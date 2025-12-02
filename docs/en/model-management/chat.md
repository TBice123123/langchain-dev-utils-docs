# Chat Model Management

> [!NOTE]  
> **Function Overview**: Provides more efficient and convenient chat model management, supporting multiple model providers.  
> **Prerequisites**: Understanding of LangChain [Chat Models](https://docs.langchain.com/oss/python/langchain/models).  
> **Estimated Reading Time**: 15 minutes.

## Overview

LangChain's `init_chat_model` function only supports a limited number of model providers. This library offers a more flexible chat model management solution that supports custom model providers, especially suitable for scenarios where you need to integrate model services not natively supported (such as vLLM, OpenRouter, etc.).

Using the chat model management feature of this library requires two steps:

1.  **Register Model Provider**

    Use `register_model_provider` to register a model provider. Its parameters are defined as follows:
    <Params  
    name="provider_name"  
    type="string"  
    description="Name of the model provider, used as an identifier for subsequent model loading"  
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
    description="Declare the features and related parameters of each model provided by this model provider (optional, applicable to both types of chat_model). Will eventually read the corresponding configuration based on model_name and write it to model.profile (e.g., containing fields like max_input_tokens, tool_calling, etc.)."  
    :required="false"  
    :default="null"  
    />
    <Params  
    name="compatibility_options"  
    type="dict"  
    description="Compatibility options for the model provider (optional, effective when chat_model is a string and value is 'openai-compatible'), used to declare the provider's support for OpenAI-compatible features (such as tool_choice strategies, JSON Mode, etc.) to ensure proper function adaptation."  
    :required="false"  
    :default="null"  
    />

2.  **Load Chat Model**

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

To register a chat model provider, you need to call `register_model_provider`. For different situations, the registration steps vary slightly.

### Case 1: Existing LangChain Chat Model Class

If the model provider already has a ready and suitable LangChain integration (see [Chat Model Class Integration](https://docs.langchain.com/oss/python/integrations/chat)), please pass the corresponding integrated chat model class as the chat_model parameter.

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

**Note**: `FakeChatModel` is only for testing. In actual use, you must pass in a `ChatModel` class with real functionality.

<StepItem step="3" title="Set base_url (optional)"></StepItem>

-   **This parameter usually does not need to be set**, as the API address is already defined within the model class (such as `api_base` or `base_url` fields);
-   **Only pass in `base_url` when you need to override the default address**;
-   The override mechanism only works for attributes with field names `api_base` or `base_url` (including aliases) in the model class.

<StepItem step="4" title="Set model_profiles (optional)"></StepItem>

If your LangChain integrated chat model class already fully supports the `profile` parameter (i.e., you can directly access model-related properties through `model.profile`, such as `max_input_tokens`, `tool_calling`, etc.), then you don't need to set `model_profiles` additionally.

If accessing through `model.profile` returns an empty dictionary `{}`, it indicates that the LangChain chat model class may not currently support the `profile` parameter. In this case, you can manually provide `model_profiles`.

`model_profiles` is a dictionary where each key is a model name, and the value is the profile configuration for the corresponding model:

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
    #可以有任意多个模型配置
}
```

**Tip**: It's recommended to use the `langchain-model-profiles` library to get the profiles for the model provider you're using.

### Case 2: No LangChain Chat Model Class, but Model Provider Supports OpenAI-Compatible API

Many model providers support **OpenAI-Compatible API** services, such as: [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://www.together.ai/), etc. When the model provider you're integrating doesn't have a suitable LangChain chat model class, but the provider supports an OpenAI-compatible API, you can consider using this case.

This library will build a corresponding chat model class for a specific provider using the built-in `BaseChatOpenAICompatible` class based on user input. This class inherits from `langchain-openai`'s `BaseChatOpenAI` and enhances the following capabilities:

-   **Support for more reasoning_content formats**: Can parse reasoning content output from non-OpenAI providers.  
-   **Dynamic adaptation and selection of the most suitable structured output method**: By default, it can automatically select the optimal structured output method (`function_calling` or `json_schema`) based on the actual support of the model provider.  
-   **Fine-grained adaptation of differences through compatibility_options**: By configuring provider compatibility options, resolve support differences for parameters like `tool_choice`, `response_format`, etc.

**Note**: When using this case, you must install the standard version of the `langchain-dev-utils` library. For details, refer to [Installation](../installation.md).

<StepItem step="1" title="Set provider_name"></StepItem>

Pass in a custom provider name, **must not contain a colon `:`**.

<StepItem step="2" title="Set chat_model"></StepItem>

You must pass in the string `"openai-compatible"`. This is the only supported string value at present.

<StepItem step="3" title="Set base_url (required)"></StepItem>

-   **You must provide an API address**, otherwise the chat model class cannot be initialized;
-   It can be provided in either of the following ways:
    -   **Explicit parameter passing**:
        ```python
        register_model_provider(
            provider_name="vllm",
            chat_model="openai-compatible",
            base_url="http://localhost:8000/v1"
        )
        ```
    -   **Through environment variables** (recommended for configuration management):
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
        In this case, the naming rule for environment variables of the model provider's API endpoint is `${PROVIDER_NAME}_API_BASE` (all uppercase, separated by underscores). The corresponding naming rule for API_KEY environment variables is `${PROVIDER_NAME}_API_KEY` (all uppercase, separated by underscores).
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

In this case, if `model_profiles` is not manually set, then `model.profile` will return an empty dictionary `{}`. Therefore, if you need to obtain configuration information for a specific model through `model.profile`, you must first explicitly set `model_profiles`.

<StepItem step="5" title="Set compatibility_options (optional)"></StepItem>

Only effective in this case. Used to declare the provider's support for some features of the **OpenAI API** to improve compatibility and stability.

-   `supported_tool_choice`: List of supported `tool_choice` strategies, default is `["auto"]`;
-   `supported_response_format`: List of supported `response_format` formats (`json_schema`, `json_object`), default is `[]`;
-   `reasoning_content_keep_type`: How to retain the `reasoning_content` field in historical messages (messages) passed to the model. Optional values are `discard`, `temp`, `retain`. Default is `discard`.
-   `include_usage`: Whether to include `usage` information in the last streaming response, default is `True`.

::: details supported_tool_choice

Common values for `tool_choice`:

-   `"auto"`: Model decides whether to call tools;
-   `"none"`: Prohibit tool calling;
-   `"required"`: Force calling at least one tool;
-   Specify a specific tool (in OpenAI-compatible API, specifically `{"type": "function", "function": {"name": "xxx"}}`).

Different providers support different ranges. To avoid errors, this library's default `supported_tool_choice` is `["auto"]`, which means only `tool_choice` of `auto` can be passed, other strategies will be filtered out.

If you need to enable it, you must explicitly declare the supported items. The configuration value is a string list, with optional values:

-   `"auto"`, `"none"`, `"required"`: Corresponding to standard strategies;
-   `"specific"`: A special identifier in this library, indicating support for specifying specific tools.

For example, vLLM supports all strategies:

```python
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    compatibility_options={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```

::: info Tip
In scenarios where structured output is implemented using the `function calling` method, the model may not call the corresponding structured tool due to its own issues, resulting in the output being `None`. Therefore, if your model provider supports specifying specific tools through the `tool_choice` parameter, you can explicitly set this parameter when registering (i.e., `compatibility_options={"supported_tool_choice": [...,"specific"]}`) to ensure the stability and reliability of structured output.
:::

::: details supported_response_format

Currently, there are three common methods for structured output.

-   `function_calling`: Generate structured output by calling a tool that conforms to a specified schema.
-   `json_schema`: A specialized feature provided by the model provider for generating structured output. In OpenAI-compatible APIs, specifically `response_format={"type": "json_schema", "json_schema": {...}}`.
-   `json_mode`: A feature provided by some providers before they introduced `json_schema`, which can generate valid JSON, but the schema must be described in the prompt. In OpenAI-compatible APIs, specifically `response_format={"type": "json_object"}`).

Among these, `json_schema` is supported by only a few OpenAI-compatible API providers (such as `OpenRouter`, `TogetherAI`); `json_mode` has higher support and is compatible with most providers; while `function_calling` is the most universal, as long as the model supports tool calling, it can be used.

This parameter is used to declare the model provider's support for `response_format`. By default, it is `[]`, indicating that the model provider supports neither `json_mode` nor `json_schema`. In this case, the structured output implementation method will be set to `function_calling` by default. If the model provider supports the above `json_mode` or `json_schema` (especially `json_schema`), you can explicitly set this parameter when registering (i.e., `compatibility_options={"supported_response_format": ["json_mode", "json_schema"]}`) to enable the corresponding structured output method.
:::

::: details reasoning_content_keep_type

Supports the following values:
-   `discard`: Do not retain reasoning content in historical messages (default);
-   `temp`: Only retain the `reasoning_content` field of the current conversation;
-   `retain`: Retain the `reasoning_content` field of all conversations.

For example:
Assume the user first asks "What's the weather in New York today", then asks "What's the weather in London today"; currently, the conversation has progressed to the second question, and is about to make the final model call.

-   When the value is `discard`

    When the value is `discard`, the final messages passed to the model will not have any `reasoning_content` fields. The final messages received by the model will be:

    ```python
    messages = [
        {"content": "Check the weather in New York today", "role": "user"},
        {"content": "", "role": "assistant", "tool_calls": [...]},
        {"content": "2025-12-01", "role": "tool", "tool_call_id": "..."},
        {"content": "", "role": "assistant", "tool_calls": [...]},
        {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
        {"content": "2025-12-01, New York is cloudy, 7~13°C.", "role": "assistant"},
        {"content": "Check the weather in London today", "role": "user"},
        {"content": "", "role": "assistant", "tool_calls": [...]},
        {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    ]
    ```
-   When the value is `temp`

    When the value is `temp`, only the `reasoning_content` field of the current conversation is retained. The final messages received by the model will be:
    ```python
    messages = [
        {"content": "Check the weather in New York today", "role": "user"},
        {"content": "", "role": "assistant", "tool_calls": [...]},
        {"content": "2025-12-01", "role": "tool", "tool_call_id": "..."},
        {"content": "", "role": "assistant", "tool_calls": [...]},
        {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
        {"content": "2025-12-01, New York is cloudy, 7~13°C.", "role": "assistant"},
        {"content": "Check the weather in London today", "role": "user"},
        {
            "content": "",
            "reasoning_content": "Check London's weather. First get the date, based on historical context, the date is known, directly call the weather tool.",  # Only retain reasoning_content for this round of conversation
            "role": "assistant",
            "tool_calls": [...],
        },
        {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    ]
    ```
-   When the value is `retain`

    When the value is `retain`, the `reasoning_content` field of all conversations is retained. The final messages received by the model will be:
    ```python
    messages = [
        {"content": "Check the weather in New York today", "role": "user"},
        {
            "content": "",
            "reasoning_content": "Need to get the date first, then check New York's weather.",  # Retain reasoning_content
            "role": "assistant",
            "tool_calls": [...],
        },
        {"content": "2025-12-01", "role": "tool", "tool_call_id": "..."},
        {
            "content": "",
            "reasoning_content": "Date obtained, checking New York's weather.",  # Retain reasoning_content
            "role": "assistant",
            "tool_calls": [...],
        },
        {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
        {
            "content": "2025-12-01, New York is cloudy, 7~13°C.",
            "reasoning_content": "Return New York weather result.",  # Retain reasoning_content
            "role": "assistant",
        },
        {"content": "Check the weather in London today", "role": "user"},
        {
            "content": "",
            "reasoning_content": "Check London's weather. First get the date, based on historical context, the date is known, directly call the weather tool.",  # Retain reasoning_content
            "role": "assistant",
            "tool_calls": [...],
        },
        {"content": "Cloudy 7~13°C", "role": "tool", "tool_call_id": "..."},
    ]
    ```

**Note**: If the current round of conversation does not involve tool calling, the effect of `temp` is the same as `discard`.
:::

::: details include_usage

`include_usage` is a parameter in the OpenAI-compatible API used to control whether to append a message containing token usage information (such as `prompt_tokens` and `completion_tokens`) at the end of the streaming response. Since standard streaming responses do not return usage information by default, enabling this option allows clients to directly obtain complete token consumption data, facilitating billing, monitoring, or logging.

Usually enabled through `stream_options={"include_usage": true}`. Considering that some model providers do not support this parameter, this library sets it as a compatibility option with a default value of `True`, as most model providers support this parameter. If not supported, it can be explicitly set to `False`.
:::

:::info Note  
Different models from the same provider may also have differences in support for parameters like `tool_choice`, `response_format`, etc. To address this, this library treats the four **compatibility options** `supported_tool_choice`, `supported_response_format`, `reasoning_content_keep_type`, and `include_usage` as instance attributes of the chat model class. When registering a model provider, you can directly pass these parameters as **global default values**, summarizing the support situation for most models provided by that provider; when loading a specific model later, if a model's support situation differs from the default values, you only need to explicitly pass the corresponding parameters in `load_chat_model` to **dynamically override** the global configuration, achieving fine-grained adaptation.

Example: Most models of a provider support three `tool_choice` strategies: `["auto", "none", "required"]`, but individual models only support `["auto"]`. Set the global default value when registering:

```python
register_model_provider(
    ...,
    compatibility_options={"supported_tool_choice": ["auto", "none", "required"]},
)
```

And when loading that special model, explicitly override the configuration:

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

-   If `model_provider` is not passed, then `model` must be in the format `provider_name:model_name`;
-   If `model_provider` is passed, then `model` must be only `model_name`.

**Example**:

```python
# Method 1
model = load_chat_model("vllm:qwen3-4b")

# Method 2
model = load_chat_model("qwen3-4b", model_provider="vllm")
```

Although vLLM doesn't strictly require an API Key, LangChain still requires it to be set. You can set it in an environment variable:

```bash
export VLLM_API_KEY=vllm
```

### Model Methods and Parameters

For **Case 1**, all its methods and parameters are consistent with the corresponding chat model class.  
For **Case 2**, the model's methods and parameters are as follows:

-   Supports `invoke`, `ainvoke`, `stream`, `astream` and other methods.
-   Supports the `bind_tools` method for tool calling.
-   Supports the `with_structured_output` method for structured output.
-   Supports passing parameters of `BaseChatOpenAI`, such as `temperature`, `top_p`, `max_tokens`, etc.
-   Supports passing multimodal data
-   Supports OpenAI's latest `responses api`
-   Supports the `model.profile` parameter to get the model's profile.

:::details Normal Call

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

:::details Streaming Output

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

Supports structured output, with the default `method` value being `auto`, which will automatically select the appropriate structured output method based on the model provider's `supported_response_format` parameter. Specifically, if the value contains `json_schema`, the `json_schema` method will be selected; otherwise, the `function_calling` method will be selected.

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
Compared to tool calling, `json_schema` can 100% guarantee that the output conforms to the JSON Schema specification, avoiding parameter errors that might occur with tool calling. Therefore, if the model provider supports `json_schema`, this method will be adopted by default. When the model provider does not support it, it will fall back to the `function_calling` method.
For `json_mode`, although it has higher support, since it must guide the model to output a JSON string with a specified Schema in the prompt, it is more troublesome to use, so it is not adopted by default. If you want to use it, you can explicitly provide `method="json_mode"` (provided that when registering or instantiating, ensure that `supported_response_format` contains `json_mode`).
:::

:::details Passing Model Parameters

In addition, since this class inherits from `BaseChatOpenAI`, it supports passing model parameters of `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b",extra_body={"chat_template_kwargs": {"enable_thinking": False}}) #Use extra_body to pass additional parameters, here to turn off thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::

:::details Passing Multimodal Data

Supports passing multimodal data, you can use the OpenAI-compatible multimodal data format or directly use `content_block` in `langchain`. For example:

```python
from langchain_dev_utils.chat_models import register_model_provider, load_chat_model
from langchain_core.messages import HumanMessage


register_model_provider(
    provider_name="openrouter",
    chat_model="openai-compatible",
    base_url="https://openrouter.ai/api/v1  ",
)

messages = [
    HumanMessage(
        content_blocks=[
            {
                "type": "image",
                "url": "https://example.com/image.png  ",
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
Taking OpenRouter as an example, you first need to install the `langchain-model-profiles` library:

```bash
pip install langchain-model-profiles
```

Then you can use the following method to get the model profiles supported by OpenRouter:

```bash
langchain-profiles refresh --provider openrouter --data-dir ./data/openrouter
```

This will generate a `_profiles.py` file in the `./data/openrouter` folder in the project root, which contains a dictionary variable named `_PROFILES`.

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
# 或
model = load_chat_model("gpt-4o-mini", model_provider="openai")
```

<BestPractice>
    <p>For the use of this module, you can choose based on the following three situations:</p>
    <ol>
        <li>If all model providers you're integrating are supported by the official `init_chat_model`, please directly use the official function to get the best compatibility and stability.</li>
        <li>If some of the model providers you're integrating are not officially supported, you can use the features of this module, first use `register_model_provider` to register model providers, then use `load_chat_model` to load models.</li>
        <li>If the model providers you're integrating do not have suitable integrations, but the providers provide OpenAI-compatible APIs (such as vLLM, OpenRouter), it is recommended to use the features of this module, first use `register_model_provider` to register model providers (pass `openai-compatible` for chat_model), then use `load_chat_model` to load models.</li>
    </ol>
</BestPractice>