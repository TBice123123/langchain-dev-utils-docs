# Model Management

The model management module provides a flexible system for registering and loading model providers.

## Overview

LangChain's official `init_chat_model` and `init_embeddings` functions are convenient, but they support a relatively limited number of model providers. This module provides the `register_model_provider` (`batch_register_model_provider`) and `register_embeddings_provider` (`batch_register_embeddings_provider`) functions, enabling developers to register any model provider through a unified mechanism.

## ChatModel Class

### Core Functions

- `register_model_provider`: Register a single model provider
- `batch_register_model_provider`: Register multiple model providers in bulk
- `load_chat_model`: Load and instantiate a chat model for use

### Registering Model Providers

#### Parameters for `register_model_provider`

- `provider_name`: A custom, unique identifier for the provider (e.g., `"dashscope"`, `"my_custom_provider"`).
- `chat_model`: Either a LangChain-compatible ChatModel class (e.g., `ChatQwen`) or a string representing a provider natively supported by LangChain’s `init_chat_model` (e.g., `"openai"`, `"anthropic"`).
- `base_url` (Optional): The API endpoint URL. **Required** if `chat_model` is passed as a string (e.g., `"openai"`) to point to a compatible API server.

#### Parameters for `batch_register_model_provider`

- `providers`: A list of dictionaries. Each dictionary must contain the keys `provider`, `chat_model`, and optionally `base_url`, corresponding to the parameters of `register_model_provider`.

::: tip 📌
The `chat_model` parameter supports specifying the model provider via a string value (e.g., `"openai"`, `"deepseek"`), which should be one of the provider names supported by LangChain’s `init_chat_model`.

This feature is designed for models that offer APIs compatible with popular vendor styles (like OpenAI's API). If your model lacks a dedicated LangChain integration but supports, for example, the OpenAI API format, you can pass `"openai"` as the `chat_model` and provide the `base_url` to point to your model's endpoint.

For models following the DeepSeek calling pattern, passing `"deepseek"` is recommended.

This implementation leverages the same underlying concept as LangChain's [Base URL or Proxy configuration](https://docs.langchain.com/oss/python/langchain/models#base-url-or-proxy).
:::

### Loading Chat Models

#### Parameters for `load_chat_model`

- `model`: The model identifier. Can be in two formats:
  - `model_name`: Uses the default registered provider.
  - `provider_name:model_name`: Explicitly specifies which registered provider to use.
- `model_provider` (Optional): If not provided, the provider must be specified within the `model` string (e.g., `dashscope:qwen-flash`).
- `kwargs`: Additional optional parameters to configure the model, such as `temperature`, `api_key`, `max_tokens`, `stop`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_model_provider, load_chat_model
from langchain_qwq import ChatQwen
from dotenv import load_dotenv

load_dotenv()

# Register custom model providers
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1")

# Load and use models
model = load_chat_model(model="dashscope:qwen-flash")
print(model.invoke("Hello"))

model = load_chat_model(model="openrouter:moonshotai/kimi-k2-0905")
print(model.invoke("Hello"))
```

You can also use batch registration for efficiency:

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

# Load models after batch registration
model = load_chat_model(model="dashscope:qwen-flash")
print(model.invoke("Hello"))

model = load_chat_model(model="openrouter:moonshotai/kimi-k2-0905")
print(model.invoke("Hello"))
```

### Important Notes

- **Global Registration**: Registrations are stored in a global dictionary. **All providers must be registered before any `load_chat_model` calls are made**, ideally at application startup.
- **Thread Safety**: Avoid calling `register_model_provider` after the application has started serving requests in a multi-threaded environment to prevent race conditions.
- **Initialization Best Practice**: Place your registration calls in your application’s main `__init__.py` file or a dedicated initialization module.

### Project Structure Example

```text
langgraph-project/
├── src
│   ├── __init__.py                 # Place global registrations here
│   └── graphs
│       ├── __init__.py             # Or here, if graph-specific
│       ├── graph1/
│       └── graph2/
```

## Embeddings Class

### Core Functions

- `register_embeddings_provider`: Register a single embeddings provider
- `batch_register_embeddings_provider`: Register multiple embeddings providers in bulk
- `load_embeddings`: Load and instantiate an embeddings model

### Registering Embeddings Providers

#### Parameters for `register_embeddings_provider`

- `provider_name`: A custom, unique identifier for the embeddings provider.
- `embeddings_model`: Either a LangChain-compatible Embeddings class (e.g., `SiliconFlowEmbeddings`) or a string representing a provider natively supported by LangChain’s `init_embeddings` (e.g., `"openai"`, `"cohere"`).
- `base_url` (Optional): The API endpoint URL. **Highly recommended** if `embeddings_model` is passed as a string.

#### Parameters for `batch_register_embeddings_provider`

- `providers`: A list of dictionaries. Each dictionary must contain the keys `provider`, `embeddings_model`, and optionally `base_url`.

::: tip 📌
Similar to chat models, you can use strings like `"openai"` for `embeddings_model` if your embedding service has a compatible API. Always provide the `base_url` to direct requests to your custom endpoint.
:::

### Loading Embeddings Models

#### Parameters for `load_embeddings`

- `model`: The model identifier. Can be in two formats:
  - `model_name`: Uses the default registered provider.
  - `provider_name:model_name`: Explicitly specifies which registered provider to use.
- `provider` (Optional): If not provided, the provider must be specified within the `model` string.
- `kwargs`: Additional optional parameters, such as `chunk_size`, `api_key`, `dimensions`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_embeddings_provider, load_embeddings
from langchain_siliconflow import SiliconFlowEmbeddings

# Register providers
register_embeddings_provider(
    "dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

register_embeddings_provider(
    "siliconflow", SiliconFlowEmbeddings
)

# Load and use embeddings models
embeddings = load_embeddings("dashscope:text-embedding-v4")
print(embeddings.embed_query("hello world"))

embeddings = load_embeddings("siliconflow:text-embedding-v4")
print(embeddings.embed_query("hello world"))
```

Batch registration example:

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

- **Global Registration**: Like chat models, all embeddings providers must be registered at startup.
- **Thread Safety**: Do not modify the registry after initialization.
- **Initialization**: Place `register_embeddings_provider` calls in `__init__.py`.

## Supported Model Formats

### Chat Models

- `model_name`: Load from the default provider (if one is set or inferred).
- `provider_name:model_name`: Load from a specific, pre-registered provider.

### Embedding Models

- `model_name`: Load from the default provider.
- `provider_name:model_name`: Load from a specific, pre-registered provider.

## Best Practices

1. **Register Early**: Always register providers at application startup.
2. **Use Descriptive Names**: Choose meaningful provider names.
3. **Handle Dependencies**: Ensure all required packages are installed.
4. **Test Registration**: Verify that provider registration is valid before using the model.

**Note**: The `load_chat_model` function is also a drop-in replacement for LangChain's `init_chat_model`. You can use it to load any model that `init_chat_model` supports **without** needing to register it first. The same applies to `load_embeddings` for `init_embeddings`. This module extends functionality for _unsupported_ or _custom_ providers.

## Next Steps

- [Message Processing](./message-processing.md) - Provides a suite of utility functions for the Message class, including chunk merging and more.
- [Tool Enhancement](./tool-enhancement.md) - Further facilitates developers in defining and developing LangChain tools.
- [Context Engineering](./context-engineering.md) - Offers advanced tools for context engineering and corresponding state-mixing classes.
- [API Reference](./api-reference.md) - API documentation reference.
