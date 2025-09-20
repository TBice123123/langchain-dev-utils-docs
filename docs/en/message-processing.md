# Message Processing

The Message Processing module provides a suite of utility tools for handling AI messages, including merging reasoning content, processing message chunks, and detecting tool calls.

## Overview

This module offers comprehensive functionality for handling various types of AI messages, especially suited for scenarios involving reasoning models, streaming responses, and tool invocations.

## Merge Reasoning Content

Provides functionality to merge `reasoning_content` returned by reasoning models into the `content` field of AI messages.

### Core Functions

- `convert_reasoning_content_for_ai_message`: Merges reasoning content from an AIMessage into its content field.
- `convert_reasoning_content_for_chunk_iterator`: Merges reasoning content for streaming responses (iterator of message chunks).
- `aconvert_reasoning_content_for_chunk_iterator`: Asynchronous version of `convert_reasoning_content_for_chunk_iterator`, for async streaming processing.

### Parameters

- `model_response`: The AI message response returned by the model.
- `think_tag`: A tuple specifying start and end tags for reasoning content (default: `("<think>", "</think>")`).

### Usage Example

```python
# Synchronous reasoning content processing
from typing import cast
from langchain_dev_utils import convert_reasoning_content_for_ai_message
from langchain_core.messages import AIMessage

# Streaming reasoning content processing
from langchain_dev_utils import convert_reasoning_content_for_chunk_iterator

response = model.invoke("hello")
converted_response = convert_reasoning_content_for_ai_message(
    cast(AIMessage, response), think_tag=("<start>", "<end>")
)
print(converted_response.content)

for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("hello"), think_tag=("<start>", "<end>")
):
    print(chunk.content, end="", flush=True)
```

## Merge AI Chunks

Provides utility functions to merge multiple AI message chunks into a single AIMessage.

### Core Function

- `merge_ai_message_chunk`: Merges a list of AI message chunks.

### Parameters

- `chunks`: List of AI message chunks.

### Usage Example

```python
from langchain_dev_utils import merge_ai_message_chunk

chunks = []
for chunk in model.stream("hello"):
    chunks.append(chunk)

merged_message = merge_ai_message_chunk(chunks)
print(merged_message)
```

## Detect Tool Calls

Provides a simple function to detect whether a message contains tool calls.

### Core Function

- `has_tool_calling`: Checks if a message contains any tool calls.

### Parameters

- `message`: An AIMessage object.

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

response = model.bind_tools([get_current_time]).invoke("what time is it?")
print(has_tool_calling(cast(AIMessage, response)))
```

## Parse Tool Call Arguments

Provides a utility function to parse tool call arguments and extract parameter information from messages.

### Core Function

- `parse_tool_calling`: Parses tool call arguments.

### Parameters

- `message`: AIMessage object.
- `first_tool_call_only`: If `True`, returns only the first tool call as a single tuple; if `False`, returns a list of tuples for all tool calls.

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

response = model.bind_tools([get_current_time]).invoke("what time is it?")

if has_tool_calling(cast(AIMessage, response)):
    name, args = parse_tool_calling(
        cast(AIMessage, response), first_tool_call_only=True
    )
    print(name, args)
```

## Content Concatenation

Formats a list of documents, messages, or strings into a single concatenated string.

### Core Function

- `message_format`: Formats a list of messages/documents/strings.

### Parameters

- `inputs`: A list containing any of the following types:
  - `langchain_core.messages`: HumanMessage, AIMessage, SystemMessage, ToolMessage
  - `langchain_core.documents.Document`
  - `str`
- `separator`: String used to join content items (default: `"-"`).
- `with_num`: If `True`, prefixes each item with a number (e.g., `"1. hello"`); default is `False`.

### Usage Example

```python
from langchain_dev_utils import message_format
from langchain_core.documents import Document

messages = [
    Document(page_content="document 1"),
    Document(page_content="document 2"),
    Document(page_content="document 3"),
    Document(page_content="document 4"),
]
formatted_messages = message_format(messages, separator="\n", with_num=True)
print(formatted_messages)
```

## Best Practices

1. **Type Safety**: Always use explicit type casting when handling message objects.
2. **Streaming**: Choose the appropriate streaming function (sync/async) based on your use case.
3. **Tool Calls**: Always check for tool calls using `has_tool_calling` before attempting to parse them.
4. **Content Concatenation**: Select appropriate separators and numbering based on your formatting needs.

## Next Steps

- [Tool Enhancement](./tool-enhancement.md) — Simplifies defining and developing LangChain tools.
- [Context Engineering](./context-engineering.md) — Advanced tools and state mixin classes for context management.
- [API Reference](./api-reference.md) — Complete API documentation
- [Example](./example.md) — Example of using the library
