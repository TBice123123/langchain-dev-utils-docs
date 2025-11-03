# Embeddings Model Management

> [!NOTE]
>
> **Overview**: Provides more efficient and convenient embeddings model management.
>
> **Prerequisites**: Familiarity with LangChain's [Embeddings Models](https://docs.langchain.com/oss/python/integrations/text_embedding/).
>
> **Estimated Reading Time**: 10 minutes

Similar to `init_chat_model`, `langchain` also provides the `init_embeddings` function for initializing embeddings models, but the model providers it supports are still limited. Therefore, you can also use this library's functionality to conveniently manage embeddings models.

To use an embeddings model, you first need to register the embeddings model provider using `register_embeddings_provider`, and then you can use `load_embeddings` to load the embeddings model.

## Registering an Embeddings Model Provider

Similar to registering a chat model provider, the function to register an embeddings model provider is `register_embeddings_provider`, which accepts the following parameters:

- **provider_name**: The name of the embeddings model provider, type is str.
- **embeddings_model**: The embeddings model, type is either a LangChain Embeddings or str.
- **base_url**: The base URL for the embeddings model, type is str. Only takes effect when embeddings_model is str.

### Setting provider_name

Similar to chat model providers, the `provider_name` parameter accepts a string that can be customized.

### Setting embeddings_model

For the `embeddings_model` parameter, it accepts two types: a LangChain `Embeddings` or a `str`.

We explain the different types for this parameter separately:

**1. Type is Embeddings**

Example code:

```python
from langchain_dev_utils.embeddings import load_embeddings, register_embeddings_provider
from langchain_core.embeddings.fake import FakeEmbeddings

register_embeddings_provider(
    provider_name="fake_provider",
    embeddings_model=FakeEmbeddings,
)
```

In this example, we use the built-in `FakeEmbeddings` from `langchain_core`, which is only for testing and does not connect to a real model provider. **In practical applications, you should pass an `Embeddings` class that has actual functionality.**

**2. Type is str**

Similar to chat models, when the `embeddings_model` parameter is a string, its only current valid value is `"openai-compatible"`, indicating that it will be connected via the model provider's OpenAI-compatible API.
In this case, the library uses `OpenAIEmbeddings` from `langchain-openai` as the actual embeddings model.
It's important to note that `OpenAIEmbeddings` performs tokenization on input text by default, which may cause errors when connecting to other OpenAI-compatible API embeddings models. To solve this issue, this library explicitly sets the `check_embedding_ctx_length` parameter to `False` when loading the model, thereby skipping the tokenization step and avoiding compatibility problems.

### Setting base_url (Optional)

For the case where `embeddings_model` is a string (specifically `"openai-compatible"`), you must also provide the `base_url`. You can pass the `base_url` directly in this function, or set the model provider's `API_BASE` environment variable.

For example, suppose we want to use a model deployed by vLLM, we can set it up like this:

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

Or set it like this:

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

::: danger note
Both `register_embeddings_provider` and its corresponding batch registration function `batch_register_embeddings_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please ensure that all registration operations are completed during the project startup phase. Do not dynamically register providers during runtime.
:::

::: tip tips
`vllm` can also deploy Embeddings models. The reference command is as follows:

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

- **model**: The name of the embeddings model, type is str.
- **provider**: The name of the embeddings model provider, type is str, optional.
- **kwargs**: Other additional parameters.

For the **model** parameter, it supports the following formats:

- provider_name:embeddings_name
- embeddings_name

Where **provider_name** is the `provider_name` registered in the `register_embeddings_provider` function.

For the **provider** parameter, its meaning is the same as the **provider_name** mentioned above. It is allowed to be omitted, but in that case, the **model** parameter must be in the **provider_name:embeddings_name** format. If provided, the **model** parameter must be in the **embeddings_name** format.
Example code:

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("vllm:qwen3-embedding-4b")
emb = embeddings.embed_query("Hello")
print(emb)
```

You can also directly pass the **provider** parameter.

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("qwen3-embedding-4b", provider="vllm")
emb = embeddings.embed_query("Hello")
print(emb)
```

## Batch Registration

Similar to chat models, there is also a function for batch registering embeddings model providers: `batch_register_embeddings_provider`.
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
            "provider": "fake_provider",
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
    "fake_provider:fake-emb", size=1024
)  # The size parameter is not mandatory; it's required for initializing FakeEmbeddings. Your Embeddings model might not need it.
emb = embedding.embed_query("Hello")
print(emb)
```

::: tip tips
For model providers officially supported by the `init_embeddings` function, you can also use the `load_embeddings` function to load models directly without additional registration. Therefore, if you need to integrate multiple models where some providers are officially supported and others are not, you can consider using `load_embeddings` for unified loading. For example:

```python
from langchain_dev_utils.embeddings import load_embeddings

# You must specify both the provider and model name when loading the model
model = load_embeddings("openai:text-embedding-3-large")
# Or explicitly specify the provider parameter
model = load_embeddings("text-embedding-3-large", provider="openai")
```

:::
