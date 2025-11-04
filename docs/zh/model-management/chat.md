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

注册对话模型提供商需要使用函数`register_model_provider`。

对于这个函数，它接收以下参数：

- **provider_name**：对话模型提供商名称，类型为 str
- **chat_model**：对话模型，类型为 langchain 的 ChatModel 或者 str
- **base_url**：对话模型基础 URL，类型为 str，仅在 chat_model 为 str 时生效
- **tool_choice**：该大模型提供商所支持的所有 tool_choice 取值，类型为字符串列表。与 base_url 相同，仅在 chat_model 为 str 时生效

具体的使用方法如下：

### Step 1：设置 provider_name

首先需要传入 `provider_name`参数以指定模型提供商。此名称可自定义，建议使用具有明确含义的名称（如`vllm`）来指代真实的提供商。请注意，名称中请勿包含冒号`:`，因为该符号后续将用于分隔提供商与模型名称。

### Step 2：设置 chat_model

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
此时，本库会使用内置的 `BaseChatOpenAICompatible` 作为实际的聊天模型。

`BaseChatOpenAICompatible` 继承自 `langchain-openai` 中的 `BaseChatOpenAI`，并在其基础上进行了多项兼容性优化。为确保功能正常，请务必安装标准版的 `langchain-dev-utils`（安装方法详见 [安装文档](../installation.md)）。

相较于直接使用 `langchain-openai` 提供的 `ChatOpenAI`，本库的 `BaseChatOpenAICompatible` 具有以下优势：

1. **支持输出更多类型的思维链内容（`reasoning_content`）**：  
   `ChatOpenAI` 仅能输出官方 OpenAI 模型原生支持的思维链内容，而 `OpenAICompatibleChatModel` 可输出其它模型提供商的思维链内容（例如 openrouter 等）。

2. **优化结构化输出的默认行为**：  
   在调用 `with_structured_output` 时，`method` 参数的默认值被调整为 `"function_calling"`（而非 `ChatOpenAI` 默认的 `"json_schema"`），从而更好地兼容其它模型。

3. **支持配置 tool_choice**：  
   对于大多数兼容 OpenAI API 的模型提供商，其 tool_choice 参数可能与 OpenAI 官方 API 支持的有所不同。因此，该对话模型类支持用户指定支持的 `tool_choice`（见下文）。

### Step 3：设置 base_url（可选）

该参数仅在`chat_model`为字符串（具体是`"openai-compatible"`）时才需要进行设置。你可以通过直接在本函数中传递`base_url`，或者设置模型的提供商的`API_BASE`。

例如，假设我们要使用 vllm 部署的模型，那么可以这样设置：

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

或者这样设置：

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

### Step 4：设置 tool_choice（可选）

仅当 `chat_model` 为字符串 `"openai-compatible"` 时，才需要显式设置此参数。本库之所以提供该参数是为了增强兼容性。
大多数模型提供商支持 `tool_choice` 参数。在 LangChain 中，部分对话模型类的 `bind_tools` 方法允许通过 `tool_choice` 参数来设置。该参数通常接受以下字符串值：

- `auto`：由模型自主决定是否调用工具（大多数提供商的默认行为）；
- `none`：禁止调用任何工具；
- `required`：强制模型必须调用至少一个工具；
- `any`：允许调用任意工具（部分提供商支持）；
- `具体工具名称`：强制调用指定名称的工具。

然而，不同模型提供商对 `tool_choice` 的支持范围并不一致。为提升兼容性，本库引入了一个配置项，用于声明当前模型实际支持的 `tool_choice` 选项。

该配置项是一个字符串列表，每个字符串的取值只能是`auto`、`none`、`any`、`required`、`specific`。其中，前四项对应标准的 `tool_choice` 策略，而 `specific` 是本库特有的标识，表示最后一种策略，即强制调用指定的工具。

**示例**：  
vLLM 支持 `"auto"`、`"none"`、`"required"` 以及指定具体工具名称的 `tool_choice`。因此，在本库中应将该参数设为：

```python
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    tool_choice=["auto", "none", "required", "specific"]  #[!code highlight]
)
```

本参数主要用于以下两种场景：

1. **针对高层封装库的调用**  
   某些高层封装（如 `langmem`）可能会传入 `tool_choice` 参数。若当前模型不支持该取值，可通过本参数显式声明模型实际支持的选项（如 `["auto"]`）。系统会自动检测传入的 `tool_choice` 值是否在支持列表中；若不支持，则回退为 `None`（即不传递该参数），避免因不兼容导致报错。

2. **强制工具调用以确保结构化输出**  
   默认情况下，本库不会强制模型调用特定工具，可能导致结构化输出为 `None`。若你的模型提供商支持强制调用指定工具（例如允许设置`tool_choice={"type": "function", "function": {"name": "get_weather"}}`），则可在本参数中包含 `"specific"`。 启用后，系统在绑定对应工具的时候也会传入上述的参数，强制模型调用指定工具，确保输出符合预期结构。

## 批量注册

如果你需要注册多个模型提供商，可以多次使用`register_model_provider`函数。但是这样显然特别麻烦，因此本库提供了一个批量注册的函数`batch_register_model_provider`。

其接收的参数是 providers，其为一个字典列表，每个字典有四个键分别是`provider`、`chat_model`、`base_url`(可选)、`tool_choice`(可选)。每个键的意义与`register_model_provider`函数中的参数意义相同。

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

::: warning 注意
`register_model_provider` 及其对应的批量注册函数 `batch_register_model_provider` 均基于一个全局字典实现。为避免多线程并发问题，请务必在项目启动阶段完成所有注册操作，切勿在运行时动态注册。
:::

## 加载对话模型

加载对话模型的函数是`load_chat_model`，其接收以下参数：

- **model**：对话模型名称，类型为 str
- **model_provider**：对话模型提供商名称，类型为 str，可选
- **kwargs**：传递给对话模型类的额外的参数，例如 temperature、top_p 等

对于**model**参数，其支持的格式如下：

- provider_name:model_name
- model_name

其中 **provider_name** 为 register_model_provider 函数中注册的 **provider_name**。

对于 **model_provider** 参数，含义和上述的 **provider_name** 相同，允许不传，但是此时 **model** 参数必须为 **provider_name:model_name** 格式，如果传入，则 **model** 参数必须为 **model_name** 格式。
示例代码如下：

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```

也可以直接传入**model_provider**参数。

```python
from langchain_dev_utils.chat_models import load_chat_model

model = load_chat_model("qwen3-4b", model_provider="vllm")
```

**注意**：虽然 vllm 本身可以不要求 api_key,但是由于这个对话模型类需要 api_key，因此你必须设置 api_key。

```bash
export VLLM_API_KEY=vllm
```

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

::: tip 提示
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

:::
