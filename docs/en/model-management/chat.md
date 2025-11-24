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
name="provider_config"
type="dict"
description="Chat model provider related configuration"
:required="false"
:default="null"
/>

The specific usage of the above parameters is as follows:

<StepItem step="1" title="Set provider_name"></StepItem>
First, you need to pass the `provider_name` parameter to specify the model provider. This name can be customized, but it is recommended to use a meaningful name (e.g., `vllm`) to refer to the actual provider. Please note that the name should not contain a colon `:`, as this character will later be used to separate the provider from the model name.

<StepItem step="2" title="Set chat_model"></StepItem>

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

In this example, we use the built-in `FakeChatModel` from `langchain_core`, which is only for testing and does not connect to a real model provider. **However, in practical applications, you should pass a `ChatModel` class with actual functionality.**

**2. Type is str**

When the `chat_model` parameter is a string, its only current valid value is `"openai-compatible"`, indicating that it will be connected via the model provider's **OpenAI-compatible API**. This is because many model providers currently support the OpenAI-compatible API, such as [vLLM](https://github.com/vllm-project/vllm), [OpenRouter](https://openrouter.ai/), [Together AI](https://together.ai/), etc.
In this case, the library will use the built-in `BaseChatOpenAICompatible` as the template class to create the actual chat model class.

`BaseChatOpenAICompatible` inherits from `BaseChatOpenAI` in `langchain-openai` and includes multiple compatibility optimizations. To ensure proper functionality, please make sure to install the standard version of `langchain-dev-utils` (see [Installation Documentation](../installation.md) for installation methods).

Compared to directly using `ChatOpenAI` provided by `langchain-openai`, this library's `BaseChatOpenAICompatible` has the following advantages:

1. **Supports output of more types of reasoning content (`reasoning_content`)**:  
   `ChatOpenAI` can only output reasoning content natively supported by official OpenAI models, while `OpenAICompatibleChatModel` can output reasoning content from other model providers (e.g., OpenRouter).

2. **Optimizes default behavior for structured output**:  
   When calling `with_structured_output`, the default value of the `method` parameter is adjusted to `"function_calling"` (instead of the default `"json_schema"` in `ChatOpenAI`), providing better compatibility with other models.

3. **Supports configuration of related parameters**:  
   For cases where parameters differ from the official OpenAI API, this library provides the `provider_config` parameter to address this issue. For example, when different model providers have inconsistent support for `tool_choice`, you can adapt by setting `supported_tool_choice` in `provider_config`.

<StepItem step="3" title="Set base_url (Optional)"></StepItem>

Next, you need to decide **based on the actual situation** whether to set the model provider's API address (i.e., the `base_url` parameter). This step is **not always required**, and it depends on the type of `chat_model`:

- **When `chat_model` is a string with the value `"openai-compatible"`**:  
  You must explicitly provide the `base_url` parameter or specify the API endpoint via an environment variable. Otherwise, the model client cannot be initialized, as the system has no way to infer the API endpoint.

- **When `chat_model` is of type `ChatModel`**:  
  The API endpoint is typically already defined within the class, so no additional `base_url` configuration is needed.  
  **You only need to explicitly provide `base_url` (via parameter or environment variable) if you intend to override the class’s default API endpoint**. This override applies only to class attributes named `api_base` or `base_url` (including fields whose alias is either `api_base` or `base_url`).

For example, suppose you want to use a vLLM-deployed OpenAI-compatible model. You can configure it as follows:

**Method 1: Pass `base_url` directly**

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

**Method 2: Configure via environment variable**

```bash
export VLLM_API_BASE=http://localhost:8000/v1
```

Then omit `base_url` in your code:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible"
    # Automatically reads the VLLM_API_BASE environment variable
)
```

> 💡 **Tip**: The naming convention for environment variables is `${PROVIDER_NAME}_API_BASE` (all uppercase, underscore-separated).

::: tip Additional Note
`vLLM` is a well-known framework for deploying large language models, capable of serving them via an OpenAI-compatible API. For instance, to deploy the `qwen3-4b` model, you could run the following command:

```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```

After successful deployment, it will expose an OpenAI-compatible API at `http://localhost:8000/v1`.
:::
<StepItem step="4" title="Set provider_config (Optional)"></StepItem>

This parameter is only effective when `chat_model` is the string `"openai-compatible"`. It is used to configure parameters related to the model provider.
Currently, the following provider parameters are supported for configuration:

- `supported_tool_choice`: Supported `tool_choice` values.
- `keep_reasoning_content`: Whether to retain reasoning content (`reasoning_content`) in the historical context messages passed to the model.
- `support_json_mode`: Whether to support the `json_mode` structured output method.

**1. supported_tool_choice**

`tool_choice` is a common parameter for API endpoints of most model providers. This parameter typically accepts the following values:

- `auto`: Let the model decide whether to call tools (default behavior for most providers);
- `none`: Prohibit calling any tools;
- `required`: Force the model to call at least one tool;
- `Specify a specific tool`: Force the call of a tool with a specified name (generally requires passing the specific tool's name, e.g., in the OpenAI API, you need to pass `tool_choice={"type": "function", "function": {"name": "get_weather"}}`).

However, different model providers do not consistently support the range of `tool_choice` values. Some support most of the values mentioned above, while others only support the most basic `auto` value.
However, some high-level encapsulation libraries might pass a specific `tool_choice` parameter for stability. If the connected model provider API does not support it, the call will throw an exception. To solve this, this library's default approach is to filter out any `tool_choice` parameter values, ensuring that no `tool_choice` parameter is ultimately passed to the large model API (even if the user explicitly passes a `tool_choice` parameter). This helps avoid errors caused by compatibility issues as much as possible.

However, sometimes it is necessary to set `tool_choice` to improve application stability. For example, in structured output scenarios, None might be output due to prompt issues or model performance problems. If the model provider supports the strategy of specifying a particular tool, then `tool_choice` can be used to improve the correctness of structured output.

To address this, this library introduces the configuration item `supported_tool_choice`. This configuration item is a list of strings. By default, it is an empty list, meaning it filters all `tool_choice` parameter values. Each string value can only be `auto`, `none`, `required`, or `specific`. The first three correspond to standard `tool_choice` strategies, while `specific` is a unique identifier of this library, representing the last strategy, i.e., specifying a particular tool.

For example:

vLLM supports `auto`, `none`, `required`, and `tool_choice` that specifies a particular tool (i.e., all possible `tool_choice` values). Therefore, in this library, this parameter should be set as:

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    provider_config={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```

**2. support_json_mode**

The implementation of structured output mainly relies on two methods: `function_calling` and `json_mode`. Among them, `function_calling` is the most commonly used method currently, applicable to the vast majority of large model APIs; while `json_mode` is a structured output method provided by some model providers, allowing the model to directly generate structured responses conforming to a specified JSON Schema without pre-defining tool functions, thus simplifying the calling process and improving output consistency.

In the OpenAI API, enabling `json_mode` requires explicitly setting `response_format={"type": "json_object"}`.

If your model provider supports `json_mode`, you can set the `support_json_mode` parameter to `True` and explicitly specify `method="json_mode"` when calling `with_structured_output` to enable this mode.

**3. keep_reasoning_content**

The purpose of this parameter is to control whether to retain the model's reasoning content in the final historical context (`messages`) passed to the model. The default is `False`, meaning not to retain it. This is the method required by most model providers, i.e., the final context content passed to the large model should not include reasoning content. As shown below, this is the `messages` format for most providers, which does not include reasoning content:

```json
[
  { "role": "user", "content": "Hello" },
  { "role": "assistant", "content": "Hello! How can I help you?" }
]
```

However, some providers also recommend retaining reasoning content to further improve reasoning ability, especially in complex task scenarios involving multi-step tool calls. **This parameter is intended to handle this situation.** When the parameter is `True` (retain reasoning content), the `messages` passed to the model are as follows:

```json
[
  { "role": "user", "content": "Hello" },
  {
    "role": "assistant",
    "content": "Hello! How can I help you?",
    "reasoning_content": "The user said 'Hello', which is a greeting. I should respond politely and proactively ask for needs."
  }
]
```

It is worth noting that in most cases you should not actively set this parameter to `true` because passing reasoning content will increase context consumption, and some providers even do not allow passing reasoning content (e.g., DeepSeek). Unless the model provider's documentation explicitly recommends passing it, you can consider passing it then.

**Note**: The above example is relatively simple; in actual agent scenarios, some messages may contain tool calls and other content.

::: info Note  
Different models from the same provider may vary in their support for the aforementioned parameters. Therefore, this library treats `supported_tool_choice`, `support_json_mode`, and `keep_reasoning_content` as **instance-level configuration attributes**.

- When calling `register_model_provider`, the `provider_config` parameter sets the **default values** for these instance attributes across all models of that provider.
- At runtime, you can override these defaults by passing them as keyword arguments to `load_chat_model`, allowing fine-grained adaptation to the capabilities of a specific model.

For example:
```python
model = load_chat_model(
    "vllm:qwen3-4b",
    supported_tool_choice=["auto"]  # assuming the qwen3-4b model served by vLLM only supports the 'auto' strategy
)
```
This approach enables you to maintain clean global configurations while still allowing precise, per-model customization.
:::


## Batch Registration

If you need to register multiple model providers, you can use the `register_model_provider` function multiple times. However, this is obviously very troublesome. Therefore, this library provides a batch registration function `batch_register_model_provider`.

It receives the parameter `providers`, which is a list of dictionaries. Each dictionary has four keys: `provider_name`, `chat_model`, `base_url` (optional), and `provider_config` (optional). The meaning of each key is the same as the corresponding parameter in the `register_model_provider` function.

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

model = load_chat_model("vllm:qwen3-4b")
print(model.invoke("Hello"))

model = load_chat_model("fake_provider:fake-model")
print(model.invoke("Hello"))
```

::: warning Note
Both `register_model_provider` and its corresponding batch registration function `batch_register_model_provider` are implemented based on a global dictionary. To avoid multi-threading concurrency issues, please ensure all registration operations are completed during the project startup phase. Do not dynamically register during runtime.
:::

## Loading Chat Models

The function for loading chat models is `load_chat_model`, which accepts the following parameters:

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

Additionally, there are some important points to note when using this function:

**1. Additional Parameters**

This function can also accept any number of keyword arguments, such as `temperature`, `max_tokens`, etc. For specific details, refer to the corresponding model integration class documentation (if the chat_model is `openai-compatible`, you can refer to `ChatOpenAI`).

**2. Model Parameter Format**

The `model` parameter supports two formats:

1. `provider_name:model_name`
2. `model_name`

Where `provider_name` is the provider name registered through the `register_model_provider` function.

The `model_provider` parameter has the same meaning as the `provider_name` above and is an optional parameter:

- If `model_provider` is not provided, the `model` parameter must be in the format `provider_name:model_name`;
- If `model_provider` is provided, the `model` parameter must be in the format `model_name`.

Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

Alternatively, you can directly pass the `model_provider` parameter.

```python
from langchain_dev_utils.chat_models import load_chat_model

model = load_chat_model("qwen3-4b", model_provider="vllm")
```

**Note**: Although vllm itself may not require an api_key, this chat model class does require an api_key, so you must set the api_key.

```bash
export VLLM_API_KEY=vllm
```

**3. Features of Chat Model Class when chat_model is a String**

For the case where `chat_model` is a string (i.e., `"openai-compatible"`), it supports the following features and functionalities:

::: details Regular Invocation
For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::

::: details Asynchronous Invocation

Also supports asynchronous invocation

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

::: details Asynchronous Streaming Output
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
Note: Ensure the model supports tool calling

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
response = model.invoke([HumanMessage("Hello, my name is Zhang San, I'm 25 years old")])
print(response)
```

Additionally, if your model provider supports `json_mode`, you can set `support_json_mode` to `True` in the `provider_config` parameter when registering the model provider, and specify the `method` parameter as `"json_mode"` when calling `with_structured_output` to enable this mode. In this case, it is recommended to explicitly guide the model to output structured data according to the specified JSON Schema format in the prompt.
:::

::: details Passing Model Parameters

Furthermore, since this class inherits from `BaseChatOpenAI`, it supports passing model parameters of `BaseChatOpenAI`, such as `temperature`, `extra_body`, etc.
Example code:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", extra_body={"chat_template_kwargs": {"enable_thinking": False}}) # Using extra_body to pass additional parameters, here disabling thinking mode
response = model.invoke([HumanMessage("Hello")])
print(response)
```

:::

::: details Passing Multimodal Data

Also supports passing multimodal data, you can use OpenAI-compatible multimodal data format or directly use `content_block` in `langchain`. For example:

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

Finally, it should be emphasized that this model class also supports OpenAI's latest `responses_api`. However, currently only a few providers support this API style. If your model provider supports this API style, you can pass the `use_responses_api` parameter as `True`.
For example, if vllm supports `responses_api`, you can use it like this:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", use_responses_api=True)
response = model.invoke([HumanMessage(content="Hello")])
print(response)
```

:::

## 4. Compatibility with Official Functions

For model providers already supported by the official `init_chat_model` function, you can also directly use the `load_chat_model` function for loading without additional registration. Therefore, if you need to connect to multiple models simultaneously, where some providers are officially supported and others are not, you can consider using `load_chat_model` uniformly for loading. For example:

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

# When loading a model, you need to specify the provider and model name
model = load_chat_model("openai:gpt-4o-mini")
# Or explicitly specify the provider parameter
model = load_chat_model("gpt-4o-mini", model_provider="openai")

# Note: You must specify the model provider; it cannot be automatically inferred based solely on the model name
response = model.invoke([HumanMessage("Hello")])
print(response)
```

<BestPractice>
    <p>For the use of this module, the following recommendations are provided:</p>
    <ol>
        <li>If all models are supported by the official <code>init_chat_model</code>, please use that function directly for optimal compatibility and stability.</li>
        <li>If some models are not officially supported, or you need to integrate providers not covered by the official function, you can use the functions of this module.</li>
        <li>If there is no suitable model integration library available, but the provider offers an OpenAI-compatible API, you can use the functions of this module.</li>
    </ol>
</BestPractice>
