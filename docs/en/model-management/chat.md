# Chat Model Management

> [!NOTE]  
> **Feature Overview**: Provides a more efficient and convenient chat model management system, supporting multiple model providers.  
> **Prerequisites**: Understanding of LangChain [Chat Models](https://docs.langchain.com/oss/python/langchain/models).  
> **Estimated Reading Time**: 15 minutes.

## Overview

LangChain's `init_chat_model` function supports a limited number of model providers. This library offers a more flexible chat model management solution that supports custom model providers, especially useful for scenarios requiring integration with model services not natively supported (such as vLLM, OpenRouter, etc.).

Using the chat model management feature of this library involves two steps:

1.  **Register a Model Provider**

Use `register_model_provider` to register a model provider. Its parameters are defined as follows:
<Params
name="provider_name"
type="string"
description="Name of the chat model provider"
:required="true"
:default="null"
/>
<Params
name="chat_model"
type="BaseChatModel | string"
description="The chat model"
:required="true"
:default="null"
/>
<Params
name="base_url"
type="string"
description="Base URL for the chat model"
:required="false"
:default="null"
/>
<Params
name="provider_config"
type="dict"
description="Configuration for the chat model provider"
:required="false"
:default="null"
/>

2.  **Load a Chat Model**

Use `load_chat_model` to instantiate a specific model. Its parameters are defined as follows:

<Params
name="model"
type="string"
description="Name of the chat model"
:required="true"
:default="null"
/>
<Params
name="model_provider"
type="string"
description="Name of the chat model provider"
:required="false"
:default="null"
/>

**Note**: The `load_chat_model` function can also accept any number of keyword arguments, which can be used to pass additional parameters such as `temperature`, `max_tokens`, `extra_body`, etc.

## Registering a Model Provider

To register a chat model provider, call `register_model_provider`. The registration process varies slightly depending on the situation.

### Case 1: An Existing LangChain Chat Model Class is Available

If the model provider already has a suitable and existing LangChain integration (see [Chat Model Integrations](https://docs.langchain.com/oss/python/integrations/chat) for details), pass the corresponding integrated chat model class as the `chat_model` parameter.

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
**Note**: `FakeChatModel` is for testing purposes only. In actual use, you must pass a functional `ChatModel` class.

<StepItem step="3" title="Set base_url (Optional)"></StepItem>

- **This parameter is usually not required**, as the model class already defines the API address internally (e.g., in `api_base` or `base_url` fields).
- **Only pass `base_url` if you need to override the default address**.
- The override mechanism only applies to attributes with the field name `api_base` or `base_url` (including aliases) within the model class.

### Case 2: No LangChain Chat Model Class, but the Provider Supports an OpenAI-Compatible API

Many model providers support services with an **OpenAI-compatible API**, such as [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), and [Together AI](https://www.together.ai/). If the model provider you are integrating does not have a suitable LangChain chat model class but supports an OpenAI-compatible API, you can consider this approach.

The library will use the built-in `BaseChatOpenAICompatible` class to construct a chat model class specific to the provider. This class inherits from `langchain-openai`'s `BaseChatOpenAI` and enhances the following capabilities:

1.  **Support for more `reasoning_content` formats**: Can parse reasoning content (`reasoning_content`) output from non-OpenAI providers.
2.  **Structured output defaults to `function_calling`**: Offers broader compatibility than `json_schema`.
3.  **Fine-tune differences via `provider_config`**: Resolves support differences for parameters like `tool_choice` and `response_format`.

<StepItem step="1" title="Set provider_name"></StepItem>

Provide a custom provider name (e.g., `"vllm"` or `"openrouter"`). **Must not contain a colon `:`**.

<StepItem step="2" title="Set chat_model"></StepItem>

You must pass the string `"openai-compatible"`. This is the only supported string value at present.

<StepItem step="3" title="Set base_url (Required)"></StepItem>

- **You must provide the API address**, otherwise the chat model class cannot be initialized.
- It can be provided in one of the following ways:
  - **Explicitly as a parameter**:
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible",
        base_url="http://localhost:8000/v1"
    )
    ```
  - **Via an environment variable** (recommended for configuration management):
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
In this scenario, the naming convention for the environment variable of the model provider's API endpoint is `${PROVIDER_NAME}_API_BASE` (all caps, underscore-separated). The corresponding API_KEY environment variable follows the convention `${PROVIDER_NAME}_API_KEY` (all caps, underscore-separated).
:::
::: tip Supplement  
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

<StepItem step="4" title="Set provider_config (Optional)"></StepItem>
This is only effective in this case and is used to declare the provider's support for certain parameters. The following configuration options are supported:

- `supported_tool_choice`: List of supported `tool_choice` strategies.
- `support_json_mode`: Whether `response_format={"type": "json_object"}` is supported.
- `keep_reasoning_content`: Whether to retain `reasoning_content` in message history.

**1. supported_tool_choice**

Common `tool_choice` values:
- `"auto"`: The model decides autonomously whether to call a tool.
- `"none"`: Prohibits tool calls.
- `"required"`: Forces the call of at least one tool.
- A specific tool (in OpenAI-compatible APIs, this is `{"type": "function", "function": {"name": "xxx"}}`).

Different providers support different ranges. To avoid errors, this library defaults `supported_tool_choice` to `["auto"]`. With this strategy, only `tool_choice="auto"` can be passed; other strategies will be filtered out.

If you need to enable more, you must explicitly declare the supported items. The configuration value is a list of strings with optional values:
- `"auto"`, `"none"`, `"required"`: Correspond to standard strategies.
- `"specific"`: A unique identifier for this library, indicating support for specifying a particular tool.

For example, vLLM supports all strategies:
```python
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    provider_config={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```
::: info Tip
In structured output scenarios using the function calling approach, the model may fail to invoke the appropriate structured tool due to its own internal behavior, resulting in an output of `None`. Therefore, if your model provider supports specifying a particular tool via the `tool_choice` parameter, it is recommended to explicitly set this parameter during registration to ensure the stability and reliability of structured outputs.
:::

**2. support_json_mode**

If the provider supports `json_mode` (in OpenAI-compatible APIs, specifically `response_format={"type": "json_object"}`), you can set this to `True`. When using the `with_structured_output` method, you must explicitly specify `method="json_mode"`.

**3. keep_reasoning_content**

Defaults to `False` (reasoning content is not retained in message history). When set to `True`, the message history will include the `reasoning_content` field.

For example:

- When set to `False`, the final `messages` value passed to the model is:
```json
[
  { "role": "user", "content": "Hello" },
  { "role": "assistant", "content": "Hello! How can I help you today?" }
]
```
- When set to `True`, the final `messages` value passed to the model is:
```json
[
  { "role": "user", "content": "Hello" },
  {
    "role": "assistant",
    "content": "Hello! How can I help you today?",
    "reasoning_content": "The user said 'Hello', which is a greeting. I should respond politely and proactively ask how I can assist."
  }
]
```
**Note**: Do not set this parameter to `True` unless the provider's documentation explicitly recommends it. Some providers (like DeepSeek) prohibit passing reasoning content, and it also increases token consumption.

:::info Note  
Different models from the same provider may have varying support for parameters like `tool_choice` and `json_mode`. This library treats the three parameters (`supported_tool_choice`, `support_json_mode`, `keep_reasoning_content`) as instance attributes of the chat model class. When registering a provider, developers can pre-pass these three parameters as **default values**, representing the support situation for most models of that provider. Subsequently, when loading a specific model instance, if special support cases are encountered, the default values can be **overridden** by passing explicit parameters.

For example, assume most models from a certain provider support the `tool_choice` strategies `["auto", "none", "required"]`, but one specific model only supports `["auto"]`. In this case, you can set the default value when registering the provider:

```python
register_model_provider(
    ...,
    provider_config={"supported_tool_choice": ["auto", "none", "required"]},
)
```

And when loading that special model, explicitly override the configuration:

```python
model = load_chat_model(
    "...",  # provider and model name
    supported_tool_choice=["auto"]  # Override default
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
Both registration functions are implemented based on a global dictionary. To avoid multi-threading issues, **all registrations must be completed during the application startup phase**. Dynamic registration at runtime is strictly prohibited.  
:::

## Loading a Chat Model

Use the `load_chat_model` function to load a chat model (instantiate a chat model instance). The parameter rules are as follows:

- If `model_provider` is not passed, `model` must be in the format `provider_name:model_name`.
- If `model_provider` is passed, `model` must be only `model_name`.

**Example**:
```python
# Method 1
model = load_chat_model("vllm:qwen3-4b")

# Method 2
model = load_chat_model("qwen3-4b", model_provider="vllm")
```

Although vLLM does not strictly require an API Key, LangChain still mandates one. You can set it in an environment variable:
```bash
export VLLM_API_KEY=vllm
```

### Model Methods and Parameters
For **Case 1**, all its methods and parameters are consistent with the corresponding chat model class.  
For **Case 2**, the model's methods and parameters are as follows:
- Supports methods like `invoke`, `ainvoke`, `stream`, `astream`.
- Supports the `bind_tools` method for tool calling.
- Supports the `with_structured_output` method for structured output.
- Accepts parameters from `BaseChatOpenAI`, such as `temperature`, `top_p`, `max_tokens`, etc.
- Supports passing multimodal data.
- Supports OpenAI's latest `responses api`.

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

::: details Streaming Output

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

::: details Tool Calling

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

::: details Structured Output

Supports structured output, defaulting to the `function_calling` method, which requires the model to support tool calling:
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

model = load_chat_model("vllm:qwen3-4b").with_structured_output(User)
response = model.invoke([HumanMessage("Hello, my name is Zhang San and I am 25 years old.")])
print(response)
```
Additionally, if your model provider supports `json_mode`, you can set `support_json_mode` to `True` in the `provider_config` parameter when registering the provider. Then, when calling `with_structured_output`, specify the `method` parameter as `"json_mode"` to enable this mode. Finally, please explicitly guide the model in the prompt to output structured data according to the specified JSON Schema format.
:::

::: details Passing Model Parameters

Furthermore, since this class inherits from `BaseChatOpenAI`, it supports passing model parameters from `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.:
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here to disable thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```
:::

::: details Passing Multimodal Data

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

::: details OpenAI's Latest `responses_api`

This model class also supports OpenAI's latest `responses_api`. However, currently only a few providers support this API style. If your model provider supports this API style, you can pass `use_responses_api=True`.
For example, vLLM supports `responses_api`, so you can use it like this:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", use_responses_api=True)
response = model.invoke([HumanMessage(content="Hello")])
print(response)
```
:::

### Compatibility with Official Providers

For providers already officially supported by LangChain (such as `openai`), you can use `load_chat_model` directly without registration:

```python
model = load_chat_model("openai:gpt-4o-mini")
# or
model = load_chat_model("gpt-4o-mini", model_provider="openai")
```

<BestPractice>
    <p>For using this module, you can choose based on the following three scenarios:</p>
    <ol>
        <li>If all model providers you are integrating are supported by the official <code>init_chat_model</code>, please use the official function directly for the best compatibility and stability.</li>
        <li>If some of your model providers are not officially supported, you can use this module's features. First, use <code>register_model_provider</code> to register the model providers, then use <code>load_chat_model</code> to load the models.</li>
        <li>If a model provider you are integrating lacks a suitable LangChain integration but offers an OpenAI-compatible API (like vLLM, OpenRouter), it is recommended to use this module's features. First, use <code>register_model_provider</code> to register the provider (passing <code>openai-compatible</code> as the <code>chat_model</code>), then use <code>load_chat_model</code> to load the model.</li>
    </ol>
</BestPractice>