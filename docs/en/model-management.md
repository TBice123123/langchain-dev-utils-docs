# Model Management

The Model Management module provides a flexible system for registering and loading model providers.

## Overview

LangChain's official `init_chat_model` and `init_embeddings` functions are convenient, but they support a relatively limited number of model providers. This module provides `register_model_provider` (`batch_register_model_provider`) and `register_embeddings_provider` (`batch_register_embeddings_provider`) functions, enabling developers to register any model provider through a unified mechanism.

## ChatModel Class

### Core Functions

- `register_model_provider`: Register a model provider
- `batch_register_model_provider`: Batch register model providers
- `load_chat_model`: Load a chat model

### Registering Model Providers

#### Parameters for `register_model_provider`

- `provider_name`: Provider name; must be a custom name
- `chat_model`: Chat model class or string. If it's a string, currently only `openai-compatible` is supported.
- `base_url`: Optional base URL. Only valid when `chat_model` is a string.

#### Parameters for `batch_register_model_provider`

- `providers`: An array of dictionaries, each containing `provider`, `chat_model`, and `base_url`, with the same meanings as in `register_model_provider`.

::: tip 📌
`chat_model` supports specifying the use of OpenAI-compatible API for model calls via the string parameter `openai-compatible`. You can refer to this section in the official LangChain documentation: [Setting API_BASE](https://docs.langchain.com/oss/python/langchain/models#base-url-or-proxy).
When using this mode, you must also provide the `base_url` parameter or set the API_BASE environment variable for the corresponding environment to specify the API service address of the custom model.
Furthermore, this utility library has enhanced the ChatModel class corresponding to `openai-compatible`, including features such as supporting the output of reasoning content.
:::

#### Loading Chat Models

#### Parameters for `load_chat_model`

- `model`: Model name, in the format `model_name` or `provider_name:model_name`
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
register_model_provider("openrouter", "openai-compatible", base_url="https://openrouter.ai/api/v1")

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
        "chat_model": "openai-compatible",
        "base_url": "https://openrouter.ai/api/v1",
    },
])
model = load_chat_model(model="dashscope:qwen-flash")
print(model.invoke("Hello"))

model = load_chat_model(model="openrouter:moonshotai/kimi-k2-0905")
print(model.invoke("Hello"))
```

### Important Notes

- **Global Registration**: Since the underlying implementation uses a global dictionary, **all model providers must be registered when the application starts**.
- **Thread Safety**: Modifications at runtime should be avoided to prevent multi-threading concurrency synchronization issues.
- **Initialization**: We recommend placing `register_model_provider` calls in the application's `__init__.py` file.

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

---

## Embeddings Class

### Core Functions

- `register_embeddings_provider`: Register an embeddings provider
- `batch_register_embeddings_provider`: Batch register embeddings providers
- `load_embeddings`: Load an embeddings model

### Registering Embeddings Providers

#### Parameters for `register_embeddings_provider`

- `provider_name`: Provider name; must be a custom name
- `embeddings_model`: Embeddings class or string. If it's a string, currently only `openai-compatible` is supported.
- `base_url`: Optional base URL. Only valid when `embeddings_model` is a string.

#### Parameters for `batch_register_embeddings_provider`

- `providers`: An array of dictionaries, each containing `provider`, `embeddings_model`, and `base_url`.

::: tip 📌
`embeddings_model` supports specifying the embeddings model provider via a string parameter. Currently, its value only supports `openai-compatible`. In this case, the `init_embeddings` function will be used to create the Embeddings instance.
:::

### Loading Embeddings Models

#### Parameters for `load_embeddings`

- `model`: Embeddings model name, in the format `model_name` or `provider_name:model_name`
- `provider`: Optional embeddings model provider name. If not provided, the `model` parameter must be in the format `provider_name:model_name`.
- `kwargs`: Optional additional model parameters, such as `chunk_size`, `api_key`, `dimensions`, etc.

### Usage Examples

```python
from langchain_dev_utils import register_embeddings_provider, load_embeddings
from langchain_siliconflow import SiliconFlowEmbeddings

register_embeddings_provider(
    "dashscope", "openai-compatible", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

register_embeddings_provider(
    "siliconflow", SiliconFlowEmbeddings
)

embeddings = load_embeddings("dashscope:text-embedding-v4")

print(embeddings.embed_query("hello world"))

embeddings = load_embeddings("siliconflow:text-embedding-v4")
print(embeddings.embed_query("hello world"))
```

Batch registration can also be used:

```python
from langchain_dev_utils import batch_register_embeddings_provider
batch_register_embeddings_provider(
    [
        {"provider": "dashscope", "embeddings_model": "openai-compatible"},
        {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
    ]
)
embeddings = load_embeddings("dashscope:text-embedding-v4")
print(embeddings.embed_query("hello world"))
embeddings = load_embeddings("siliconflow:text-embedding-v4")
print(embeddings.embed_query("hello world"))
```

### Important Notes

- **Global Registration**: Similarly, all embeddings model providers must be registered when the application starts.
- **Thread Safety**: Modifications should not be made after registration to avoid multi-threading concurrency issues.
- **Initialization**: We recommend placing `register_embeddings_provider` in the application's `__init__.py` file.

**Note**: `load_chat_model` can also be used to load models supported by `init_chat_model`, using the same method as described above, without needing to call `register_chat_model` for registration. The same applies to `load_embeddings`.

## Next Steps

- [Tool Enhancement](./tool-enhancement.md) — Add new functionality to existing tools.
- [Context Engineering](./context-engineering.md) — Practical tools and State Schemas for context management.
- [Graph Orchestration](./graph-orchestration.md) — Combine multiple StateGraphs in parallel or serial workflows.
- [Prebuilt Agent](./prebuilt.md) — Effectively aligns with the prebuilt Agent of the official library, but extends its model selection.
- [API Reference](./api-reference.md) — Complete API documentation.
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage.
