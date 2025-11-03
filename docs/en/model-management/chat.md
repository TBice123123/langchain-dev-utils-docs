# Chat Model Management

> [!NOTE]
>
> **Overview**: Provides more efficient and convenient chat model management.
>
> **Prerequisites**: Familiarity with LangChain's [Chat Models](https://docs.langchain.com/oss/python/langchain/models).
>
> **Estimated Reading Time**: 10 minutes

In `langchain`, the `init_chat_model` function can be used to initialize a chat model instance, but the model providers it supports are relatively limited. If you wish to use more model providers (especially if your preferred provider is not supported by this function), you can utilize the chat model management functionality provided by this library.

To use a chat model, you first need to register the chat model provider using `register_model_provider`, and then you can use `load_chat_model` to load the chat model.

## Registering a Chat Model Provider

To register a chat model provider, use the function `register_model_provider`.

This function accepts the following parameters:

- **provider_name**: The name of the chat model provider, type is str.
- **chat_model**: The chat model, type is either a LangChain ChatModel or str.
- **base_url**: The base URL for the chat model, type is str. Only takes effect when chat_model is str.
- **tool_choice**: All supported `tool_choice` values for this model provider, type is a list of strings. Similar to base_url, only takes effect when chat_model is str.

Specific usage methods are as follows:

### Setting provider_name

First, you need to pass the `provider_name` parameter to specify the model provider. This name can be customized. It is recommended to use a name with a clear meaning (like `vllm`) to refer to the actual provider. Please note that the name should not contain a colon `:`, as this symbol will later be used to separate the provider from the model name.

### Setting chat_model

Next, you need to pass the `chat_model` parameter, which accepts two types: a LangChain `ChatModel` or a `str`.

We explain the different types for this parameter separately:

**1. Type is ChatModel**

Example code:

```python
from langchain_core.language_models.fake_chat_models import FakeChatModel
from langchain_dev_utils.chat_models import load_chat_model, register_model_provider

register_model_provider(
    provider_name="fake_provider",
    chat_model=FakeChatModel,
)
```

In this example, we use the built-in `FakeChatModel` from `langchain_core`, which is only for testing and does not connect to a real model provider. **However, in practical applications, you should pass a `ChatModel` class that has actual functionality.**

**2. Type is str**

When the `chat_model` parameter is a string, its only current valid value is `"openai-compatible"`, indicating that it will be connected via the model provider's **OpenAI-compatible API**. This is because many model providers currently support the OpenAI-compatible API, such as [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://together.ai/), etc.
In this case, the library will use the built-in `BaseChatOpenAICompatible` as the actual chat model.

`BaseChatOpenAICompatible` inherits from `BaseChatOpenAI` in `langchain-openai` and includes multiple compatibility optimizations on top of it. To ensure proper functionality, please make sure to install the standard version of `langchain-dev-utils` (see the [Installation Documentation](../installation.md) for installation methods).

Compared to directly using `ChatOpenAI` provided by `langchain-openai`, this library's `BaseChatOpenAICompatible` has the following advantages:

1. **Supports outputting more types of reasoning content (`reasoning_content`)**:  
   `ChatOpenAI` can only output reasoning content natively supported by the official OpenAI models, whereas `OpenAICompatibleChatModel` can output reasoning content from other model providers (e.g., OpenRouter).

2. **Optimized default behavior for structured output**:  
   When calling `with_structured_output`, the default value for the `method` parameter is adjusted to `"function_calling"` (instead of `"json_schema"` as default in `ChatOpenAI`), providing better compatibility with other models.

3. **Supports configuring tool_choice**:  
   For most model providers compatible with the OpenAI API, their `tool_choice` parameter might differ from what the official OpenAI API supports. Therefore, this chat model class supports users specifying the supported `tool_choice` values (see below).

### Setting base_url (Optional)

This parameter only needs to be set when `chat_model` is a string (specifically `"openai-compatible"`). You can pass the `base_url` directly in this function, or set the model provider's `API_BASE` environment variable.

For example, suppose we want to use a model deployed by vLLM, we can set it up like this:

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

::: tip tips
`vllm` is a well-known large model deployment framework that can deploy large models as an OpenAI-compatible API. For example, if we want to deploy the qwen3-4b model, we can use the following command:

```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```

After completion, it provides an OpenAI-compatible API at `http://localhost:8000/v1`.
:::

### Setting tool_choice (Optional)

Also only needs to be set when `chat_model` is a string (specifically `"openai-compatible"`).

Most model providers support the `tool_choice` parameter. In LangChain, the `bind_tools` method of some chat model classes allows passing this option via the `tool_choice` parameter. This parameter typically accepts string values, such as `"auto"`, `"none"`, `"any"`, `"required"`, or the name of a specific tool. However, the level of support for `tool_choice` may vary among different model providers. To address this, we introduced this configuration item to declare the `tool_choice` options supported by the current model provider, improving compatibility. In most cases, you can use it normally without manually setting this parameter.

This parameter is a list of strings, where each string can only be one of: `"auto"`, `"none"`, `"any"`, `"required"`, and `"specific"`. Among them, the first four are common `tool_choice` values, and `"specific"` is a unique option of this library, meaning to force the model to call a tool with a specified name.

By default, if the `tool_choice` parameter is not passed, model providers usually adopt the `"auto"` strategy, allowing the model to decide whether to call tools. However, in some high-level wrapper libraries (like `langmem`), the `tool_choice` parameter might be actively passed. To avoid errors caused by the model not supporting that parameter value, this library provides this parameter. When the passed value is not within the supported range, the system will automatically fall back to `None`, meaning the `tool_choice` parameter is not passed.

For example, if vLLM supports setting `tool_choice` to `auto`, `none`, `required`, or the name of a specific tool, then in this function you should write:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    tool_choice=["auto", "none", "required", "specific"]  #[!code highlight]
)
```

The last value is `specific`, which means forcing the model to call a tool with a specified name. For the OpenAI-compatible API, it often requires passing `tool_choice={"type": "function", "function": {"name": "get_weather"}}`. But actually, in `langchain`, you can directly pass the name of that tool.

::: danger note

Both `register_model_provider` and its corresponding batch registration function `batch_register_model_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please ensure that all registration operations are completed during the project startup phase. Do not dynamically register providers during runtime.
:::

## Loading a Chat Model

The function to load a chat model is `load_chat_model`, which accepts the following parameters:

- **model**: The name of the chat model, type is str.
- **model_provider**: The name of the chat model provider, type is str, optional.
- **kwargs**: Additional parameters passed to the chat model class, such as temperature, top_p, etc.

For the **model** parameter, it supports the following formats:

- provider_name:model_name
- model_name

Where **provider_name** is the **provider_name** registered in the `register_model_provider` function.

For the **model_provider** parameter, its meaning is the same as the **provider_name** mentioned above. It is allowed to be omitted, but in that case, the **model** parameter must be in the **provider_name:model_name** format. If provided, the **model** parameter must be in the **model_name** format.
Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

You can also directly pass the **model_provider** parameter.

```python
from langchain_dev_utils.chat_models import load_chat_model

model = load_chat_model("qwen3-4b", model_provider="vllm")
```

**Note**: Although vLLM itself may not require an api_key, because this chat model class requires an api_key, you must set it.

```bash
export VLLM_API_KEY=vllm
```

For the case where `chat_model` is a string (i.e., `"openai-compatible"`) as mentioned above, it provides the basic functionalities of a LangChain `ChatModel`, including the following:

::: details Regular Invocation
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

In addition, since this class inherits from `BaseChatOpenAI`, it supports passing model parameters specific to `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.
Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here disabling thinking mode.
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Also, it supports multimodal data. You can use the OpenAI-compatible multimodal data format or directly use `content_block` from `langchain`. For example:

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

If you need to register multiple model providers, you can use the `register_model_provider` function multiple times. However, this is obviously cumbersome. Therefore, this library provides a batch registration function `batch_register_model_provider`.

It accepts the parameter `providers`, which is a list of dictionaries. Each dictionary has four keys: `provider`, `chat_model`, `base_url` (optional), and `tool_choice` (optional). The meaning of each key is the same as the corresponding parameter in the `register_model_provider` function.

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
            "provider": "fake_provider",
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

model = load_chat_model("fake_provider:fake-model")
print(model.invoke("Hello"))
```

::: tip tips
For model providers officially supported by the `init_chat_model` function, you can also use the `load_chat_model` function to load models directly without additional registration. Therefore, if you need to integrate multiple models where some providers are officially supported and others are not, you can consider using `load_chat_model` for unified loading. For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

# You must specify both the provider and model name when loading the model
model = load_chat_model("openai:gpt-4o-mini")
# Or explicitly specify the provider parameter
model = load_chat_model("openai:gpt-4o-mini", model_provider="openai")

# Note: The model provider must be specified, as it cannot be automatically inferred from the model name alone
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::
