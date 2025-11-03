# Prebuilt Agent Functions

> [!NOTE]
>
> **Feature Overview**: Provides utility tools to facilitate Agent development.
>
> **Prerequisites**: Understand LangChain's [Agent](https://docs.langchain.com/oss/python/langchain/agents) and [Multi-Agent](https://docs.langchain.com/oss/python/langchain/multi-agent).
>
> **Estimated Reading Time**: 8 minutes

The Prebuilt Agent module primarily provides a function that is functionally identical to LangChain's `create_agent` function but allows specifying more models via strings (which need to be registered).

## Creating an Agent

Similar to LangChain's `create_agent` function, but capable of specifying more models. Details as follows:

- `create_agent`: Creates a single agent.

**Function Parameters**:

- **model**: The model name. Must be a string in the format `provider_name:model_name`. Also supports formats compatible with `init_chat_model` and `load_chat_model`. For `load_chat_model`, the `provider_name` must be registered using `register_model_provider`.
- Other parameters are identical to LangChain's `create_agent`.

**Usage Example**

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# Register a model provider
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

## Converting an Agent into a Tool

This function's purpose is to convert an Agent into a Tool, allowing it to be used as a tool. This method is one way to implement multi-agent systems.

Core Function:

- `wrap_agent_as_tool`: Converts an Agent into a Tool.

**Function Parameters**:

- **agent**: The agent. Must be a LangChain **CompiledStateGraph**.
- **tool_name**: The name of the tool (Optional, must be a string). If not provided, the default tool name is `transfor_to_agent_name`.
- **tool_description**: The description of the tool (Optional, must be a string).
- **pre_input_hooks**: Preprocessing function(s) for the tool's input (Optional, must be a function or a tuple of two functions).
- **post_input_hooks**: Post-processing function(s) for the tool's output (Optional, must be a function or a tuple of two functions).

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
tool = wrap_agent_as_tool(
    time_agent, tool_name="call_time_agent", tool_description="Call the time agent"
)
# Use it as a tool
agent = create_agent("vllm:qwen3-4b", tools=[tool], name="agent")

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

### `pre_input_hooks`

**Purpose**:  
Preprocesses the raw input string for the tool. Can be used for input enhancement, context injection, format validation, permission checks, etc.

Supports passing the following types:

- If a **single synchronous function** is passed, it is used for both synchronous (`invoke`) and asynchronous (`ainvoke`) call paths (in the async path, it is called directly without `await`).
- If a **tuple of two functions `(sync_func, async_func)`** is passed:
  - The first function is used for the synchronous call path.
  - The second function (must be `async def`) is used for the asynchronous call path and will be `await`ed.

The function(s) you pass receive two parameters:

- `request: str`: The raw tool call input.
- `runtime: ToolRuntime`: LangChain's `ToolRuntime`.

The function(s) you pass must return the processed `str`, which becomes the actual input for the agent.

**Example**:

```python
def process_input(request: str, runtime: ToolRuntime) -> str:
    return "<task_description>" + request + "</task_description>"

# Or supporting async
async def process_input_async(request: str, runtime: ToolRuntime) -> str:
    return "<task_description>" + request + "</task_description>"

# Usage
tool = wrap_agent_as_tool(
    agent,
    pre_input_hooks=(process_input, process_input_async)
)
```

### `post_output_hooks`

**Purpose**:  
After the agent execution is complete, post-processes the complete list of messages returned by the agent to generate the final return value for the tool. Can be used for result extraction, structured transformation, etc.

Supports passing the following types:

- If a **single function** is passed, it is used for both synchronous and asynchronous paths (not `await`ed in the async path).
- If a **tuple of two functions `(sync_func, async_func)`** is passed:
  - The first is used for the synchronous path.
  - The second (`async def`) is used for the asynchronous path and will be `await`ed.

The function(s) you pass receive three parameters:

- `request: str`: The (potentially preprocessed) raw input.
- `messages: List[AnyMessage]`: The complete message history returned by the agent (from `response["messages"]`).
- `runtime: ToolRuntime`: LangChain's `ToolRuntime`.

The value returned by your function(s) must be serializable to a string or be a `Command` object.

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
tool = wrap_agent_as_tool(
    agent,
    post_output_hooks=(process_output_sync, process_output_async)
)
```

- If `pre_input_hooks` are not provided, the input is passed through as-is.
- If `post_output_hooks` are not provided, it defaults to returning `response["messages"][-1].content` (i.e., the text content of the last message).

**Note**: When an Agent (`CompiledStateGraph`) is used as the `agent` parameter for `wrap_agent_as_tool`, that Agent must have a `name` attribute defined.
