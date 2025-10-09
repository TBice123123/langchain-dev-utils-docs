# 消息处理

消息处理模块提供了一系列 Message 相关的实用工具，包括推理内容合并、消息块处理以及工具调用检测等功能。

## 概述

本模块提供了处理各种类型 AI 消息的全面功能，适用于处理推理模型返回的内容、大模型流式返回和工具调用等场景。

## 合并推理内容

提供将推理模型返回的 `reasoning_content` 合并到 AI 消息 `content` 字段的功能。

### 核心函数

- `convert_reasoning_content_for_ai_message`：将 AIMessage 中的推理内容合并到内容字段（用于模型的 invoke 和 ainvoke）
- `convert_reasoning_content_for_chunk_iterator`：将流式响应中的推理内容合并到内容字段 (用于模型的 stream)
- `aconvert_reasoning_content_for_chunk_iterator`：`convert_reasoning_content_for_chunk_iterator` 的异步版本，用于异步流式处理(用于模型的 astream)

### 参数

- `model_response`：模型返回的 AI 消息响应
- `think_tag`：包含推理内容起始和结束标签的元组（默认为`<think></think>`）

### 使用示例

```python
from typing import cast
from langchain_dev_utils import convert_reasoning_content_for_ai_message, convert_reasoning_content_for_chunk_iterator
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

## 合并 AI Chunks

提供将多个 AI Chunks 合并为单个 AIMessage 的工具函数。

### 核心函数

- `merge_ai_message_chunk`：合并 AI 消息块

### 参数

- `chunks`：AI 消息块列表

### 使用示例

```python
from langchain_dev_utils import merge_ai_message_chunk

chunks = []
for chunk in model.stream("你好"):
    chunks.append(chunk)

merged_message = merge_ai_message_chunk(chunks)
print(merged_message)
```

## 检测工具调用

提供一个简单函数来检测消息是否包含工具调用。

### 核心函数

- `has_tool_calling`：检查消息是否包含工具调用

### 参数

- `message`：AIMessage 对象

### 使用示例

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils import has_tool_calling
from langchain_core.messages import AIMessage
from typing import cast

@tool
def get_current_time() -> str:
    """获取当前时间戳"""
    return str(datetime.datetime.now().timestamp())

response = model.bind_tools([get_current_time]).invoke("现在几点了？")
print(has_tool_calling(cast(AIMessage, response)))
```

## 解析工具调用参数

提供一个实用函数来解析工具调用参数，从消息中提取参数信息。

### 核心函数

- `parse_tool_calling`：解析工具调用参数

### 参数

- `message`：AIMessage 对象
- `first_tool_call_only`：是否仅解析第一个工具调用。如果为 `True`，返回单个元组；如果为 `False`，返回元组列表。

### 使用示例

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils import has_tool_calling, parse_tool_calling
from langchain_core.messages import AIMessage
from typing import cast

@tool
def get_current_time() -> str:
    """获取当前时间戳"""
    return str(datetime.datetime.now().timestamp())

response = model.bind_tools([get_current_time]).invoke("现在几点了？")

if has_tool_calling(cast(AIMessage, response)):
    name, args = parse_tool_calling(
        cast(AIMessage, response), first_tool_call_only=True
    )
    print(name, args)
```

## 格式化列表内容

将由 Document、Message 或字符串组成的列表格式化为单个文本字符串。

### 核心函数

- `message_format`：格式化消息

### 参数

- `inputs`：包含以下任意类型的列表：
  - `langchain_core.messages`：HumanMessage、AIMessage、SystemMessage、ToolMessage
  - `langchain_core.documents.Document`
  - `str`
- `separator`：用于连接内容的字符串，默认为 `"-"`。
- `with_num`：如果为 `True`，为每个项目添加数字前缀（例如 `"1. 你好"`），默认为 `False`。

### 使用示例

```python
from langchain_dev_utils import message_format
from langchain_core.documents import Document

messages = [
    Document(page_content="文档 1"),
    Document(page_content="文档 2"),
    Document(page_content="文档 3"),
    Document(page_content="文档 4"),
]
formatted_messages = message_format(messages, separator="\n", with_num=True)
print(formatted_messages)
```

## 下一步

- [工具增强](./tool-enhancement.md) - 在已定义的 tools 中添加新的功能。
- [上下文工程](./context-engineering.md) - 提供用于帮助上下文工程管理的实用性 tools 以及相关的状态 Schema。
- [状态图编排](./graph-orchestration.md) - 将多个状态图(StateGraph)以并行或者串行的方式组合在一起。
- [预构建 Agent](./prebuilt.md) - 效果与官方预构建的 Agent 对齐，但是拓展了其模型选择。
- [API 参考](./api-reference.md) - API 参考文档。
- [使用示例](./example.md) - 介绍本库的使用示例。
