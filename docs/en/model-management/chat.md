# Chat Model Management

> [!NOTE]
>
> **Function Overview**: Provides more efficient and convenient chat model management.
>
> **Prerequisites**: Understanding of LangChain's [chat models](https://docs.langchain.com/oss/python/langchain/models).
>
> **Estimated Reading Time**: 10 minutes

In `langchain`, the `init_chat_model` function can be used to initialize chat model instances, but it supports a limited number of model providers. If you want to use more model providers (especially when your preferred provider is not supported by this function), you can use the chat model management functionality provided by this library.

When using chat models, you need to first use `register_model_provider` to register a chat model provider, and then you can use `load_chat_model` to load the chat model.

## Registering Chat Model Providers

To register a chat model provider, you need to use the function `register_model_provider`. This function accepts the following parameters:

<Params :params="[
{
name: 'provider_name',
type: 'string',
description: 'Chat model provider name',
required: true,
},
{
name: 'chat_model',
type: ' BaseChatModel | string',
description: 'Chat model',
required: true,
},
{
name: 'base_url',
type: 'string',
description: 'Base URL for the chat model',
required: false,
},
{
name: 'tool_choice',
type: 'list[string]',
description: 'All supported tool_choice values for this model provider',
required: false,
},
]"/>

The specific usage of the above parameters is as follows:

<StepItem step="1" title="Set provider_name"></StepItem>
First, you need to pass the `provider_name` parameter to specify the model provider. This name can be customized, and it's recommended to use a meaningful name (such as `vllm`) to represent the actual provider. Please note that the name should not contain a colon `:` because this symbol will be used later to separate the provider and model name.

<StepItem step="2" title="Set chat_model"></StepItem>

Next, you need to pass the `chat_model` parameter, which accepts two types: `langchain`'s `ChatModel` or `str`.

We'll introduce these different types separately:

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

In this example, we're using the built-in `FakeChatModel` from `langchain_core`, which is only for testing and doesn't connect to a real model provider. **In practical applications, you should pass a `ChatModel` class with actual functionality.**

**2. Type is str**

When the `chat_model` parameter is a string, its only current value is `"openai-compatible"`, indicating that it will be connected through the model provider's **OpenAI-compatible API**. Many model providers support OpenAI-compatible APIs, such as [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://together.ai/), etc.
In this case, this library will use the built-in `BaseChatOpenAICompatible` as the actual chat model.

`BaseChatOpenAICompatible` inherits from `BaseChatOpenAI` in `langchain-openai` and has made several compatibility optimizations on top of it. To ensure proper functionality, please make sure to install the standard version of `langchain-dev-utils` (installation method detailed in [Installation Documentation](../installation.md)).

Compared to directly using `ChatOpenAI` provided by `langchain-openai`, this library's `BaseChatOpenAICompatible` has the following advantages:

1. **Supports outputting more types of reasoning content (`reasoning_content`)**:  
   `ChatOpenAI` can only output reasoning content natively supported by official OpenAI models, while `OpenAICompatibleChatModel` can output reasoning content from other model providers (such as OpenRouter, etc.).

2. **Optimized default behavior for structured output**:  
   When calling `with_structured_output`, the default value of the `method` parameter is adjusted to `"function_calling"` (instead of `ChatOpenAI`'s default `"json_schema"`), which better accommodates other models.

3. **Supports configuring tool_choice**:  
   For most model providers compatible with the OpenAI API, their tool_choice parameter might differ from what the official OpenAI API supports. Therefore, this chat model class supports users specifying the supported `tool_choice` (see below).

<StepItem step="3" title="Set base_url (optional)"></StepItem>

This parameter only needs to be set when `chat_model` is a string (specifically `"openai-compatible"`). You can either pass `base_url` directly in this function or set the model provider's `API_BASE`.

For example, if we want to use a model deployed by vllm, we can set it up like this:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

Or like this:

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

::: tip Additional Information
`vllm` is a well-known large model deployment framework that can deploy large models as OpenAI-compatible APIs. For example, if we want to deploy the qwen3-4b model, we can use the following command:

```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```

After completion, it will provide an OpenAI-compatible API at the address `http://localhost:8000/v1`.
:::

<StepItem step="4" title="Set tool_choice (optional)"></StepItem>

This parameter only needs to be explicitly set when `chat_model` is the string `"openai-compatible"`. The reason this library provides this parameter is to enhance compatibility.
Most model providers support the `tool_choice` parameter. In LangChain, some chat model classes' `bind_tools` method allows setting the `tool_choice` parameter. This parameter typically accepts the following string values:

- `auto`: Let the model decide whether to call tools (default behavior for most providers);
- `none`: Prohibit calling any tools;
- `required`: Force the model to call at least one tool;
- `any`: Allow calling any tool (supported by some providers);
- `Specific tool name`: Force calling a tool with the specified name.

However, different model providers have inconsistent support ranges for `tool_choice`. To improve compatibility, this library introduces a configuration item to declare the `tool_choice` options actually supported by the current model.

This configuration item is a list of strings, where each string can only be `auto`, `none`, `any`, `required`, or `specific`. The first four items correspond to standard `tool_choice` strategies, while `specific` is a unique identifier in this library, representing the last strategy, which is to force calling a specified tool.

**Example**:  
vLLM supports `"auto"`, `"none"`, `"required"`, and `tool_choice` with specified tool names. Therefore, in this library, this parameter should be set to:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    tool_choice=["auto", "none", "required", "specific"]  #[!code highlight]
)
```

This parameter is mainly used in the following two scenarios:

1. **For calls to high-level wrapper libraries**  
   Some high-level wrappers (like `langmem`) might pass in a `tool_choice` parameter. If the current model doesn't support that value, you can explicitly declare the options actually supported by the model (such as `["auto"]`) through this parameter. The system will automatically detect whether the passed `tool_choice` value is in the supported list; if not, it will fall back to `None` (i.e., not passing this parameter), avoiding errors due to incompatibility.

2. **Force tool calling to ensure structured output**  
   By default, this library doesn't force the model to call specific tools, which might result in structured output being `None`. If your model provider supports forcing the call to a specified tool (for example, allowing setting `tool_choice={"type": "function", "function": {"name": "get_weather"}}`), then you can include `"specific"` in this parameter. After enabling, when binding the corresponding tool, the system will also pass the above parameter, forcing the model to call the specified tool, ensuring the output conforms to the expected structure.

<BestPractice>
For the <strong>tool_choice</strong> parameter, whether to configure it depends on the specific scenario. For example, for structured output, if the model's output is unstable, configuring the tool_choice parameter can improve stability, especially when the model provider supports forcing the call to a specified tool. Configuring tool_choice to include "specific" ensures that structured output is not None.
</BestPractice>

## Batch Registration

If you need to register multiple model providers, you can use the `register_model_provider` function multiple times. However, this is obviously quite cumbersome, so this library provides a batch registration function `batch_register_model_provider`.

It accepts a parameter called `providers`, which is a list of dictionaries, each with four keys: `provider`, `chat_model`, `base_url` (optional), and `tool_choice` (optional). The meaning of each key is the same as the parameters in the `register_model_provider` function.

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

::: warning Note
Both `register_model_provider` and its corresponding batch registration function `batch_register_model_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please make sure to complete all registration operations during the project startup phase and do not register dynamically at runtime.
:::

## Loading Chat Models

The function for loading chat models is `load_chat_model`, which accepts the following parameters:

<Params :params="[
{
name: 'model',
type: 'string',
description: 'Chat model name',
required: true,
},
{
name: 'model_provider',
type: 'string',
description: 'Chat model provider name',
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

- provider_name:model_name
- model_name

Where `provider_name` is the `provider_name` registered in the `register_model_provider` function.

For the `model_provider` parameter, its meaning is the same as the `provider_name` mentioned above. It can be omitted, but in this case, the `model` parameter must be in the `provider_name:model_name` format. If it is passed in, then the `model` parameter must be in the `model_name` format.
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

**Note**: Although vllm itself might not require an api_key, since this chat model class needs an api_key, you must set the api_key.

```bash
export VLLM_API_KEY=vllm
```

For the case mentioned above where `chat_model` is a string (i.e., `"openai-compatible"`), it provides the basic functionality of `langchain`'s `ChatModel` as follows:

::: details Regular Call
For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Asynchronous calls are also supported:

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

Asynchronous streaming calls are also supported:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
async for chunk in model.astream([HumanMessage("Hello")]):
    print(chunk)
```

:::

::: details Tool Calling
Note: Need to ensure the model supports tool calling

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
import datetime

@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())

model = load_chat_model("vllm:qwen3-4b").bind_tools([get_current_time])
response = model.invoke([HumanMessage("Get current timestamp")])
print(response)
```

:::
::: details Structured Output
By default, the `function_calling` method is used, so the model needs to support tool calling

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

model = load_chat_model("vllm:qwen3-4b").with_structured_output(User)
response = model.invoke([HumanMessage("Hello, my name is Zhang San and I'm 25 years old")])
print(response)
```

:::
In addition, since this class inherits from `BaseChatOpenAI`, it supports passing model parameters of `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.
Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b",extra_body={"chat_template_kwargs": {"enable_thinking": False}}) #Use extra_body to pass additional parameters, here to disable thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Additionally, it supports passing multimodal data. You can use the OpenAI-compatible multimodal data format or directly use `content_block` from `langchain`. For example:

```python
from langchain_core.messages import HumanMessage

from langchain_dev_utils.chat_models import register_model_provider

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

::: tip Tip
For model providers already supported by the official `init_chat_model` function, you can also directly use the `load_chat_model` function to load them without additional registration. Therefore, if you need to connect to multiple models simultaneously, where some providers are officially supported and others are not, you can consider using `load_chat_model` uniformly for loading. For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

# When loading the model, you need to specify the provider and model name
model = load_chat_model("openai:gpt-4o-mini")
# Or explicitly specify the provider parameter
model = load_chat_model("openai:gpt-4o-mini", model_provider="openai")

# Note: You must specify the model provider; it cannot be automatically inferred based on the model name alone
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::
