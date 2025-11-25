# Pre-built Agent Functions

> [!NOTE]
>
> **Feature Overview**: Provides utility tools to facilitate Agent development.
>
> **Prerequisites**: Understand LangChain's [Agent](https://docs.langchain.com/oss/python/langchain/agents) and [Multi-Agent](https://docs.langchain.com/oss/python/langchain/multi-agent).
>
> **Estimated Reading Time**: 8 minutes

## Pre-built Agent Functions

In LangChain v1, the officially provided `create_agent` function can be used to create a single agent. The model parameter supports passing a BaseChatModel instance or a specific string (when passing a string, it is limited to the models supported by `init_chat_model`). To extend the flexibility of specifying models via strings, this library provides a functionally identical `create_agent` function, allowing you to directly use models supported by `load_chat_model` (requires prior registration).

Core Function:

- `create_agent`: Creates a single agent.

Its parameters are as follows:
<Params
name="model"
type="string"
description="The name of the chat model. The value must be a string in the format provider_name:model_name. It supports formats compatible with both init_chat_model and load_chat_model, where the provider_name for load_chat_model needs to be registered using register_model_provider."
:required="true"
:default="null"
/>

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
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())

agent = create_agent("vllm:qwen3-4b", tools=[get_current_time])
# Usage is identical to LangChain's create_agent
response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

## Wrapping an Agent as a Tool

Wrapping an agent as a tool is a common implementation pattern in multi-agent systems, which is detailed in the official LangChain documentation. To facilitate this, this library provides the pre-built function `wrap_agent_as_tool`, which can encapsulate an agent instance into a tool that can be called by other agents.

Core Function:

- `wrap_agent_as_tool`: Wraps an Agent as a Tool.

Its parameters are as follows:

<Params
name="agent"
type="CompiledStateGraph"
description="The agent, must be a LangGraph CompiledStateGraph."
:required="true"
:default="null"
/>
<Params
name="tool_name"
type="string"
description="The name of the tool. If not provided, the default tool name is `transfor_to_agent_name`."
:required="false"
:default="null"
/>
<Params
name="tool_description"
type="string"
description="The description of the tool. If not provided, the default description content is used."
:required="false"
:default="null"
/>
<Params
name="pre_input_hooks"
type="Callable | tuple[Callable, AwaitableCallable]"
description="Preprocessing hook functions, which can be a single synchronous function or a tuple of two callables. If it's a tuple, the first function is the synchronous function and the second function is the asynchronous function, used to preprocess the input before the agent runs."
:required="false"
:default="null"
/>
<Params
name="post_output_hooks"
type="Callable | tuple[Callable, AwaitableCallable]"
description="Postprocessing hook functions, which can be a single synchronous function or a tuple of two callables. If it's a tuple, the first function is the synchronous function and the second function is the asynchronous function, used to postprocess the complete list of messages returned by the agent after it finishes running."
:required="false"
:default="null"
/>

**Usage Example**

```python
import datetime
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_dev_utils.agents import wrap_agent_as_tool, create_agent

@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())

# Define an agent for querying time
time_agent = create_agent(
    "vllm:qwen3-4b", tools=[get_current_time], name="time_agent"
)
call_time_agent_tool = wrap_agent_as_tool(
    time_agent, tool_name="call_time_agent", tool_description="Call the time agent"
)
# Use it as a tool
agent = create_agent("vllm:qwen3-4b", tools=[call_time_agent_tool], name="agent")

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

### Using Hook Functions

This function provides several hook functions for performing operations before and after invoking the agent.

#### 1. pre_input_hooks

Preprocesses the input before the agent runs. Can be used for input enhancement, context injection, format validation, permission checks, etc.

Supports the following input types:

- If a **single synchronous function** is passed, this function is used for both the synchronous (`invoke`) and asynchronous (`ainvoke`) call paths (in the asynchronous path, it is called directly without `await`).
- If a **tuple `(sync_func, async_func)`** is passed:
  - The first function is used for the synchronous call path;
  - The second function (must be `async def`) is used for the asynchronous call path and will be `await`ed.

The function you pass receives two parameters:

- `request: str`: The original tool call input;
- `runtime: ToolRuntime`: LangChain's `ToolRuntime`.

The function you pass must return the processed `str`, which will be used as the actual input for the agent.

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

Postprocesses the complete list of messages returned by the agent after it finishes running to generate the final return value for the tool. Can be used for result extraction, structured transformation, etc.

Supports the following input types:

- If a **single function** is passed, this function is used for both synchronous and asynchronous paths (in the asynchronous path, it is called without `await`).
- If a **tuple `(sync_func, async_func)`** is passed:
  - The first function is used for the synchronous path;
  - The second function (`async def`) is used for the asynchronous path and will be `await`ed.

The function you pass receives three parameters:

- `request: str`: The (possibly processed) original input;
- `messages: List[AnyMessage]`: The complete message history returned by the agent (from `response["messages"]`);
- `runtime: ToolRuntime`: LangChain's `ToolRuntime`.

The value returned by the function you pass can be either a string or a `Command` object.

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

- If `pre_input_hooks` is not provided, the input is passed through unchanged.
- If `post_output_hooks` is not provided, it defaults to returning `response["messages"][-1].content` (i.e., the text content of the last message).

**Note**: When an Agent (CompiledStateGraph) is used as the agent parameter for `wrap_agent_as_tool`, that Agent must have the name attribute defined.
