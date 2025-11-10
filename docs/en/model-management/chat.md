# Chat Model Management

> [!NOTE]
>
> **Overview**: Provides more efficient and convenient chat model management.
>
> **Prerequisites**: Familiarity with LangChain's [Chat Models](https://docs.langchain.com/oss/python/langchain/models).
>
> **Estimated Reading Time**: 10 minutes

In `langchain`, the `init_chat_model` function can be used to initialize a chat model instance, but it supports a limited number of model providers. If you wish to use more model providers (especially if your preferred provider is not supported by this function), you can utilize the chat model management functionality provided by this library.

To use a chat model, you first need to register the chat model provider using `register_model_provider`, and then you can use `load_chat_model` to load the chat model.

## Registering a Chat Model Provider

To register a chat model provider, use the `register_model_provider` function. This function accepts the following parameters:

<Params
name="provider_name"
type="string"
description="Chat model provider name"
:required="true"
:default="null"
/>
<Params
name="chat_model"
type="BaseChatModel | string"
description="Chat model"
:required="true"
:default="null"
/>
<Params
name="base_url"
type="string"
description="Chat model base URL"
:required="false"
:default="null"
/>
<Params
name="tool_choice"
type="list[string]"
description="All supported tool_choice values for this LLM provider"
:required="false"
:default="null"
/>
<Params
name="keep_reasoning_content"
type="bool"
description="Whether to keep the model's reasoning content (reasoning_content) in the subsequent messages, default False, only takes effect for reasoning models."
:required="false"
:default="false"
/>

The specific usage of these parameters is as follows:

<StepItem step="1" title="Set provider_name"></StepItem>
First, you need to specify the model provider by passing the `provider_name` parameter. This name can be customized, but it's recommended to use a meaningful name (like `vllm`) that refers to the actual provider. Please note that the name should not contain a colon `:`, as this symbol will later be used to separate the provider from the model name.

<StepItem step="2" title="Set chat_model"></StepItem>

Next, you need to pass the `chat_model` parameter, which accepts two types: a LangChain `ChatModel` class or a `str`.

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

In this example, we use the built-in `FakeChatModel` from `langchain_core`, which is only for testing and does not connect to a real model provider. **However, in practical applications, you should pass a `ChatModel` class with actual functionality.**

**2. Type is str**

When the `chat_model` parameter is a string, its only currently accepted value is `"openai-compatible"`, indicating that it will connect via the model provider's **OpenAI-compatible API**. This is because many model providers now support the OpenAI-compatible API, such as [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://together.ai/), etc.
In this case, the library will use the built-in `BaseChatOpenAICompatible` as the actual chat model.

`BaseChatOpenAICompatible` inherits from `BaseChatOpenAI` in `langchain-openai` and includes several compatibility optimizations on top of it. To ensure proper functionality, make sure to install the standard version of `langchain-dev-utils` (see [Installation Documentation](../installation.md) for installation instructions).

Compared to directly using `ChatOpenAI` provided by `langchain-openai`, this library's `BaseChatOpenAICompatible` offers the following advantages:

1. **Supports outputting more types of reasoning content (`reasoning_content`)**:  
   `ChatOpenAI` can only output reasoning content natively supported by official OpenAI models, whereas `OpenAICompatibleChatModel` can output reasoning content from other model providers (e.g., openrouter).

2. **Optimized default behavior for structured output**:  
   When calling `with_structured_output`, the default value for the `method` parameter is adjusted to `"function_calling"` (instead of `"json_schema"` which is the default for `ChatOpenAI`), providing better compatibility with other models.

3. **Supports configuring tool_choice**:  
   For most model providers compatible with the OpenAI API, their `tool_choice` parameter might differ from those supported by the official OpenAI API. Therefore, this chat model class allows users to specify the supported `tool_choice` values (see below).

<StepItem step="3" title="Set base_url (Optional)"></StepItem>

This parameter only needs to be set when `chat_model` is a string (specifically `"openai-compatible"`). You can pass the `base_url` directly in this function, or set the `API_BASE` environment variable for the model provider.

For example, suppose we want to use a model deployed by vLLM, we can set it like this:

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

::: tip Supplement
`vllm` is a well-known large model deployment framework that can serve large models as an OpenAI-compatible API. For example, to deploy the qwen3-4b model, you can use the following command:

```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```

This will provide an OpenAI-compatible API at `http://localhost:8000/v1`.
:::

<StepItem step="4" title="Set tool_choice (Optional)"></StepItem>

This parameter only needs to be explicitly set when `chat_model` is the string `"openai-compatible"`. This library provides this parameter to enhance compatibility.
Most model providers support the `tool_choice` parameter. In LangChain, the `bind_tools` method of some chat model classes allows setting it via the `tool_choice` parameter. This parameter typically accepts the following string values:

- `auto`: Lets the model decide whether to call tools (default behavior for most providers);
- `none`: Prevents calling any tools;
- `required`: Forces the model to call at least one tool;
- `any`: Allows calling any tool (supported by some providers);
- `Specific tool name`: Forces the model to call the specified tool by name.

However, different model providers support different ranges of `tool_choice` values. To improve compatibility, this library introduces a configuration item to declare the actual `tool_choice` options supported by the current model.

This configuration item is a list of strings, where each string can only be one of `auto`, `none`, `any`, `required`, or `specific`. The first four correspond to standard `tool_choice` strategies, while `specific` is a special identifier specific to this library, representing the last strategy, i.e., forcing the call of a specified tool.

**Example**:  
vLLM supports `"auto"`, `"none"`, `"required"`, and `tool_choice` specifying a concrete tool name. Therefore, in this library, this parameter should be set as:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    tool_choice=["auto", "none", "required", "specific"]  #[!code highlight]
)
```

This parameter is primarily used in the following two scenarios:

1. **For calls from high-level wrapper libraries**  
   Some high-level wrappers (like `langmem`) might pass a `tool_choice` parameter. If the current model does not support that value, you can explicitly declare the model's actual supported options (e.g., `["auto"]`) using this parameter. The system will automatically check if the incoming `tool_choice` value is in the supported list; if not, it falls back to `None` (i.e., not passing the parameter), avoiding errors due to incompatibility.

2. **Forcing tool calls to ensure structured output**  
   By default, this library does not force the model to call a specific tool, which might result in structured output being `None`. If your model provider supports forcing the call of a specified tool (e.g., allowing setting `tool_choice={"type": "function", "function": {"name": "get_weather"}}`), you can include `"specific"` in this parameter. When enabled, the system will also pass the corresponding parameter when binding the tool, forcing the model to call the specified tool and ensuring the output conforms to the expected structure.

<StepItem step="5" title="Set keep_reasoning_content (Optional)"></StepItem>

This parameter is only valid when `chat_model` is a string and set to `openai-compatible`. Unlike other parameters, it applies exclusively to reasoning models. Its purpose is to control whether the model's reasoning content (`reasoning content`) is retained in the final context history (`messages`) passed to the model. The default value is `False`, meaning reasoning content is not retained—this is the approach required by most model providers, as the final context sent to the large model should not include reasoning details. Below is the standard `messages` format used by most providers, which excludes reasoning content:

```json
[
  { "role": "user", "content": "Hello" },
  { "role": "assistant", "content": "Hello! How can I assist you?" }
]
```

However, some providers recommend retaining reasoning content to further enhance reasoning capabilities, particularly in complex scenarios involving multi-step tool calls. **This parameter is designed specifically to support such cases.** When set to `True` (retain reasoning content), the `messages` passed to the model will appear as follows:

```json
[
  { "role": "user", "content": "Hello" },
  {
    "role": "assistant",
    "content": "Hello! How can I assist you?",
    "reasoning_content": "The user said 'Hello,' which is a greeting. I should respond politely and proactively ask about their needs."
  }
]
```

It is important to note that in most cases, you should not set this parameter to `True`, as including reasoning content increases context length and may be explicitly prohibited by certain providers (e.g., DeepSeek). Only if the model provider’s documentation explicitly recommends including reasoning content should you consider enabling this option.

**Note**: The above example is simplified. In actual agent scenarios, some messages may include tool calls and other complex elements.

## Batch Registration

If you need to register multiple model providers, you can use the `register_model_provider` function multiple times. However, this can be cumbersome. Therefore, this library provides a batch registration function `batch_register_model_provider`.

It accepts a parameter `providers`, which is a list of dictionaries. Each dictionary has four keys: `provider`, `chat_model`, `base_url` (optional), and `tool_choice` (optional). The meaning of each key is the same as the corresponding parameter in the `register_model_provider` function.

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
Both `register_model_provider` and its corresponding batch registration function `batch_register_model_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please ensure all registrations are completed during the project startup phase. Do not dynamically register providers during runtime.
:::

## Loading a Chat Model

The function to load a chat model is `load_chat_model`, which accepts the following parameters:

<Params
name="model"
type="string"
description="Chat model name"
:required="true"
:default="null"
/>
<Params
name="model_provider"
type="string"
description="Chat model provider name"
:required="false"
:default="null"
/>

Additionally, the following points should be noted when using this function:

**1. Additional Parameters**

This function can also accept any number of keyword arguments, such as `temperature`, `max_tokens`, etc. For specifics, refer to the documentation of the corresponding model integration class (if `chat_model` is `"openai-compatible"`, you can refer to `ChatOpenAI`).

**2. model Parameter Format**

The `model` parameter supports two formats:

1. `provider_name:model_name`
2. `model_name`

Here, `provider_name` is the name of the provider registered via the `register_model_provider` function.

The `model_provider` parameter has the same meaning as `provider_name` above and is optional:

- If `model_provider` is not provided, the `model` parameter must be in the `provider_name:model_name` format.
- If `model_provider` is provided, the `model` parameter must be in the `model_name` format.

Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

You can also pass the `model_provider` parameter directly.

```python
from langchain_dev_utils.chat_models import load_chat_model

model = load_chat_model("qwen3-4b", model_provider="vllm")
```

**Note**: Although vLLM itself may not require an api_key, because this chat model class requires an api_key, you must set it.

```bash
export VLLM_API_KEY=vllm
```

**3. Characteristics of the Chat Model Class when chat_model is a String**

For the case mentioned above where `chat_model` is a string (i.e., `"openai-compatible"`), it provides the basic functionalities of a LangChain `ChatModel`, including the following:

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
Uses the `function_calling` method by default, so the model needs to support tool calling.

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

model = load_chat_model("vllm:qwen3-4b", extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here disabling thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Also, it supports multimodal data. You can use the OpenAI-compatible multimodal data format or directly use `content_block` from `langchain`. For example:

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

**4. Compatibility with Official Functions**

For model providers already supported by the official `init_chat_model` function, you can also load them directly using the `load_chat_model` function without additional registration. Therefore, if you need to integrate multiple models, some of which are officially supported and others are not, consider using `load_chat_model` uniformly for loading. For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

# When loading the model, specify the provider and model name
model = load_chat_model("openai:gpt-4o-mini")
# Or explicitly specify the provider parameter
model = load_chat_model("openai:gpt-4o-mini", model_provider="openai")

# Note: The model provider must be specified; it cannot be automatically inferred solely from the model name.
response = model.invoke([HumanMessage("Hello")])
print(response)
```

<BestPractice>
    <p>For using this module, the following recommendations are provided:</p>
    <ol>
        <li>If all your models are supported by the official <code>init_chat_model</code>, please use that function directly for best compatibility and stability.</li>
        <li>If some models are not officially supported, or you need to integrate providers not covered by the official function, you can use the functions in this module.</li>
        <li>If there is no suitable model integration library available, but the provider offers an OpenAI-compatible API, then you can use the functions in this module.</li>
    </ol>
</BestPractice>
