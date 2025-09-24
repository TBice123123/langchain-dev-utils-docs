# Model Management

The Model Management module provides a flexible system for registering and loading model providers.

## Overview

LangChain's official `init_chat_model` and `init_embeddings` functions are convenient, but they support a relatively limited number of model providers. This module provides functions such as `register_model_provider` (and `batch_register_model_provider`) and `register_embeddings_provider` (and `batch_register_embeddings_provider`), enabling developers to register any model provider through a unified mechanism.

## ChatModel Class

### Core Functions

- `register_model_provider`: Register a model provider
- `batch_register_model_provider`: Register multiple model providers in batch
- `load_chat_model`: Load a chat model

### Registering Model Providers

#### Parameters of `register_model_provider`

- `provider_name`: The name of the provider; must be a custom name.
- `chat_model`: Either a `ChatModel` class or a string. If it's a string, it must correspond to a provider supported by LangChain’s official `init_chat_model` function (e.g., `"openai"`, `"anthropic"`). In this case, `init_chat_model` will be invoked internally.
- `base_url`: Optional base URL. Only effective when `chat_model` is a string.

#### Parameters of `batch_register_model_provider`

- `providers`: A list of dictionaries, where each dictionary contains the keys `provider`, `chat_model`, and `base_url`.

::: tip 📌
The `chat_model` parameter supports specifying a provider via a string, which should match a provider name supported by LangChain’s `init_chat_model` (e.g., `"openai"`).  
This is because many large models today offer APIs compatible with other vendors (e.g., OpenAI-style APIs). If your model lacks a dedicated or suitable integration library but the provider supports an API compatible with another vendor’s style, you can pass the corresponding provider string.  
When using this approach, you must also provide the `base_url` parameter or set the provider’s `API_BASE` environment variable to specify the custom model’s API endpoint.  
If your model follows DeepSeek’s inference API pattern, we also recommend using `"deepseek"` as the value.

This functionality is inspired by: [Configuring the BASE_URL Parameter](https://docs.langchain.com/oss/python/langchain/models#base-url-or-proxy)
:::

### Loading Chat Models

#### Parameters of `load_chat_model`

- `model`: Model name, in the format `model_name` or `provider_name:model_name`.
- `model_provider`: Optional provider name. If not provided, the `model` parameter must be in the format `provider_name:model_name`.
- `kwargs`: Optional additional model parameters, such as `temperature`, `api_key`, `stop`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_model_provider, load_chat_model
from langchain_qwq import ChatQwen
from dotenv import load_dotenv

load_dotenv()

# Register custom model providers
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1")

# Load models
model = load_chat_model(model="dashscope:qwen-flash")
print(model.invoke("Hello"))

model = load_chat_model(model="openrouter:moonshotai/kimi-k2-0905")
print(model.invoke("Hello"))
```

You can also register providers in batch:

```python
from langchain_dev_utils import batch_register_model_provider

batch_register_model_provider([
    {
        "provider": "dashscope",
        "chat_model": ChatQwen,
    },
    {
        "provider": "openrouter",
        "chat_model": "openai",
        "base_url": "https://openrouter.ai/api/v1",
    },
])
model = load_chat_model(model="dashscope:qwen-flash")
print(model.invoke("Hello"))

model = load_chat_model(model="openrouter:moonshotai/kimi-k2-0905")
print(model.invoke("Hello"))
```

### Important Notes

- **Global Registration**: Since the underlying implementation uses a global dictionary, **all model providers must be registered at application startup**.
- **Thread Safety**: Avoid modifying registrations at runtime to prevent concurrency issues in multi-threaded environments.
- **Initialization**: We recommend placing `register_model_provider` calls in your application’s `__init__.py` file.

### Example Project Structure

```text
langgraph-project/
├── src
│   ├── __init__.py
│   └── graphs
│       ├── __init__.py  # Call register_model_provider here
│       ├── graph1
│       └── graph2
```

## Embeddings Class

### Core Functions

- `register_embeddings_provider`: Register an embeddings provider
- `batch_register_embeddings_provider`: Register multiple embeddings providers in batch
- `load_embeddings`: Load an embeddings model

### Registering Embeddings Providers

#### Parameters of `register_embeddings_provider`

- `provider_name`: The name of the provider; must be a custom name.
- `embeddings_model`: Either an `Embeddings` class or a string. If it's a string, it must correspond to a provider supported by LangChain’s official `init_embeddings` function (e.g., `"openai"`, `"cohere"`). In this case, `init_embeddings` will be invoked internally.
- `base_url`: Optional base URL. Only effective when `embeddings_model` is a string.

#### Parameters of `batch_register_embeddings_provider`

- `providers`: A list of dictionaries, where each dictionary contains the keys `provider`, `embeddings_model`, and `base_url`.

::: tip 📌
The `embeddings_model` parameter supports specifying a provider via a string, which should match a provider name supported by LangChain’s `init_embeddings` (e.g., `"openai"`).  
This is because many large models today offer APIs compatible with other vendors (e.g., OpenAI-style APIs). If your model lacks a dedicated or suitable integration library but the provider supports an API compatible with another vendor’s style, you can pass the corresponding provider string.  
When using this approach, you must also provide the `base_url` parameter to specify the custom model’s API endpoint.  
:::

### Loading Embeddings Models

#### Parameters of `load_embeddings`

- `model`: Model name, in the format `model_name` or `provider_name:model_name`.
- `provider`: Optional provider name. If not provided, the `model` parameter must be in the format `provider_name:model_name`.
- `kwargs`: Optional additional model parameters, such as `chunk_size`, `api_key`, `dimensions`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_embeddings_provider, load_embeddings
from langchain_siliconflow import SiliconFlowEmbeddings

register_embeddings_provider(
    "dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

register_embeddings_provider(
    "siliconflow", SiliconFlowEmbeddings
)

embeddings = load_embeddings("dashscope:text-embedding-v4")
print(embeddings.embed_query("hello world"))

embeddings = load_embeddings("siliconflow:text-embedding-v4")
print(embeddings.embed_query("hello world"))
```

Batch registration is also supported:

```python
from langchain_dev_utils import batch_register_embeddings_provider
batch_register_embeddings_provider(
    [
        {"provider": "dashscope", "embeddings_model": "openai", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"},
        {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
    ]
)
embeddings = load_embeddings("dashscope:text-embedding-v4")
print(embeddings.embed_query("hello world"))

embeddings = load_embeddings("siliconflow:text-embedding-v4")
print(embeddings.embed_query("hello world"))
```

### Important Notes

- **Global Registration**: Similarly, all embeddings providers must be registered at application startup.
- **Thread Safety**: Do not modify registrations after initialization to avoid concurrency issues.
- **Initialization**: We recommend placing `register_embeddings_provider` calls in your application’s `__init__.py` file.

**Note**: `load_chat_model` can also be used to load models supported by `init_chat_model`—no need to call `register_model_provider` in such cases. The same applies to `load_embeddings`.

## Next Steps

- [Message Processing](./message-processing.md) – Utility functions for working with Messages, such as chunk concatenation.
- [Tool Enhancement](./tool-enhancement.md) – Extend functionality of existing tools.
- [Context Engineering](./context-engineering.md) – Practical tools and state schemas to assist with context management.
- [Graph Orchestration](./graph-orchestration.md) – Compose multiple StateGraphs in parallel or sequential workflows.
- [API Reference](./api-reference.md) – Full API documentation.
- [Usage Examples](./example.md) – Demonstrations of how to use this library.
