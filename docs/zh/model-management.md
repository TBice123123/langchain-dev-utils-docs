# 模型管理

模型管理模块提供了一个灵活的系统，用于注册和加载模型提供商。

## 概述

LangChain 官方的 `init_chat_model` 和 `init_embeddings` 函数很方便，但它们支持的模型提供商数量相对有限。该模块提供了 `register_model_provider` 和 `register_embeddings_provider` 函数，使开发者能够通过统一的机制注册任何模型提供商。

## ChatModel 类

### 核心函数

- `register_model_provider`：注册模型提供商
- `load_chat_model`：加载聊天模型

### 注册模型提供商

#### `register_model_provider` 的参数

- `provider_name`：提供商名称；必须是自定义名称
- `chat_model`：ChatModel 类或字符串。如果是字符串，必须是官方 `init_chat_model` 支持的提供商（例如 `openai`、`anthropic`）。在这种情况下，将调用 `init_chat_model` 函数。
- `base_url`：可选的基础 URL。当 `chat_model` 是字符串时推荐使用。

::: tip 📌
`chat_model` 支持通过字符串参数指定模型提供商，其取值应为 LangChain 中 `init_chat_model` 所支持的提供商名称（例如 `"openai"`）。  
这是因为目前许多大模型都提供了兼容其他厂商风格（如 OpenAI）的 API。若您的模型没有专用或者合适的集成库，但提供商支持兼容其他厂商的 API 风格，可考虑传递对应提供商字符串。
使用此方式时必须同时传递 `base_url` 参数或者设置提供商的 API_BASE 环境变量以指定自定义模型的 API 端点。  
若您的模型为推理模型且遵循 DeepSeek 的调用模式，也推荐传递 `"deepseek"` 值。
:::

#### 加载聊天模型

#### `load_chat_model` 的参数

- `model`：模型名称，格式为 `model_name` 或 `provider_name:model_name`
- `model_provider`：可选的模型提供商名称。如果未提供，提供商名称必须包含在 `model` 参数中。
- `kwargs`：可选的额外模型参数，如 `temperature`、`api_key`、`stop` 等。

### 使用示例

```python
from langchain_dev_utils import register_model_provider, load_chat_model
from langchain_qwq import ChatQwen
from dotenv import load_dotenv

load_dotenv()

# 注册自定义模型提供商
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1")

# 加载模型
model = load_chat_model(model="dashscope:qwen-flash")
print(model.invoke("Hello"))

model = load_chat_model(model="openrouter:moonshotai/kimi-k2-0905")
print(model.invoke("Hello"))
```

### 重要说明

- **全局注册**：由于底层实现使用全局字典，**所有模型提供商必须在应用程序启动时注册**。
- **线程安全**：应避免在运行时进行修改，以防止多线程并发同步问题。
- **初始化**：我们建议将 `register_model_provider` 调用放在应用程序的 `__init__.py` 文件中。

### 项目结构示例

```text
langgraph-project/
├── src
│   ├── __init__.py
│   └── graphs
│       ├── __init__.py # 在这里调用 register_model_provider
│       ├── graph1
│       └── graph2
```

## Embeddings 类

### 核心函数

- `register_embeddings_provider`：注册嵌入模型提供商
- `load_embeddings`：加载嵌入模型

### 注册嵌入提供商

#### `register_embeddings_provider` 的参数

- `provider_name`：提供商名称；必须是自定义名称
- `embeddings_model`：Embeddings 类或字符串。如果是字符串，必须是官方 `init_embeddings` 支持的提供商（例如 `openai`、`cohere`）。在这种情况下，将调用 `init_embeddings` 函数。
- `base_url`：可选的基础 URL。当 `embeddings_model` 是字符串时推荐使用。

::: tip 📌
`embeddings_model` 支持通过字符串参数指定模型提供商，其取值应为 LangChain 中 `init_embeddings` 所支持的提供商名称（例如 `"openai"`）。  
这是因为目前许多大模型都提供了兼容其他厂商风格（如 OpenAI）的 API。若您的模型没有专用或者适合的集成库，但提供商支持兼容其他厂商的 API 风格，可考虑传递对应提供商字符串。
使用此方式时必须同时传递 `base_url` 参数以指定自定义模型的 API 端点。  
:::

### 加载嵌入模型

#### `load_embeddings` 的参数

- `model`：模型名称，格式为 `model_name` 或 `provider_name:model_name`
- `provider`：可选的模型提供商名称。如果未提供，提供商名称必须包含在 `model` 参数中。
- `kwargs`：可选的额外模型参数，如 `chunk_size`、`api_key`、`dimensions` 等。

### 使用示例

```python
from langchain_dev_utils import register_embeddings_provider, load_embeddings

register_embeddings_provider(
    "dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

embeddings = load_embeddings("dashscope:text-embedding-v4")

print(embeddings.embed_query("hello world"))
```

### 重要说明

- **全局注册**：同样，所有嵌入模型提供商必须在应用程序启动时注册。
- **线程安全**：注册后不应进行修改，以避免多线程并发问题。
- **初始化**：我们建议将 `register_embeddings_provider` 放在应用程序的 `__init__.py` 文件中。

## 支持的模型格式

### 聊天模型

- `model_name` - 从默认提供商加载
- `provider_name:model_name` - 从特定提供商加载

### 嵌入模型

- `model_name` - 从默认提供商加载
- `provider_name:model_name` - 从特定提供商加载

## 最佳实践

1. **提前注册**：始终在应用程序启动时注册提供商
2. **使用描述性名称**：选择有意义的提供商名称
3. **处理依赖项**：确保安装了所有必需的包
4. **测试注册**：在使用模型之前验证提供商注册是否有效

**注意**：load_chat_model 也可以用于加载`init_chat_model`支持的模型，使用方式与上文一样，且无需注册。同样的也适用于 load_embeddings。

## 后续步骤

- [消息处理](./message-processing.md) - 了解消息实用工具
- [工具增强](./tool-enhancement.md) - 为工具添加人工审核
- [API 参考](./api-reference.md) - 完整的 API 文档
