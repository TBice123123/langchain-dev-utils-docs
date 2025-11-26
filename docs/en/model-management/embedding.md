# Embedding Model Management

> [!NOTE]  
> **Function Overview**: Provides more efficient and convenient embedding model management, supporting multiple model providers.  
> **Prerequisites**: Understanding of LangChain [Embedding Models](https://docs.langchain.com/oss/python/integrations/text_embedding/).  
> **Estimated Reading Time**: 8 minutes.

## Overview

LangChain's `init_embeddings` function only supports a limited number of embedding model providers. This library offers a more flexible embedding model management solution, particularly suitable for scenarios where you need to integrate embedding services not natively supported (such as vLLM, etc.).

Using the embedding model management feature of this library requires two steps:

1. **Register Embedding Model Provider**

Use `register_embeddings_provider` to register an embedding model provider. Its parameters are defined as follows:

<Params  
name="provider_name"  
type="string"  
description="Name of the embedding model provider"  
:required="true"  
:default="null"  
/>  
<Params  
name="embeddings_model"  
type="Embeddings | string"  
description="Embedding model class or identifier"  
:required="true"  
:default="null"  
/>  
<Params  
name="base_url"  
type="string"  
description="Base URL of the embedding model"  
:required="false"  
:default="null"  
/>

2. **Load Embedding Model**

Use `load_embeddings` to instantiate a specific embedding model. Its parameters are defined as follows:

<Params  
name="model"  
type="string"  
description="Name of the embedding model"  
:required="true"  
:default="null"  
/>  
<Params  
name="provider"  
type="string"  
description="Name of the embedding model provider"  
:required="false"  
:default="null"  
/>

**Note**: The `load_embeddings` function can also receive any number of keyword arguments, which can be used to pass additional parameters such as `dimension`, etc.



## Registering Embedding Model Providers

To register an embedding model provider, call `register_embeddings_provider`. The registration method varies slightly depending on the type of `embeddings_model`.

### Case 1: `embeddings_model` is an `Embeddings` class (for existing LangChain embedding model classes)

Applicable to embedding models already integrated in LangChain (refer to [Embedding Model Integration List](https://docs.langchain.com/oss/python/integrations/text_embedding)), where you can directly pass the model class.

<StepItem step="1" title="Set provider_name"></StepItem>

Pass in a custom provider name (such as `"fake_provider"`), **must not contain colons `:`**.

<StepItem step="2" title="Set embeddings_model"></StepItem>

Pass in a **subclass of `Embeddings`**.

```python
from langchain_core.embeddings.fake import FakeEmbeddings
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="fake_provider",
    embeddings_model=FakeEmbeddings,
)
```

**Note**: `FakeEmbeddings` is only for testing. In actual use, you must pass in an `Embeddings` class with real functionality.

<StepItem step="3" title="Set base_url (optional)"></StepItem>

- **Usually doesn't need to be set**, as the API address is already defined within the model class (such as `api_base` or `base_url` fields);
- **Only pass in `base_url` when you need to override the default address**;
- The override mechanism only works for attributes in the model class with field names `api_base` or `base_url` (including aliases).


### Case 2: `embeddings_model` is the string `"openai-compatible"` (for OpenAI-compatible API services)

Similar to chat models, many embedding model providers also offer **OpenAI-compatible APIs**. When there's no ready-made LangChain integration but the protocol is supported, you can use this mode.

The system will use `OpenAIEmbeddings` (from `langchain-openai`) to build the embedding client and automatically disable context length checking (set `check_embedding_ctx_length=False`) to improve compatibility.

<StepItem step="1" title="Set provider_name"></StepItem>

Pass in a custom name (such as `"vllm"`), **must not contain colons `:`**.

<StepItem step="2" title="Set embeddings_model"></StepItem>

Must pass in the string `"openai-compatible"`. This is the only supported string value at present.

<StepItem step="3" title="Set base_url (required)"></StepItem>

- **Must provide an API address**, otherwise initialization will fail;
- Can be provided in either of the following ways:

  **Explicit parameter passing**:
  ```python
  register_embeddings_provider(
      provider_name="vllm",
      embeddings_model="openai-compatible",
      base_url="http://localhost:8000/v1"
  )
  ```

  **Environment variables (recommended)**:
  ```bash
  export VLLM_API_BASE=http://localhost:8000/v1
  ```
  ```python
  register_embeddings_provider(
      provider_name="vllm",
      embeddings_model="openai-compatible"
      # Automatically reads VLLM_API_BASE
  )
  ```

::: info Tip  
The environment variable naming rule is `${PROVIDER_NAME}_API_BASE` (all uppercase, separated by underscores).  
The corresponding API Key environment variable is `${PROVIDER_NAME}_API_KEY`.
:::

::: tip Supplement  
vLLM can deploy embedding models and expose OpenAI-compatible interfaces, for example:
```bash
vllm serve Qwen/Qwen3-Embedding-4B \
--task embed \
--served-model-name qwen3-embedding-4b \
--host 0.0.0.0 --port 8000
```
The service address is `http://localhost:8000/v1`.
:::


## Batch Registration

If you need to register multiple providers, you can use `batch_register_embeddings_provider`:

```python
from langchain_dev_utils.embeddings import batch_register_embeddings_provider
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
```

::: warning Note  
Both registration functions are implemented based on a global dictionary. **All registrations must be completed during the application startup phase**, and dynamic registration during runtime is prohibited to avoid multithreading issues.  
:::


## Loading Embedding Models

Use `load_embeddings` to initialize an embedding model instance. The parameter rules are as follows:

- If `provider` is not passed, then `model` must be in the format of `provider_name:embeddings_name`;
- If `provider` is passed, then `model` is only `embeddings_name`.

**Example**:
```python
# Method 1
embedding = load_embeddings("vllm:qwen3-embedding-4b")

# Method 2
embedding = load_embeddings("qwen3-embedding-4b", provider="vllm")
```

### Additional Parameter Support

You can pass any keyword arguments, for example:
```python
embedding = load_embeddings(
    "fake_provider:fake-emb",
    size=1024  # Parameter required by FakeEmbeddings
)
```

For the `"openai-compatible"` type, all parameters of `OpenAIEmbeddings` are supported.

### Compatibility with Official Providers

For providers already officially supported by LangChain (such as `openai`), you can directly use `load_embeddings` without registration:

```python
model = load_embeddings("openai:text-embedding-3-large")
# or
model = load_embeddings("text-embedding-3-large", provider="openai")
```

<BestPractice>
    <p>For the use of this module, the following suggestions are made:</p>
    <ol>
        <li>If all embedding models are supported by the official <code>init_embeddings</code>, please prioritize using the official function for best compatibility.</li>
        <li>If you need to integrate embedding services not officially supported (especially OpenAI-compatible APIs), please use the registration and loading mechanism of this module.</li>
        <li>When mixing official and non-official models in a project, you can uniformly use <code>load_embeddings</code> to simplify the calling logic.</li>
    </ol>
</BestPractice>