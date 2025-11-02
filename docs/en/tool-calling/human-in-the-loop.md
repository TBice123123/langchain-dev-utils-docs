# Adding Human-in-the-Loop Support

> [!NOTE]
>
> **Overview**: Provides utility tools to easily add "human-in-the-loop" review support for tool invocation processes.
>
> **Prerequisites**: Familiarity with LangChain's [Tool](https://docs.langchain.com/oss/python/langchain/tools) and [Human-in-the-Loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop).
>
> **Estimated Reading Time**: 5 minutes

Provides decorator functions for adding "human-in-the-loop" review support to tool calls, enabling human review during tool execution.

## Core Functions (Decorators)

The core functions are:

- `human_in_the_loop`: For synchronous tool functions
- `human_in_the_loop_async`: For asynchronous tool functions

**Function Parameter Description:**

- **func**: The function to be decorated (**Do not pass this parameter manually, only for decorator syntax**)
- **handler**: Optional, type is Callable[[InterruptParams], Any], custom interrupt handling logic. If not provided, the built-in default_handler is used.

**The parameters for the async function decorator are the same as above, but the handler must be an async function**

## Usage Examples

**Using the default handler**

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

**Asynchronous tool example**

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

::: details Default handler

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

When interrupting, a JSON Schema content as returned by `_get_human_in_the_loop_request` will be sent. When replying, a JSON Schema content needs to be returned, with a key "type" and value "accept"/"edit"/"response".

:::

**Custom Handler Example**
You can fully control the interrupt behavior, for example, only allowing "accept/reject", or customizing the prompt:

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
