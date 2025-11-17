# Embedding Model Management

> [!NOTE]
>
> **Feature Overview**: Provides more efficient and convenient embedding model management.
>
> **Prerequisites**: Understand LangChain's [Embedding Models](https://docs.langchain.com/oss/python/integrations/text_embedding/).
>
> **Estimated Reading Time**: 10 minutes

Similar to `init_chat_model`, `langchain` also provides the `init_embeddings` function for initializing embedding models, but the supported model providers are still limited. Therefore, you can also use this library's functionality to conveniently manage embedding models.

When using embedding models, you first need to register an embedding model provider using `register_embeddings_provider`, and then you can use `load_embeddings` to load the embedding model.

## Registering Embedding Model Providers

Similar to registering chat model providers, the function for registering embedding model providers is `register_embeddings_provider`, which accepts the following parameters:

<Params
name="provider_name"
type="string"
description="Embedding model provider name"
:required="true"
:default="null"
/>
<Params
name="embeddings_model"
type="Embeddings | string"
description="Embedding model"
:required="true"
:default="null"
/>
<Params
name="base_url"
type="string"
description="Embedding model base URL"
:required="false"
:default="null"
/>

The usage of this function is as follows:

<StepItem step="1" title="Set provider_name"></StepItem>

Similar to chat model providers, the `provider_name` parameter accepts a string that can be customized.

<StepItem step="2" title="Set embeddings_model"></StepItem>

For the `embeddings_model` parameter, it accepts two types: `langchain`'s `Embeddings` or `str`.

We'll explain these different parameter types separately:

**1. Type as Embeddings**

Example code:

```python
from langchain_dev_utils.embeddings import load_embeddings, register_embeddings_provider
from langchain_core.embeddings.fake import FakeEmbeddings

register_embeddings_provider(
    provider_name="fake_provider",
    embeddings_model=FakeEmbeddings,
)
```

In this example, we're using the built-in `FakeEmbeddings` from `langchain_core`, which is only for testing and doesn't connect to real model providers. **In practical applications, you should pass an `Embeddings` class with actual functionality.**

**2. Type as str**

Similar to chat models, when the `embeddings_model` parameter is a string, its only current value is `"openai-compatible"`, indicating that it will connect through the model provider's OpenAI-compatible API.
In this case, the library uses `langchain-openai`'s `OpenAIEmbeddings` as the actual embedding model.
Note that `OpenAIEmbeddings` defaults to tokenizing input text, which may cause errors when connecting to other OpenAI API-compatible embedding models. To solve this issue, this library explicitly sets the `check_embedding_ctx_length` parameter to `False` when loading the model, skipping the tokenization step to avoid compatibility issues.

<StepItem step="3" title="Set base_url (optional)"></StepItem>
Next, you need to decide **based on the actual situation** whether to set the API endpoint (i.e., the `base_url` parameter) for the embedding model provider. This step is **not always required**, and it depends specifically on the type of `embeddings_model`:

- **When `embeddings_model` is a string with the value `"openai-compatible"`**:  
  You **must explicitly provide** the `base_url` parameter or specify the API endpoint via an environment variable. Otherwise, the embedding model client cannot be initialized because the system cannot infer the API endpoint.

- **When `embeddings_model` is of type `Embeddings`**:  
  The API endpoint for the embedding model is usually already defined within the class, so no additional `base_url` configuration is needed.  
  **Only if you need to override the default API endpoint embedded in the class** should you explicitly pass the `base_url` parameter or set it via an environment variable. This override only takes effect for class fields named `api_base` or `base_url` (including cases where the field alias is either of these two names).

For example, suppose you want to use an OpenAI-compatible embedding model deployed via vLLM. You can configure it as follows:

**Method 1: Pass `base_url` directly**

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

**Method 2: Configure via environment variable**

```bash
export VLLM_API_BASE=http://localhost:8000/v1
```

Then omit `base_url` in your code:

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible"
    # Automatically reads the VLLM_API_BASE environment variable
)
```

> 💡 **Tip**: The environment variable naming convention is `${PROVIDER_NAME}_API_BASE` (all uppercase, with underscores).

::: tip Additional Note
`vllm` can also serve embedding models. Here’s an example command:

```bash
vllm serve Qwen/Qwen3-Embedding-4B \
--task embed \
--served-model-name qwen3-embedding-4b \
--host 0.0.0.0 --port 8000
```

After running this, an OpenAI-compatible API will be available at `http://localhost:8000/v1`.
:::

## Batch Registration

Similar to chat models, there's also a function for batch registering embedding model providers: `batch_register_embeddings_provider`.
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
            "provider_name": "fake_provider",
            "embeddings_model": FakeEmbeddings,
        },
        {
            "provider_name": "vllm",
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
)  # The size parameter is not required, it's necessary for FakeEmbeddings initialization, your Embeddings model might not need it
emb = embedding.embed_query("Hello")
print(emb)
```

::: warning Note
Both `register_embeddings_provider` and its corresponding batch registration function `batch_register_embeddings_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please be sure to complete all registration operations during the project startup phase, and do not dynamically register during runtime.
:::

## Loading Embedding Models

The function for loading embedding models is `load_embeddings`, which accepts the following parameters:

<Params
name="model"
type="string"
description="Embedding model name"
:required="true"
:default="null"
/>
<Params
name="provider"
type="string"
description="Embedding model provider name"
:required="false"
:default="null"
/>
When using this function, please note the following:

**1. Additional Parameters**

This function can also accept any number of keyword arguments, such as `dimension`, etc. For specifics, refer to the corresponding model integration class documentation (if embeddings_model is `openai-compatible`, you can refer to `OpenAIEmbeddings`).

**2. Model Parameter Format**

The `model` parameter supports the following two formats:

- `provider_name:embeddings_name`
- `embeddings_name`

Where `provider_name` is the provider name registered through the `register_embeddings_provider` function.

The `provider` parameter has the same meaning as the above `provider_name` and is optional:

- If `provider` is not passed, the `model` parameter must be in the `provider_name:embeddings_name` format;
- If `provider` is passed, the `model` parameter must be in the `embeddings_name` format.

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

**3. Compatibility with Official Functions**

Similar to chat models, for model providers already supported by the official `init_embeddings` function, you can also directly use the `load_embeddings` function to load them without additional registration. Therefore, if you need to connect to multiple models, some of which are officially supported and others not, you can consider uniformly using `load_embeddings` for loading. For example:

```python
from langchain_dev_utils.embeddings import load_embeddings

# When loading the model, you need to specify both the provider and the model name
model = load_embeddings("openai:text-embedding-3-large")
# Or explicitly specify the provider parameter
model = load_embeddings("text-embedding-3-large", provider="openai")
```

<BestPractice>
The usage recommendations for this module's functionality are similar to the chat model module. For specifics, you can refer to the usage recommendations in the chat model module.
</BestPractice>
