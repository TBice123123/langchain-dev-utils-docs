# 预构建 Agent

预构建智能体模块主要是提供一个和官方功能上完全相同的预构建 Agent 函数，但是拓展了模型选择。

### 概述

`langgraph`中的`create_react_agent`函数(v1 迁移到`langchain`并改名为`create_agent`)可以方便的创建一个单智能体，但是其`model`参数仅支持官方`init_chat_model`支持的格式。本模块提供与官方函数功能上完全相同的函数，但是可以使用`load_chat_model`加载的模型。

### 核心函数

- `create_agent`：创建单智能体

### 参数

- model: 模型名称，取值必须为字符串，且格式是`provider_name:model_name`,同时支持`init_chat_model`以及`load_chat_model`支持的格式，其中`load_chat_model`的 provider_name 需要使用`register_model_provider`完成注册。
- 其它参数与`langgraph`的`create_react_agent`完全相同。

### 使用示例

```python
from langchain_dev_utils import register_model_provider
from langchain_dev_utils.prebuilt import create_agent
from langchain_core.tools import tool
import datetime
# Register a model provider
register_model_provider(
    provider_name="moonshot",
    chat_model="openai",
    base_url="https://api.moonshot.cn/v1",
)

@tool
def get_current_time() -> str:
    """获取当前时间戳"""
    return str(datetime.datetime.now().timestamp())

agent = create_agent(
    "moonshot:kimi-k2-0905-preview",
    tools=[get_current_time],
    name="time-agent"
)
# 使用方式与 langgraph中的create_react_agent完全一致
response = agent.invoke({
    "messages": [{"role": "user", "content": "现在几点了？"}]
})
print(response)
```

## 下一步

- [API 参考](./api-reference.md) - API 参考文档。
- [使用示例](./example.md) - 介绍本库的使用示例。
