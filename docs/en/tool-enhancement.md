# Tool Enhancement

The Tool Enhancement module provides a set of utilities that make it easier to write and extend tools.

## Overview

This module offers encapsulated helper functions to speed up tool authoring or to conveniently augment existing tools with extra capabilities.

## Add “Human-in-the-Loop” Review

Decorators that let you inject a human-review step **before** a tool is actually executed.

### Core decorators

| Sync                | Async                     |
| ------------------- | ------------------------- |
| `human_in_the_loop` | `human_in_the_loop_async` |

### Parameters (both decorators)

- `func` – **DO NOT PASS MANUALLY**, used only for the decorator syntax.
- `handler` – optional `Callable[[InterrruptParams], Any]`.  
  – If omitted, the built-in `default_handler` is used.  
  – For the async decorator the handler itself must be `async`.

## Usage Examples

### 1. Basic usage (default handler)

```python
from langchain_dev_utils import human_in_the_loop
from langchain_core.tools import tool
import datetime

@human_in_the_loop
@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())
```

### 2. Async tool

```python
from langchain_dev_utils import human_in_the_loop_async
from langchain_core.tools import tool
import asyncio, datetime

@human_in_the_loop_async
@tool
async def async_get_current_time() -> str:
    """Async version"""
    await asyncio.sleep(1)
    return str(datetime.datetime.now().timestamp())
```

### 3. Custom handler (accept / reject only)

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async
from langgraph.types import interrupt

async def custom_handler(params: InterrruptParams) -> Any:
    response = await interrupt(
        f"Call {params['tool_call_name']} with args {params['tool_call_args']}?"
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"],
                                            params["config"])
    elif response["type"] == "reject":
        return "User rejected the call"
    raise ValueError(f"Unknown response: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
@tool
async def get_weather(city: str) -> str:
    """Get weather for a city"""
    return f"{city} is sunny"
```

## Default-handler behaviour

If you do **not** supply a `handler`, the decorator uses LangGraph’s standard interrupt flow (accept / edit / respond).  
See the official docs: [Adding human approval](https://docs.langchain.com/oss/python/langgraph/add-human-in-the-loop).

## Best Practices

1. **Security first**: For operations involving funds, data deletion, external API calls, etc., enforce manual review.
2. **Clear prompts**: Provide clear and understandable interrupt messages in custom handlers to assist the reviewer in making quick decisions.
3. **Timeout and retry**: Currently, the `interrupt()` function has no built-in timeout mechanism. If you need timeout control, you should implement it manually (e.g., using `asyncio.wait_for`).
4. **Error handling**: Catch and handle `ValueError` or user refusal scenarios to avoid process interruption.
5. **Logging and auditing**: Record each interrupt request and response in the handler for posterior auditing.

## Next steps

- [API Reference](./api-reference.md) – full type signatures
- [Getting Started](./getting-started.md) – back to overview
