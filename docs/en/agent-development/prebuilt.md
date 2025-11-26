# Pre-built Agent Functions

> [!NOTE]
>
> **Feature Overview**: Provides utilities for convenient Agent development.
>
> **Prerequisites**: Understanding of LangChain's [Agent](https://docs.langchain.com/oss/python/langchain/agents) and [Multi-Agent](https://docs.langchain.com/oss/python/langchain/multi-agent).
>
> **Estimated Reading Time**: 8 minutes

## Overview
Provides pre-built agent functions to facilitate agent development. Main features include:
- Creating single agents
- Wrapping agents as tools for multi-agent scenarios


## Pre-built Agent Functions

In LangChain v1, the official `create_agent` function can be used to create a single agent, where the model parameter supports passing a BaseChatModel instance or a specific string (when passing a string, it's limited to models supported by `init_chat_model`). To extend the flexibility of specifying models with strings, this library provides a `create_agent` function with the same functionality, allowing you to directly use models supported by `load_chat_model` (requires registration in advance).

Core function:

- `create_agent`: Creates a single agent

Its parameters are:
<Params
name="model"
type="string"
description="Chat model name, must be a string in the format provider_name:model_name, supporting both init_chat_model and load_chat_model formats, where the provider_name for load_chat_model needs to be registered using register_model_provider."
:required="true"
:default="null"
/>

**Note**: Other parameters are the same as langchain's create_agent.

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
# Usage is exactly the same as langchain's create_agent
response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

## Wrapping Agent as Tool

Wrapping an agent as a tool is a common implementation pattern in multi-agent systems, which is detailed in the official LangChain documentation. For this purpose, this library provides the pre-built function `wrap_agent_as_tool` to implement this pattern, which can wrap an agent instance into a tool that can be called by other agents.

Core function:

- `wrap_agent_as_tool`: Wraps an Agent as a Tool

Its parameters are:

<Params
name="agent"
type="CompiledStateGraph"
description="The agent, must be a langgraph CompiledStateGraph."
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
description="Pre-processing hook function, can be a single synchronous function or a tuple. If it's a tuple, the first function is synchronous, and the second function is asynchronous, used for preprocessing the input before the agent runs."
:required="false"
:default="null"
/>
<Params
name="post_output_hooks"
type="Callable | tuple[Callable, AwaitableCallable]"
description="Post-processing hook function, can be a single synchronous function or a tuple. If it's a tuple, the first function is synchronous, and the second function is asynchronous, used for post-processing the complete message list returned by the agent after it completes."
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

Preprocesses the input before the agent runs. Can be used for input enhancement, context injection, format validation, permission checks, etc.

Supports the following types:

- If passing a **single synchronous function**, this function is used for both synchronous (`invoke`) and asynchronous (`ainvoke`) call paths (in the async path, it won't be `awaited`, but called directly).
- If passing a **tuple `(sync_func, async_func)`**:
  - The first function is used for the synchronous call path;
  - The second function (must be `async def`) is used for the asynchronous call path and will be `awaited`.

The function you pass receives two parameters:

- `request: str`: The original tool call input;
- `runtime: ToolRuntime`: The `ToolRuntime` from `langchain`.

The function you pass must return the processed `str` as the actual input to the agent.

**Example**:

```python
def process_input(request: str, runtime: ToolRuntime) -> str:
    return "<task_description>" + request + "</task_description>"

# Or support async
async def process_input_async(request: str, runtime: ToolRuntime) -> str:
    return "<task_description>" + request + "</task_description>"

# Usage
call_agent_tool = wrap_agent_as_tool(
    agent,
    pre_input_hooks=(process_input, process_input_async)
)
```

#### 2. post_output_hooks

Post-processes the complete message list returned by the agent after it completes to generate the final return value of the tool. Can be used for result extraction, structured transformation, etc.

Supports the following types:

- If passing a **single function**, this function is used for both synchronous and asynchronous paths (not `awaited` in the async path).
- If passing a **tuple `(sync_func, async_func)`**:
  - The first is used for the synchronous path;
  - The second (`async def`) is used for the asynchronous path and will be `awaited`.

The function you pass receives three parameters:

- `request: str`: The original input (possibly processed);
- `messages: List[AnyMessage]`: The complete message history returned by the agent (from `response["messages"]`);
- `runtime: ToolRuntime`: The `ToolRuntime` from `langchain`.

The value returned by the function you pass can be something that can be serialized to a string or a `Command` object.

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
- If `post_output_hooks` is not provided, it defaults to returning `response["messages"][-1].content` (i.e., the text content of the last message).

**Note**: When this Agent (CompiledStateGraph) is used as the agent parameter for `wrap_agent_as_tool`, the Agent must define the name attribute.