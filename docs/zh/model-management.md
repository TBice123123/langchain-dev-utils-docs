# 模型管理

> [!NOTE]
>
> **功能概述**：提供更高效、更便捷的模型管理（包括对话模型和嵌入模型）。
>
> **前置要求**：了解 langchain 的[对话模型](https://docs.langchain.com/oss/python/langchain/models)和[嵌入模型](https://docs.langchain.com/oss/python/integrations/text_embedding/)。
>
> **预计阅读时间**：10 分钟

## 对话模型管理

在 `langchain` 中，`init_chat_model` 函数可用于初始化对话模型实例，但其支持的模型提供商较为有限。如果你希望使用更多模型提供商（尤其是你偏好的提供商未被该函数支持），可以借助本库提供的对话模型管理功能来实现。

使用对话模型时，需要先使用`register_model_provider`注册对话模型提供商，然后才能使用`load_chat_model`加载对话模型。

### 注册对话模型提供商

注册对话模型提供商的函数是`register_model_provider`，其接收以下参数：

- `provider_name`：对话模型提供商名称，类型为`str`
- `chat_model`：对话模型，类型为`langchain`的`ChatModel`或者`str`
- `base_url`：对话模型基础 URL，类型为`str`，仅在`chat_model`为`str`时生效

对于`provider_name`你可以传入自定义的模型提供商名称，而`chat_model`则需要传入`langchain`的`ChatModel`或者`str`。对于这个参数的详细介绍如下：

**1.类型为 ChatModel**

示例代码如下：

```python
from langchain_core.language_models.fake_chat_models import FakeChatModel
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="fakechat",
    chat_model=FakeChatModel,
)
```

在本示例中，我们使用的是 `langchain_core` 内置的 `FakeChatModel`，它仅用于测试，并不对接真实的模型提供商。在实际应用中，应传入一个具有实际功能的 `ChatModel` 类。

**2.类型为 str**

当 `chat_model` 参数为字符串时，其目前唯一取值为 `"openai-compatible"`，表示将通过模型提供商的 OpenAI 兼容 API 进行接入。因为目前很多模型提供商都支持 OpenAI 兼容 API，例如 vllm、openrouter、together 等。
此时，本库会使用内置的 `OpenAICompatibleChatModel` 作为实际的聊天模型。

`OpenAICompatibleChatModel` 继承自 `langchain-openai` 中的 `BaseChatOpenAI`，并在其基础上进行了多项兼容性优化。为确保功能正常，请务必安装标准版的 `langchain-dev-utils`（安装方法详见 [安装文档](./installation.md)）。

相较于直接使用 `langchain-openai` 提供的 `ChatOpenAI`，本库的 `OpenAICompatibleChatModel` 具有以下优势：

1. **支持输出更多类型的思维链内容（`reasoning_content`）**：  
   `ChatOpenAI` 仅能输出官方 OpenAI 模型原生支持的思维链内容，而 `OpenAICompatibleChatModel` 可输出其它模型提供商的思维链内容（例如 openrouter 等）。

2. **优化结构化输出的默认行为**：  
   在调用 `with_structured_output` 时，`method` 参数的默认值被调整为 `"function_calling"`（而非 `ChatOpenAI` 默认的 `"json_schema"`），从而更好地兼容其它模型。

对于`chat_model`为字符串（具体是`"openai-compatible"`）的情况，你必须提供`base_url`。你可以通过直接在本函数中传递`base_url`，或者设置模型的提供商的`API_BASE`。

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

### 加载对话模型

加载对话模型的函数是`load_chat_model`，其接收以下参数：

- `model`：对话模型名称，类型为`str`
- `model_provider`：对话模型提供商名称，类型为`str`，可选
- `kwargs`：其它额外的参数

对于`model`参数，其支持的格式如下：

- `provider_name:model_name`
- `model_name`

其中`provider_name`为`register_model_provider`函数中注册的`provider_name`。

对于`model_provider`参数，含义和上述的`provider_name`相同，允许不传，但是此时`model`参数必须为`provider_name:model_name`格式，如果传入，则`model`参数必须为`model_name`格式。
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

**注意**：虽然`vllm`本身可以不要求 api_key,但是由于这个`OpenAICompatibleChatModel`需要`api_key`，因此你必须设置`api_key`。

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
除此之外，由于其采用的`ChatModel`继承了`BaseChatOpenAI`,因此支持传递`BaseChatOpenAI`的模型参数，例如`temperature`, `extra_body`等。
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

### 批量注册

如果你需要注册多个模型提供商，可以多次使用`register_model_provider`函数。但是这样显然特别麻烦，因此本库提供了一个批量注册的函数`batch_register_model_provider`。

其接收的参数是 providers，其为一个字典列表，每个字典有三个键分别是`provider`、`chat_model`、`base_url`。

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
            "provider": "fakechat",
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

model = load_chat_model("fakechat:fake-chat")
print(model.invoke("Hello"))
```

## 嵌入模型管理

与`init_chat_model`类似，`langchain`也提供了`init_embeddings`函数用于初始化嵌入模型，但是其支持的模型提供商仍然有限，因此你也可以使用本库的功能方便进行嵌入模型的管理。

使用嵌入模型时，需要先使用`register_embeddings_provider`注册嵌入模型提供商，然后才能使用`load_embeddings`加载嵌入模型。

### 注册嵌入模型提供商

与注册对话模型提供商类似，注册嵌入模型提供商的函数是`register_embeddings_provider`，其接收以下参数：

- `provider_name`：嵌入模型提供商名称，类型为`str`
- `embeddings_model`：嵌入模型，类型为`langchain`的`Embeddings`或者`str`
- `base_url`：嵌入模型基础 URL，类型为`str`，仅在`embeddings_model`为`str`时生效

对于`provider_name`你可以传入自定义的模型提供商名称，而`embeddings_model`则需要传入`langchain`的`Embeddings`或者`str`。对于这个参数的详细介绍如下：

**1.类型为 Embeddings**

示例代码如下：

```python
from langchain_dev_utils.embeddings import load_embeddings, register_embeddings_provider
from langchain_core.embeddings.fake import FakeEmbeddings

register_embeddings_provider(
    provider_name="fakeembeddings",
    embeddings_model=FakeEmbeddings,
)
```

在本示例中，我们使用的是 `langchain_core` 内置的 `FakeEmbeddings`，它仅用于测试，并不对接真实的模型提供商。在实际应用中，应传入一个具有实际功能的 `Embeddings` 类。

**2.类型为 str**

与对话模型类似，当 `embeddings_model` 参数为字符串时，其目前唯一取值为 `"openai-compatible"`，表示将通过模型提供商的 OpenAI 兼容 API 进行接入。
此时，本库会使用内置的 `OpenAIEmbeddings` 作为实际的嵌入模型。
需要注意的是，`OpenAIEmbeddings` 默认会对输入文本进行 tokenize，这在接入其他兼容 OpenAI API 的嵌入模型时可能导致错误。为解决此问题，本库在加载模型时已显式将 `check_embedding_ctx_length` 参数设为 `False`，从而跳过 tokenize 步骤，避免兼容性问题。
对于`embeddings_model`为字符串（具体是`"openai-compatible"`）的情况，你也必须提供`base_url`。你可以通过直接在本函数中传递`base_url`，或者设置模型的提供商的`API_BASE`。

例如，假设我们要使用 vllm 部署的模型，那么可以这样设置：

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

或者这样设置：

```bash
export VLLM_API_BASE=http://localhost:8000/v1
```

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible"
)
```

::: tip 补充
`vllm`同时可以部署 Embeddings 模型，参考的指令如下:

```bash
vllm serve Qwen/Qwen3-Embedding-4B \
--task embed\
--served-model-name qwen3-embedding-4b \
--host 0.0.0.0 --port 8000
```

完成后会提供一个 OpenAI 兼容 API，地址为`http://localhost:8000/v1`。
:::

### 加载嵌入模型

加载嵌入模型的函数是`load_embeddings`，其接收以下参数：

- `model`：嵌入模型名称，类型为`str`
- `provider`：嵌入模型提供商名称，类型为`str`，可选
- `kwargs`：其它额外的参数

对于`model`参数，其支持的格式如下：

- `provider_name:embeddings_name`
- `embeddings_name`

其中`provider_name`为`register_embeddings_provider`函数中注册的`provider_name`。

对于`provider`参数，含义和上述的`provider_name`相同，允许不传，但是此时`model`参数必须为`provider_name:embeddings_name`格式，如果传入，则`model`参数必须为`embeddings_name`格式。
示例代码如下：

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("vllm:qwen3-embedding-4b")
emb = embeddings.embed_query("Hello")
print(emb)
```

也可以直接传入`provider`参数。

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("qwen3-embedding-4b", provider="vllm")
emb = embeddings.embed_query("Hello")
print(emb)
```

### 批量注册

与对话模型类似,也提供了一个用于批量注册嵌入模型提供商的函数`batch_register_embeddings_provider`。
参考代码如下:

```python
from langchain_dev_utils.embeddings import (
    batch_register_embeddings_provider,
    load_embeddings,
)
from langchain_core.embeddings.fake import FakeEmbeddings

batch_register_embeddings_provider(
    providers=[
        {
            "provider": "fakeembeddings",
            "embeddings_model": FakeEmbeddings,
        },
        {
            "provider": "vllm",
            "embeddings_model": "openai-compatible",
            "base_url": "http://localhost:8000/v1",
        },
    ]
)

embedding = load_embeddings("vllm:qwen3-embedding-4b")
emb = embedding.embed_query("Hello")
print(emb)

embedding = load_embeddings(
    "fakeembeddings:fake-emb", size=1024
)  # size参数不是必须的,是FakeEmbeddings进行初始化必须要传入的,你的Embeddings模型可能不需要
emb = embedding.embed_query("Hello")
print(emb)
```

## 注意

`register_model_provider`、`register_embeddings_provider` 及其对应的批量注册函数 `batch_register_model_provider` 和 `batch_register_embeddings_provider` 均基于一个全局字典实现。为避免多线程并发问题，请务必在项目启动阶段完成所有注册操作，切勿在运行时动态注册。
