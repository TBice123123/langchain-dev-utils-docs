# Embedding Model Management

> [!NOTE]
>
> **Function Overview**: Provides more efficient and convenient embedding model management.
>
> **Prerequisites**: Understanding of LangChain's [embedding models](https://docs.langchain.com/oss/python/integrations/text_embedding/).
>
> **Estimated Reading Time**: 10 minutes

Similar to `init_chat_model`, `langchain` also provides the `init_embeddings` function for initializing embedding models, but its supported model providers are still limited. Therefore, you can also use the functionality of this library to conveniently manage embedding models.

When using embedding models, you need to first use `register_embeddings_provider` to register an embedding model provider, and then you can use `load_embeddings` to load the embedding model.

## Registering Embedding Model Providers

Similar to registering chat model providers, the function for registering embedding model providers is `register_embeddings_provider`, which accepts the following parameters:

<Params :params="[
{
name: 'provider_name',
type: 'string',
description: 'Embedding model provider name',
required: true,
},
{
name: 'embeddings_model',
type: ' Embeddings | string',
description: 'Embedding model',
required: true,
},
{
name: 'base_url',
type: 'string',
description: 'Base URL for the embedding model',
required: false,
},
]"/>

For the use of this function, the details are as follows:

<StepItem step="1" title="Set provider_name"></StepItem>

Similar to chat model providers, the `provider_name` parameter accepts a string, which can be customized.

<StepItem step="2" title="Set embeddings_model"></StepItem>

For the `embeddings_model` parameter, it accepts two types: `langchain`'s `Embeddings` or `str`.

We'll introduce these different types separately:

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

In this example, we're using the built-in `FakeEmbeddings` from `langchain_core`, which is only for testing and doesn't connect to a real model provider. **In practical applications, you should pass an `Embeddings` class with actual functionality.**

**2. Type is str**

Similar to chat models, when the `embeddings_model` parameter is a string, its only current value is `"openai-compatible"`, indicating that it will be connected through the model provider's OpenAI-compatible API.
In this case, this library uses `OpenAIEmbeddings` from `langchain-openai` as the actual embedding model.
It should be noted that `OpenAIEmbeddings` will tokenize the input text by default, which might cause errors when connecting to other embedding models compatible with the OpenAI API. To solve this problem, this library has explicitly set the `check_embedding_ctx_length` parameter to `False` when loading the model, thereby skipping the tokenize step and avoiding compatibility issues.

<StepItem step="3" title="Set base_url (optional)"></StepItem>

For the case where `embeddings_model` is a string (specifically `"openai-compatible"`), you must also provide `base_url`. You can either pass `base_url` directly in this function or set the model provider's `API_BASE`.

For example, if we want to use a model deployed by vllm, we can set it up like this:

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

Or like this:

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

::: tip Additional Information
`vllm` can also deploy Embedding models. The reference command is as follows:

```bash
vllm serve Qwen/Qwen3-Embedding-4B \
--task embed\
--served-model-name qwen3-embedding-4b \
--host 0.0.0.0 --port 8000
```

After completion, it will provide an OpenAI-compatible API at the address `http://localhost:8000/v1`.
:::

## Batch Registration

Similar to chat models, a function `batch_register_embeddings_provider` is also provided for batch registration of embedding model providers.
Reference code is as follows:

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
)  # The size parameter is not necessary, it's required for FakeEmbeddings initialization, your Embeddings model might not need it
emb = embedding.embed_query("Hello")
print(emb)
```

::: warning Note
Both `register_embeddings_provider` and its corresponding batch registration function `batch_register_embeddings_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please make sure to complete all registration operations during the project startup phase and do not register dynamically at runtime.
:::

## Loading Embedding Models

The function for loading embedding models is `load_embeddings`, which accepts the following parameters:

<Params :params="[
{
name: 'model',
type: 'string',
description: 'Embedding model name',
required: true,
},
{
name: 'provider',
type: 'string',
description: 'Embedding model provider name',
required: false,
},
{
name: 'kwargs',
type: 'dict',
description: 'Other model parameters, refer to the corresponding model provider documentation for details',
required: false,
}
]"/>

For the `model` parameter, the supported formats are as follows:

- provider_name:embeddings_name
- embeddings_name

Where `provider_name` is the `provider_name` registered in the `register_embeddings_provider` function.

For the `provider` parameter, its meaning is the same as the `provider_name` mentioned above. It can be omitted, but in this case, the `model` parameter must be in the `provider_name:embeddings_name` format. If it is passed in, then the `model` parameter must be in the `embeddings_name` format.
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

::: tip Tip
Similar to chat models, for model providers already supported by the official `init_embeddings` function, you can also directly use the `load_embeddings` function to load them without additional registration. Therefore, if you need to connect to multiple models simultaneously, where some providers are officially supported and others are not, you can consider using `load_embeddings` uniformly for loading. For example:

```python
from langchain_dev_utils.embeddings import load_embeddings

# When loading the model, you need to specify both the provider and model name
model = load_embeddings("openai:text-embedding-3-large")
# Or explicitly specify the provider parameter
model = load_embeddings("text-embedding-3-large", provider="openai")
```

:::
