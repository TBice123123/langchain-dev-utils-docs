# Chat Model Management

> [!NOTE]  
> **Function Overview**: Provides more efficient and convenient chat model management, supporting multiple model providers.  
> **Prerequisites**: Understanding LangChain [chat models](https://docs.langchain.com/oss/python/langchain/models).  
> **Estimated Reading Time**: 15 minutes.

## Overview

LangChain's `init_chat_model` function only supports a limited number of model providers. This library provides a more flexible chat model management solution, supporting custom model providers, particularly suitable for scenarios requiring integration with model services not natively supported (such as vLLM, OpenRouter, etc.).

Using this library's chat model management functionality requires two steps:

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
description="Chat model, can be a ChatModel class or string (currently supports 'openai-compatible')"  
:required="true"  
:default="null"  
/>  
<Params  
name="base_url"  
type="string"  
description="API endpoint of the model provider (optional, effective for both types of chat_model, but mainly used when chat_model is a string and is 'openai-compatible')"  
:required="false"  
:default="null"  
/>  
<Params  
name="model_profiles"  
type="dict"  
description="Declares the features and related parameters supported by each model offered by this provider (optional, applicable to both types of chat_model). The configuration corresponding to model_name will be read and written to model.profile (e.g., containing fields like max_input_tokens, tool_calling, etc.)."  
:required="false"  
:default="null"  
/>
<Params  
name="compatibility_options"  
type="dict"  
description="Model provider compatibility options (optional, effective when chat_model is a string with value 'openai-compatible'), used to declare the provider's support for OpenAI-compatible features (such as tool_choice strategies, JSON Mode, etc.) to ensure correct feature adaptation."  
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

**Note**: The `load_chat_model` function can also accept any number of keyword arguments, which can be used to pass additional parameters such as `temperature`, `max_tokens`, `extra_body`, etc.

## Registering Model Providers

To register a chat model provider, call `register_model_provider`. The registration steps vary slightly depending on the situation.

### Case 1: Existing LangChain Chat Model Class

If the model provider already has a suitable LangChain integration (see [Chat Model Class Integrations](https://docs.langchain.com/oss/python/integrations/chat)), pass the corresponding integrated chat model class as the chat_model parameter.

<StepItem step="1" title="Set provider_name"></StepItem>

Pass a `provider_name` for later reference in `load_chat_model`. The name can be customized but **must not contain colons**.

<StepItem step="2" title="Set chat_model"></StepItem>

Pass a **`BaseChatModel` subclass**.

```python
from langchain_core.language_models.fake_chat_models import FakeChatModel
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="fake_provider",
    chat_model=FakeChatModel,
)
```

**Note**: `FakeChatModel` is for testing only. In actual use, you must pass a `ChatModel` class with real functionality.

<StepItem step="3" title="Set base_url (optional)"></StepItem>

- **This parameter usually doesn't need to be set**, as the API endpoint is already defined within the model class (such as `api_base` or `base_url` fields);
- **Only pass `base_url` when you need to override the default address**;
- The override mechanism only works for attributes in the model class with field names `api_base` or `base_url` (including aliases).

<StepItem step="4" title="Set model_profiles (optional)"></StepItem>

If your LangChain integrated chat model class already fully supports the `profile` parameter (i.e., you can directly access model-related attributes like `max_input_tokens`, `tool_calling`, etc. via `model.profile`), then no additional `model_profiles` setting is needed.

If accessing via `model.profile` returns an empty dictionary `{}`, it means the LangChain chat model class may not yet support the `profile` parameter. In this case, you can manually provide `model_profiles`.

`model_profiles` is a dictionary where each key is a model name and the value is the corresponding model's profile configuration:

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
    # Can have any number of model configurations
}
```

**Tip**: It is recommended to use the `langchain-model-profiles` library to obtain profiles for your model provider.

### Case 2: No LangChain Chat Model Class, but Model Provider Supports OpenAI-Compatible API

Many model providers offer services with **OpenAI-compatible APIs**, such as [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://www.together.ai/), etc. When your integrated model provider doesn't have a suitable LangChain chat model class but supports OpenAI-compatible APIs, you can consider this case.

This library will use the built-in `BaseChatOpenAICompatible` class to build a corresponding chat model class for the specific provider based on user input. This class inherits from `langchain-openai`'s `BaseChatOpenAI` and enhances the following capabilities:

- **Support for more reasoning_content formats**: Can parse reasoning content output from non-OpenAI providers.  
- **Dynamically adapt and select the most suitable structured output method**: By default, it can automatically select the optimal structured output method (`function_calling` or `json_schema`) based on the model provider's actual support.  
- **Fine-tune differences through compatibility_options**: By configuring provider compatibility options, resolve support differences in parameters like `tool_choice`, `response_format`, etc.

**Note**: When using this case, you must install the standard version of the `langchain-dev-utils` library. For details, refer to [Installation](../installation.md).

<StepItem step="1" title="Set provider_name"></StepItem>

Pass a custom provider name, **must not contain colons `:`**.

<StepItem step="2" title="Set chat_model"></StepItem>

Must pass the string `"openai-compatible"`. This is currently the only supported string value.

<StepItem step="3" title="Set base_url (required)"></StepItem>

- **Must provide the API endpoint**, otherwise the chat model class cannot be initialized;
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
    Can omit `base_url` in code:
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible"
        # Automatically reads VLLM_API_BASE
    )
    ```
    ::: info Tip
    In this case, the environment variable for the model provider's API endpoint is named `${PROVIDER_NAME}_API_BASE` (all uppercase, underscore-separated). The corresponding API_KEY environment variable is named `${PROVIDER_NAME}_API_KEY` (all uppercase, underscore-separated).
    :::

::: tip Supplementary

vLLM is a commonly used large model inference framework that can deploy large models as OpenAI-compatible APIs, such as Qwen3-4B in this example:

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

In this case, if `model_profiles` is not manually set, `model.profile` will return an empty dictionary `{}`. Therefore, if you need to obtain configuration information for a specific model via `model.profile`, you must explicitly set `model_profiles` first.

<StepItem step="5" title="Set compatibility_options (optional)"></StepItem>

Only effective in this case. Used to **declare** the provider's support for certain **OpenAI API** features to improve compatibility and stability.
Currently supports the following configuration items:

- `supported_tool_choice`: List of supported `tool_choice` strategies, defaults to `["auto"]`;
- `supported_response_format`: List of supported `response_format` formats (`json_schema`, `json_object`), defaults to `[]`;
- `reasoning_content_keep_type`: How to retain the `reasoning_content` field in historical messages passed to the model. Options are `discard`, `temp`, `retain`. Defaults to `discard`.
- `include_usage`: Whether to include `usage` information in the last streaming response, defaults to `True`.

**Note**: Different models from the same provider may also differ in their support for parameters like `tool_choice`, `response_format`, etc. For this reason, this library treats the above four **compatibility options** as instance attributes of the chat model class. When registering a model provider, you can directly pass these parameters as **global default values** to summarize the support status of most models offered by that provider; when loading a specific model later, if a model's support status differs from the default values, you only need to explicitly pass the corresponding parameters in `load_chat_model` to **dynamically override** the global configuration, achieving fine-grained adaptation.

::: details supported_tool_choice

`tool_choice` is used to control whether and which external tools the large model should invoke when responding, to improve accuracy, reliability, and controllability. Common values include:

- `"auto"`: The model autonomously decides whether to call tools (default behavior);
- `"none"`: Prohibits tool calls;
- `"required"`: Forces at least one tool to be called;
- Specifying a specific tool (in OpenAI-compatible APIs, specifically `{"type": "function", "function": {"name": "xxx"}}`).

Different providers have different support ranges. To avoid errors, this library's default `supported_tool_choice` is `["auto"]`, so when using `bind_tools`, the `tool_choice` parameter can only pass `auto`. Any other values will be filtered out.

To support passing other `tool_choice` values, you must configure the supported items. The configuration value is a list of strings, with each string's options:

- `"auto"`, `"none"`, `"required"`: Correspond to standard strategies;
- `"specific"`: A special identifier in this library indicating support for specifying a particular tool.

For example, vLLM supports all strategies:

```python
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    compatibility_options={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```

::: info Tip
If there are no special requirements, you can keep the default (i.e., `["auto"]`). If your business scenario requires the model to **must call a specific tool** or **choose one from a given list**, and the model provider supports the corresponding strategy, then enable it as needed:
1. To require **at least one** tool to be called, if the provider supports `required`, you can set it to `["required"]`
2. To require **a specific tool** to be called, if the provider supports specifying a particular tool call, you can set it to `["specific"]` (this is very useful in `function_calling` structured output to ensure the model calls the specified structured output tool, guaranteeing stability of structured output)

This parameter can be set uniformly in `register_model_provider` or dynamically overridden for individual models in `load_chat_model`; it is recommended to declare the `tool_choice` support status of most models from the provider in `register_model_provider` once, and for models with different support statuses, specify them separately in `load_chat_model`.
:::


::: details supported_response_format

Currently, there are three common structured output methods.

- `function_calling`: Generates structured output by calling a tool that conforms to a specified schema.
- `json_schema`: A specialized feature for generating structured output provided by model providers. In OpenAI-compatible APIs, this is specifically `response_format={"type": "json_schema", "json_schema": {...}}`.
- `json_mode`: A feature provided by some providers before launching `json_schema`. It can generate valid JSON, but the schema must be described in the prompt. In OpenAI-compatible APIs, this is specifically `response_format={"type": "json_object"}`.

Among them, `json_schema` is only supported by a few OpenAI-compatible API providers (such as `OpenRouter`, `TogetherAI`); `json_mode` has higher support, with most providers already compatible; while `function_calling` is the most universal, as long as the model supports tool calling, it can be used.

This parameter is used to declare the model provider's support for `response_format`. By default, it is `[]`, meaning the provider supports neither `json_mode` nor `json_schema`. In this case, the `method` parameter in `with_structured_output` can only pass `function_calling` (or `auto`, which will be inferred as `function_calling`). If `json_mode` or `json_schema` is passed, it will automatically be converted to `function_calling`. To enable `json_mode` or `json_schema` structured output implementation, you must explicitly set this parameter.

For example, most models on OpenRouter support both `json_mode` and `json_schema` response_format, so you can declare this during registration:

```python
register_model_provider(
    provider_name="openrouter",
    chat_model="openai-compatible",
    compatibility_options={"supported_response_format": ["json_mode", "json_schema"]},
)
``` 

::: info Tip
Usually, no configuration is needed. Only consider configuring this when using the `with_structured_output` method. If the model provider supports `json_schema`, you can consider configuring this parameter to ensure stability of structured output. For `json_mode`, because it can only guarantee JSON output, it's generally not necessary to set it. Only when the model doesn't support tool calling and only supports setting `response_format={"type":"json_object"}` do you need to configure this parameter to include `json_mode`.

Similarly, this parameter can be set uniformly in `register_model_provider` or dynamically overridden for individual models in `load_chat_model`; it is recommended to declare the `response_format` support status of most models from the provider in `register_model_provider` once, and for models with different support statuses, specify them separately in `load_chat_model`.

:::

::: details reasoning_content_keep_type

Used to control how the `reasoning_content` field in historical messages is retained.

Supports the following values:
- `discard`: Do not retain reasoning content in historical messages (default);
- `temp`: Only retain the `reasoning_content` field in the current conversation;
- `retain`: Retain the `reasoning_content` field in all conversations.

For example:
Assume the user first asks "What's the weather in New York today?", then asks "What's the weather in London today?"; currently at the second question, about to initiate the final model call.

- When value is `discard`

When the value is `discard`, the final messages passed to the model will not contain any `reasoning_content` field. The messages received by the model are:

```python
messages = [
    {"content": "Check New York weather today", "role": "user"},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "2025-12-01", "role": "tool", "tool_call_id": "..."},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    {"content": "2025-12-01, New York is cloudy, 7~13°C.", "role": "assistant"},
    {"content": "Check London weather today", "role": "user"},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
]
```
- When value is `temp`

When the value is `temp`, only retain the `reasoning_content` field in the current conversation. The messages received by the model are:
```python
messages = [
    {"content": "Check New York weather today", "role": "user"},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "2025-12-01", "role": "tool", "tool_call_id": "..."},
    {"content": "", "role": "assistant", "tool_calls": [...]},
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    {"content": "2025-12-01, New York is cloudy, 7~13°C.", "role": "assistant"},
    {"content": "Check London weather today", "role": "user"},
    {
        "content": "",
        "reasoning_content": "Check London weather. First get the date. Based on historical context, the date is known, directly call the weather tool.",  # Only retain reasoning_content from current round
        "role": "assistant",
        "tool_calls": [...],
    },
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
]
```
- When value is `retain`

When the value is `retain`, retain the `reasoning_content` field in all conversations. The messages received by the model are:
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
        "reasoning_content": "Date obtained, check New York weather.",  # Retain reasoning_content
        "role": "assistant",
        "tool_calls": [...],
    },
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    {
        "content": "2025-12-01, New York is cloudy, 7~13°C.",
        "reasoning_content": "Return New York weather result.",  # Retain reasoning_content
        "role": "assistant",
    },
    {"content": "Check London weather today", "role": "user"},
    {
        "content": "",
        "reasoning_content": "Check London weather. First get the date. Based on historical context, the date is known, directly call the weather tool.",  # Retain reasoning_content
        "role": "assistant",
        "tool_calls": [...],
    },
    {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
]
```

**Note**: If the current conversation round does not involve tool calling, the `temp` effect is the same as the `discard` effect.
::: info Tip
Configure flexibly according to the model provider's requirements for `reasoning_content` retention:
- If the provider requires **full retention** of reasoning content, set to `retain`;
- If the requirement is only to retain reasoning content in the **current tool call**, set to `temp`;
- If there are no special requirements, keep the default `discard`.

Similarly, this parameter can be set uniformly in `register_model_provider` or dynamically overridden for individual models in `load_chat_model`; if there are only a few models that require `reasoning_content` retention, it is recommended to specify them separately in `load_chat_model`, and no setting is needed in `register_model_provider`.
:::

::: details include_usage

`include_usage` is a parameter in OpenAI-compatible APIs used to control whether to append a message containing token usage information (such as `prompt_tokens` and `completion_tokens`) at the end of a streaming response. Since standard streaming responses don't return usage information by default, enabling this option allows clients to directly obtain complete token consumption data, facilitating billing, monitoring, or logging.

Usually enabled via `stream_options={"include_usage": true}`. Considering some model providers don't support this parameter, this library makes it a compatibility option with a default value of `True`, because the vast majority of model providers support it. If not supported, you can explicitly set it to `False`.

::: info Tip
This parameter generally doesn't need to be set, keep the default value. Only set it to `False` when the model provider doesn't support it.
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
Both registration functions are implemented based on a global dictionary. To avoid multithreading issues, **all registrations must be completed during application startup**, and dynamic registration at runtime is prohibited.  
:::

## Loading Chat Models

Use the `load_chat_model` function to load a chat model (initialize a chat model instance). The parameter rules are as follows:

- If `model_provider` is not passed, `model` must be in the format `provider_name:model_name`;
- If `model_provider` is passed, `model` must be only `model_name`.

**Examples**:

```python
# Method 1
model = load_chat_model("vllm:qwen3-4b")

# Method 2
model = load_chat_model("qwen3-4b", model_provider="vllm")
```

Although `vLLM` doesn't strictly require an API Key, LangChain still requires setting one. You can set it in environment variables:

```bash
export VLLM_API_KEY=vllm
```

### Model Methods and Parameters

For **Case 1**, all methods and parameters are consistent with the corresponding chat model class.
For **Case 2**, the model's methods and parameters are as follows:

- Supports methods like `invoke`, `ainvoke`, `stream`, `astream`.
- Supports the `bind_tools` method for tool calling.
- Supports the `with_structured_output` method for structured output.
- Supports passing `BaseChatOpenAI` parameters such as `temperature`, `top_p`, `max_tokens`, etc.
- Supports passing multimodal data
- Supports OpenAI's latest `responses api`
- Supports the `model.profile` parameter to obtain the model's profile.

:::details Normal Invocation

Supports `invoke` for simple calls:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Also supports `ainvoke` for asynchronous calls:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = await model.ainvoke([HumanMessage("Hello")])
print(response)
```

:::

::: details Streaming Output

Supports `stream` for streaming output:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
for chunk in model.stream([HumanMessage("Hello")]):
    print(chunk)
```

And `astream` for asynchronous streaming calls:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
async for chunk in model.astream([HumanMessage("Hello")]):
    print(chunk)
```

:::

::: details Tool Calling

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

::: details Structured Output

Supports structured output. The default `method` value is `auto`, which will automatically select the appropriate structured output method based on the model provider's `supported_response_format` parameter. Specifically, if the value includes `json_schema`, it will choose the `json_schema` method; otherwise, it will choose the `function_calling` method.

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
Compared with tool calling, `json_schema` can 100% guarantee output conforms to JSON Schema specifications, avoiding parameter errors that may occur with tool calls. Therefore, if the model provider supports `json_schema`, this method will be used by default. When the model provider doesn't support it, it will fall back to the `function_calling` method.
For `json_mode`, although it has higher support, it must guide the model to output JSON strings with specified schemas in the prompt, making it more troublesome to use, so this method is not used by default. If you want to use it, you can explicitly provide `method="json_mode"` (provided that `json_mode` is included in `supported_response_format` during registration or instantiation).
:::

::: details Passing Model Parameters

In addition, since this class inherits from `BaseChatOpenAI`, it supports passing `BaseChatOpenAI` model parameters such as `temperature`, `extra_body`, etc.:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b",extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here to disable thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::

::: details Passing Multimodal Data

Supports passing multimodal data. You can use OpenAI-compatible multimodal data formats or directly use `content_block` from `langchain`. For example:

```python
from langchain_dev_utils.chat_models import register_model_provider, load_chat_model
from langchain_core.messages import HumanMessage


register_model_provider(
    provider_name="openrouter",
    chat_model="openai-compatible",
    base_url="https://openrouter.ai/api/v1   ",
)

messages = [
    HumanMessage(
        content_blocks=[
            {
                "type": "image",
                "url": "https://example.com/image.png   ",
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

::: details OpenAI's Latest `responses_api`

This model class also supports OpenAI's latest `responses_api`. However, currently only a few providers support this API style. If your model provider supports this API style, you can pass the `use_responses_api` parameter as `True`.
For example, vllm supports `responses_api`, so you can use it like this:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", use_responses_api=True)
response = model.invoke([HumanMessage(content="Hello")])
print(response)
```

:::

::: details Getting Model Profile
Taking OpenRouter as an example, first install the `langchain-model-profiles` library:

```bash
pip install langchain-model-profiles
```

Then you can get the model profiles supported by OpenRouter using the following method:

```bash
langchain-profiles refresh --provider openrouter --data-dir ./data/openrouter
```

This will generate a `_profiles.py` file in the `./data/openrouter` folder of the project root directory, containing a dictionary variable named `_PROFILES`.

Next, you can refer to the following example in your code:

```python
from langchain_dev_utils.chat_models import load_chat_model, register_model_provider

from data.openrouter._profiles import _PROFILES

register_model_provider("openrouter", "openai-compatible", model_profiles=_PROFILES)

model = load_chat_model("openrouter:openai/gpt-5-mini")
print(model.profile)
```

:::

### Compatible with Official Providers

For providers officially supported by LangChain (such as `openai`), you can directly use `load_chat_model` without registration:

```python
model = load_chat_model("openai:gpt-4o-mini")
# Or
model = load_chat_model("gpt-4o-mini", model_provider="openai")
```

<BestPractice>
    <p>For using this module, you can choose based on the following three situations:</p>
    <ol>
        <li>If all model providers you integrate are supported by the official <code>init_chat_model</code>, please use the official function directly for best compatibility and stability.</li>
        <li>If some model providers you integrate are not officially supported, you can use this module's functionality, first use <code>register_model_provider</code> to register the model provider, then use <code>load_chat_model</code> to load the model.</li>
        <li>If the model provider you integrate has no suitable integration yet, but the provider offers an OpenAI-compatible API (such as vLLM, OpenRouter), it is recommended to use this module's functionality, first use <code>register_model_provider</code> to register the model provider (with chat_model as <code>openai-compatible</code>), then use <code>load_chat_model</code> to load the model.</li>
    </ol>
</BestPractice>