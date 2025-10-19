# Tool Calling

> [!NOTE]
>
> **Feature Overview**: Provides utilities for conveniently writing tool calling processes.
>
> **Prerequisites**: Familiarity with Langchain's [Tool](https://docs.langchain.com/oss/python/langchain/tools), [Message](https://docs.langchain.com/oss/python/langchain/messages), and [Human-in-the-Loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop).
>
> **Estimated Reading Time**: 5 minutes

## Detecting Tool Calls

Detects whether a message contains a tool call.
Core functions:

- `has_tool_calling`: Checks if a message contains a tool call

Supported parameters:

- `message`: An AIMessage object

Usage example:

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils.tool_calling import has_tool_calling
from langchain_core.messages import AIMessage
from typing import cast


@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())


response = model.bind_tools([get_current_time]).invoke("What time is it now?")
print(has_tool_calling(cast(AIMessage, response)))
```

## Parsing Tool Call Arguments

Provides a utility function to parse tool call arguments and extract parameter information from messages.

Core functions:

- `parse_tool_calling`: Parses tool call arguments

Supported parameters:

- `message`: An AIMessage object
- `first_tool_call_only`: Whether to parse only the first tool call. If `True`, returns a single tuple; if `False`, returns a list of tuples.

Usage example:

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils.tool_calling import has_tool_calling, parse_tool_calling
from langchain_core.messages import AIMessage
from typing import cast


@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())


response = model.bind_tools([get_current_time]).invoke("What time is it now?")

if has_tool_calling(cast(AIMessage, response)):
    name, args = parse_tool_calling(
        cast(AIMessage, response), first_tool_call_only=True
    )
    print(name, args)
```

## Adding Human-in-the-Loop Approval Support for Tool Calling Processes

Provides decorator functions to add human-in-the-loop approval support for tool calls, enabling human review during tool execution.

Core functions:

- `human_in_the_loop`: For synchronous tool functions
- `human_in_the_loop_async`: For asynchronous tool functions

Supported parameters:

- `func`: The function to be decorated (**Do not pass this manually, only for decorator syntax**)
- `handler`: Optional, type `Callable[[InterruptParams], Any]`, custom interrupt handling logic. If not provided, the built-in `default_handler` is used.

For the asynchronous function decorator, the parameters are the same as above, but the handler must be an asynchronous function.

Usage example:

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

When interrupting, a JSON Schema content as returned by `_get_human_in_the_loop_request` will be sent. When responding, you need to return a JSON Schema content with a key `type` and value `accept`/`edit`/`response`/`reject`.

:::

**Custom Handler Example**
You can fully control the interrupt behavior, for example, only allowing "accept/reject", or customizing prompts:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt

async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I want to call tool {params['tool_call_name']} with arguments {params['tool_call_args']}. Please confirm whether to call it."
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
