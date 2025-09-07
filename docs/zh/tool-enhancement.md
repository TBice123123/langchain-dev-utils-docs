# 工具增强

工具增强模块提供了一系列实用工具，方便进行工具（tool）的编写。

## 概述

本模块的作用是提供一些封装的功能函数，加快工具的编写或者方便扩充工具的功能。

## 添加“人在回路”审核

提供装饰器函数，用于为工具调用添加“人在回路”审核支持，在工具执行期间启用人工审核。

### 核心函数

- `human_in_the_loop`：用于同步工具函数
- `human_in_the_loop_async`：用于异步工具函数

### 参数

- `func`：待装饰的函数（**请勿手动传参，仅用于装饰器语法**）
- `handler`：可选，类型为 `Callable[[InterrruptParams], Any]`，自定义中断处理逻辑。若未提供，则使用内置 `default_handler`。

对于异步函数的装饰器的参数和上述相同，但是 handler 必须是一个异步函数

## 使用示例

### 基础用法（使用默认 handler）

```python
from langchain_dev_utils import human_in_the_loop
from langchain_core.tools import tool
import datetime

@human_in_the_loop
@tool
def get_current_time() -> str:
    """获取当前时间戳"""
    return str(datetime.datetime.now().timestamp())
```

### 异步工具示例

```python
from langchain_dev_utils import human_in_the_loop_async
from langchain_core.tools import tool
import asyncio
import datetime

@human_in_the_loop_async
@tool
async def async_get_current_time() -> str:
    """异步获取当前时间戳"""
    await asyncio.sleep(1)
    return str(datetime.datetime.now().timestamp())
```

### 自定义 Handler 示例

你可以完全控制中断行为，例如只允许“接受/拒绝”，或自定义提示语：

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async
from langgraph.types import interrupt

async def custom_handler(params: InterrruptParams) -> Any:
    response = interrupt(
        f"我要调用工具 {params['tool_call_name']}，参数为 {params['tool_call_args']}，请确认是否调用"
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "用户拒绝调用该工具"
    else:
        raise ValueError(f"不支持的响应类型: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
@tool
async def get_weather(city: str) -> str:
    """获取天气信息"""
    return f"{city}天气晴朗"
```

## 默认 Handler 行为

如果不传入 `handler`，将使用默认中断逻辑。默认的中断逻辑可以参考 langgraph 官方文档：[添加人工审核](https://docs.langchain.com/oss/python/langgraph/add-human-in-the-loop)

## 最佳实践

1. **安全性优先**：对涉及资金、数据删除、外部 API 调用等敏感操作，强制使用人工审核。
2. **清晰提示语**：在自定义 handler 中提供明确、易懂的中断消息，帮助审核者快速决策。
3. **超时与重试**：当前 `interrupt()` 无内置超时机制，如需超时控制，应在 handler 中自行实现（如 asyncio.wait_for）。
4. **错误处理**：捕获并处理 `ValueError` 或用户拒绝场景，避免流程中断。
5. **日志与审计**：在 handler 中记录每次中断请求与响应，便于事后追溯。

## 下一步

- [API 参考](./api-reference.md) - 完整类型与函数签名
- [入门指南](./getting-started.md) - 返回概览
