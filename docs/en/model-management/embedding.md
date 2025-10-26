# Embeddings Model Management

> [!NOTE]
>
> **Overview**: Provides more efficient and convenient embeddings model management.
>
> **Prerequisites**: Familiarity with Langchain's [Embeddings Models](https://docs.langchain.com/oss/python/integrations/text_embedding/).
>
> **Estimated Reading Time**: 10 minutes

Similar to `init_chat_model`, `langchain` also provides the `init_embeddings` function for initializing embeddings models, but it still supports a limited number of model providers. Therefore, you can also use this library's functionality to conveniently manage embeddings models.

To use an embeddings model, you must first register the embeddings model provider using `register_embeddings_provider`, and then you can use `load_embeddings` to load the embeddings model.

## Registering an Embeddings Model Provider

Similar to registering chat model providers, the function to register an embeddings model provider is `register_embeddings_provider`, which accepts the following parameters:

- `provider_name`: The name of the embeddings model provider, type `str`
- `embeddings_model`: The embeddings model, type is either `langchain`'s `Embeddings` or `str`
- `base_url`: The base URL for the embeddings model, type `str`, only effective when `embeddings_model` is `str`

For `provider_name`, you can pass a custom model provider name. For `embeddings_model`, you need to pass either a `langchain` `Embeddings` or a `str`. Detailed explanations for this parameter are as follows:

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

Similar to chat models, when the `embeddings_model` parameter is a string, its only currently accepted value is `"openai-compatible"`, indicating that it will connect via the model provider's OpenAI-compatible API.
In this case, the library will use the built-in `OpenAIEmbeddings` as the actual embeddings model.
It's important to note that `OpenAIEmbeddings` defaults to tokenizing input text, which may cause errors when connecting to other OpenAI API-compatible embeddings models. To address this issue, this library explicitly sets the `check_embedding_ctx_length` parameter to `False` when loading the model, thereby skipping the tokenization step and avoiding compatibility issues.

When `embeddings_model` is a string (specifically `"openai-compatible"`), you must also provide the `base_url`. You can do this by passing `base_url` directly in this function or by setting the `API_BASE` environment variable for the model provider.

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

::: tip Note
`vllm` can also deploy Embeddings models. Reference command:

```bash
vllm serve Qwen/Qwen3-Embedding-4B \
--task embed\
--served-model-name qwen3-embedding-4b \
--host 0.0.0.0 --port 8000
```

After completion, it provides an OpenAI-compatible API at `http://localhost:8000/v1`.
:::

## Loading an Embeddings Model

The function to load an embeddings model is `load_embeddings`, which accepts the following parameters:

- `model`: The name of the embeddings model, type `str`
- `provider`: The name of the embeddings model provider, type `str`, optional
- `kwargs`: Other additional parameters

For the `model` parameter, the supported formats are:

- `provider_name:embeddings_name`
- `embeddings_name`

Where `provider_name` is the `provider_name` registered in the `register_embeddings_provider` function.

For the `provider` parameter, its meaning is the same as the `provider_name` mentioned above. It is allowed to omit this parameter, but in that case, the `model` parameter must be in the `provider_name:embeddings_name` format. If `provider` is provided, then the `model` parameter must be in the `embeddings_name` format.
Example code:

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("vllm:qwen3-embedding-4b")
emb = embeddings.embed_query("Hello")
print(emb)
```

You can also pass the `provider` parameter directly.

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("qwen3-embedding-4b", provider="vllm")
emb = embeddings.embed_query("Hello")
print(emb)
```

## Batch Registration

Similar to chat models, there is also a function for batch registration of embeddings model providers: `batch_register_embeddings_provider`.
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
)  # The size parameter is not mandatory; it's required for FakeEmbeddings initialization. Your Embeddings model might not need it.
emb = embedding.embed_query("Hello")
print(emb)
```

## Note

Both `register_embeddings_provider` and its corresponding batch registration function `batch_register_embeddings_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please ensure all registration operations are completed during the project startup phase. Do not dynamically register providers during runtime.
