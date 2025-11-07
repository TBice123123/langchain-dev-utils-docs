# Pre-built Agent Functions

> [!NOTE]
>
> **Feature Overview**: Provides utilities for convenient Agent development.
>
> **Prerequisites**: Understanding of langchain's [Agent](https://docs.langchain.com/oss/python/langchain/agents) and [Multi-Agent](https://docs.langchain.com/oss/python/langchain/multi-agent).
>
> **Estimated Reading Time**: 8 minutes

The pre-built agent module mainly provides a function that is completely identical in functionality to LangChain's `create_agent` function, but allows specifying more models through strings (requires registration).

## Creating an Agent

Similar to LangChain's `create_agent` function, but allows specifying more models. Details are as follows:

- `create_agent`: Create a single agent

Its parameters are as follows:

<Params :params="[
{
name: 'model',
type: 'str',
description: 'Model name, must be a string in the format provider_name:model_name, and also supports formats supported by init_chat_model and load_chat_model, where the provider_name for load_chat_model needs to be registered using register_model_provider.',
required: true,
}
]"/>

**Note**: Other parameters are the same as LangChain's create_agent.

**Usage Example**

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# Register model provider
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)

@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())

agent = create_agent("vllm:qwen3-4b", tools=[get_current_time])
# Usage is completely consistent with langchain's create_agent
response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

## Converting an Agent to a Tool

The function of this module is to convert an Agent into a Tool, so that it can be used as a tool. This approach is a very common implementation method for multi-agent systems.

Core function:

- `wrap_agent_as_tool`: Convert Agent to Tool

Its parameters are as follows:

<Params :params="[
{
name: 'agent',
type: 'CompiledStateGraph',
description: 'Agent, must be a **CompiledStateGraph** from **langchain**.',
required: true,
},
{
name: 'tool_name',
type: 'str',
description: 'Name of the Tool. If not passed, the default tool name is `transfor_to_agent_name`.',
required: false,
},
{
name: 'tool_description',
type: 'str',
description: 'Description of the Tool.',
required: false,
},
{
name: 'pre_input_hooks',
type: 'Callable | tuple[Callable, AwaitableCallable]',
description: 'Preprocessing function for the Tool, can be a single synchronous function or a binary tuple. If it is a binary tuple, the first function is a synchronous function, and the second function is an asynchronous function, used for preprocessing the input before the agent runs.',
required: false,
},
{
name: 'post_output_hooks',
type: 'Callable | tuple[Callable, AwaitableCallable]',
description: 'Postprocessing function for the Tool, can be a single synchronous function or a binary tuple. If it is a binary tuple, the first function is a synchronous function, and the second function is an asynchronous function, used for postprocessing the complete message list returned after the agent runs.',
required: false,
},
]"/>

**Usage Example**

```python
import datetime
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_dev_utils.agents import wrap_agent_as_tool, create_agent

@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())

# Define an agent for querying time
time_agent = create_agent(
    "vllm:qwen3-4b", tools=[get_current_time], name="time_agent"
)
call_time_agent_tool = wrap_agent_as_tool(
    time_agent, tool_name="call_time_agent", tool_description="Call time agent"
)
# Use it as a tool
agent = create_agent("vllm:qwen3-4b", tools=[call_time_agent_tool], name="agent")

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

### Using Hook Functions

This function provides several hook functions for performing operations before and after calling the agent.

#### 1. pre_input_hooks

Preprocess the input before the agent runs. Can be used for input enhancement, context injection, format validation, permission checking, etc.

Supports the following types:

- If passing a **single synchronous function**, the function is used for both synchronous (`invoke`) and asynchronous (`ainvoke`) call paths (will not be `awaited` in the asynchronous path, called directly).
- If passing a **binary tuple `(sync_func, async_func)`**:
  - The first function is used for the synchronous call path;
  - The second function (must be `async def`) is used for the asynchronous call path and will be `awaited`.

The function you pass receives two parameters:

- `request: str`: Original tool call input;
- `runtime: ToolRuntime`: `ToolRuntime` from `langchain`.

The function you pass must return the processed `str` as the actual input to the agent.

**Example**:

```python
def process_input(request: str, runtime: ToolRuntime) -> str:
    return "<task_description>" + request + "</task_description>"

# Or support asynchronous
async def process_input_async(request: str, runtime: ToolRuntime) -> str:
    return "<task_description>" + request + "</task_description>"

# Usage
call_agent_tool = wrap_agent_as_tool(
    agent,
    pre_input_hooks=(process_input, process_input_async)
)
```

#### 2. post_output_hooks

After the agent runs, postprocess the complete message list returned to generate the final return value of the tool. Can be used for result extraction, structured conversion, etc.

Supports the following types:

- If passing a **single function**, the function is used for both synchronous and asynchronous paths (will not be `awaited` in the asynchronous path).
- If passing a **binary tuple `(sync_func, async_func)`**:
  - The first is used for the synchronous path;
  - The second (must be `async def`) is used for the asynchronous path and will be `awaited`.

The function you pass receives three parameters:

- `request: str`: Original input (possibly processed);
- `messages: List[AnyMessage]`: Complete message history returned by the agent (from `response["messages"]`);
- `runtime: ToolRuntime`: `ToolRuntime` from `langchain`.

The value returned by the function you pass can be a string that can be serialized or a `Command` object.

**Example**:

```python
from langgraph.types import Command

def process_output_sync(request: str, messages: list, runtime: ToolRuntime) -> Command:
    return Command(update={
        "messages":[ToolMessage(content=messages[-1].content, tool_call_id=runtime.tool_call_id)]
    })

async def process_output_async(request: str, messages: list, runtime: ToolRuntime) -> Command:
    return Command(update={
        "messages":[ToolMessage(content=messages[-1].content, tool_call_id=runtime.tool_call_id)]
    })

# Usage
call_agent_tool = wrap_agent_as_tool(
    agent,
    post_output_hooks=(process_output_sync, process_output_async)
)
```

- If `pre_input_hooks` is not provided, the input is passed as is;
- If `post_output_hooks` is not provided, it returns `response["messages"][-1].content` by default (i.e., the text content of the last message).

**Note**: When the Agent (CompiledStateGraph) is used as the agent parameter of `wrap_agent_as_tool`, the Agent must define the name attribute.
