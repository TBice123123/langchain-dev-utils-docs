# Chat Model Management

> [!NOTE]  
> **Function Overview**: Provides more efficient and convenient chat model management, supporting multiple model providers.  
> **Prerequisites**: Understanding of LangChain [Chat Models](https://docs.langchain.com/oss/python/langchain/models).  
> **Estimated Reading Time**: 10 minutes.

## Overview

LangChain's `init_chat_model` function only supports a limited number of model providers. This library offers a more flexible chat model management solution that supports custom model providers, particularly suitable for scenarios where you need to integrate model services not natively supported (such as vLLM, OpenRouter, etc.).

Using the chat model management feature of this library requires two steps:

1. **Register Model Provider**

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
description="Chat model"  
:required="true"  
:default="null"  
/>  
<Params  
name="base_url"  
type="string"  
description="Base URL of the chat model"  
:required="false"  
:default="null"  
/>  
<Params  
name="provider_config"  
type="dict"  
description="Configuration related to the chat model provider"  
:required="false"  
:default="null"  
/>


2. **Load Chat Model**

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

**Note**: The `load_chat_model` function can also receive any number of keyword arguments, which can be used to pass additional parameters such as `temperature`, `max_tokens`, `extra_body`, etc.



## Registering Model Providers

To register a chat model provider, call `register_model_provider`. For different `chat_model` types, the registration steps vary slightly.

### Case 1: `chat_model` is a `BaseChatModel` class (for existing LangChain chat model classes)

This case applies to existing LangChain integrated models (you can refer to [Chat Model Class Integration](https://docs.langchain.com/oss/python/integrations/chat)), where you can directly pass the model class.

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

- **This parameter usually doesn't need to be set**, as the API address is already defined within the model class (such as `api_base` or `base_url` fields);
- **Only pass in `base_url` when you need to override the default address**;
- The override mechanism only works for attributes in the model class with field names `api_base` or `base_url` (including aliases).


### Case 2: `chat_model` is the string `"openai-compatible"` (for OpenAI-compatible API services)

Many model providers support **OpenAI-compatible API** services, such as: [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://www.together.ai/), etc. When the model provider you're integrating doesn't have a suitable LangChain chat model class, but the provider supports OpenAI-compatible API, you can consider using this case.

The system will use the built-in `BaseChatOpenAICompatible` class to build a chat model class corresponding to a specific provider. This class inherits from `langchain-openai`'s `BaseChatOpenAI` and enhances the following capabilities:

1. **Support for more `reasoning_content` formats**: Can parse reasoning content (`reasoning_content`) output from non-OpenAI providers;
2. **Structured output defaults to `function_calling`**: Has broader compatibility than `json_schema`;
3. **Fine-tune differences through `provider_config`**: Solve support differences for parameters like `tool_choice`, `response_format`, etc.

<StepItem step="1" title="Set provider_name"></StepItem>

Pass in a custom provider name (such as `"vllm"` or `"openrouter"`), **must not contain colons `:`**.

<StepItem step="2" title="Set chat_model"></StepItem>

Must pass in the string `"openai-compatible"`. This is the only supported string value at present.

<StepItem step="3" title="Set base_url (required)"></StepItem>

- **Must provide an API address**, otherwise the chat model class cannot be initialized;
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
    In the code, `base_url` can be omitted:
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible"
        # Automatically reads VLLM_API_BASE
    )
    ```
::: info Tip
In this case, the naming rule for environment variables of the model provider's API endpoint is `${PROVIDER_NAME}_API_BASE` (all uppercase, separated by underscores). The corresponding API_KEY environment variable naming rule is `${PROVIDER_NAME}_API_KEY` (all uppercase, separated by underscores).
:::
::: tip Supplement  
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

<StepItem step="4" title="Set provider_config (optional)"></StepItem>
Only effective in this case, used to declare the provider's support for certain parameters. The following configuration items are supported:

- `supported_tool_choice`: List of supported `tool_choice` strategies;
- `support_json_mode`: Whether to support `response_format={"type": "json_object"}`;
- `keep_reasoning_content`: Whether to retain `reasoning_content` in historical messages.

**1. supported_tool_choice**

Common values for `tool_choice`:
- `"auto"`: Model decides whether to call tools;
- `"none"`: Prohibit tool calls;
- `"required"`: Force calling at least one tool;
- Specify a specific tool (in OpenAI-compatible API, specifically `{"type": "function", "function": {"name": "xxx"}}`).

Different providers support different ranges. To avoid errors, this library defaults `supported_tool_choice` to `["auto"]`, which means only `tool_choice` as `auto` can be passed, other strategies will be filtered out.

If you need to enable, you must explicitly declare the supported items. Configuration value is a string list, optional values:
- `"auto"`, `"none"`, `"required"`: Correspond to standard strategies;
- `"specific"`: Unique identifier of this library, indicating support for specifying specific tools.

For example, vLLM supports all strategies:
```python
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    provider_config={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```
::: info Tip
In structured output scenarios, if forced tool calling is not set, the model might not call the corresponding structured tool due to its own issues, resulting in output being `None`. Therefore, if your model provider supports specifying specific tools, you can explicitly set this parameter during registration to ensure structured output stability.
:::

**2. support_json_mode**

If the provider supports `json_mode` (in OpenAI-compatible API, specifically `response_format={"type": "json_object"}`), you can set it to `True`, and in the `with_structured_output` method, you need to explicitly specify `method="json_mode"`.

**3. keep_reasoning_content**

Defaults to `False` (does not retain reasoning content in historical messages). When set to `True`, historical messages will include the `reasoning_content` field.

For example:

- When set to `False`, the final messages value passed to the model is:
```json
[
  { "role": "user", "content": "你好" },
  { "role": "assistant", "content": "你好！有什么我可以帮你的吗？" }
]
```
- When set to `True`, the final messages value passed to the model is:
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
**Note**: Unless explicitly recommended by the provider documentation, do not set this parameter to `True`. Some providers (like DeepSeek) prohibit passing reasoning content and it will increase token consumption.

:::info Note  
Different models from the same provider may have different support for parameters like `tool_choice`, `json_mode`, etc. This library treats the three parameters (`supported_tool_choice`, `support_json_mode`, `keep_reasoning_content`) as instance attributes of the chat model class. When registering a model provider, developers can pre-pass these three parameters as **default values**, representing the support situation for most models of that provider. Later, when loading specific model instances, if there are special support situations, they can be **overridden** by explicitly passing parameters.

For example: Suppose most models of a certain provider support three `tool_choice` strategies: `["auto", "none", "required"]`, but a specific model only supports `["auto"]`. In this case, you can set the default value when registering the provider:

```python
register_model_provider(
    ...,
    provider_config={"supported_tool_choice": ["auto", "none", "required"]},
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

Use the `load_chat_model` function to load chat models (initialize chat model instances). The parameter rules are as follows:

- If `model_provider` is not passed, then `model` must be in the format of `provider_name:model_name`;
- If `model_provider` is passed, then `model` must be only `model_name`.

**Example**:
```python
# Method 1
model = load_chat_model("vllm:qwen3-4b")

# Method 2
model = load_chat_model("qwen3-4b", model_provider="vllm")
```

Although vLLM doesn't strictly require an API Key, LangChain still requires it to be set. You can set it in environment variables:
```bash
export VLLM_API_KEY=vllm
```

### Feature Support (limited to `"openai-compatible"` case)
For the case mentioned above where `chat_model` is a string (i.e., `"openai-compatible"`), it supports the following features:

::: details Regular Call
For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::

::: details Async Call

Also supports asynchronous calls

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

:::

::: details Async Streaming Output
Also supports asynchronous streaming calls

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
Uses `function_calling` method by default, so the model needs to support tool calling

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

At the same time, if your model provider supports `json_mode`, you can set `support_json_mode` to `True` in the `provider_config` parameter when registering the model provider, and specify the `method` parameter as `"json_mode"` when calling `with_structured_output` to enable this mode. In this case, it's recommended to explicitly guide the model to output structured data according to the specified JSON Schema format in the prompt.
:::

::: details Passing Model Parameters

In addition, since this class inherits from `BaseChatOpenAI`, it supports passing model parameters of `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.
Example code is as follows:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b",extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Use extra_body to pass additional parameters, here to disable thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::

::: details Passing Multimodal Data

Also supports passing multimodal data. You can use OpenAI-compatible multimodal data formats or directly use `content_block` from `langchain`. For example:

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

::: details OpenAI's Latest `responses_api`

Finally, it's worth emphasizing that this model class also supports OpenAI's latest `responses_api`. However, currently only a few providers support this API style. If your model provider supports this API style, you can pass in the `use_responses_api` parameter as `True`.
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

For providers already officially supported by LangChain (such as `openai`), you can directly use `load_chat_model` without registration:

```python
model = load_chat_model("openai:gpt-4o-mini")
# or
model = load_chat_model("gpt-4o-mini", model_provider="openai")
```

<BestPractice>
    <p>For the use of this module, the following suggestions are made:</p>
    <ol>
        <li>If all models are supported by the official <code>init_chat_model</code>, please use that function directly for best compatibility and stability.</li>
        <li>If some models are not officially supported, or you need to integrate providers not covered by the official, you can use the functions of this module.</li>
        <li>If there is no suitable model integration library for the time being, but the provider provides an OpenAI-compatible API (such as vLLM, OpenRouter), you must use the functions of this module.</li>
    </ol>
</BestPractice>