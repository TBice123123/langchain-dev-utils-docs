# 对话模型管理

> [!NOTE]  
> **功能概述**：提供更高效、更便捷的对话模型管理，支持多种模型提供商。  
> **前置要求**：了解 LangChain [对话模型](https://docs.langchain.com/oss/python/langchain/models)。  
> **预计阅读时间**：15分钟。

## 概述

LangChain 的 `init_chat_model` 函数仅支持有限的模型提供商。本库提供更灵活的对话模型管理方案，支持自定义模型提供商，特别适用于需要接入未内置支持的模型服务（如 vLLM、OpenRouter 等）的场景。

使用本库的对话模型管理功能需要两个步骤：

1. **注册模型提供商** 

使用 `register_model_provider` 注册模型提供商。其参数定义如下：
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


2. **加载对话模型** 

使用 `load_chat_model` 实例化具体模型。其参数定义如下：


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

**注意**：`load_chat_model`函数同时还能接收任意数量的关键字参数，可用于传递如`temperature`、`max_tokens`、`extra_body`等额外参数。



## 注册模型提供商

注册对话模型提供商需调用 `register_model_provider`。对于不同的情况，注册步骤略有不同。

### 情况一：已有 LangChain 对话模型类

若模型提供商已有现成且合适的LangChain 集成（详见[对话模型类集成](https://docs.langchain.com/oss/python/integrations/chat)），请将相应的集成对话模型类作为 chat_model 参数传入。 

<StepItem step="1" title="设置 provider_name"></StepItem>

传入 `provider_name`，用于后续在 `load_chat_model` 中引用。名称可自定义，但**不要包含冒号**。

<StepItem step="2" title="设置 chat_model"></StepItem>

传入一个 **`BaseChatModel` 的子类**。

```python
from langchain_core.language_models.fake_chat_models import FakeChatModel
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="fake_provider",
    chat_model=FakeChatModel,
)
```
**注意**：`FakeChatModel` 仅用于测试。实际使用中必须传入具备真实功能的 `ChatModel` 类。

<StepItem step="3" title="设置 base_url（可选）"></StepItem>

- **此参数通常无需设置**，因为模型类内部已定义 API 地址（如 `api_base` 或 `base_url` 字段）；
- **仅当你需要覆盖默认地址时**才传入 `base_url`；
- 覆盖机制仅对模型类中字段名为 `api_base` 或 `base_url`（含别名）的属性生效。


### 情况二：未有 LangChain 对话模型类，但模型提供商支持 OpenAI 兼容 API

很多模型提供商都支持 **OpenAI 兼容 API** 的服务，例如：[vLLM](https://github.com/vllm-project/vllm)、[OpenRouter](https://openrouter.ai/)、[Together AI](https://www.together.ai/)等。当你接入的模型提供商未有合适的 LangChain 对话模型类时，但提供商支持OpenAI 兼容 API 时，可以考虑使用此情况。

本库将使用内置 `BaseChatOpenAICompatible` 类构建对应于特定提供商的对话模型类。该类继承自 `langchain-openai` 的 `BaseChatOpenAI`，并增强以下能力：

1. **支持更多 `reasoning_content` 格式**：可解析非 OpenAI 提供商的推理内容（`reasoning_content`）输出；
2. **结构化输出默认使用 `function_calling`**：比 `json_schema` 兼容性更广；
3. **通过 `provider_config` 精细适配差异**：解决 `tool_choice`、`response_format` 等参数的支持差异。

<StepItem step="1" title="设置 provider_name"></StepItem>

传入自定义提供商名称（如 `"vllm"` 或 `"openrouter"`），**不要包含冒号 `:`**。

<StepItem step="2" title="设置 chat_model"></StepItem>

必须传入字符串 `"openai-compatible"`。这是当前唯一支持的字符串值。

<StepItem step="3" title="设置 base_url（必需）"></StepItem>

- **必须提供 API 地址**，否则无法初始化对话模型类；
- 可通过以下任一方式提供：
  - **显式传参**：
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible",
        base_url="http://localhost:8000/v1"
    )
    ```
  - **通过环境变量**（推荐用于配置管理）：
    ```bash
    export VLLM_API_BASE=http://localhost:8000/v1
    ```
    代码中可省略 `base_url`：
    ```python
    register_model_provider(
        provider_name="vllm",
        chat_model="openai-compatible"
        # 自动读取 VLLM_API_BASE
    )
    ```
::: info 提示
此情况下，模型提供商的API端点的环境变量的命名规则是`${PROVIDER_NAME}_API_BASE`（全大写，下划线分隔）。对应的API_KEY环境变量的命名规则是`${PROVIDER_NAME}_API_KEY`（全大写，下划线分隔）。
:::
::: tip 补充  
vLLM 是常用的大模型推理框架，其可以将大模型部署为OpenAI兼容的API，例如本例子中的Qwen3-4B：
```bash
vllm serve Qwen/Qwen3-4B \
--reasoning-parser qwen3 \
--enable-auto-tool-choice --tool-call-parser hermes \
--host 0.0.0.0 --port 8000 \
--served-model-name qwen3-4b
```
服务地址为 `http://localhost:8000/v1`。  
:::

<StepItem step="4" title="设置 provider_config（可选）"></StepItem>
仅在此情况下有效，用于声明提供商对于某些参数的支持情况。支持以下配置项：

- `supported_tool_choice`：支持的 `tool_choice` 策略列表；
- `support_json_mode`：是否支持 `response_format={"type": "json_object"}`；
- `keep_reasoning_content`：是否在历史消息中保留 `reasoning_content`。

**1. supported_tool_choice**

`tool_choice` 常见取值：
- `"auto"`：模型自主决定是否调用工具；
- `"none"`：禁止调用工具；
- `"required"`：强制调用至少一个工具；
- 指定具体工具（在OpenAI兼容API中，具体为 `{"type": "function", "function": {"name": "xxx"}}`）。

不同提供商支持范围不同。为避免错误，本库默认的`supported_tool_choice`为`["auto"]`，这种策略下，只能传递`tool_choice`为`auto`，其它策略均会被过滤。

若需启用，必须显式声明支持项。配置值为字符串列表，可选值：
- `"auto"`, `"none"`, `"required"`：对应标准策略；
- `"specific"`：本库特有标识，表示支持指定具体工具。

例如 vLLM 支持全部策略：
```python
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    provider_config={"supported_tool_choice": ["auto", "none", "required", "specific"]},
)
```
::: info 提示
在利用`function calling`方法实现结构化输出场景中，模型可能因自身问题从而导致未调用相应结构化工具，导致输出结果为 `None`。因此，如果您的模型提供商支持通过 `tool_choice` 参数指定调用特定的工具，那么可以在注册时显式设置该参数，以确保结构化输出的稳定性和可靠性。
:::

**2. support_json_mode**

若提供商支持 `json_mode`（在OpenAI兼容API中，具体为 `response_format={"type": "json_object"}`），可以设置为 `True`，并在`with_structured_output`方法中需显式指定 `method="json_mode"`。

**3. keep_reasoning_content**

默认 `False`（在历史消息中不保留推理内容）。设为 `True` 时，历史消息将包含 `reasoning_content` 字段。

例如：

- 设为`False`时，最终传递给模型的messages值为：
```json
[
  { "role": "user", "content": "你好" },
  { "role": "assistant", "content": "你好！有什么我可以帮你的吗？" }
]
```
- 设为`True`时，最终传递给模型的messages值为：
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
**注意**：除非提供商文档明确推荐，否则不要设置此参数为 `True`。部分提供商（如 DeepSeek）禁止传入推理内容，且会增加 token 消耗。

:::info 注意  
同一模型提供商的不同模型在 `tool_choice` 、 `json_mode` 等参数上也有支持上的差异，本库将上述的三个参数（`supported_tool_choice`、`support_json_mode`、`keep_reasoning_content`）作为对话模型类的实例属性。开发者在注册模型提供商时，可预先传入这三个参数作为**默认值**，代表该提供商大多数模型的支持情况。随后，在加载具体模型实例时，如遇特殊支持情况，可通过显式传参**覆盖默认值**。

例如：假设某模型提供商的大多数模型均支持 `["auto", "none", "required"]` 三种 `tool_choice` 策略，但其中某个特定模型仅支持 `["auto"]`。此时，可在注册提供商时设置默认值：

```python
register_model_provider(
    ...,
    provider_config={"supported_tool_choice": ["auto", "none", "required"]},
)
```

而在加载该特殊模型时，显式覆盖配置：

```python
model = load_chat_model(
    "...",  # 模型提供商和模型名称
    supported_tool_choice=["auto"]  # 覆盖默认值
)
```

这种方式便于开发者根据不同模型的实际支持情况进行灵活配置。
:::

## 批量注册

若需注册多个提供商，可使用 `batch_register_model_provider` 避免重复调用。

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

::: warning 注意  
两个注册函数均基于全局字典实现。为避免多线程问题，**必须在应用启动阶段完成所有注册**，禁止运行时动态注册。  
:::

## 加载对话模型

使用 `load_chat_model` 函数加载对话模型（初始化对话模型实例）。其中，参数的规则如下：

- 若未传 `model_provider`，则 `model` 必须为 `provider_name:model_name` 格式；
- 若传 `model_provider`，则 `model` 必须仅为 `model_name`。

**示例**：
```python
# 方式一
model = load_chat_model("vllm:qwen3-4b")

# 方式二
model = load_chat_model("qwen3-4b", model_provider="vllm")
```

虽然`vLLM` 不强制需要 API Key，但 LangChain 仍要求设置。可以在环境变量中设置：
```bash
export VLLM_API_KEY=vllm
```

### 模型方法和参数
对于**情况一**，其所有方法与参数均与该对应的对话模型类保持一致。  
而对于**情况二**，则模型的方法和参数如下：
- 支持`invoke`、`ainvoke`、`stream`、`astream`等方法。
- 支持`bind_tools`方法，进行工具调用。
- 支持`with_structured_output`方法，进行结构化输出。
- 支持传递`BaseChatOpenAI`的参数，例如`temperature`、`top_p`、`max_tokens`等。
- 支持传递多模态数据
- 支持OpenAI最新的`responses api`

:::details 普通调用

支持`invoke`进行简单的调用：
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = model.invoke([HumanMessage("Hello")])
print(response)
```
同时也支持`ainvoke`进行异步调用：
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
response = await model.ainvoke([HumanMessage("Hello")])
print(response)
```
:::

::: details 流式输出

支持`stream`进行流式输出：
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
for chunk in model.stream([HumanMessage("Hello")]):
    print(chunk)
```
以及`astream`进行异步流式调用：
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b")
async for chunk in model.astream([HumanMessage("Hello")]):
    print(chunk)
```
:::

::: details 工具调用

如果模型本身支持工具调用，那么可以直接使用`bind_tools`方法进行工具调用：
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

支持结构化输出，默认采用`function_calling`方法，因此模型需要支持工具调用：
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
同时，如果你的模型提供商支持`json_mode`，则可在注册模型提供商时，将`provider_config`参数中的`support_json_mode`设置为`True`，并在调用`with_structured_output`时将`method`参数指定为`"json_mode"`以启用该模式。最后请在提示词中明确引导模型按照指定的 JSON Schema 格式输出结构化数据。
:::

::: details 传递模型参数

除此之外，由于该类继承了`BaseChatOpenAI`,因此支持传递`BaseChatOpenAI`的模型参数，例如`temperature`, `extra_body`等：
```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b",extra_body={"chat_template_kwargs": {"enable_thinking": False}}) #利用extra_body传递额外参数，这里是关闭思考模式
response = model.invoke([HumanMessage("Hello")])
print(response)
```
:::

::: details 传递多模态数据

支持传递多模态数据，你可以使用 OpenAI 兼容的多模态数据格式或者直接使用`langchain`中的`content_block`。例如：
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
            {"type": "text", "text": "描述这张图片"},
        ]
    )
]

model = load_chat_model("openrouter:qwen/qwen3-vl-8b-thinking")
response = model.invoke(messages)
print(response)
```
:::

::: details OpenAI 最新的`responses_api`

该模型类也支持 OpenAI 最新的`responses_api`。但是目前仅有少量的提供商支持该风格的 API。如果你的模型提供商支持该 API 风格，则可以在传入`use_responses_api`参数为`True`。
例如 vllm 支持`responses_api`，则可以这样使用：

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_core.messages import HumanMessage

model = load_chat_model("vllm:qwen3-4b", use_responses_api=True)
response = model.invoke([HumanMessage(content="你好")])
print(response)
```
:::

### 兼容官方提供商

对于 LangChain 官方已支持的提供商（如 `openai`），可直接使用 `load_chat_model` 无需注册：

```python
model = load_chat_model("openai:gpt-4o-mini")
# 或
model = load_chat_model("gpt-4o-mini", model_provider="openai")
```

<BestPractice>
    <p>对于本模块的使用，可以根据下面三种情况进行选择：</p>
    <ol>
        <li>若接入的所有模型提供商均被官方 <code>init_chat_model</code> 支持，请直接使用官方函数，以获得最佳兼容性和稳定性。</li>
        <li>若接入的部分模型提供商为非官方支持，可使用本模块的功能，先利用<code>register_model_provider</code>注册模型提供商，然后使用<code>load_chat_model</code>加载模型。</li>
        <li>若接入的模型提供商暂无适合的集成，但提供商提供了 OpenAI 兼容的 API（如 vLLM、OpenRouter），则推荐使用本模块的功能，先利用<code>register_model_provider</code>注册模型提供商（chat_model传入<code>openai-compatible</code>），然后使用<code>load_chat_model</code>加载模型。</li>
    </ol>
</BestPractice>
