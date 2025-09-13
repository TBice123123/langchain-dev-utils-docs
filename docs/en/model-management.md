# Model Management

The model management module provides a flexible system for registering and loading model providers.

## Overview

LangChain's official `init_chat_model` and `init_embeddings` functions are convenient, but they support a relatively limited number of model providers. This module provides the `register_model_provider` (`batch_register_model_provider`) and `register_embeddings_provider` (`batch_register_embeddings_provider`) functions, enabling developers to register any model provider through a unified mechanism.

## ChatModel Class

### Core Functions

- `register_model_provider`: Register a model provider
- `batch_register_model_provider`: Batch register model providers
- `load_chat_model`: Load a chat model

### Registering Model Providers

#### Parameters for `register_model_provider`

- `provider_name`: Provider name; must be a custom name
- `chat_model`: ChatModel class or string. If a string, it must be a provider supported by the official `init_chat_model` (e.g., `openai`, `anthropic`). In this case, the `init_chat_model` function will be invoked.
- `base_url`: Optional base URL. Recommended when `chat_model` is a string.

#### Parameters for `batch_register_model_provider`

- `providers`: An array of dictionaries, each containing `provider`, `chat_model`, and `base_url`.

::: tip 📌
The `chat_model` parameter supports specifying the model provider via a string value, which should be one of the provider names supported by LangChain’s `init_chat_model` (e.g., `"openai"`).  
This is because many large models offer APIs compatible with other vendors' styles (e.g., OpenAI-style). If your model lacks a dedicated or suitable integration library but supports API styles compatible with other vendors, consider passing the corresponding provider string.  
When using this approach, you must also provide the `base_url` parameter or set the provider’s API_BASE environment variable to specify the custom model’s API endpoint.  
If your model is an inference model following DeepSeek’s calling pattern, we also recommend passing the value `"deepseek"`.

This feature's implementation idea can be referred to: [Configure BASEURL Parameter](https://docs.langchain.com/oss/python/langchain/models#base-url-or-proxy)
:::

### Loading Chat Models

#### Parameters for `load_chat_model`

- `model`: Model name, in format `model_name` or `provider_name:model_name`
- `model_provider`: Optional model provider name. If not provided, the provider name must be included in the `model` parameter.
- `kwargs`: Optional additional model parameters, such as `temperature`, `api_key`, `stop`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_model_provider, load_chat_model
from langchain_qwq import ChatQwen
from dotenv import load_dotenv

load_dotenv()

# Register a custom model provider
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1  ")

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
        "base_url": "https://openrouter.ai/api/v1  ",
    },
])
model = load_chat_model(model="dashscope:qwen-flash")
print(model.invoke("Hello"))

model = load_chat_model(model="openrouter:moonshotai/kimi-k2-0905")
print(model.invoke("Hello"))
```

### Important Notes

- **Global Registration**: Due to the underlying implementation using a global dictionary, **all model providers must be registered at application startup**.
- **Thread Safety**: Avoid modifying registrations at runtime to prevent concurrency issues in multi-threaded environments.
- **Initialization**: We recommend placing `register_model_provider` calls in your application’s `__init__.py` file.

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

- `provider_name`: Provider name; must be a custom name
- `embeddings_model`: Embeddings class or string. If a string, it must be a provider supported by the official `init_embeddings` (e.g., `openai`, `cohere`). In this case, the `init_embeddings` function will be invoked.
- `base_url`: Optional base URL. Recommended when `embeddings_model` is a string.

#### Parameters for `batch_register_embeddings_provider`

- `providers`: An array of dictionaries, each containing `provider`, `embeddings_model`, and `base_url`.

::: tip 📌
The `embeddings_model` parameter supports specifying the model provider via a string value, which should be one of the provider names supported by LangChain’s `init_embeddings` (e.g., `"openai"`).  
This is because many large models offer APIs compatible with other vendors' styles (e.g., OpenAI-style). If your model lacks a dedicated or suitable integration library but supports API styles compatible with other vendors, consider passing the corresponding provider string.  
When using this approach, you must also provide the `base_url` parameter to specify the custom model’s API endpoint.
:::

### Loading Embeddings Models

#### Parameters for `load_embeddings`

- `model`: Model name, in format `model_name` or `provider_name:model_name`
- `provider`: Optional model provider name. If not provided, the provider name must be included in the `model` parameter.
- `kwargs`: Optional additional model parameters, such as `chunk_size`, `api_key`, `dimensions`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_embeddings_provider, load_embeddings
from langchain_siliconflow import SiliconFlowEmbeddings

register_embeddings_provider(
    "dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1  "
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
- **Thread Safety**: Do not modify registrations after initialization to avoid concurrency issues.
- **Initialization**: We recommend placing `register_embeddings_provider` calls in your application’s `__init__.py` file.

## Supported Model Formats

### Chat Models

- `model_name` - Load from default provider
- `provider_name:model_name` - Load from specific provider

### Embedding Models

- `model_name` - Load from default provider
- `provider_name:model_name` - Load from specific provider

## Best Practices

1. **Register Early**: Always register providers at application startup
2. **Use Descriptive Names**: Choose meaningful provider names
3. **Handle Dependencies**: Ensure all required packages are installed
4. **Test Registrations**: Verify provider registration is effective before using models

**Note**: `load_chat_model` can also be used to load models supported by `init_chat_model` using the same syntax above, without requiring registration. The same applies to `load_embeddings`.

## Next Steps

- [Message Processing](./message-processing.md) - Learn about message utilities
- [Tool Enhancement](./tool-enhancement.md) - Add human review to tools
- [API Reference](./api-reference.md) - Complete API documentation
