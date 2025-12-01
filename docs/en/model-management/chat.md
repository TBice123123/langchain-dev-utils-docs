# Chat Model Management

> [!NOTE]  
> **Feature Overview**: Provides more efficient and convenient chat model management, supporting multiple model providers.  
> **Prerequisites**: Understanding of LangChain [Chat Models](https://docs.langchain.com/oss/python/langchain/models).  
> **Estimated Reading Time**: 15 minutes.

## Overview

LangChain's `init_chat_model` function only supports a limited number of model providers. This library offers a more flexible chat model management solution that supports custom model providers, particularly suitable for scenarios where you need to integrate with model services not natively supported (such as vLLM, OpenRouter, etc.).

Using the chat model management feature of this library requires two steps:

1. **Register Model Provider**

Use `register_model_provider` to register a model provider. Its parameters are defined as follows:
<Params  
name="provider_name"  
type="string"  
description="Model provider name, used as an identifier for subsequent model loading"  
:required="true"  
:default="null"  
/>  
<Params  
name="chat_model"  
type="BaseChatModel | string"  
description="Chat model, can be a ChatModel or a string (currently supports 'openai-compatible')"  
:required="true"  
:default="null"  
/>  
<Params  
name="base_url"  
type="string"  
description="API address of the model provider (optional, valid for both types of chat_model, but mainly used when chat_model is a string and is 'openai-compatible')"  
:required="false"  
:default="null"  
/>  
<Params  
name="model_profiles"  
type="dict"  
description="Declare the features and related parameters of each model provided by this model provider (optional, applicable to both types of chat_model). The corresponding configuration will be read based on model_name and written to model.profile (e.g., containing fields like max_input_tokens, tool_calling, etc.)."  
:required="false"  
:default="null"  
/>
<Params  
name="compatibility_options"  
type="dict"  
description="Model provider compatibility options (optional, effective when chat_model is a string and value is 'openai-compatible'), used to declare the provider's support for OpenAI-compatible features (such as tool_choice strategies, JSON Mode, etc.) to ensure proper functionality adaptation."  
:required="false"  
:default="null"  
/>

2. **Load Chat Model**

Use `load_chat_model` to instantiate a specific model. Its parameters are defined as follows:

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

**Note**: The `load_chat_model` function can also receive any number of keyword arguments, which can be used to pass additional parameters such as `temperature`, `max_tokens`, `extra_body`, etc.

## Registering Model Providers

To register a chat model provider, call `register_model_provider`. For different situations, the registration steps vary slightly.

### Case 1: Existing LangChain Chat Model Class

If the model provider already has a ready and suitable LangChain integration (see [Chat Model Class Integration](https://docs.langchain.com/oss/python/integrations/chat)), pass the corresponding integrated chat model class as the chat_model parameter.

<StepItem step="1" title="Set provider_name"></StepItem>

Pass in `provider_name`, which will be used for reference in `load_chat_model` later. The name can be customized, but **must not contain colons**.

<StepItem step="2" title="Set chat_model"></StepItem>

Pass in a **subclass of `BaseChatModel`**.

```python
from langchain_core.language_models.fake_chat_models import FakeChatModel
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="fake_provider",
    chat_model=FakeChatModel,
)
```

**Note**: `FakeChatModel` is only for testing purposes. In actual use, you must pass in a functional `ChatModel` class.

<StepItem step="3" title="Set base_url (optional)"></StepItem>

- **This parameter usually doesn't need to be set** because the model class already defines the API address internally (such as `api_base` or `base_url` fields);
- **Only pass in `base_url` when you need to override the default address**;
- The override mechanism only works for attributes with field names `api_base` or `base_url` (including aliases) in the model class.

<StepItem step="4" title="Set model_profiles (optional)"></StepItem>

If your LangChain integrated chat model class fully supports the `profile` parameter (i.e., you can directly access model-related properties through `model.profile`, such as `max_input_tokens`, `tool_calling`, etc.), then no additional `model_profiles` setting is needed.

If accessing through `model.profile` returns an empty dictionary `{}`, it indicates that this LangChain chat model class may not yet support the `profile` parameter. In this case, you can manually provide `model_profiles`.

`model_profiles` is a dictionary where each key is a model name, and the value is the profile configuration for that model:

```python
{
    "model_name_1": {
        "max_input_tokens": 100_000,
        "tool_calling": True,
        "structured_output": True,
        # ... other optional fields
    },
    "model_name_2": {
        "max_input_tokens": 32768,
        "image_inputs": True,
        "tool_calling": False,
        # ... other optional fields
    },
    # You can have any number of model configurations
}
```

**Tip**: It's recommended to use the `langchain-model-profiles` library to get profiles for your model provider.

### Case 2: No LangChain Chat Model Class, but Provider Supports OpenAI-Compatible API

Many model providers support **OpenAI-compatible API** services, such as: [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://www.together.ai/), etc. When the model provider you're integrating with doesn't have a suitable LangChain chat model class, but the provider supports an OpenAI-compatible API, you can consider using this case.

This library will build a chat model class corresponding to a specific provider using the built-in `BaseChatOpenAICompatible` class based on user input. This class inherits from `langchain-openai`'s `BaseChatOpenAI` and enhances the following capabilities:

1. **Support for more `reasoning_content` formats**: Can parse reasoning content (`reasoning_content`) output from non-OpenAI providers;
2. **Structured output defaults to `function_calling`**: More compatible than `json_schema`;
3. **Fine-tune differences through `compatibility_options`**: Resolve support differences for parameters like `tool_choice`, `response_format`, etc.

**Note**: When using this case, you must install the standard version of the `langchain-dev-utils` library. For details, refer to [Installation](../installation.md).

<StepItem step="1" title="Set provider_name"></StepItem>

Pass in a custom provider name, **must not contain colons `:`**.

<StepItem step="2" title="Set chat_model"></StepItem>

You must pass in the string `"openai-compatible"`. This is the only supported string value at present.

<StepItem step="3" title="Set base_url (required)"></StepItem>

- **You must provide an API address**, otherwise the chat model class cannot be initialized;
- Can be provided in either of the following ways:
  - **Explicit parameter passing**:
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible",
        base_url="http://localhost:8000/v1"
    )
    ```
  - **Through environment variables** (recommended for configuration management):
    ```bash
    export VLLM_API_BASE=http://localhost:8000/v1
    ```
    The `base_url` can be omitted in the code:
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible"
        # Automatically reads VLLM_API_BASE
    )
    ```
    ::: info Tip
    In this case, the naming convention for environment variables of the model provider's API endpoint is `${PROVIDER_NAME}_API_BASE` (all uppercase, separated by underscores). The corresponding API_KEY environment variable naming convention is `${PROVIDER_NAME}_API_KEY` (all uppercase, separated by underscores).
    :::

::: tip Supplement

vLLM is a commonly used large model inference framework that can deploy large models as OpenAI-compatible APIs, such as the Qwen3-4B in this example:

```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```

The service address is `http://localhost:8000/v1`.  
:::

<StepItem step="4" title="Set model_profiles (optional)"></StepItem>

In this case, if `model_profiles` is not manually set, then `model.profile` will return an empty dictionary `{}`. Therefore, if you need to get configuration information for a specific model through `model.profile`, you must explicitly set `model_profiles` first.

<StepItem step="5" title="Set compatibility_options (optional)"></StepItem>

Only effective in this case. Used to declare the provider's support for some features of the **OpenAI API** to improve compatibility and stability.

- `supported_tool_choice`: List of supported `tool_choice` strategies, default is `["auto"]`;
- `support_json_mode`: Whether to support `response_format={"type": "json_object"}`, default is `False`;
- `reasoning_content_keep_type`: How to retain the `reasoning_content` field in historical messages (messages) passed to the model. Possible values are `discard`, `temp`, `retain`. Default is `discard`.
- `include_usage`: Whether to include `usage` information in the last streaming response result, default is `True`.

::: details supported_tool_choice

Common values for `tool_choice`:

- `"auto"`: Model decides whether to call tools autonomously;
- `"none"`: Prohibit tool calling;
- `"required"`: Force calling at least one tool;
- Specify a specific tool (in OpenAI-compatible API, specifically `{"type": "function", "function": {"name": "xxx"}}`).

Different providers support different ranges. To avoid errors, this library defaults `supported_tool_choice` to `["auto"]`. With this strategy, you can only pass `tool_choice` as `auto`, and other strategies will be filtered out.

If you need to enable, you must explicitly declare the supported items. The configuration value is a list of strings, with optional values:

- `"auto"`, `"none"`, `"required"`: Corresponding to standard strategies;
- `"specific"`: A unique identifier for this library, indicating support for specifying specific tools.

For example, vLLM supports all strategies:

```python
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    compatibility_options={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```

::: info Tip
In scenarios where structured output is implemented using the `function calling` method, the model might not call the corresponding structured tool due to its own issues, resulting in an output of `None`. Therefore, if your model provider supports specifying a specific tool to call through the `tool_choice` parameter, you can explicitly set this parameter during registration to ensure the stability and reliability of structured output.
:::

::: details support_json_mode

If the provider supports `json_mode` (in OpenAI-compatible API, specifically `response_format={"type": "json_object"}`), you can set it to `True`, and in the `with_structured_output` method, you need to explicitly specify `method="json_mode"`.

:::

::: details reasoning_content_keep_type

Supports the following values:
- `discard`: Do not retain reasoning content in historical messages (default);
- `temp`: Only retain the `reasoning_content` field in the current conversation;
- `retain`: Retain the `reasoning_content` field in all conversations.

For example:
Assume the user first asks "What's the weather in New York today", then asks "What's the weather in London today"; the conversation has progressed to the second question, about to make the final model call.

- When the value is `discard`

When the value is `discard`, the final messages passed to the model will not have any `reasoning_content` fields. The final messages received by the model will be:

```python
messages = [
    {"content": "Check New York weather today", "role": "user"},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "2025-12-01", "role": "tool", "tool_call_id": "..."},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    {"content": "2025-12-01, New York cloudy, 7~13°C.", "role": "assistant"},
    {"content": "Check London weather today", "role": "user"},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
]
```
- When the value is `temp`

When the value is `temp`, only the `reasoning_content` field in the current conversation is retained. The final messages received by the model will be:
```python
messages = [
    {"content": "Check New York weather today", "role": "user"},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "2025-12-01", "role": "tool", "tool_call_id": "..."},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    {"content": "2025-12-01, New York cloudy, 7~13°C.", "role": "assistant"},
    {"content": "Check London weather today", "role": "user"},
    {
        "content": "",
        "reasoning_content": "Check London weather. First get the date, based on historical context the date is known, directly call the weather tool.",  # Only retain reasoning_content for this round of conversation
        "role": "assistant",
        "tool_calls": [...],
    },
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
]
```
- When the value is `retain`

When the value is `retain`, the `reasoning_content` field in all conversations is retained. The final messages received by the model will be:
```python
messages = [
    {"content": "Check New York weather today", "role": "user"},
    {
        "content": "",
        "reasoning_content": "Need to get the date first, then check New York weather.",  # Retain reasoning_content
        "role": "assistant",
        "tool_calls": [...],
    },
    {"content": "2025-12-01", "role": "tool", "tool_call_id": "..."},
    {
        "content": "",
        "reasoning_content": "Date obtained, checking New York weather.",  # Retain reasoning_content
        "role": "assistant",
        "tool_calls": [...],
    },
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    {
        "content": "2025-12-01, New York cloudy, 7~13°C.",
        "reasoning_content": "Return New York weather result.",  # Retain reasoning_content
        "role": "assistant",
    },
    {"content": "Check London weather today", "role": "user"},
    {
        "content": "",
        "reasoning_content": "Check London weather. First get the date, based on historical context the date is known, directly call the weather tool.",  # Retain reasoning_content
        "role": "assistant",
        "tool_calls": [...],
    },
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
]
```

**Note**: If the current round of conversation does not involve tool calls, the effect of `temp` is the same as `discard`.
:::

::: details include_usage

`include_usage` is a parameter in the OpenAI-compatible API used to control whether to append a message containing token usage information (such as `prompt_tokens` and `completion_tokens`) at the end of streaming responses. Since standard streaming responses don't return usage information by default, enabling this option allows clients to directly obtain complete token consumption data for billing, monitoring, or logging purposes.

Usually enabled through `stream_options={"include_usage": true}`. Considering that some model providers don't support this parameter, this library sets it as a compatibility option with a default value of `True`, as most model providers support this parameter. If not supported, it can be explicitly set to `False`.
:::

:::info Note  
Different models from the same provider may also have differences in support for parameters like `tool_choice`, `json_mode`, etc. For this reason, this library treats the four **compatibility options** `supported_tool_choice`, `support_json_mode`, `reasoning_content_keep_type`, and `include_usage` as instance attributes of the chat model class. When registering a model provider, you can directly pass these parameters as **global default values**, summarizing the support situation for most models provided by that provider; when loading a specific model later, if a model's support situation differs from the default values, you only need to explicitly pass the corresponding parameters in `load_chat_model` to **dynamically override** the global configuration, achieving fine-tuned adaptation.

Example: Most models of a provider support three `tool_choice` strategies: `["auto", "none", "required"]`, but individual models only support `["auto"]`. Set the global default value during registration:

```python
register_model_provider(
    ...,
    compatibility_options={"supported_tool_choice": ["auto", "none", "required"]},
)
```

And when loading this special model, explicitly override the configuration:

```python
model = load_chat_model(
    "...",  # Model provider and model name
    supported_tool_choice=["auto"]  # Override default value
)
```

This approach allows developers to flexibly configure according to the actual support situation of different models.
:::

## Batch Registration

If you need to register multiple providers, you can use `batch_register_model_provider` to avoid repeated calls.

```python
from langchain_dev_utils.chat_models import batch_register_model_provider
from langchain_core.language_models.fake_chat_models import FakeChatModel

batch_register_model_provider(
    providers=[
        {
            "provider_name": "fake_provider",
            "chat_model": FakeChatModel,
        },
        {
            "provider_name": "vllm",
            "chat_model": "openai-compatible",
            "base_url": "http://localhost:8000/v1",
        },
    ]
)
```

::: warning Note  
Both registration functions are implemented based on a global dictionary. To avoid multithreading issues, **all registrations must be completed during the application startup phase**, and dynamic registration during runtime is prohibited.  
:::

## Loading Chat Models

Use the `load_chat_model` function to load a chat model (initialize a chat model instance). The parameter rules are as follows:

- If `model_provider` is not passed, then `model` must be in the format `provider_name:model_name`;
- If `model_provider` is passed, then `model` must only be `model_name`.

**Examples**:

```python
# Method 1
model = load_chat_model("vllm:qwen3-4b")

# Method 2
model = load_chat_model("qwen3-4b", model_provider="vllm")
```

Although `vLLM` doesn't strictly require an API Key, LangChain still requires it to be set. You can set it in environment variables:

```bash
export VLLM_API_KEY=vllm
```

### Model Methods and Parameters

For **Case 1**, all its methods and parameters are consistent with the corresponding chat model class.  
For **Case 2**, the model's methods and parameters are as follows:

- Supports `invoke`, `ainvoke`, `stream`, `astream` and other methods.
- Supports the `bind_tools` method for tool calling.
- Supports the `with_structured_output` method for structured output.
- Supports passing parameters of `BaseChatOpenAI`, such as `temperature`, `top_p`, `max_tokens`, etc.
- Supports passing multimodal data
- Supports OpenAI's latest `responses api`
- Supports the `model.profile` parameter to get the model's profile.

:::details Regular Calling

Supports using `invoke` for simple calls:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Also supports using `ainvoke` for asynchronous calls:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = await model.ainvoke([HumanMessage("Hello")])
print(response)
```

:::

:::details Streaming Output

Supports using `stream` for streaming output:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
for chunk in model.stream([HumanMessage("Hello")]):
    print(chunk)
```

And using `astream` for asynchronous streaming calls:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
async for chunk in model.astream([HumanMessage("Hello")]):
    print(chunk)
```

:::

:::details Tool Calling

If the model itself supports tool calling, you can directly use the `bind_tools` method for tool calling:

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

:::details Structured Output

Supports structured output, using the `function_calling` method by default, so the model needs to support tool calling:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

model = load_chat_model("vllm:qwen3-4b").with_structured_output(User)
response = model.invoke([HumanMessage("Hello, my name is Zhang San, I'm 25 years old")])
print(response)
```

At the same time, if your model provider supports `json_mode`, you can set `support_json_mode` to `True` in the `provider_config` parameter when registering the model provider, and specify `method` as `"json_mode"` when calling `with_structured_output` to enable this mode. Finally, please explicitly guide the model in the prompt to output structured data according to the specified JSON Schema format.
:::

:::details Passing Model Parameters

In addition, since this class inherits from `BaseChatOpenAI`, it supports passing model parameters of `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here to disable thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::

:::details Passing Multimodal Data

Supports passing multimodal data. You can use OpenAI-compatible multimodal data formats or directly use `content_block` from `langchain`. For example:

```python
from langchain_dev_utils.chat_models import register_model_provider, load_chat_model
from langchain_core.messages import HumanMessage


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

:::

:::details OpenAI's Latest `responses_api`

This model class also supports OpenAI's latest `responses_api`. However, currently only a few providers support this API style. If your model provider supports this API style, you can pass in `use_responses_api=True` as a parameter.
For example, vllm supports `responses_api`, so you can use it like this:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", use_responses_api=True)
response = model.invoke([HumanMessage(content="Hello")])
print(response)
```

:::

:::details Getting Model Profile
Taking OpenRouter as an example, first you need to install the `langchain-model-profiles` library:

```bash
pip install langchain-model-profiles
```

Then you can use the following way to get OpenRouter's supported model profiles:

```bash
langchain-profiles refresh --provider openrouter --data-dir ./data/openrouter
```

This will generate a `_profiles.py` file in the `./data/openrouter` folder in the project root directory, which contains a dictionary variable named `_PROFILES`.

Next, you can refer to the following example for the code:

```python
from langchain_dev_utils.chat_models import load_chat_model, register_model_provider

from data.openrouter._profiles import _PROFILES

register_model_provider("openrouter", "openai-compatible", model_profiles=_PROFILES)

model = load_chat_model("openrouter:openai/gpt-5-mini")
print(model.profile)
```

:::

### Compatibility with Official Providers

For providers already officially supported by LangChain (such as `openai`), you can directly use `load_chat_model` without registration:

```python
model = load_chat_model("openai:gpt-4o-mini")
# or
model = load_chat_model("gpt-4o-mini", model_provider="openai")
```

<BestPractice>
    <p>For the use of this module, you can choose according to the following three situations:</p>
    <ol>
        <li>If all model providers you're integrating are supported by the official <code>init_chat_model</code>, please directly use the official function for the best compatibility and stability.</li>
        <li>If some model providers you're integrating are not officially supported, you can use the functionality of this module, first use <code>register_model_provider</code> to register model providers, then use <code>load_chat_model</code> to load models.</li>
        <li>If the model providers you're integrating don't have suitable integrations yet, but the providers offer OpenAI-compatible APIs (such as vLLM, OpenRouter), it's recommended to use the functionality of this module, first use <code>register_model_provider</code> to register model providers (passing <code>openai-compatible</code> as chat_model), then use <code>load_chat_model</code> to load models.</li>
    </ol>
</BestPractice>