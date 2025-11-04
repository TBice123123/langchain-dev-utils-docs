# Embeddings Model Management

> [!NOTE]
>
> **Overview**: Provides more efficient and convenient embeddings model management.
>
> **Prerequisites**: Familiarity with LangChain's [Embeddings Models](https://docs.langchain.com/oss/python/integrations/text_embedding/).
>
> **Estimated Reading Time**: 10 minutes

Similar to `init_chat_model`, `langchain` also provides the `init_embeddings` function for initializing embeddings models, but the model providers it supports remain limited. Therefore, you can also use this library's functionality to conveniently manage embeddings models.

To use an embeddings model, you first need to register the embeddings model provider using `register_embeddings_provider`, and then you can use `load_embeddings` to load the embeddings model.

## Registering an Embeddings Model Provider

Similar to registering a chat model provider, the function to register an embeddings model provider is `register_embeddings_provider`, which accepts the following parameters:

- **provider_name**: The name of the embeddings model provider, type is str.
- **embeddings_model**: The embeddings model, type is either a LangChain Embeddings class or str.
- **base_url**: The base URL for the embeddings model, type is str, only effective when embeddings_model is str.

### Step 1: Set provider_name

Similar to the chat model provider, the `provider_name` parameter accepts a string that can be customized.

### Step 2: Set embeddings_model

For the `embeddings_model` parameter, it accepts two types: a LangChain `Embeddings` class or a `str`.

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

In this example, we use the built-in `FakeEmbeddings` from `langchain_core`, which is only for testing and does not connect to a real model provider. **In practical applications, you should pass an `Embeddings` class with actual functionality.**

**2. Type is str**

Similar to chat models, when the `embeddings_model` parameter is a string, its only current valid value is `"openai-compatible"`, indicating that it will be accessed via the model provider's OpenAI-compatible API.
In this case, the library uses `OpenAIEmbeddings` from `langchain-openai` as the actual embeddings model.
It's important to note that `OpenAIEmbeddings` performs tokenization on input text by default, which might cause errors when connecting to other OpenAI API-compatible embeddings models. To address this issue, this library explicitly sets the `check_embedding_ctx_length` parameter to `False` when loading the model, thereby skipping the tokenization step and avoiding compatibility problems.

### Step 3: Set base_url (Optional)

For the case where `embeddings_model` is a string (specifically `"openai-compatible"`), you must also provide the `base_url`. You can pass the `base_url` directly in this function, or set the `API_BASE` environment variable for the model provider.

For example, if we want to use a model deployed by vLLM, we can set it like this:

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

::: tip Additional Info
`vllm` can also deploy Embeddings models. A reference command is as follows:

```bash
vllm serve Qwen/Qwen3-Embedding-4B \
--task embed\
--served-model-name qwen3-embedding-4b \
--host 0.0.0.0 --port 8000
```

This will provide an OpenAI-compatible API at `http://localhost:8000/v1`.
:::

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

::: warning Note
Both `register_embeddings_provider` and its corresponding batch registration function `batch_register_embeddings_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please ensure all registrations are completed during the project startup phase. Do not dynamically register providers during runtime.
:::

## Loading an Embeddings Model

The function to load an embeddings model is `load_embeddings`, which accepts the following parameters:

- **model**: The embeddings model name, type is str.
- **provider**: The embeddings model provider name, type is str, optional.
- **kwargs**: Other additional parameters.

For the **model** parameter, the supported formats are:

- provider_name:embeddings_name
- embeddings_name

Where **provider_name** is the `provider_name` registered in the `register_embeddings_provider` function.

For the **provider** parameter, its meaning is the same as **provider_name** mentioned above. It is allowed to omit this parameter, but in that case, the **model** parameter must be in the **provider_name:embeddings_name** format. If **provider** is provided, then the **model** parameter must be in the **embeddings_name** format.
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

::: tip Tips
Similar to chat models, for model providers already supported by the official `init_embeddings` function, you can also use the `load_embeddings` function directly for loading without additional registration. Therefore, if you need to connect to multiple models, some providers being officially supported and others not, consider using `load_embeddings` uniformly for loading. For example:

```python
from langchain_dev_utils.embeddings import load_embeddings

# You must specify both the provider and model name when loading the model
model = load_embeddings("openai:text-embedding-3-large")
# Or explicitly specify the provider parameter
model = load_embeddings("text-embedding-3-large", provider="openai")
```

:::
