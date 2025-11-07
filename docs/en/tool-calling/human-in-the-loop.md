# Add Human-in-the-Loop Support

> [!NOTE]
>
> **Feature Overview**: Provides utilities to conveniently add "human-in-the-loop" review support to the tool calling process.
>
> **Prerequisites**: Understanding of langchain's [Tool](https://docs.langchain.com/oss/python/langchain/tools) and [Human-in-the-Loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop).
>
> **Estimated Reading Time**: 5 minutes

Provides decorator functions to add "human-in-the-loop" review support to tool calls, enabling human review during tool execution.

## Core Functions (Decorators)

The core functions are:

- `human_in_the_loop`: For synchronous tool functions
- `human_in_the_loop_async`: For asynchronous tool functions

Their parameters are as follows:

<Params :params="[
{
name: 'func',
type: 'Callable',
description: 'The function to be decorated (**Do not pass manually, used only for decorator syntax**)',
required: true,
},
{
name: 'handler',
type: 'Callable[[InterruptParams], Any]',
description: 'Optional, custom interrupt handling logic. If not provided, the built-in default_handler is used. For the async decorator, the handler must be an async function.',
required: false,
},
]"/>

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

### Async Tool Example

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

When interrupted, a JSON Schema with the content returned by `_get_human_in_the_loop_request` above will be sent. When replying, a JSON Schema with a key `type` and a value of `accept`/`edit`/`response` is required.

:::

### Custom Handler Example

You can have full control over the interrupt behavior, for example, by only allowing "accept/reject" or customizing the prompt:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt

async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I am about to call the tool {params['tool_call_name']} with arguments {params['tool_call_args']}. Please confirm if I should proceed."
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "User rejected the tool call."
    else:
        raise ValueError(f"Unsupported response type: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
@tool
async def get_weather(city: str) -> str:
    """Get weather information"""
    return f"The weather in {city} is sunny."
```

<BestPractice>
When multiple tools require human-in-the-loop support with the same workflow, you can define a handler using the method above and then add the decorator to multiple functions in sequence. If only one function needs this support, it is recommended to use the `interrupt` function directly provided by langgraph.
</BestPractice>
