# Best Practice Guide

## Basic Principles

### Prioritize Official Interfaces (When All Models Used Are Officially Supported)

If you are **only using models officially supported by LangChain** (such as OpenAI, Anthropic, Google, Mistral, etc.), please use the official initialization methods directly:

```python
from langchain.chat_models import init_chat_model
from langchain.embeddings import init_embeddings

model = init_chat_model("gpt-4o-mini", model_provider="openai") # Chat model
embeddings = init_embeddings("text-embedding-3-large", provider="openai") # Embedding model
```

> **Advantages**: No additional registration required, convenient to use, and officially maintained for stability

### Only Introduce This Library (`langchain_dev_utils`) When Non-official Models Are Needed

Use this library when you need:

- Any model providers not supported by `init_chat_model` / `init_embeddings`
- Model providers that don't have a suitable `langchain` integration library but provide an OpenAI-compatible API interface

## Recommendations for Registering Model Providers

### Timing and Method of Registration

- **Complete all model provider registrations at project startup**, and avoid registering again later to prevent errors caused by concurrent writes in multithreading.
- **Register a single provider**: Use `register_model_provider` / `register_embeddings_provider`
- **Register multiple providers**: Use `batch_register_model_provider` / `batch_register_embeddings_provider`

### Naming Conventions

- `provider_name` should use meaningful names, such as `vllm`, `openrouter`, etc.
- Avoid using colons `:` as this symbol is used to separate providers from model names

## Provider Configuration Recommendations

### Environment Variable Management

**Use environment variables to manage sensitive information and addresses**:

```bash
# vLLM local deployment
export VLLM_API_BASE=http://localhost:8000/v1
export VLLM_API_KEY=vllm

# OpenRouter
export OPENROUTER_API_KEY=sk-xxx
export OPENROUTER_API_BASE=https://openrouter.ai/api/v1
```

### `tool_choice` Parameter Configuration

**Consider whether to configure the `tool_choice` parameter based on specific scenarios**:

A common situation is **when structured output is unstable**. Configuring the `tool_choice` parameter can improve stability, especially when the model provider supports forced calling of specified tools. Configure `tool_choice` to include `"specific"` to ensure structured output is not `None`.

## Model Loading and Parameter Passing

### Basic Loading Methods

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_dev_utils.embeddings import load_embeddings

# Method 1: provider_name:model_name format
model = load_chat_model("vllm:qwen3-4b")
embeddings = load_embeddings("vllm:qwen3-embedding-4b")

# Method 2: Specify model name and provider separately
model = load_chat_model("qwen3-4b", model_provider="vllm")
embeddings = load_embeddings("qwen3-embedding-4b", provider="vllm")
```

### Passing Additional Parameters

When loading models, you can pass additional parameters needed for model initialization through `kwargs`, such as `temperature`, `max_tokens`, etc.

```python
# Chat model: Pass temperature and additional request body parameters
model = load_chat_model(
    "vllm:qwen3-4b",
    temperature=0.7,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}} # Additional parameters passed to the API
)
```

> **Note**: The additional parameters passed depend on the specific model implementation you're using. Please refer to the corresponding model documentation to confirm available parameters. For OpenAI-compatible models, you can refer to `ChatOpenAI` and `OpenAIEmbeddings`.
