# Tool Enhancement

The tool enhancement module provides a series of practical utilities to facilitate the writing of tools.

## Overview

This module aims to offer encapsulated utility functions to speed up tool development and simplify the process of extending tool functionality.

## Adding "Human-in-the-Loop" Review

Provides decorator functions to add "Human-in-the-Loop" review support for tool calls, enabling manual review during tool execution.

### Core Functions

- `human_in_the_loop`: For synchronous tool functions
- `human_in_the_loop_async`: For asynchronous tool functions

### Parameters

- `func`: The function to be decorated (**Do not pass this parameter manually; it is only for decorator syntax**)
- `handler`: Optional, type `Callable[[InterrruptParams], Any]`, custom interruption handling logic. If not provided, the built-in `default_handler` is used.

The parameters for the decorator of asynchronous functions are the same as above, but the handler must be an asynchronous function.

### Usage Examples

#### Basic Usage (Using the Default Handler)

```python
from langchain_dev_utils import human_in_the_loop
from langchain_core.tools import tool
import datetime

@human_in_the_loop
@tool
def get_current_time() -> str:
    """Get the current timestamp."""
    return str(datetime.datetime.now().timestamp())
```

#### Asynchronous Tool Example

```python
from langchain_dev_utils import human_in_the_loop_async
from langchain_core.tools import tool
import asyncio
import datetime

@human_in_the_loop_async
@tool
async def async_get_current_time() -> str:
    """Asynchronously get the current timestamp."""
    await asyncio.sleep(1)
    return str(datetime.datetime.now().timestamp())
```

#### Custom Handler Example

You can fully control the interruption behavior, such as only allowing "accept/reject" or customizing the prompt message:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt

async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I am about to call the tool {params['tool_call_name']} with parameters {params['tool_call_args']}. Please confirm whether to proceed."
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "The user rejected the tool call."
    else:
        raise ValueError(f"Unsupported response type: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
@tool
async def get_weather(city: str) -> str:
    """Get weather information."""
    return f"The weather in {city} is sunny."
```

#### Default Handler Behavior

If no `handler` is provided, the default interruption logic will be used. The default interruption logic can be referenced in the LangGraph official documentation: [Adding Human-in-the-Loop](https://docs.langchain.com/oss/python/langgraph/add-human-in-the-loop)

## Best Practices

1.  **Prioritize Security**: Enforce human review for sensitive operations involving funds, data deletion, external API calls, etc.
2.  **Clear Prompts**: Provide clear and understandable interruption messages in custom handlers to help reviewers make quick decisions.
3.  **Timeout and Retry**: The current `interrupt()` has no built-in timeout mechanism. If timeout control is needed, implement it yourself within the handler (e.g., using `asyncio.wait_for`).
4.  **Error Handling**: Catch and handle `ValueError` or user rejection scenarios to avoid process interruption.
5.  **Logging and Auditing**: Log each interruption request and response within the handler for traceability.

## Next Steps

- [API Reference](./api-reference.md) - Complete types and function signatures
- [Getting Started Guide](./getting-started.md) - Return to Overview
