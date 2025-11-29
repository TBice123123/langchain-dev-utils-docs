# Chat Model Management

> [!NOTE]  
> **Feature Overview**: Provides a more efficient and convenient way to manage chat models, supporting multiple model providers.  
> **Prerequisites**: Understanding of LangChain [Chat Models](https://docs.langchain.com/oss/python/langchain/models).  
> **Estimated Reading Time**: 15 minutes.

## Overview

LangChain's `init_chat_model` function only supports a limited number of model providers. This library offers a more flexible chat model management solution that supports custom model providers, making it particularly suitable for scenarios where you need to integrate with model services not natively supported (such as vLLM, OpenRouter, etc.).

Using the chat model management feature of this library involves two steps:

1.  **Register a Model Provider**

Use `register_model_provider` to register a model provider. Its parameters are defined as follows:
<Params  
name="provider_name"  
type="string"  
description="The name of the model provider, used as an identifier for subsequent model loading."  
:required="true"  
:default="null"  
/>  
<Params  
name="chat_model"  
type="BaseChatModel | string"  
description="The chat model, which can be a ChatModel class or a string (currently supports 'openai-compatible')."  
:required="true"  
:default="null"  
/>  
<Params  
name="base_url"  
type="string"  
description="The API address of the model provider (optional, valid for both types of chat_model, but primarily used when chat_model is the string 'openai-compatible')."  
:required="false"  
:default="null"  
/>  
<Params  
name="model_profiles"  
type="dict"  
description="Declares the supported features and related parameters for each model offered by the provider (optional, applies to both types of chat_model). The configuration for a specific model will be read based on model_name and written into model.profile (e.g., fields like max_input_tokens, tool_calling, etc.)."  
:required="false"  
:default="null"  
/>
<Params  
name="compatibility_options"  
type="dict"  
description="Compatibility options for the model provider (optional, effective only when chat_model is the string 'openai-compatible'). Used to declare the provider's support for OpenAI-compatible features (like tool_choice strategies, JSON Mode, etc.) to ensure correct functionality."  
:required="false"  
:default="null"  
/>


2.  **Load a Chat Model**

Use the `load_chat_model` function to instantiate a specific model. Its parameters are defined as follows:

<Params  
name="model"  
type="string"  
description="The name of the chat model."  
:required="true"  
:default="null"  
/>  
<Params  
name="model_provider"  
type="string"  
description="The name of the chat model provider."  
:required="false"  
:default="null"  
/>

**Note**: The `load_chat_model` function can also accept any number of keyword arguments, which can be used to pass additional parameters such as `temperature`, `max_tokens`, `extra_body`, etc.



## Registering a Model Provider

To register a chat model provider, call `register_model_provider`. The registration steps vary slightly depending on the situation.

### Case 1: An Existing LangChain Chat Model Class is Available

If the model provider already has a suitable and ready-made LangChain integration (see [Chat Model Integrations](https://docs.langchain.com/oss/python/integrations/chat)), pass the corresponding integrated chat model class as the `chat_model` parameter.

<StepItem step="1" title="Set provider_name"></StepItem>

Provide a `provider_name`, which will be used to reference the provider later in `load_chat_model`. The name can be custom, but **must not contain a colon**.

<StepItem step="2" title="Set chat_model"></StepItem>

Pass a **subclass of `BaseChatModel`**.

```python
from langchain_core.language_models.fake_chat_models import FakeChatModel
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="fake_provider",
    chat_model=FakeChatModel,
)
```
**Note**: `FakeChatModel` is for testing only. In actual use, you must pass a functional `ChatModel` class.

<StepItem step="3" title="Set base_url (Optional)"></StepItem>

- **This parameter is usually not required**, as the API address is already defined within the model class (e.g., in fields like `api_base` or `base_url`);
- **Only pass `base_url` if you need to override the default address**;
- The override mechanism only works for attributes in the model class named `api_base` or `base_url` (including aliases).

<StepItem step="4" title="Set model_profiles (Optional)"></StepItem>

If your LangChain integrated chat model class fully supports the `profile` parameter (meaning you can directly access model-related properties like `max_input_tokens`, `tool_calling`, etc., via `model.profile`), then you do not need to set `model_profiles` additionally.

If `model.profile` returns an empty dictionary `{}`, it indicates that the LangChain chat model class may not support the `profile` parameter yet. In this case, you can manually provide `model_profiles`.

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

**Tip**: It is recommended to use the `langchain-model-profiles` library to get the profiles for your model provider.

### Case 2: No LangChain Chat Model Class, but the Provider Supports an OpenAI-Compatible API

Many model providers support services with an **OpenAI-compatible API**, such as [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://www.together.ai/), etc. When the model provider you are integrating with does not have a suitable LangChain chat model class but does offer an OpenAI-compatible API, you can consider this case.

This library will use the built-in `BaseChatOpenAICompatible` class to construct the corresponding chat model class for a specific provider. This class inherits from `langchain-openai`'s `BaseChatOpenAI` and enhances the following capabilities:

1.  **Support for more `reasoning_content` formats**: Can parse reasoning content (`reasoning_content`) output from non-OpenAI providers.
2.  **Structured output defaults to `function_calling`**: This has broader compatibility than `json_schema`.
3.  **Fine-tune differences with `compatibility_options`**: Resolves support differences for parameters like `tool_choice` and `response_format`.

<StepItem step="1" title="Set provider_name"></StepItem>

Provide a custom provider name, **which must not contain a colon `:`**.

<StepItem step="2" title="Set chat_model"></StepItem>

You must pass the string `"openai-compatible"`. This is the only supported string value at present.

<StepItem step="3" title="Set base_url (Required)"></StepItem>

- **You must provide an API address**, otherwise the chat model class cannot be initialized;
- It can be provided in either of the following ways:
  - **Explicitly as a parameter**:
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible",
        base_url="http://localhost:8000/v1"
    )
    ```
  - **Via environment variables** (recommended for configuration management):
    ```bash
    export VLLM_API_BASE=http://localhost:8000/v1
    ```
    You can then omit `base_url` in the code:
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible"
        # Automatically reads VLLM_API_BASE
    )
    ```
::: info Tip
In this case, the naming convention for the environment variable of the provider's API endpoint is `${PROVIDER_NAME}_API_BASE` (all caps, underscore-separated). The corresponding API_KEY environment variable follows the convention `${PROVIDER_NAME}_API_KEY` (all caps, underscore-separated).
:::
::: tip Additional Info  
vLLM is a popular large model inference framework that can deploy large models with an OpenAI-compatible API. For example, deploying Qwen3-4B:
```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```
The service address is `http://localhost:8000/v1`.  
:::
<StepItem step="4" title="Set model_profiles (Optional)"></StepItem>

In this case, if `model_profiles` is not manually set, `model.profile` will return an empty dictionary `{}`. Therefore, if you need to obtain configuration information for a specific model via `model.profile`, you must first explicitly set `model_profiles`.

<StepItem step="5" title="Set compatibility_options (Optional)"></StepItem>

This is only effective in this case. It is used to declare the provider's support for certain **OpenAI API** features to improve compatibility and stability.

- `supported_tool_choice`: List of supported `tool_choice` strategies.
- `support_json_mode`: Whether it supports `response_format={"type": "json_object"}`.
- `keep_reasoning_content`: Whether to retain `reasoning_content` in message history.
- `include_usage`: Whether to include `usage` information in the last streaming response chunk.

::: details supported_tool_choice

Common `tool_choice` values:
- `"auto"`: The model autonomously decides whether to call a tool.
- `"none"`: Prohibits tool calling.
- `"required"`: Forces the calling of at least one tool.
- A specific tool (in an OpenAI-compatible API, this is `{"type": "function", "function": {"name": "xxx"}}`).

Different providers support different ranges. To avoid errors, this library defaults `supported_tool_choice` to `["auto"]`. With this strategy, you can only pass `tool_choice` as `auto`; other strategies will be filtered out.

To enable other strategies, you must explicitly declare the supported items. The configuration value is a list of strings, with optional values:
- `"auto"`, `"none"`, `"required"`: Correspond to standard strategies.
- `"specific"`: A special identifier for this library, indicating support for specifying a particular tool.

For example, vLLM supports all strategies:
```python
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    compatibility_options={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```
::: info Tip
In scenarios where structured output is implemented using the `function calling` method, the model might fail to call the corresponding structured tool due to its own issues, resulting in an output of `None`. Therefore, if your model provider supports specifying a specific tool to be called via the `tool_choice` parameter, you can explicitly set this parameter during registration to ensure the stability and reliability of structured output.
:::

::: details support_json_mode

If the provider supports `json_mode` (specifically `response_format={"type": "json_object"}` in an OpenAI-compatible API), you can set this to `True`. Then, when using the `with_structured_output` method, you need to explicitly specify `method="json_mode"`.

:::

::: details keep_reasoning_content

Defaults to `False` (reasoning content is not retained in message history). When set to `True`, the message history will include the `reasoning_content` field.

For example:

- When set to `False`, the final messages passed to the model are:
```json
[
  { "role": "user", "content": "你好" },
  { "role": "assistant", "content": "你好！有什么我可以帮你的吗？" }
]
```
- When set to `True`, the final messages passed to the model are:
```json
[
  { "role": "user", "content": "你好" },
  {
    "role": "assistant",
    "content": "你好！有什么我可以帮你的吗？",
    "reasoning_content": "用户说了'你好'，这是打招呼，我应该礼貌回应并主动询问需求。"
  }
]
```
**Note**: Do not set this parameter to `True` unless explicitly recommended by the provider's documentation. Some providers (like DeepSeek) prohibit passing reasoning content, and it will also increase token consumption.
:::

::: details include_usage

`include_usage` is a parameter in the OpenAI-compatible API that controls whether to append a message containing token usage information (such as `prompt_tokens` and `completion_tokens`) at the end of a streaming response. Since standard streaming responses do not return usage information by default, enabling this option allows the client to directly obtain complete token consumption data, which is useful for billing, monitoring, or logging.

It is typically enabled via `stream_options={"include_usage": true}`. Considering that some model providers do not support this parameter, this library makes it a compatibility option with a default value of `True`, as most providers support it. If a provider does not, you can explicitly set it to `False`.
:::

:::info Note  
Different models from the same provider may also have varying levels of support for parameters like `tool_choice` and `json_mode`. To address this, this library treats the four **compatibility options**—`supported_tool_choice`, `support_json_mode`, `keep_reasoning_content`, and `include_usage`—as instance attributes of the chat model class. When registering a model provider, you can pass these parameters directly as **global default values**, summarizing the support for the majority of models offered by that provider. Later, when loading a specific model, if its support level differs from the default, you can simply pass the corresponding parameter in `load_chat_model` to **dynamically override** the global configuration, achieving fine-grained adaptation.

Example: Most models from a provider support the `tool_choice` strategies `["auto", "none", "required"]`, but a specific model only supports `["auto"]`. Set the global default during registration:

```python
register_model_provider(
    ...,
    compatibility_options={"supported_tool_choice": ["auto", "none", "required"]},
)
```

And then override the configuration when loading that special model:

```python
model = load_chat_model(
    "...",  # model provider and model name
    supported_tool_choice=["auto"]  # Override default value
)
```

This approach allows developers to configure flexibly based on the actual support of different models.
:::

## Batch Registration

If you need to register multiple providers, you can use `batch_register_model_provider` to avoid repetitive calls.

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

::: warning Warning  
Both registration functions are implemented based on a global dictionary. To avoid multithreading issues, **all registrations must be completed during the application startup phase**. Dynamic registration at runtime is prohibited.  
:::

## Loading a Chat Model

Use the `load_chat_model` function to load a chat model (i.e., initialize a chat model instance). The parameter rules are as follows:

- If `model_provider` is not passed, `model` must be in the format `provider_name:model_name`.
- If `model_provider` is passed, `model` must be just the `model_name`.

**Example**:
```python
# Method 1
model = load_chat_model("vllm:qwen3-4b")

# Method 2
model = load_chat_model("qwen3-4b", model_provider="vllm")
```

Although `vLLM` does not strictly require an API Key, LangChain still mandates one. You can set it in an environment variable:
```bash
export VLLM_API_KEY=vllm
```

### Model Methods and Parameters
For **Case 1**, all its methods and parameters are consistent with the corresponding chat model class.  
For **Case 2**, the model's methods and parameters are as follows:
- Supports methods like `invoke`, `ainvoke`, `stream`, `astream`, etc.
- Supports the `bind_tools` method for tool calling.
- Supports the `with_structured_output` method for structured output.
- Supports passing parameters from `BaseChatOpenAI`, such as `temperature`, `top_p`, `max_tokens`, etc.
- Supports passing multimodal data.
- Supports OpenAI's latest `responses API`.
- Supports the `model.profile` parameter to get the model's profile.

:::details Basic Invocation

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
And `astream` for asynchronous streaming:
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
async for chunk in model.astream([HumanMessage("Hello")]):
    print(chunk)
```
:::

:::details Tool Calling

If the model itself supports tool calling, you can directly use the `bind_tools` method:
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

:::details Structured Output

Supports structured output, defaulting to the `function_calling` method, which requires the model to support tool calling:
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

model = load_chat_model("vllm:qwen3-4b").with_structured_output(User)
response = model.invoke([HumanMessage("Hello, my name is Zhang San and I am 25 years old")])
print(response)
```
Additionally, if your model provider supports `json_mode`, you can set `support_json_mode` to `True` in the `compatibility_options` when registering the provider. Then, when calling `with_structured_output`, specify the `method` parameter as `"json_mode"` to enable this mode. Finally, be sure to explicitly guide the model in the prompt to output structured data according to the specified JSON Schema.
:::

:::details Passing Model Parameters

Furthermore, since this class inherits from `BaseChatOpenAI`, it supports passing model parameters from it, such as `temperature`, `extra_body`, etc.:
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here to disable thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```
:::

:::details Passing Multimodal Data

Supports passing multimodal data. You can use the OpenAI-compatible multimodal data format or directly use `content_block` from `langchain`. For example:
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

This model class also supports OpenAI's latest `responses_api`. However, only a few providers currently support this API style. If your model provider supports this API style, you can pass `use_responses_api=True`.
For example, if vLLM supports `responses_api`, you can use it like this:

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
Then you can use the following command to get the model profiles supported by OpenRouter:

```bash
langchain-profiles refresh --provider openrouter --data-dir ./data/openrouter
```
This will generate a `_profiles.py` file in the `./data/openrouter` folder in your project's root directory. This file contains a dictionary variable named `_PROFILES`.

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

For providers already officially supported by LangChain (like `openai`), you can use `load_chat_model` directly without registration:

```python
model = load_chat_model("openai:gpt-4o-mini")
# or
model = load_chat_model("gpt-4o-mini", model_provider="openai")
```

<BestPractice>
    <p>For using this module, you can choose based on the following three scenarios:</p>
    <ol>
        <li>If all model providers you are integrating are supported by the official <code>init_chat_model</code>, please use the official function directly for the best compatibility and stability.</li>
        <li>If some of your model providers are not officially supported, you can use this module's features. First, use <code>register_model_provider</code> to register the providers, then use <code>load_chat_model</code> to load the models.</li>
        <li>If your model provider does not have a suitable integration but offers an OpenAI-compatible API (like vLLM, OpenRouter), it is recommended to use this module's features. First, use <code>register_model_provider</code> to register the provider (passing <code>openai-compatible</code> for `chat_model`), then use <code>load_chat_model</code> to load the model.</li>
    </ol>
</BestPractice>