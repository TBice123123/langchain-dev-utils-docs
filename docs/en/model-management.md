# Model Management

The Model Management module provides a flexible system for registering and loading model providers.

## Overview

While langchain's official `init_chat_model` and `init_embeddings` functions are convenient, they support a relatively limited number of model providers. This module offers the `register_model_provider` (`batch_register_model_provider`) and `register_embeddings_provider` (`batch_register_embeddings_provider`) functions, enabling developers to register any model provider through a unified mechanism.

## ChatModel Class

### Core Functions

- `register_model_provider`: Register a model provider
- `batch_register_model_provider`: Batch register model providers
- `load_chat_model`: Load a chat model

### Registering Model Providers

#### Parameters for `register_model_provider`

- `provider_name`: The provider name; must be a custom name.
- `chat_model`: The chat model class or a string. If it is a string, it must be a provider name supported by langchain's official `init_chat_model` (e.g., `openai`, `anthropic`). In this case, the `init_chat_model` function will be invoked.
- `base_url`: Optional base URL. Only valid when `chat_model` is a string.

#### Parameters for `batch_register_model_provider`

- `providers`: An array of dictionaries, each containing `provider`, `chat_model`, and `base_url`. Each parameter has the same meaning as in `register_model_provider`.

::: tip 📌
The `chat_model` parameter supports specifying the model provider via a string, which should be a provider name supported by langchain's `init_chat_model` (e.g., `openai`).  
This is because many large models offer APIs compatible with other vendors' styles (e.g., OpenAI). If your model lacks a dedicated or suitable integration library but supports API compatibility with other vendors, consider passing the corresponding provider string.  
When using this approach, you must provide the `base_url` parameter or set the provider's `API_BASE` environment variable to specify the custom model's API endpoint.  
If your model is an inference model whose output format is consistent with `deepseek`, you may consider passing `deepseek` here.

This functionality is implemented based on the concept described in: [Configuring the BASE_URL Parameter](https://docs.langchain.com/oss/python/langchain/models#base-url-or-proxy)
:::

### Loading Chat Models

#### Parameters for `load_chat_model`

- `model`: The model name, in the format `model_name` or `provider_name:model_name`.
- `model_provider`: Optional model provider name. If not provided, the `model` parameter must be in the format `provider_name:model_name`.
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

- **Global Registration**: Since the underlying implementation uses a global dictionary, **all model providers must be registered at application startup**.
- **Thread Safety**: Avoid modifying registrations during runtime to prevent concurrency issues in multi-threaded environments.
- **Initialization**: We recommend placing `register_model_provider` calls in your application's `__init__.py` file.

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
- `batch_register_embeddings_provider`: Batch register embeddings providers
- `load_embeddings`: Load an embeddings model

### Registering Embeddings Providers

#### Parameters for `register_embeddings_provider`

- `provider_name`: The provider name; must be a custom name.
- `embeddings_model`: The embeddings model class or a string. If it is a string, it must be a provider name supported by langchain's official `init_embeddings` (e.g., `openai`, `cohere`). In this case, the `init_embeddings` function will be invoked.
- `base_url`: Optional base URL. Only valid when `embeddings_model` is a string.

#### Parameters for `batch_register_embeddings_provider`

- `providers`: An array of dictionaries, each containing `provider`, `embeddings_model`, and `base_url`.

::: tip 📌
The `embeddings_model` parameter supports specifying the embeddings provider via a string, which should be a provider name supported by langchain's `init_embeddings` (e.g., `openai`).  
This is because many embedding models offer APIs compatible with other vendors' styles (e.g., OpenAI). If your model lacks a dedicated or suitable integration library but supports API compatibility with other vendors, consider passing the corresponding provider string.  
When using this approach, you must provide the `base_url` parameter to specify the custom model's API endpoint.
:::

### Loading Embeddings Models

#### Parameters for `load_embeddings`

- `model`: The embeddings model name, in the format `model_name` or `provider_name:model_name`.
- `provider`: Optional embeddings model provider name. If not provided, the `model` parameter must be in the format `provider_name:model_name`.
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

- **Global Registration**: Similarly, all embeddings providers must be registered at application startup.
- **Thread Safety**: Avoid modifying registrations after initialization to prevent concurrency issues.
- **Initialization**: We recommend placing `register_embeddings_provider` calls in your application's `__init__.py` file.

**Note**: `load_chat_model` can also be used to load models supported by `init_chat_model` using the same syntax as above, without requiring a prior `register_chat_model` call. The same applies to `load_embeddings`.

## Next Steps

- [Message Processing](./message-processing.md) — Utility functions for message handling, such as chunk concatenation
- [Tool Enhancement](./tool-enhancement.md) — Add new functionality to existing tools
- [Context Engineering](./context-engineering.md) — Practical tools and State Schemas for context management
- [Graph Orchestration](./graph-orchestration.md) — Combine multiple StateGraphs in parallel or serial workflows
- [API Reference](./api-reference.md) — Complete API documentation
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage
