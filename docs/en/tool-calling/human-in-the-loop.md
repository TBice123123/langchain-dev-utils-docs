# Adding Human-in-the-Loop Support

> [!NOTE]
>
> **Feature Overview**: Provides utility tools to conveniently add "human-in-the-loop" review support for tool invocation processes.
>
> **Prerequisites**: Understand LangChain's [Tool](https://docs.langchain.com/oss/python/langchain/tools), [Human-in-the-Loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop).
>
> **Estimated Reading Time**: 5 minutes

Provides decorator functions for adding "human-in-the-loop" review support to tool calls, enabling human review during tool execution.

## Core Functions (Decorators)

The core functions are:

- `human_in_the_loop`: For synchronous tool functions
- `human_in_the_loop_async`: For asynchronous tool functions

Their parameters are as follows:

<Params
name="func"
type="Callable"
description="Function to be decorated (do not pass manually, only for decorator syntax)"
:required="true"
:default="null"
/>
<Params
name="handler"
type="Callable[[InterruptParams], Any]"
description="Optional, custom interrupt handling logic. If not provided, the built-in default_handler is used. For the async decorator, handler must be an async function."
:required="false"
:default="null"
/>

## Usage Examples

### Using the Default Handler

```python
from langchain_dev_utils import human_in_the_loop
from langchain_core.tools import tool
import datetime

@human_in_the_loop
@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())
```

### Asynchronous Tool Example

```python
from langchain_dev_utils import human_in_the_loop_async
from langchain_core.tools import tool
import asyncio
import datetime

@human_in_the_loop_async
@tool
async def async_get_current_time() -> str:
    """Asynchronously get the current timestamp"""
    await asyncio.sleep(1)
    return str(datetime.datetime.now().timestamp())
```

::: details Default Handler

```python
def _get_human_in_the_loop_request(params: InterruptParams) -> dict[str, Any]:
    return {
        "action_request": {
            "action": params["tool_call_name"],
            "args": params["tool_call_args"],
        },
        "config": {
            "allow_accept": True,
            "allow_edit": True,
            "allow_respond": True,
        },
        "description": f"Please review tool call: {params['tool_call_name']}",
    }


def default_handler(params: InterruptParams) -> Any:
    request = _get_human_in_the_loop_request(params)
    response = interrupt(request)

    if response["type"] == "accept":
        return params["tool"].invoke(params["tool_call_args"])
    elif response["type"] == "edit":
        updated_args = response["args"]
        return params["tool"].invoke(updated_args)
    elif response["type"] == "response":
        return response["args"]
    else:
        raise ValueError(f"Unsupported interrupt response type: {response['type']}")
```

When interrupting, a JSON Schema content will be sent as returned by `_get_human_in_the_loop_request`. When responding, you need to return a JSON Schema content with a key `type` and value `accept`/`edit`/`response`.

:::

### Custom Handler Example

You can fully control the interrupt behavior, for example, only allowing "accept/reject", or custom prompts:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt

async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I want to call tool {params['tool_call_name']} with parameters {params['tool_call_args']}, please confirm whether to call it"
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "User rejected calling this tool"
    else:
        raise ValueError(f"Unsupported response type: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
@tool
async def get_weather(city: str) -> str:
    """Get weather information"""
    return f"Weather in {city} is sunny"
```

<BestPractice>
When implementing custom human-in-the-loop logic with this decorator, you need to pass the handler parameter. This handler parameter is a function that must internally use LangGraph's interrupt function to perform the interrupt operation. Therefore, if you only need to add custom human-in-the-loop logic for a single tool, it is recommended to directly use LangGraph's interrupt function. When multiple tools require the same custom human-in-the-loop logic, using this decorator can effectively avoid code duplication.
</BestPractice>
