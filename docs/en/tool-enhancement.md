# Tool Enhancement

The Tool Enhancement module provides a set of practical utilities to streamline the development and expansion of tools.

## Overview

This module offers encapsulated helper functions designed to accelerate tool development and enhance tool functionality with minimal boilerplate code.

## Adding Human-in-the-Loop Review

Provides decorator functions to enable human-in-the-loop review for tool calls, allowing manual approval or modification before tool execution.

### Core Functions

- `human_in_the_loop`: For synchronously executed tool functions
- `human_in_the_loop_async`: For asynchronously executed tool functions

### Parameters

- `func`: The function to be decorated (**Do not pass manually — use only as a decorator**)
- `handler`: Optional, of type `Callable[[InterruptParams], Any]`. Custom logic to handle interruption. If not provided, the built-in `default_handler` is used.

For the async decorator, parameters are identical, but the `handler` must be an async function.

### Usage Examples

#### Basic Usage (with Default Handler)

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

#### Async Tool Example

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

You can fully control the interruption behavior—for example, allowing only "accept/reject" or customizing the prompt:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt

async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I am about to call tool '{params['tool_call_name']}' with args: {params['tool_call_args']}. Please confirm whether to proceed."
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "User rejected this tool call."
    else:
        raise ValueError(f"Unsupported response type: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
@tool
async def get_weather(city: str) -> str:
    """Get weather information."""
    return f"The weather in {city} is sunny."
```

#### Default Handler Behavior

If no `handler` is provided, the default interruption logic is used. The default behavior follows the LangGraph official implementation: [Add Human-in-the-Loop](https://docs.langchain.com/oss/python/langgraph/add-human-in-the-loop).

## Best Practices

1. **Prioritize Security**: Enforce human review for sensitive operations such as financial transactions, data deletion, or external API calls.
2. **Clear Prompts**: In custom handlers, provide clear, concise, and actionable messages to help reviewers make quick decisions.
3. **Timeout and Retry**: The `interrupt()` function has no built-in timeout. Implement timeout logic manually in your handler (e.g., using `asyncio.wait_for`).
4. **Error Handling**: Catch and handle `ValueError` or user rejection scenarios gracefully to prevent workflow interruption.
5. **Logging and Auditing**: Log all interruption requests and responses within your handler for traceability and compliance.

## Next Steps

- [Context Engineering](./context-engineering.md) - Advanced tools and state-mixing classes for context engineering.
- [API Reference](./api-reference.md) - Comprehensive API documentation.
