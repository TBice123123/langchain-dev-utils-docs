# Model Management

The Model Management module provides a flexible system for registering and loading model providers.

## Overview

While LangChain's official `init_chat_model` and `init_embeddings` functions are convenient, they support a limited set of model providers. This module introduces `register_model_provider` (`batch_register_model_provider`) and `register_embeddings_provider` (`batch_register_embeddings_provider`) functions, enabling developers to register any model provider through a unified interface.

## ChatModel Class

### Core Functions

- `register_model_provider`: Register a model provider
- `batch_register_model_provider`: Batch-register multiple model providers
- `load_chat_model`: Load a chat model

### Registering Model Providers

#### `register_model_provider` Parameters

- `provider_name`: The name of the provider; must be a custom identifier
- `chat_model`: Either a ChatModel class or a string. If a string is provided, it must correspond to a provider natively supported by LangChain’s `init_chat_model` (e.g., `openai`, `anthropic`), in which case `init_chat_model` will be invoked internally.
- `base_url`: Optional base URL. Only applicable when `chat_model` is a string.

#### `batch_register_model_provider` Parameters

- `providers`: A list of dictionaries, each containing `provider`, `chat_model`, and optionally `base_url`.

::: tip 📌
The `chat_model` parameter supports passing a string representing a provider name compatible with LangChain’s `init_chat_model` (e.g., `"openai"`).  
This is because many large models offer APIs compatible with established formats like OpenAI’s. If your model lacks a dedicated integration but supports an OpenAI-style API, you can pass the corresponding provider string.  
In this case, you **must** provide the `base_url` parameter or set the provider’s `API_BASE` environment variable to specify the custom API endpoint.  
For models following DeepSeek’s invocation pattern, we recommend passing `"deepseek"` as the provider string.

Implementation details can be referenced here: [Configuring BASE_URL](https://docs.langchain.com/oss/python/langchain/models#base-url-or-proxy)
:::

### Loading Chat Models

#### `load_chat_model` Parameters

- `model`: The model identifier, in format `model_name` or `provider_name:model_name`
- `model_provider`: Optional provider name. If not provided, the provider must be included in the `model` parameter.
- `kwargs`: Optional additional model parameters such as `temperature`, `api_key`, `stop`, etc.

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

You can also use batch registration:

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

- **Global Registration**: Due to internal use of a global registry, **all model providers must be registered at application startup**.
- **Thread Safety**: Avoid modifying registered providers at runtime to prevent race conditions in multi-threaded environments.
- **Initialization Recommendation**: We recommend placing `register_model_provider` calls in your application’s `__init__.py` file.

### Project Structure Example

```text
langgraph-project/
├── src
│   ├── __init__.py
│   └── graphs
│       ├── __init__.py # Call register_model_provider here
│       ├── graph1
│       └── graph2
```

## Embeddings Class

### Core Functions

- `register_embeddings_provider`: Register an embeddings provider
- `batch_register_embeddings_provider`: Batch-register multiple embeddings providers
- `load_embeddings`: Load an embeddings model

### Registering Embeddings Providers

#### `register_embeddings_provider` Parameters

- `provider_name`: The name of the provider; must be a custom identifier
- `embeddings_model`: Either an Embeddings class or a string. If a string is provided, it must correspond to a provider natively supported by LangChain’s `init_embeddings` (e.g., `openai`, `cohere`), in which case `init_embeddings` will be invoked internally.
- `base_url`: Optional base URL. Recommended when `embeddings_model` is a string.

#### `batch_register_embeddings_provider` Parameters

- `providers`: A list of dictionaries, each containing `provider`, `embeddings_model`, and optionally `base_url`.

::: tip 📌
The `embeddings_model` parameter supports passing a string representing a provider name compatible with LangChain’s `init_embeddings` (e.g., `"openai"`).  
This is useful when your model lacks a dedicated integration but supports an OpenAI-style API.  
In this case, you **must** provide the `base_url` parameter to specify the custom API endpoint.
:::

### Loading Embeddings Models

#### `load_embeddings` Parameters

- `model`: The model identifier, in format `model_name` or `provider_name:model_name`
- `provider`: Optional provider name. If not provided, the provider must be included in the `model` parameter.
- `kwargs`: Optional additional parameters such as `chunk_size`, `api_key`, `dimensions`, etc.

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

You can also use batch registration:

```python
from langchain_dev_utils import batch_register_embeddings_provider

batch_register_embeddings_provider(
    [
        {"provider": "dashscope", "embeddings_model": "openai"},
        {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
    ]
)

embeddings = load_embeddings("dashscope:text-embedding-v4")
print(embeddings.embed_query("hello world"))

embeddings = load_embeddings("siliconflow:text-embedding-v4")
print(embeddings.embed_query("hello world"))
```

### Important Notes

- **Global Registration**: All embeddings providers must be registered at application startup.
- **Thread Safety**: Avoid modifying registered providers after initialization to prevent concurrency issues.
- **Initialization Recommendation**: Place `register_embeddings_provider` calls in your application’s `__init__.py` file.

## Supported Model Formats

The utility functions `load_chat_model` and `load_embeddings` support the following input formats:

1. **Only model name**: Format must be `provider_name:model_name`
2. **Separate provider and model name**: Pass `provider` and `model` as distinct parameters

**Note**: `load_chat_model` can also be used to load models natively supported by `init_chat_model` without prior registration. The same applies to `load_embeddings`.

## Next Steps

- [Message Processing](./message-processing.md) - Provides utility functions related to Message handling, such as chunk concatenation.
- [Tool Enhancement](./tool-enhancement.md) - Adds new functionality to already defined tools.
- [Context Engineering](./context-engineering.md) - Provides practical tools and associated state schemas for assisting context engineering management.
- [Graph Orchestration](./graph-orchestration.md) - Combines multiple StateGraphs in parallel or sequential configurations.
- [API Reference](./api-reference.md) - API reference documentation
- [Usage Examples](./example.md) - Demonstrates practical usage examples of this library
