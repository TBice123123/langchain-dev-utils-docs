# Chat Model Management

> [!NOTE]
>
> **Feature Overview**: Provides more efficient and convenient chat model management.
>
> **Prerequisites**: Understand Langchain's [Chat Models](https://docs.langchain.com/oss/python/langchain/models).
>
> **Estimated Reading Time**: 10 minutes

In `langchain`, the `init_chat_model` function can be used to initialize a chat model instance, but it supports a limited number of model providers. If you wish to use more model providers (especially if your preferred provider is not supported by that function), you can leverage the chat model management functionality provided by this library.

To use a chat model, you must first register the chat model provider using `register_model_provider`, and then you can use `load_chat_model` to load the chat model.

## Registering a Chat Model Provider

The function to register a chat model provider is `register_model_provider`, which accepts the following parameters:

- `provider_name`: The name of the chat model provider, type `str`
- `chat_model`: The chat model, type is `langchain`'s `ChatModel` or `str`
- `base_url`: The base URL for the chat model, type `str`, only takes effect when `chat_model` is `str`
- `tool_choice`: Parameter for the LLM's `tool_choice`, type is a list of strings, each element can only be `auto`, `none`, `any`, `required`, `specific`. Similar to `base_url`, only takes effect when `chat_model` is `str`

For `provider_name`, you can pass a custom model provider name. For `chat_model`, you need to pass a `langchain` `ChatModel` or a `str`. Detailed explanations for this parameter are as follows:

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

When the `chat_model` parameter is a string, its only currently accepted value is `"openai-compatible"`, indicating that it will connect via the model provider's OpenAI-compatible API. This is because many model providers currently support OpenAI-compatible APIs, such as vllm, openrouter, together, etc.
In this case, the library will use the built-in `OpenAICompatibleChatModel` as the actual chat model.

`OpenAICompatibleChatModel` inherits from `BaseChatOpenAI` in `langchain-openai` and includes several compatibility optimizations on top of it. To ensure proper functionality, please make sure to install the standard version of `langchain-dev-utils` (see [Installation Documentation](./installation.md) for installation methods).

Compared to directly using `ChatOpenAI` provided by `langchain-openai`, this library's `OpenAICompatibleChatModel` offers the following advantages:

1. **Supports outputting more types of reasoning content (`reasoning_content`)**:  
   `ChatOpenAI` can only output reasoning content natively supported by official OpenAI models, whereas `OpenAICompatibleChatModel` can output reasoning content from other model providers (e.g., openrouter).

2. **Optimized default behavior for structured output**:  
   When calling `with_structured_output`, the default value for the `method` parameter is adjusted to `"function_calling"` (instead of `"json_schema"` as default in `ChatOpenAI`), providing better compatibility with other models.

For cases where `chat_model` is a string (specifically `"openai-compatible"`), you must provide a `base_url`. You can do this by either passing `base_url` directly in this function or by setting the `API_BASE` for the model provider.

For example, if we want to use a model deployed by vllm, we can set it up as follows:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

Or set it like this:

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
`vllm` is a well-known large model deployment framework that can deploy large models as OpenAI-compatible APIs. For example, if we want to deploy the qwen3-4b model, we can use the following command:

```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```

After completion, it provides an OpenAI-compatible API at `http://localhost:8000/v1`.
:::

**Setting the tool_choice Parameter**

In `langchain`, the `bind_tools` method supports specifying the tool calling strategy via the `tool_choice` parameter. This parameter typically accepts string values such as `"auto"`, `"none"`, `"any"`, `"required"`, or a specific tool name. However, support for this parameter may vary across different model providers. Therefore, we have provided this parameter to represent the `tool_choice` parameters supported by the model provider, enhancing compatibility. In most cases, you can meet your needs without setting this parameter.

This parameter is a list of strings, where each string can only be: `"auto"`, `"none"`, `"any"`, `"required"`, and `"specific"`. Among them, the first four are common `tool_choice` values, and `"specific"` is a unique option in this library, meaning to force the model to call a specific tool.

By default, if the `tool_choice` parameter is not passed, the model provider usually adopts the `"auto"` strategy, allowing the model to decide whether to call tools. However, in some high-level wrapper libraries (like `langmem`), the `tool_choice` parameter might be actively passed. To avoid errors caused by the model not supporting a particular parameter value, this library provides this parameter. When an incoming value is not within the supported range, the system will automatically fall back to `None`, meaning the `tool_choice` parameter is not passed.

For example, if your model provider only supports `"auto"`, `"none"`, and `"required"`, and does not support forcing the call to a specific tool, and you need to explicitly set the aforementioned parameters, you can register it as follows:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    # Register model provider, other parameters omitted.
    tool_choice=["auto", "none", "required"]
)
```

## Loading a Chat Model

The function to load a chat model is `load_chat_model`, which accepts the following parameters:

- `model`: The chat model name, type `str`
- `model_provider`: The chat model provider name, type `str`, optional
- `kwargs`: Other additional parameters

For the `model` parameter, the supported formats are:

- `provider_name:model_name`
- `model_name`

Where `provider_name` is the `provider_name` registered in the `register_model_provider` function.

For the `model_provider` parameter, its meaning is the same as the `provider_name` mentioned above. It is allowed to be omitted, but in that case, the `model` parameter must be in the `provider_name:model_name` format. If provided, the `model` parameter must be in the `model_name` format.
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

**Note**: Although `vllm` itself may not require an api_key, because this `OpenAICompatibleChatModel` requires `api_key`, you must set `api_key`.

```bash
export VLLM_API_KEY=vllm
```

For the case mentioned above where `chat_model` is a string (i.e., `"openai-compatible"`), it provides the basic functionality of `langchain`'s `ChatModel`, including the following:

::: details Standard Invocation
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
Uses the `"function_calling"` method by default, so the model needs to support tool calling.

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

Additionally, because the underlying `ChatModel` inherits from `BaseChatOpenAI`, it supports passing model parameters specific to `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.
Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here disabling thinking mode.
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Furthermore, it also supports passing multimodal data. You can use the OpenAI-compatible multimodal data format or directly use `content_block` from `langchain`. For example:

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider, load_chat_model

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

## Batch Registration

If you need to register multiple model providers, you can use the `register_model_provider` function multiple times. However, this can be cumbersome. Therefore, this library provides a batch registration function `batch_register_model_provider`.

It accepts a parameter `providers`, which is a list of dictionaries. Each dictionary has four keys: `provider`, `chat_model`, `base_url`, and `tool_choice`. The meaning of each key is the same as the corresponding parameter in the `register_model_provider` function.

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

## Note

Both `register_model_provider` and its corresponding batch registration function `batch_register_model_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please ensure all registration operations are completed during the project startup phase. Do not perform dynamic registration during runtime.
