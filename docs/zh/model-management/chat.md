# 对话模型管理

> [!NOTE]
>
> **功能概述**：提供更高效、更便捷的对话模型管理。
>
> **前置要求**：了解 langchain 的[对话模型](https://docs.langchain.com/oss/python/langchain/models)。
>
> **预计阅读时间**：10 分钟

在 `langchain` 中，`init_chat_model` 函数可用于初始化对话模型实例，但其支持的模型提供商较为有限。如果你希望使用更多模型提供商（尤其是你偏好的提供商未被该函数支持），可以借助本库提供的对话模型管理功能来实现。

使用对话模型时，需要先使用`register_model_provider`注册对话模型提供商，然后才能使用`load_chat_model`加载对话模型。

## 注册对话模型提供商

注册对话模型提供商需要使用函数`register_model_provider`。对于这个函数，它接收以下参数：

<Params
name="provider_name"
type="string"
description="对话模型提供商名称"
:required="true"
:default="null"
/>
<Params
name="chat_model"
type="BaseChatModel | string"
description="对话模型"
:required="true"
:default="null"
/>
<Params
name="base_url"
type="string"
description="对话模型基础 URL"
:required="false"
:default="null"
/>
<Params
name="provider_config"
type="dict"
description="对话模型提供商相关配置"
:required="false"
:default="null"
/>

对于上述参数的具体使用方法如下：

<StepItem step="1" title="设置 provider_name"></StepItem>
首先需要传入 `provider_name`参数以指定模型提供商。此名称可自定义，建议使用具有明确含义的名称（如`vllm`）来指代真实的提供商。请注意，名称中请勿包含冒号`:`，因为该符号后续将用于分隔提供商与模型名称。

<StepItem step="2" title="设置 chat_model"></StepItem>

接下来需要传入 `chat_model`参数，这个参数接收两种类型：`langchain` 的 `ChatModel` 或者 `str`。

对于这个参数的不同类型，我们分别介绍：

**1.类型为 ChatModel**

示例代码如下：

```python
from langchain_core.language_models.fake_chat_models import FakeChatModel
from langchain_dev_utils.chat_models import load_chat_model, register_model_provider

register_model_provider(
    provider_name="fake_provider",
    chat_model=FakeChatModel,
)
```

在本示例中，我们使用的是 `langchain_core` 内置的 `FakeChatModel`，它仅用于测试，并不对接真实的模型提供商。**但在实际应用中，应传入一个具有实际功能的 `ChatModel` 类。**

**2.类型为 str**

当 `chat_model` 参数为字符串时，其目前唯一取值为 `"openai-compatible"`，表示将通过模型提供商的 **OpenAI 兼容 API** 进行接入。因为目前很多模型提供商都支持 OpenAI 兼容 API，例如[vLLM](https://github.com/vllm-project/vllm)、[OpenRouter](https://openrouter.ai/)、[Together AI](https://together.ai/) 等。
此时，本库会使用内置的 `BaseChatOpenAICompatible` 作为模板类来创建实际的对话模型类。

`BaseChatOpenAICompatible` 继承自 `langchain-openai` 中的 `BaseChatOpenAI`，并在其基础上进行了多项兼容性优化。为确保功能正常，请务必安装标准版的 `langchain-dev-utils`（安装方法详见 [安装文档](../installation.md)）。

相较于直接使用 `langchain-openai` 提供的 `ChatOpenAI`，本库的 `BaseChatOpenAICompatible` 具有以下优势：

1. **支持输出更多类型的思维链内容（`reasoning_content`）**：  
   `ChatOpenAI` 仅能输出官方 OpenAI 模型原生支持的思维链内容，而 `OpenAICompatibleChatModel` 可输出其它模型提供商的思维链内容（例如 openrouter 等）。

2. **优化结构化输出的默认行为**：  
   在调用 `with_structured_output` 时，`method` 参数的默认值被调整为 `"function_calling"`（而非 `ChatOpenAI` 默认的 `"json_schema"`），从而更好地兼容其它模型。

3. **支持配置相关配置参数**：  
   针对与 OpenAI 官方 API 部分参数存在差异的情况，本库提供了 `provider_config` 参数用于解决本问题，例如，不同模型提供商对 `tool_choice` 的支持方式不一致时，可通过在 `provider_config` 中设置 `supported_tool_choice` 进行适配。

<StepItem step="3" title="设置 base_url（可选）"></StepItem>

接下来，需要根据**实际情况**决定是否设置模型提供商的 API 地址（即`base_url`参数）。该步骤**并非总是必需**，具体取决于 `chat_model` 的类型：

- **当 `chat_model` 是字符串且值为 `"openai-compatible"` 时**：  
  必须显式提供 `base_url` 参数（或通过环境变量指定 API 地址），否则将无法正确初始化模型客户端。

- **当 `chat_model` 是 `ChatModel` 的子类实例时**：  
  通常无需额外设置 `base_url`，因为模型的 API 地址已在类内部定义。仅当你希望覆盖该模型集成类的默认 API 地址时，才需要手动配置，配置方式和上述一样，可以显式提供 `base_url` 参数或者通过环境变量指定 API 地址。

例如，假设我们要使用 vLLM 部署的 OpenAI 兼容模型，那么可以这样设置：

**方法一：直接传入 `base_url`**

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

**方法二：通过环境变量配置**

```bash
export VLLM_API_BASE=http://localhost:8000/v1
```

然后在代码中省略 `base_url`：

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible"
    # 自动读取 VLLM_API_BASE 环境变量
)
```

> 💡 提示：环境变量命名规则为 `${PROVIDER_NAME}_API_BASE`（全大写，下划线分隔）。

::: tip 补充
`vllm`是知名的大模型部署框架，其可以将大模型部署为 OpenAI 兼容 API。例如我们要部署 qwen3-4b 模型。则可以使用如下指令：

```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```

完成后会提供一个 OpenAI 兼容 API，地址为`http://localhost:8000/v1`。
:::

<StepItem step="4" title="设置 provider_config（可选）"></StepItem>

仅当 `chat_model` 为字符串 `"openai-compatible"` 时，此参数才有效。用于配置模型提供商的相关参数。
目前支持配置以下提供商参数：

- `supported_tool_choice`：支持的 `tool_choice` 取值。
- `keep_reasoning_content`：是否在传给模型的历史上下文消息中保留推理内容（`reasoning_content`）。
- `support_json_mode`：是否支持 `json_mode`的结构化输出方式。

**1. supported_tool_choice**

`tool_choice`是大部分模型提供商 API 端点常见的参数。该参数通常接受以下取值：

- `auto`：由模型自主决定是否调用工具（大多数提供商的默认行为）；
- `none`：禁止调用任何工具；
- `required`：强制模型必须调用至少一个工具；
- `指定某一特定工具`：强制调用指定名称的工具（一般需要传递具体的工具的名称，例如在 OpenAI API 中，需要传递 `tool_choice={"type": "function", "function": {"name": "get_weather"}}`）。

然而，不同模型提供商对 `tool_choice` 的支持范围并不一致。有些支持上述的大部分取值，有些仅支持最基础的`auto`取值。
但是，某些高层封装库为了提高其稳定性，会传递某个特定的`tool_choice`参数，此时如果对接的模型提供商 API 不支持，则调用会引发异常。为了解决上述现象，本库默认的做法是过滤任何的`tool_choice`参数取值，使得最终传递给大模型 API 不会有`tool_choice`参数（哪怕使用者显式地传递了`tool_choice`参数），这样做能够尽可能的避免兼容性问题引发的错误。

但是，有些时候确实需要通过设置`tool_choice`来提升应用稳定性。例如在结构化输出的场景下，由于提示词问题或者模型性能问题可能会输出 None，此时如果模型提供商支持设置指定某一特定工具的策略方式，那么可以使用`tool_choice`来提高结构化输出的正确性。

对此，本库引入了本配置项`supported_tool_choice`，该配置项是一个字符串列表，默认情况下是一个空列表，即过滤所有的`tool_choice`参数取值。每个字符串的取值只能是`auto`、`none`、`required`、`specific`。其中，前三项对应标准的 `tool_choice` 策略，而`specific` 是本库特有的标识，表示最后一种策略，即指定某一特定工具。

例如：

vLLM 支持 `auto`、`none`、`required` 以及指定特定工具的 `tool_choice`（即全部的可能的`tool_choice`取值）。因此，在本库中应将该参数设为：

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    provider_config={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```

**2. support_json_mode**

结构化输出的实现主要依赖两种方式：`function_calling` 与 `json_mode`。其中，`function_calling` 是当前最常用的方式，适用于绝大多数大模型 API；而 `json_mode` 是部分模型提供商提供的一种结构化输出方式，允许模型直接生成符合指定 JSON Schema 的结构化响应，无需预先定义工具函数，从而简化调用流程并提升输出一致性。

在 OpenAI API 中，启用 `json_mode` 需显式设置 `response_format={"type": "json_object"}`。

若你的模型提供商支持 `json_mode`，可将`support_json_mode`参数设为 `True`，并在调用 `with_structured_output` 时显式指定 `method="json_mode"` 以启用该模式。

**3. keep_reasoning_content**

这个参数的作用是用于控制最终传给模型的上下文历史记录（`messages`）中要不要保留模型推理内容（`reasoning content`）。默认是 `False`，即不保留，这也是大部分模型提供商要求的方式，即最终传给大模型的上下文内容不应该包含推理内容。如下所示，这是大多数提供商的 `messages` 格式，不包含推理内容：

```json
[
  { "role": "user", "content": "你好" },
  { "role": "assistant", "content": "你好！有什么我可以帮你的吗？" }
]
```

但是有些提供商也会建议保留推理内容进一步提高推理能力，尤其是在面对多步工具调用的复杂任务场景。**本参数的作用就是为了应对这个情况。** 当参数为 `True`（保留推理内容）时，传入模型的 `messages` 如下：

```json
[
  { "role": "user", "content": "你好" },
  {
    "role": "assistant",
    "content": "你好！有什么我可以帮你的吗？",
    "reasoning_content": "用户说了‘你好’，这是打招呼，我应该礼貌回应并主动询问需求。"
  }
]
```

值得注意的是，大部分情况下你不应该主动设置这个参数为 `true`，因为传入推理内容会导致上下文消耗增多，有些提供商甚至不允许传入推理内容（如 DeepSeek）。除非模型提供商文档中明确建议传入，此时你可以考虑传入。

**注意**：上面例子比较简单，实际在智能体场景下部分 message 可能会包含工具调用等内容。

## 批量注册

如果你需要注册多个模型提供商，可以多次使用`register_model_provider`函数。但是这样显然特别麻烦，因此本库提供了一个批量注册的函数`batch_register_model_provider`。

其接收的参数是 providers，其为一个字典列表，每个字典有四个键分别是`provider_name`、`chat_model`、`base_url`(可选)、`provider_config`(可选)。每个键的意义与`register_model_provider`函数中的参数意义相同。

示例代码如下：

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

::: warning 注意
`register_model_provider` 及其对应的批量注册函数 `batch_register_model_provider` 均基于一个全局字典实现。为避免多线程并发问题，请务必在项目启动阶段完成所有注册操作，切勿在运行时动态注册。
:::

## 加载对话模型

加载对话模型的函数是`load_chat_model`，其接收以下参数：

<Params
name="model"
type="string"
description="对话模型名称"
:required="true"
:default="null"
/>
<Params
name="model_provider"
type="string"
description="对话模型提供商名称"
:required="false"
:default="null"
/>
同时对于这个函数的使用还需要注意以下内容：

**1.额外参数**

该函数还能接收任意数量个关键字参数，例如`temperature`、`max_tokens`等,具体参考对应的模型集成类文档（如果 chat_model 是`openai-compatible`，则可以参考`ChatOpenAI`）。

**2.model 参数格式**

`model` 参数支持两种格式：

1. `provider_name:model_name`
2. `model_name`

其中，`provider_name` 为通过 `register_model_provider` 函数注册的提供商名称。

`model_provider` 参数与上述 `provider_name` 含义相同，为可选参数：

- 若未传入 `model_provider`，则 `model` 参数必须为 `provider_name:model_name` 格式；
- 若传入 `model_provider`，则 `model` 参数必须为 `model_name` 格式。

示例代码如下：

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

也可以直接传入`model_provider`参数。

```python
from langchain_dev_utils.chat_models import load_chat_model

model = load_chat_model("qwen3-4b", model_provider="vllm")
```

**注意**：虽然 vllm 本身可以不要求 api_key,但是由于这个对话模型类需要 api_key，因此你必须设置 api_key。

```bash
export VLLM_API_KEY=vllm
```

**3.chat_model 为字符串情况下的对话模型类特点**

对于上面提到的`chat_model`为字符串（即`"openai-compatible"`）的情况，其提供了`langchain`的`ChatModel`的基本功能包括如下：

::: details 普通调用
例如：

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

同样也支持异步

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = await model.ainvoke([HumanMessage("Hello")])
print(response)
```

:::

::: details 流式输出
例如：

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
for chunk in model.stream([HumanMessage("Hello")]):
    print(chunk)
```

同样也支持异步的流式调用

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
async for chunk in model.astream([HumanMessage("Hello")]):
    print(chunk)
```

:::

::: details 工具调用
注意：需要保证模型支持工具调用

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
import datetime

@tool
def get_current_time() -> str:
    """获取当前时间戳"""
    return str(datetime.datetime.now().timestamp())

model = load_chat_model("vllm:qwen3-4b").bind_tools([get_current_time])
response = model.invoke([HumanMessage("获取当前时间戳")])
print(response)
```

:::

::: details 结构化输出
默认采用`function_calling`方法，因此模型需要支持工具调用

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int

model = load_chat_model("vllm:qwen3-4b").with_structured_output(User)
response = model.invoke([HumanMessage("你好，我叫张三，今年25岁")])
print(response)
```

同时，如果你的模型提供商支持`json_mode`，则可在注册模型提供商时，将`provider_config`参数中的`support_json_mode`设置为`True`，并在调用`with_structured_output`时将`method`参数指定为`"json_mode"`以启用该模式。此时，建议在提示词中明确引导模型按照指定的 JSON Schema 格式输出结构化数据。
:::

除此之外，由于该类继承了`BaseChatOpenAI`,因此支持传递`BaseChatOpenAI`的模型参数，例如`temperature`, `extra_body`等。
示例代码如下：

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b",extra_body={"chat_template_kwargs": {"enable_thinking": False}}) #利用extra_body传递额外参数，这里是关闭思考模式
response = model.invoke([HumanMessage("Hello")])
print(response)
```

另外，也支持传递多模态数据，你可以使用 OpenAI 兼容的多模态数据格式或者直接使用`langchain`中的`content_block`。例如：

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
            {"type": "text", "text": "描述这张图片"},
        ]
    )
]

model = load_chat_model("openrouter:qwen/qwen3-vl-8b-thinking")
response = model.invoke(messages)
print(response)
```

**4.与官方函数兼容情况**

对于官方 `init_chat_model` 函数已支持的模型提供商，你也可以直接使用 `load_chat_model` 函数进行加载，无需额外注册。因此，如果你需要同时接入多个模型，其中部分提供商为官方支持，另一部分不支持，可以考虑统一使用 `load_chat_model` 进行加载。例如：

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

# 加载模型时需指定提供商与模型名称
model = load_chat_model("openai:gpt-4o-mini")
# 或显式指定提供商参数
model = load_chat_model("openai:gpt-4o-mini", model_provider="openai")

# 注意：必须指定模型提供商，无法仅根据模型名称自动推断
response = model.invoke([HumanMessage("Hello")])
print(response)
```

<BestPractice>
    <p>对于本模块的使用，有如下建议：</p>
    <ol>
        <li>若所有模型均被官方 <code>init_chat_model</code> 支持，请直接使用该函数，以获得最佳兼容性和稳定性。</li>
        <li>若部分模型不受官方支持，或需要集成官方未覆盖的提供商，可使用本模块的函数。</li>
        <li>如果暂无适合的模型集成库，但提供商提供了 OpenAI 兼容的 API，则可以使用本模块函数。</li>
    </ol>
</BestPractice>
