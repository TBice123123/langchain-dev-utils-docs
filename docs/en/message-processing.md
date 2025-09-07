# Message Processing

The Message Processing module provides a set of utilities for working with AI messages, including merging reasoning content, handling message chunks, and detecting tool calls.

## Overview

This module offers comprehensive functionality for processing various types of AI messages, especially suited for scenarios involving reasoning models, streaming responses, and tool calls.

## Merging Reasoning Content

Provides the ability to merge `reasoning_content` returned by reasoning models into the `content` field of AI messages.

### Core Functions

- `convert_reasoning_content_for_ai_message`: Merge reasoning content from AIMessage into the content field
- `convert_reasoning_content_for_chunk_iterator`: Merge reasoning content for message chunk iterators in streaming responses
- `aconvert_reasoning_content_for_chunk_iterator`: Async version of `convert_reasoning_content_for_chunk_iterator` for async streaming

### Parameters

- `model_response`: AI message response returned by the model
- `think_tag`: Tuple containing start and end tags for reasoning content (defaults to `<think></think>`)

### Usage Examples

```python
# Process reasoning content synchronously
from typing import cast
from langchain_dev_utils import convert_reasoning_content_for_ai_message
from langchain_core.messages import AIMessage

# Process reasoning content in streaming
from langchain_dev_utils import convert_reasoning_content_for_chunk_iterator

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

## Merging AI Message Chunks

Provides utility functions to merge multiple AI message chunks into a single AI message.

### Core Function

- `merge_ai_message_chunk`: Merge AI message chunks

### Parameters

- `chunks`: List of AI message chunks

### Usage Example

```python
from langchain_dev_utils import merge_ai_message_chunk

chunks = []
for chunk in model.stream("Hello"):
    chunks.append(chunk)

merged_message = merge_ai_message_chunk(chunks)
print(merged_message)
```

## Detecting Tool Calls

Provides a simple function to detect whether a message contains tool calls.

### Core Function

- `has_tool_calling`: Check if a message contains tool calls

### Parameters

- `message`: AIMessage object

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

## Parsing Tool Call Arguments

Provides a utility function to parse tool call arguments and extract parameter information from messages.

### Core Function

- `parse_tool_calling`: Parse tool call arguments

### Parameters

- `message`: AIMessage object
- `first_tool_call_only`: Whether to parse only the first tool call. If `True`, returns a single tuple; if `False`, returns a list of tuples.

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

## Formatting Messages

Format a list consisting of documents, messages, or strings into a single string.

### Core Function

- `message_format`: Format messages

### Parameters

- `inputs`: List containing any of these types:
  - `langchain_core.messages`: HumanMessage, AIMessage, SystemMessage, ToolMessage
  - `langchain_core.documents.Document`
  - `str`
- `separator`: String used to join content, defaults to `"-"`
- `with_num`: If `True`, adds numeric prefix to each item (e.g., `"1. Hello"`), defaults to `False`

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

## Best Practices

1. **Type Safety**: Always use type casting when handling message objects
2. **Streaming**: Choose appropriate streaming functions (sync/async) based on your use case
3. **Tool Calls**: Always check for tool calls before attempting to parse them
4. **Message Formatting**: Choose appropriate separators and numbering based on your use case

## Next Steps

- [Tool Enhancement](./tool-enhancement.md) - Learn how to add human review to tools
- [API Reference](./api-reference.md) - Complete API documentation
