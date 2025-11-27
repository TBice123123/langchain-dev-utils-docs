# Message Processing

> [!NOTE]
>
> **Function Overview**: Provides practical message processing functionality.
>
> **Prerequisites**: Understanding of langchain's [Message](https://docs.langchain.com/oss/python/langchain/messages).
>
> **Estimated Reading Time**: 3 minutes

## Overview
Main features include:
- Merging reasoning content into final replies
- Merging streaming output Chunks

## Merging Reasoning Content into Final Reply

Used to merge reasoning content (`reasoning_content`) into the final reply (`content`).

Specifically:

- `convert_reasoning_content_for_ai_message`: Merges reasoning content in AIMessage into the content field (for model invoke and ainvoke)
- `convert_reasoning_content_for_chunk_iterator`: Merges reasoning content in streaming responses into the content field (for model stream)
- `aconvert_reasoning_content_for_chunk_iterator`: Async version of `convert_reasoning_content_for_chunk_iterator`, for async streaming processing (for model astream)

Its parameters are as follows:

<Params
name="model_response"
type="AIMessage | Iterable[AIMessageChunk | AIMessage]"
description="AI message response returned by the model"
:required="true"
:default="null"
/>

<Params
name="think_tag"
type="tuple[string, string]"
description="Tuple containing start and end tags for reasoning content"
:required="false"
default="('<think>', '</think>')"
/>

Usage example:

```python
from langchain_dev_utils.message_convert import (
    convert_reasoning_content_for_ai_message,
    convert_reasoning_content_for_chunk_iterator,
)

response = model.invoke("你好")
converted_response = convert_reasoning_content_for_ai_message(
    response, think_tag=("<start>", "<end>")
)
print(converted_response.content)

for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("你好"), think_tag=("<start>", "<end>")
):
    print(chunk.content, end="", flush=True)
```

## Merging Streaming Output Chunks

Provides a utility function to merge multiple AIMessageChunks generated due to streaming output into a single AIMessage.
The core function is:

- `merge_ai_message_chunk`: Merges AI message chunks

Supported parameters are as follows:

<Params
name="chunks"
type="list[AIMessageChunk]"
description="List of AI message chunks"
:required="true"
:default="null"
/>

Usage example:

```python
from langchain_dev_utils.message_convert import merge_ai_message_chunk

chunks = []
for chunk in model.stream("你好"):
    chunks.append(chunk)

merged_message = merge_ai_message_chunk(chunks)
print(merged_message)
```