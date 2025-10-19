# 消息转换

> [!NOTE]
>
> **功能概述**：提供实用性消息转换功能。
>
> **前置要求**：了解 langchain 的[Message](https://docs.langchain.com/oss/python/langchain/messages)。
>
> **预计阅读时间**：3 分钟

## 合并思维链内容至最终回复

用于将思维链内容（`reasoning_content`）合并至最终回复（`content`）。

具体如下

- `convert_reasoning_content_for_ai_message`：将 AIMessage 中的推理内容合并到内容字段（用于模型的 invoke 和 ainvoke）
- `convert_reasoning_content_for_chunk_iterator`：将流式响应中的推理内容合并到内容字段 (用于模型的 stream)
- `aconvert_reasoning_content_for_chunk_iterator`：`convert_reasoning_content_for_chunk_iterator` 的异步版本，用于异步流式处理(用于模型的 astream)

其参数如下:

- `model_response`：模型返回的 AI 消息响应(可能是 AIMessage 或 AIMessageChunk 的迭代器)
- `think_tag`：包含推理内容起始和结束标签的元组（默认为`<think></think>`）

使用示例:

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

## 合并流式输出的 Chunks

提供将多个因为流式输出而产生的 AIMessageChunk 合并为单个 AIMessage 的工具函数。
核心函数为：

- `merge_ai_message_chunk`：合并 AI 消息块

支持的参数如下:

- `chunks`：AI 消息块列表

使用示例:

```python
from langchain_dev_utils.message_convert import merge_ai_message_chunk

chunks = []
for chunk in model.stream("你好"):
    chunks.append(chunk)

merged_message = merge_ai_message_chunk(chunks)
print(merged_message)
```

## 格式化列表内容

将由 Document、Message 或字符串组成的列表格式化为单个文本字符串。

核心函数为:

- `format_sequence`：格式化消息

支持的参数如下:

- `inputs`：包含以下任意类型的列表：
  - `langchain_core.messages`：HumanMessage、AIMessage、SystemMessage、ToolMessage
  - `langchain_core.documents.Document`
  - `str`
- `separator`：用于连接内容的字符串，默认为 `"-"`。
- `with_num`：如果为 `True`，为每个项目添加数字前缀（例如 `"1. 你好"`），默认为 `False`。

使用示例:

```python
from langchain_core.documents import Document
from langchain_core.messages import AIMessage
from langchain_dev_utils.message_convert import format_sequence

formated1 = format_sequence(
    [
        AIMessage(content="Hello1"),
        AIMessage(content="Hello2"),
        AIMessage(content="Hello3"),
    ]
)
print(formated1)

format2 = format_sequence(
    [
        Document(page_content="content1"),
        Document(page_content="content2"),
        Document(page_content="content3"),
    ],
    separator="\n",
)
print(format2)

format3 = format_sequence(
    [
        "str1",
        "str2",
        "str3",
    ],
    separator="\n",
    with_num=True,
)
print(format3)
```
