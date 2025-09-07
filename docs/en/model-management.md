# Model Management

The Model Management module provides a flexible system for registering and loading model providers.

## Overview

LangChain's official `init_chat_model` and `init_embeddings` functions are convenient, but they support a relatively limited number of model providers. This module provides `register_model_provider` and `register_embeddings_provider` functions, enabling developers to register any model provider through a unified mechanism.

## ChatModel Class

### Core Functions

- `register_model_provider`: Register a model provider
- `load_chat_model`: Load a chat model

### Registering Model Providers

#### Parameters for `register_model_provider`

- `provider_name`: Provider name; must be a custom name
- `chat_model`: ChatModel class or string. If it's a string, it must be a provider supported by official `init_chat_model` (e.g., `openai`, `anthropic`). In this case, the `init_chat_model` function will be called.
- `base_url`: Optional base URL. Recommended when `chat_model` is a string.

#### Loading Chat Models

#### Parameters for `load_chat_model`

- `model`: Model name, format as `model_name` or `provider_name:model_name`
- `model_provider`: Optional model provider name. If not provided, the provider name must be included in the `model` parameter.
- `kwargs`: Optional additional model parameters, such as `temperature`, `api_key`, `stop`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_model_provider, load_chat_model
from langchain_qwq import ChatQwen
from dotenv import load_dotenv

load_dotenv()

# Register custom model providers
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1 ")

# Load models
model = load_chat_model(model="dashscope:qwen-flash")
print(model.invoke("Hello"))

model = load_chat_model(model="openrouter:moonshotai/kimi-k2-0905")
print(model.invoke("Hello"))
```

### Important Notes

- **Global Registration**: Since the underlying implementation uses a global dictionary, **all model providers must be registered at application startup**.
- **Thread Safety**: Modifications should be avoided at runtime to prevent multi-threading concurrency issues.
- **Initialization**: We recommend placing `register_model_provider` calls in the application's `__init__.py` file.

### Example Project Structure

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

- `register_embeddings_provider`: Register an embedding model provider
- `load_embeddings`: Load an embedding model

### Registering Embedding Providers

#### Parameters for `register_embeddings_provider`

- `provider_name`: Provider name; must be a custom name
- `embeddings_model`: Embeddings class or string. If it's a string, it must be a provider supported by official `init_embeddings` (e.g., `openai`, `cohere`). In this case, the `init_embeddings` function will be called.
- `base_url`: Optional base URL. Recommended when `embeddings_model` is a string.

### Loading Embedding Models

#### Parameters for `load_embeddings`

- `model`: Model name, format as `model_name` or `provider_name:model_name`
- `provider`: Optional model provider name. If not provided, the provider name must be included in the `model` parameter.
- `kwargs`: Optional additional model parameters, such as `chunk_size`, `api_key`, `dimensions`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_embeddings_provider, load_embeddings

register_embeddings_provider(
    "dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1 "
)

embeddings = load_embeddings("dashscope:text-embedding-v4")

print(embeddings.embed_query("hello world"))
```

### Important Notes

- **Global Registration**: Similarly, all embedding model providers must be registered at application startup.
- **Thread Safety**: Modifications should not be made after registration to avoid multi-threading concurrency issues.
- **Initialization**: We recommend placing `register_embeddings_provider` in the application's `__init__.py` file.

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
4. **Test Registration**: Verify provider registration is valid before using models

**Note**: `load_chat_model` can also be used to load models supported by `init_chat_model`, using the same method as above, without registration. The same applies to `load_embeddings`.

## Next Steps

- [Message Processing](./message-processing.md) - Learn about message utilities
- [Tool Enhancement](./tool-enhancement.md) - Add human review to tools
- [API Reference](./api-reference.md) - Complete API documentation
