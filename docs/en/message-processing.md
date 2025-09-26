# Message Processing

The Message Processing module provides a set of practical utilities for handling Message-related operations, including merging reasoning content, processing message chunks, and detecting tool calls.

## Overview

This module offers comprehensive functionality for processing various types of AI messages, suitable for scenarios involving reasoning model outputs, large model streaming responses, and tool calls.

## Merge Reasoning Content

Provides functionality to merge the `reasoning_content` returned by reasoning models into the `content` field of AI messages.

### Core Functions

- `convert_reasoning_content_for_ai_message`: Merges reasoning content from an AIMessage into its content field (used for model's `invoke` and `ainvoke`)
- `convert_reasoning_content_for_chunk_iterator`: Merges reasoning content into the content field for streaming responses (used for model's `stream`)
- `aconvert_reasoning_content_for_chunk_iterator`: Asynchronous version of `convert_reasoning_content_for_chunk_iterator`, for asynchronous streaming (used for model's `astream`)

### Parameters

- `model_response`: The AI message response returned by the model
- `think_tag`: A tuple containing the start and end tags for reasoning content (default: `("<think>", "</think>")`)

### Usage Example

```python
from typing import cast
from langchain_dev_utils import convert_reasoning_content_for_ai_message, convert_reasoning_content_for_chunk_iterator
from langchain_core.messages import AIMessage

response = model.invoke("Hello")
converted_response = convert_reasoning_content_for_ai_message(
    cast(AIMessage, response), think_tag=("<start>", "<end>")
)
print(converted_response.content)

for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("Hello"), think_tag=("<start>", "<end>")
):
    print(chunk.content, end="", flush=True)
```

## Merge AI Chunks

Provides utility functions to merge multiple AI chunks into a single AIMessage.

### Core Function

- `merge_ai_message_chunk`: Merges a list of AI message chunks

### Parameters

- `chunks`: A list of AI message chunks

### Usage Example

```python
from langchain_dev_utils import merge_ai_message_chunk

chunks = []
for chunk in model.stream("Hello"):
    chunks.append(chunk)

merged_message = merge_ai_message_chunk(chunks)
print(merged_message)
```

## Detect Tool Calls

Provides a simple function to detect whether a message contains tool calls.

### Core Function

- `has_tool_calling`: Checks whether a message contains tool calls

### Parameters

- `message`: An AIMessage object

### Usage Example

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils import has_tool_calling
from langchain_core.messages import AIMessage
from typing import cast

@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())

response = model.bind_tools([get_current_time]).invoke("What time is it?")
print(has_tool_calling(cast(AIMessage, response)))
```

## Parse Tool Call Parameters

Provides a utility function to parse tool call parameters and extract parameter information from messages.

### Core Function

- `parse_tool_calling`: Parses tool call parameters

### Parameters

- `message`: An AIMessage object
- `first_tool_call_only`: If `True`, returns only the first tool call as a single tuple; if `False`, returns a list of tuples

### Usage Example

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils import has_tool_calling, parse_tool_calling
from langchain_core.messages import AIMessage
from typing import cast

@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())

response = model.bind_tools([get_current_time]).invoke("What time is it?")

if has_tool_calling(cast(AIMessage, response)):
    name, args = parse_tool_calling(
        cast(AIMessage, response), first_tool_call_only=True
    )
    print(name, args)
```

## Format List Content

Formats a list containing Documents, Messages, or strings into a single text string.

### Core Function

- `message_format`: Formats messages

### Parameters

- `inputs`: A list containing any of the following types:
  - `langchain_core.messages`: HumanMessage, AIMessage, SystemMessage, ToolMessage
  - `langchain_core.documents.Document`
  - `str`
- `separator`: String used to join content items (default: `"-"`)
- `with_num`: If `True`, adds numeric prefixes to each item (e.g., `"1. Hello"`); default is `False`

### Usage Example

```python
from langchain_dev_utils import message_format
from langchain_core.documents import Document

messages = [
    Document(page_content="Document 1"),
    Document(page_content="Document 2"),
    Document(page_content="Document 3"),
    Document(page_content="Document 4"),
]
formatted_messages = message_format(messages, separator="\n", with_num=True)
print(formatted_messages)
```

## Next Steps

- [Tool Enhancement](./tool-enhancement.md) — Add new functionality to existing tools
- [Context Engineering](./context-engineering.md) — Practical tools and State Schemas for context management
- [Graph Orchestration](./graph-orchestration.md) — Combine multiple StateGraphs in parallel or serial workflows
- [API Reference](./api-reference.md) — Complete API documentation
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage
