# 预构建 Agent 函数

> [!NOTE]
>
> **功能概述**：提供方便进行 Agent 开发的实用工具。
>
> **前置要求**：了解 langchain 的[Agent](https://docs.langchain.com/oss/python/langchain/agents)。
>
> **预计阅读时间**：3 分钟

预构建智能体模块主要是提供一个和`langchain`的`create_agent`函数功能上完全相同的函数，但是通过字符串指定更多的模型(需要进行注册)。

## 核心函数

- `create_agent`：创建单智能体

**函数参数**：

- model: 模型名称，取值必须为字符串，且格式是`provider_name:model_name`,同时支持`init_chat_model`以及`load_chat_model`支持的格式，其中`load_chat_model`的 provider_name 需要使用`register_model_provider`完成注册。
- 其它参数与`langchain`的`create_agent`完全相同。

## 使用示例

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# 注册模型提供商
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)


@tool
def get_current_time() -> str:
    """获取当前时间戳"""
    return str(datetime.datetime.now().timestamp())


agent = create_agent("vllm:qwen3-4b", tools=[get_current_time])
# 使用方式与 langchain的create_agent完全一致
response = agent.invoke({"messages": [HumanMessage(content="现在几点了？")]})
print(response)
```
