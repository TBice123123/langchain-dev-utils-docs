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
description="Embedding model provider name"  
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
description="Embedding model base URL"  
:required="false"  
:default="null"  
/>

2. **Load Embedding Model**

Use `load_embeddings` to instantiate a specific embedding model. Its parameters are defined as follows:

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

**Note**: The `load_embeddings` function can also accept any number of keyword arguments, which can be used to pass additional parameters such as `dimension`.

## Registering Embedding Model Providers

To register an embedding model provider, call `register_embeddings_provider`. The registration method varies slightly depending on the type of `embeddings_model`.

### Case 1: Existing LangChain Embedding Model Class

If the embedding model provider already has a suitable LangChain integration (see [Embedding Model Integration List](https://docs.langchain.com/oss/python/integrations/text_embedding)), directly pass the corresponding embedding model class to the `embeddings_model` parameter.

<StepItem step="1" title="Set provider_name"></StepItem>

Pass a custom provider name (e.g., `"fake_provider"`), **do not include a colon `:`**.

<StepItem step="2" title="Set embeddings_model"></StepItem>

Pass a **subclass of `Embeddings`**.

```python
from langchain_core.embeddings.fake import FakeEmbeddings
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="fake_provider",
    embeddings_model=FakeEmbeddings,
)
```

**Note**: `FakeEmbeddings` is only for testing. In actual use, you must pass an `Embeddings` class with real functionality.

<StepItem step="3" title="Set base_url (optional)"></StepItem>

- **Usually not needed**, as the API address is already defined within the model class (such as `api_base` or `base_url` fields);
- **Only pass `base_url` when you need to override the default address**;
- The override mechanism only works for attributes with field names `api_base` or `base_url` (including aliases) in the model class.

### Case 2: No LangChain Embedding Model Class, but Provider Supports OpenAI Compatible API

Similar to chat models, many embedding model providers also provide **OpenAI Compatible APIs**. When there's no existing LangChain integration but the protocol is supported, you can use this mode.

The system will use `OpenAIEmbeddings` (from `langchain-openai`) to build the embedding model instance and automatically disable context length checking (setting `check_embedding_ctx_length=False`) to improve compatibility.

<StepItem step="1" title="Set provider_name"></StepItem>

Pass a custom name (e.g., `"vllm"`), **do not include a colon `:`**.

<StepItem step="2" title="Set embeddings_model"></StepItem>

You must pass the string `"openai-compatible"`. This is the only string value currently supported.

<StepItem step="3" title="Set base_url (required)"></StepItem>

- **You must provide an API address**, otherwise initialization will fail;
- Can be provided through either of the following methods:

  **Explicit parameter passing**:
  ```python
  register_embeddings_provider(
      provider_name="vllm",
      embeddings_model="openai-compatible",
      base_url="http://localhost:8000/v1"
  )
  ```

  **Environment variable (recommended)**:
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
vLLM can deploy embedding models and expose OpenAI compatible interfaces, for example:
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
Both registration functions are implemented based on a global dictionary. **All registrations must be completed during application startup**. Dynamic registration at runtime is prohibited to avoid multithreading issues.  
:::

## Loading Embedding Models

Use `load_embeddings` to initialize embedding model instances. The parameter rules are as follows:

- If `provider` is not passed, `model` must be in the format `provider_name:embeddings_name`;
- If `provider` is passed, `model` is only `embeddings_name`.

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

For `"openai-compatible"` types, all parameters of `OpenAIEmbeddings` are supported.

### Compatibility with Official Providers

For providers already officially supported by LangChain (such as `openai`), you can directly use `load_embeddings` without registration:

```python
model = load_embeddings("openai:text-embedding-3-large")
# or
model = load_embeddings("text-embedding-3-large", provider="openai")
```

<BestPractice>
    <p>For the use of this module, you can choose according to the following three situations:</p>
    <ol>
        <li>If all embedding model providers you are integrating are supported by the official <code>init_embeddings</code>, please use the official function directly for best compatibility.</li>
        <li>If some of the embedding model providers you are integrating are not officially supported, you can use the registration and loading mechanism of this module. First use <code>register_embeddings_provider</code> to register the model provider, then use <code>load_embeddings</code> to load the model.</li>
        <li>If the embedding model provider you are integrating does not have a suitable integration but provides an OpenAI compatible API (such as vLLM, OpenRouter), it is recommended to use the functionality of this module. First use <code>register_embeddings_provider</code> to register the model provider (pass <code>openai-compatible</code> to embeddings_model), then use <code>load_embeddings</code> to load the model.</li>
    </ol>
</BestPractice>