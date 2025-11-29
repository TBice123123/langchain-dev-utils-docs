# Embedding Model Management

> [!NOTE]  
> **Feature Overview**: Provides more efficient and convenient embedding model management, supporting multiple model providers.  
> **Prerequisites**: Understanding of LangChain [Embedding Models](https://docs.langchain.com/oss/python/integrations/text_embedding/).  
> **Estimated Reading Time**: 8 minutes.

## Overview

LangChain's `init_embeddings` function only supports a limited number of embedding model providers. This library offers a more flexible embedding model management solution, particularly suitable for scenarios where you need to integrate with embedding services not natively supported (such as vLLM, etc.).

Using the embedding model management feature of this library requires two steps:

1. **Register an Embedding Model Provider**

Use `register_embeddings_provider` to register an embedding model provider. Its parameters are defined as follows:

<Params  
name="provider_name"  
type="string"  
description="The name of the embedding model provider, used as an identifier for subsequent model loading."  
:required="true"  
:default="null"  
/>  
<Params  
name="embeddings_model"  
type="Embeddings | string"  
description="The embedding model, which can be an Embeddings class or a string (currently supports 'openai-compatible')."  
:required="true"  
:default="null"  
/>  
<Params  
name="base_url"  
type="string"  
description="The API address of the embedding model provider (optional, valid for both types of embeddings_model, but primarily used when embeddings_model is the string 'openai-compatible')."  
:required="false"  
:default="null"  
/>

2. **Load an Embedding Model**

Use `load_embeddings` to instantiate a specific embedding model. Its parameters are defined as follows:

<Params  
name="model"  
type="string"  
description="The name of the embedding model."  
:required="true"  
:default="null"  
/>  
<Params  
name="provider"  
type="string"  
description="The name of the embedding model provider."  
:required="false"  
:default="null"  
/>

**Note**: The `load_embeddings` function can also accept any number of keyword arguments, which can be used to pass additional parameters such as `dimension`.



## Registering an Embedding Model Provider

To register an embedding model provider, call `register_embeddings_provider`. The registration method varies slightly depending on the type of `embeddings_model`.

### Case 1: An Existing LangChain Embedding Model Class is Available

If the embedding model provider already has a suitable and ready-made LangChain integration (see [List of Embedding Model Integrations](https://docs.langchain.com/oss/python/integrations/text_embedding)), please pass the corresponding embedding model class directly into the `embeddings_model` parameter.

<StepItem step="1" title="Set provider_name"></StepItem>

Provide a custom provider name, **which must not contain a colon `:`**.

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

**Note**: `FakeEmbeddings` is for testing only. In actual use, you must pass a functional `Embeddings` class.

<StepItem step="3" title="Set base_url (Optional)"></StepItem>

- **This parameter is usually not required**, as the API address is already defined within the model class (e.g., in fields like `api_base` or `base_url`);
- **Only pass `base_url` if you need to override the default address**;
- The override mechanism only works for attributes in the model class named `api_base` or `base_url` (including aliases).


### Case 2: No LangChain Embedding Model Class, but the Provider Supports an OpenAI-Compatible API

Similar to chat models, many embedding model providers also offer an **OpenAI-compatible API**. When there is no ready-made LangChain integration but the protocol is supported, you can use this mode.

The system will use `OpenAIEmbeddings` (from `langchain-openai`) to build the embedding model instance and will automatically disable context length checking (by setting `check_embedding_ctx_length=False`) to enhance compatibility.

<StepItem step="1" title="Set provider_name"></StepItem>

Provide a custom name, **which must not contain a colon `:`**.

<StepItem step="2" title="Set embeddings_model"></StepItem>

You must pass the string `"openai-compatible"`. This is the only supported string value at present.

<StepItem step="3" title="Set base_url (Required)"></StepItem>

- **You must provide an API address**, otherwise initialization will fail;
- It can be provided in either of the following ways:

  **Explicitly as a parameter**:
  ```python
  register_embeddings_provider(
      provider_name="vllm",
      embeddings_model="openai-compatible",
      base_url="http://localhost:8000/v1"
  )
  ```

  **Via Environment Variables (Recommended)**:
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
The naming convention for environment variables is `${PROVIDER_NAME}_API_BASE` (all caps, underscore-separated).  
The corresponding API Key environment variable is `${PROVIDER_NAME}_API_KEY`.
:::

::: tip Additional Info  
vLLM can deploy embedding models and expose an OpenAI-compatible interface, for example:
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

::: warning Warning  
Both registration functions are implemented based on a global dictionary. **All registrations must be completed during the application startup phase**. Dynamic registration at runtime is prohibited to avoid multithreading issues.  
:::


## Loading an Embedding Model

Use `load_embeddings` to initialize an embedding model instance. The parameter rules are as follows:

- If `provider` is not passed, `model` must be in the format `provider_name:embeddings_name`;
- If `provider` is passed, `model` should only be `embeddings_name`.

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

For providers already officially supported by LangChain (like `openai`), you can use `load_embeddings` directly without registration:

```python
model = load_embeddings("openai:text-embedding-3-large")
# or
model = load_embeddings("text-embedding-3-large", provider="openai")
```

<BestPractice>
    <p>For using this module, you can choose based on the following three scenarios:</p>
    <ol>
        <li>If all embedding model providers you are integrating are supported by the official <code>init_embeddings</code>, please use the official function directly for the best compatibility.</li>
        <li>If some of your embedding model providers are not officially supported, you can use this module's registration and loading mechanism. First, use <code>register_embeddings_provider</code> to register the model provider, then use <code>load_embeddings</code> to load the model.</li>
        <li>If your embedding model provider does not have a suitable integration but offers an OpenAI-compatible API (like vLLM, OpenRouter), it is recommended to use this module's features. First, use <code>register_embeddings_provider</code> to register the provider (passing <code>openai-compatible</code> for `embeddings_model`), then use <code>load_embeddings</code> to load the model.</li>
    </ol>
</BestPractice>