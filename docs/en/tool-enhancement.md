# Tool Enhancement

The Tool Enhancement module provides a set of practical utilities to add new functionalities to existing tools.

## Overview

This module offers encapsulated functional wrappers to enhance existing tools with additional capabilities. Currently, it provides only one enhancement feature: adding "Human-in-the-Loop" review support.

## Add "Human-in-the-Loop" Review

Provides decorator functions to enable human review support during tool invocation.

### Core Functions

- `human_in_the_loop`: For synchronous tool functions
- `human_in_the_loop_async`: For asynchronous tool functions

### Parameters

- `func`: The function to be decorated (**Do not pass manually; intended for decorator syntax only**)
- `handler`: Optional, type `Callable[[InterruptParams], Any]`. Custom interrupt handling logic. If not provided, the built-in `default_handler` is used.

For the asynchronous decorator, parameters are identical, but the `handler` must be an asynchronous function.

### Usage Examples

#### Basic Usage (with default handler)

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

#### Asynchronous Tool Example

```python
from langchain_dev_utils import human_in_the_loop_async
from langchain_core.tools import tool
import asyncio
import datetime

@human_in_the_loop_async
@tool
async def async_get_current_time() -> str:
    """Asynchronously get current timestamp"""
    await asyncio.sleep(1)
    return str(datetime.datetime.now().timestamp())
```

#### Custom Handler Example

You can fully control the interrupt behavior—for example, allowing only "accept/reject" or customizing prompts:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt

async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I am about to invoke tool '{params['tool_call_name']}' with arguments {params['tool_call_args']}. Please confirm whether to proceed."
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "User rejected this tool call"
    else:
        raise ValueError(f"Unsupported response type: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
@tool
async def get_weather(city: str) -> str:
    """Get weather information"""
    return f"The weather in {city} is sunny."
```

#### Default Handler Behavior

If no `handler` is provided, the default interrupt logic is used. The default logic follows the implementation in the official langgraph documentation: [Add Human-in-the-Loop](https://docs.langchain.com/oss/python/langgraph/add-human-in-the-loop).

## Next Steps

- [Context Engineering](./context-engineering.md) — Practical tools and State Schemas for context management.
- [Graph Orchestration](./graph-orchestration.md) — Combine multiple StateGraphs in parallel or serial workflows.
- [Prebuilt Agent](./prebuilt.md) — Effectively aligns with the prebuilt Agent of the official library, but extends its model selection.
- [API Reference](./api-reference.md) — Complete API documentation.
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage.
