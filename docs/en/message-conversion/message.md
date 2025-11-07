# Message Processing

> [!NOTE]
>
> **Feature Overview**: Provides practical message processing functionality.
>
> **Prerequisites**: Understanding of langchain's [Message](https://docs.langchain.com/oss/python/langchain/messages).
>
> **Estimated Reading Time**: 3 minutes

## Merge Chain of Thought Content to Final Response

Used to merge chain of thought content (`reasoning_content`) into the final response (`content`).

Specifically:

- `convert_reasoning_content_for_ai_message`: Merge reasoning content in AIMessage into the content field (for model's invoke and ainvoke)
- `convert_reasoning_content_for_chunk_iterator`: Merge reasoning content in streaming response into the content field (for model's stream)
- `aconvert_reasoning_content_for_chunk_iterator`: Asynchronous version of `convert_reasoning_content_for_chunk_iterator`, for asynchronous streaming processing (for model's astream)

Its parameters are as follows:

<Params :params="[
{
name: 'model_response',
type: 'AIMessage | Iterable[AIMessageChunk]',
description: 'AI message response returned by the model',
required: true,
},
{
name: 'think_tag',
type: 'tuple[string, string]',
description: 'Tuple containing the start and end tags for reasoning content',
required: false,
},
]"/>

Usage examples:

```python
from typing import cast
from langchain_dev_utils.message_convert import (
    convert_reasoning_content_for_ai_message,
    convert_reasoning_content_for_chunk_iterator,
)
from langchain_core.messages import AIMessage


response = model.invoke("你好")
converted_response = convert_reasoning_content_for_ai_message(
    cast(AIMessage, response), think_tag=("<start>", "<end>")
)
print(converted_response.content)

for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("你好"), think_tag=("<start>", "<end>")
):
    print(chunk.content, end="", flush=True)
```

## Merge Streaming Output Chunks

Provides a utility function to merge multiple AIMessageChunks generated from streaming output into a single AIMessage.
The core function is:

- `merge_ai_message_chunk`: Merge AI message chunks

Supported parameters:

<Params :params="[
{
name: 'chunks',
type: 'list[AIMessageChunk]',
description: 'List of AI message chunks',
required: true,
},
]"/>

Usage examples:

```python
from langchain_dev_utils.message_convert import merge_ai_message_chunk

chunks = []
for chunk in model.stream("你好"):
    chunks.append(chunk)

merged_message = merge_ai_message_chunk(chunks)
print(merged_message)
```
