# Model Management

> [!NOTE]
>
> **Feature Overview**: Provides more efficient and convenient model management (including chat models and embedding models).
>
> **Prerequisites**: Familiarity with Langchain's [Chat Models](https://docs.langchain.com/oss/python/langchain/models) and [Embedding Models](https://docs.langchain.com/oss/python/integrations/text_embedding/).
>
> **Estimated Reading Time**: 10 minutes

## Chat Model Management

In `langchain`, the `init_chat_model` function can be used to initialize a chat model instance, but the model providers it supports are relatively limited. If you wish to use more model providers (especially if your preferred provider is not supported by this function), you can utilize the chat model management functionality provided by this library.

To use a chat model, you must first register the chat model provider using `register_model_provider`, and then you can use `load_chat_model` to load the chat model.

### Registering a Chat Model Provider

The function to register a chat model provider is `register_model_provider`, which accepts the following parameters:

- `provider_name`: The name of the chat model provider, type `str`
- `chat_model`: The chat model, type is `langchain`'s `ChatModel` or `str`
- `base_url`: The base URL for the chat model, type `str`, only effective when `chat_model` is `str`

For `provider_name`, you can pass a custom model provider name. For `chat_model`, you need to pass a `langchain` `ChatModel` or a `str`. A detailed introduction to this parameter is as follows:

**1. Type is ChatModel**

Example code:

```python
from langchain_core.language_models.fake_chat_models import FakeChatModel
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="fakechat",
    chat_model=FakeChatModel,
)
```

In this example, we use the built-in `FakeChatModel` from `langchain_core`, which is only for testing and does not connect to a real model provider. In practical applications, you should pass a `ChatModel` class with actual functionality.

**2. Type is str**

When the `chat_model` parameter is a string, its only current value is `"openai-compatible"`, indicating that it will be accessed through the model provider's OpenAI-compatible API. This is because many model providers currently support the OpenAI-compatible API, such as vllm, openrouter, together, etc.
In this case, the library will use the built-in `OpenAICompatibleChatModel` as the actual chat model.

`OpenAICompatibleChatModel` inherits from `BaseChatOpenAI` in `langchain-openai` and includes several compatibility optimizations on top of it. To ensure proper functionality, please make sure to install the standard version of `langchain-dev-utils` (see [Installation Documentation](./installation.md) for installation methods).

Compared to directly using `ChatOpenAI` provided by `langchain-openai`, this library's `OpenAICompatibleChatModel` has the following advantages:

1. **Supports outputting more types of reasoning content (`reasoning_content`)**:  
   `ChatOpenAI` can only output reasoning content natively supported by official OpenAI models, while `OpenAICompatibleChatModel` can output reasoning content from other model providers (e.g., openrouter).

2. **Optimized default behavior for structured output**:  
   When calling `with_structured_output`, the default value for the `method` parameter is adjusted to `"function_calling"` (instead of `"json_schema"` as default in `ChatOpenAI`), providing better compatibility with other models.

For the case where `chat_model` is a string (specifically `"openai-compatible"`), you must provide `base_url`. You can provide it by directly passing `base_url` in this function or by setting the `API_BASE` for the model's provider.

For example, suppose we want to use a model deployed by vllm. We can set it up as follows:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

Or set it up like this:

```bash
export VLLM_API_BASE=http://localhost:8000/v1
```

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible"
)
```

::: tip Supplement
`vllm` is a well-known large model deployment framework that can deploy large models as OpenAI-compatible APIs. For example, to deploy the qwen3-4b model, you can use the following command:

```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```

After completion, it provides an OpenAI-compatible API at `http://localhost:8000/v1`.
:::

### Loading a Chat Model

The function to load a chat model is `load_chat_model`, which accepts the following parameters:

- `model`: The name of the chat model, type `str`
- `model_provider`: The name of the chat model provider, type `str`, optional
- `kwargs`: Other additional parameters

For the `model` parameter, the supported formats are:

- `provider_name:model_name`
- `model_name`

Where `provider_name` is the `provider_name` registered in the `register_model_provider` function.

For the `model_provider` parameter, its meaning is the same as the `provider_name` mentioned above. It is allowed to omit this parameter, but in that case, the `model` parameter must be in the `provider_name:model_name` format. If provided, the `model` parameter must be in the `model_name` format.
Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

You can also directly pass the `model_provider` parameter.

```python
from langchain_dev_utils.chat_models import load_chat_model

model = load_chat_model("qwen3-4b", model_provider="vllm")
```

**Note**: Although `vllm` itself may not require an api_key, because this `OpenAICompatibleChatModel` requires an `api_key`, you must set it.

```bash
export VLLM_API_KEY=vllm
```

For the case where `chat_model` is a string (i.e., `"openai-compatible"`), it provides the basic functionality of `langchain`'s `ChatModel`, including the following:

::: details Regular Invocation
For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Also supports asynchronous invocation.

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = await model.ainvoke([HumanMessage("Hello")])
print(response)
```

:::

::: details Streaming Output
For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
for chunk in model.stream([HumanMessage("Hello")]):
    print(chunk)
```

Also supports asynchronous streaming invocation.

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
async for chunk in model.astream([HumanMessage("Hello")]):
    print(chunk)
```

:::

::: details Tool Calling
Note: Ensure the model supports tool calling.

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
import datetime

@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())

model = load_chat_model("vllm:qwen3-4b").bind_tools([get_current_time])
response = model.invoke([HumanMessage("Get the current timestamp")])
print(response)
```

:::

::: details Structured Output
By default, the `function_calling` method is used, so the model needs to support tool calling.

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

model = load_chat_model("vllm:qwen3-4b").with_structured_output(User)
response = model.invoke([HumanMessage("Hello, my name is Zhang San, I am 25 years old")])
print(response)
```

:::

Additionally, because the `ChatModel` it uses inherits from `BaseChatOpenAI`, it supports passing model parameters of `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.
Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here disabling thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Also, it supports multimodal data. You can use the OpenAI-compatible multimodal data format or directly use `content_block` from `langchain`. For example:

```python
from langchain_core.messages import HumanMessage

from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="openrouter",
    chat_model="openai-compatible",
    base_url="https://openrouter.ai/api/v1",
)

messages = [
    HumanMessage(
        content_blocks=[
            {
                "type": "image",
                "url": "https://example.com/image.png",
            },
            {"type": "text", "text": "Describe this image"},
        ]
    )
]

model = load_chat_model("openrouter:qwen/qwen3-vl-8b-thinking")
response = model.invoke(messages)
print(response)
```

### Batch Registration

If you need to register multiple model providers, you can use the `register_model_provider` function multiple times. However, this is obviously very cumbersome. Therefore, this library provides a batch registration function `batch_register_model_provider`.

It accepts a parameter `providers`, which is a list of dictionaries. Each dictionary has three keys: `provider`, `chat_model`, and `base_url`.

Example code:

```python
from langchain_dev_utils.chat_models import (
    batch_register_model_provider,
    load_chat_model,
)
from langchain_core.language_models.fake_chat_models import FakeChatModel

batch_register_model_provider(
    providers=[
        {
            "provider": "fakechat",
            "chat_model": FakeChatModel,
        },
        {
            "provider": "vllm",
            "chat_model": "openai-compatible",
            "base_url": "http://localhost:8000/v1",
        },
    ]
)

model = load_chat_model("vllm:qwen3-4b")
print(model.invoke("Hello"))

model = load_chat_model("fakechat:fake-chat")
print(model.invoke("Hello"))
```

## Embedding Model Management

Similar to `init_chat_model`, `langchain` also provides the `init_embeddings` function for initializing embedding models, but the model providers it supports are still limited. Therefore, you can also use this library's functionality to conveniently manage embedding models.

To use an embedding model, you must first register the embedding model provider using `register_embeddings_provider`, and then you can use `load_embeddings` to load the embedding model.

### Registering an Embedding Model Provider

Similar to registering a chat model provider, the function to register an embedding model provider is `register_embeddings_provider`, which accepts the following parameters:

- `provider_name`: The name of the embedding model provider, type `str`
- `embeddings_model`: The embedding model, type is `langchain`'s `Embeddings` or `str`
- `base_url`: The base URL for the embedding model, type `str`, only effective when `embeddings_model` is `str`

For `provider_name`, you can pass a custom model provider name. For `embeddings_model`, you need to pass a `langchain` `Embeddings` or a `str`. A detailed introduction to this parameter is as follows:

**1. Type is Embeddings**

Example code:

```python
from langchain_dev_utils.embeddings import load_embeddings, register_embeddings_provider
from langchain_core.embeddings.fake import FakeEmbeddings

register_embeddings_provider(
    provider_name="fakeembeddings",
    embeddings_model=FakeEmbeddings,
)
```

In this example, we use the built-in `FakeEmbeddings` from `langchain_core`, which is only for testing and does not connect to a real model provider. In practical applications, you should pass an `Embeddings` class with actual functionality.

**2. Type is str**

Similar to chat models, when the `embeddings_model` parameter is a string, its only current value is `"openai-compatible"`, indicating that it will be accessed through the model provider's OpenAI-compatible API.
In this case, the library will use the built-in `OpenAIEmbeddings` as the actual embedding model.
Note that `OpenAIEmbeddings` by default tokenizes the input text, which may cause errors when connecting to other OpenAI API-compatible embedding models. To solve this problem, this library explicitly sets the `check_embedding_ctx_length` parameter to `False` when loading the model, skipping the tokenization step to avoid compatibility issues.
For the case where `embeddings_model` is a string (specifically `"openai-compatible"`), you must also provide `base_url`. You can provide it by directly passing `base_url` in this function or by setting the `API_BASE` for the model's provider.

For example, suppose we want to use a model deployed by vllm. We can set it up as follows:

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

Or set it up like this:

```bash
export VLLM_API_BASE=http://localhost:8000/v1
```

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible"
)
```

::: Tip Supplement
`vllm` can also deploy Embeddings models. The reference command is as follows:

```bash
vllm serve Qwen/Qwen3-Embedding-4B \
--task embed\
--served-model-name qwen3-embedding-4b \
--host 0.0.0.0 --port 8000
```

After completion, it provides an OpenAI-compatible API at `http://localhost:8000/v1`.
:::

### Loading an Embedding Model

The function to load an embedding model is `load_embeddings`, which accepts the following parameters:

- `model`: The name of the embedding model, type `str`
- `provider`: The name of the embedding model provider, type `str`, optional
- `kwargs`: Other additional parameters

For the `model` parameter, the supported formats are:

- `provider_name:embeddings_name`
- `embeddings_name`

Where `provider_name` is the `provider_name` registered in the `register_embeddings_provider` function.

For the `provider` parameter, its meaning is the same as the `provider_name` mentioned above. It is allowed to omit this parameter, but in that case, the `model` parameter must be in the `provider_name:embeddings_name` format. If provided, the `model` parameter must be in the `embeddings_name` format.
Example code:

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("vllm:qwen3-embedding-4b")
emb = embeddings.embed_query("Hello")
print(emb)
```

You can also directly pass the `provider` parameter.

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("qwen3-embedding-4b", provider="vllm")
emb = embeddings.embed_query("Hello")
print(emb)
```

### Batch Registration

Similar to chat models, there is also a function for batch registration of embedding model providers: `batch_register_embeddings_provider`.
Reference code:

```python
from langchain_dev_utils.embeddings import (
    batch_register_embeddings_provider,
    load_embeddings,
)
from langchain_core.embeddings.fake import FakeEmbeddings

batch_register_embeddings_provider(
    providers=[
        {
            "provider": "fakeembeddings",
            "embeddings_model": FakeEmbeddings,
        },
        {
            "provider": "vllm",
            "embeddings_model": "openai-compatible",
            "base_url": "http://localhost:8000/v1",
        },
    ]
)

embedding = load_embeddings("vllm:qwen3-embedding-4b")
emb = embedding.embed_query("Hello")
print(emb)

embedding = load_embeddings(
    "fakeembeddings:fake-emb", size=1024
)  # The size parameter is not mandatory; it is required for initializing FakeEmbeddings. Your Embeddings model might not need it.
emb = embedding.embed_query("Hello")
print(emb)
```

## Note

`register_model_provider`, `register_embeddings_provider`, and their corresponding batch registration functions `batch_register_model_provider` and `batch_register_embeddings_provider` are all implemented based on a global dictionary. To avoid multi-threading concurrency issues, please ensure that all registration operations are completed during the project startup phase. Do not dynamically register during runtime.
