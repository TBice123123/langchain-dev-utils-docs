# 工具调用处理

> [!NOTE]
>
> **功能概述**：提供解析工具调用参数的实用工具。
>
> **前置要求**：了解 langchain 的[Tool](https://docs.langchain.com/oss/python/langchain/tools)、[Message](https://docs.langchain.com/oss/python/langchain/messages)。
>
> **预计阅读时间**：3 分钟

## 检测工具调用

检测消息是否包含工具调用。
核心函数为：

- `has_tool_calling`：检查消息是否包含工具调用

支持的参数如下:

- **message**：AIMessage 对象

使用示例:

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils.tool_calling import has_tool_calling
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

核心函数为：

- `parse_tool_calling`：解析工具调用参数

支持的参数如下:

- **message**：AIMessage 对象
- **first_tool_call_only**：是否仅解析第一个工具调用。如果为 True，返回单个元组；如果为 False，返回元组列表。

使用示例:

```python

import datetime
from langchain_core.tools import tool
from langchain_dev_utils.tool_calling import has_tool_calling, parse_tool_calling
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
