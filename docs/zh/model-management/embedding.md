# 嵌入模型管理

> [!NOTE]
>
> **功能概述**：提供更高效、更便捷的嵌入模型管理。
>
> **前置要求**：了解 langchain 的[嵌入模型](https://docs.langchain.com/oss/python/integrations/text_embedding/)。
>
> **预计阅读时间**：10 分钟

与`init_chat_model`类似，`langchain`也提供了`init_embeddings`函数用于初始化嵌入模型，但是其支持的模型提供商仍然有限，因此你也可以使用本库的功能方便进行嵌入模型的管理。

使用嵌入模型时，需要先使用`register_embeddings_provider`注册嵌入模型提供商，然后才能使用`load_embeddings`加载嵌入模型。

## 注册嵌入模型提供商

与注册对话模型提供商类似，注册嵌入模型提供商的函数是`register_embeddings_provider`，其接收以下参数：

<Params
name="provider_name"
type="string"
description="嵌入模型提供商名称"
:required="true"
:default="null"
/>
<Params
name="embeddings_model"
type="Embeddings | string"
description="嵌入模型"
:required="true"
:default="null"
/>
<Params
name="base_url"
type="string"
description="嵌入模型基础 URL"
:required="false"
:default="null"
/>

对于该函数的使用，具体如下：

<StepItem step="1" title="设置 provider_name"></StepItem>

与对话模型提供商类似，`provider_name`参数接收一个字符串，该字符串可以自定义。

<StepItem step="2" title="设置 embeddings_model"></StepItem>

对于`embeddings_model`参数，它接收两种类型：`langchain` 的 `Embeddings` 或者 `str`。

对于这个参数的不同类型，我们分别介绍：

**1.类型为 Embeddings**

示例代码如下：

```python
from langchain_dev_utils.embeddings import load_embeddings, register_embeddings_provider
from langchain_core.embeddings.fake import FakeEmbeddings

register_embeddings_provider(
    provider_name="fake_provider",
    embeddings_model=FakeEmbeddings,
)
```

在本示例中，我们使用的是 `langchain_core` 内置的 `FakeEmbeddings`，它仅用于测试，并不对接真实的模型提供商。**在实际应用中，应传入一个具有实际功能的 `Embeddings` 类。**

**2.类型为 str**

与对话模型类似，当 `embeddings_model` 参数为字符串时，其目前唯一取值为 `"openai-compatible"`，表示将通过模型提供商的 OpenAI 兼容 API 进行接入。
此时，本库使用`langchain-openai`的 `OpenAIEmbeddings` 作为实际的嵌入模型。
需要注意的是，`OpenAIEmbeddings` 默认会对输入文本进行 tokenize，这在接入其他兼容 OpenAI API 的嵌入模型时可能导致错误。为解决此问题，本库在加载模型时已显式将 `check_embedding_ctx_length` 参数设为 `False`，从而跳过 tokenize 步骤，避免兼容性问题。

<StepItem step="3" title="设置 base_url（可选）"></StepItem>

接下来，需要根据**实际情况**决定是否设置嵌入模型提供商的 API 地址（即`base_url`参数）。该步骤**并非总是必需**，具体取决于 `embeddings_model` 的类型：

- **当 `embeddings_model` 为字符串且值为 `"openai-compatible"` 时**：  
  必须显式提供 `base_url` 参数，或通过环境变量指定 API 地址。否则嵌入模型客户端无法初始化，因为系统无法推断 API 端点。

- **当 `embeddings_model` 为 `Embeddings` 类型时**：  
   嵌入模型的 API 地址通常已在类中定义，无需额外配置 `base_url`。  
   **仅当你需要覆盖该类内置的默认 API 地址时**，才需显式传入 `base_url` 参数或通过环境变量设置；此覆盖仅对类中字段名为 `api_base` 或 `base_url` 的属性生效（包括字段别名 alias 为这两个名称的情况）。

例如，假设我们要使用 vLLM 部署的 OpenAI 兼容的嵌入模型，那么可以这样设置：

**方法一：直接传入 `base_url`**

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)
```

**方法二：通过环境变量配置**

```bash
export VLLM_API_BASE=http://localhost:8000/v1
```

然后在代码中省略 `base_url`：

```python
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="vllm",
    embeddings_model="openai-compatible"
    # 自动读取 VLLM_API_BASE 环境变量
)
```

> 💡 提示：环境变量命名规则为 `${PROVIDER_NAME}_API_BASE`（全大写，下划线分隔）。

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

## 批量注册

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
            "provider_name": "fake_provider",
            "embeddings_model": FakeEmbeddings,
        },
        {
            "provider_name": "vllm",
            "embeddings_model": "openai-compatible",
            "base_url": "http://localhost:8000/v1",
        },
    ]
)

embedding = load_embeddings("vllm:qwen3-embedding-4b")
emb = embedding.embed_query("Hello")
print(emb)

embedding = load_embeddings(
    "fake_provider:fake-emb", size=1024
)  # size参数不是必须的,是FakeEmbeddings进行初始化必须要传入的,你的Embeddings模型可能不需要
emb = embedding.embed_query("Hello")
print(emb)
```

::: warning 注意
`register_embeddings_provider` 及其对应的批量注册函数 `batch_register_embeddings_provider` 均基于一个全局字典实现。为避免多线程并发问题，请务必在项目启动阶段完成所有注册操作，切勿在运行时动态注册。
:::

## 加载嵌入模型

加载嵌入模型的函数是`load_embeddings`，其接收以下参数：

<Params
name="model"
type="string"
description="嵌入模型名称"
:required="true"
:default="null"
/>
<Params
name="provider"
type="string"
description="嵌入模型提供商名称"
:required="false"
:default="null"
/>
对于本函数的使用，需要注意以下几点：

**1.额外参数**

该函数还能接收任意数量个关键字参数，例如 `dimension` 等,具体参考对应的模型集成类文档（如果 embeddings_model 是 `openai-compatible`，则可以参考 `OpenAIEmbeddings`）。

**2.model 参数格式**

`model` 参数支持以下两种格式：

- `provider_name:embeddings_name`
- `embeddings_name`

其中，`provider_name` 是通过 `register_embeddings_provider` 函数注册的提供商名称。

`provider` 参数与上述 `provider_name` 含义相同，为可选参数：

- 若未传入 `provider`，则 `model` 参数必须为 `provider_name:embeddings_name` 格式；
- 若传入 `provider`，则 `model` 参数必须为 `embeddings_name` 格式。

示例代码如下：

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("vllm:qwen3-embedding-4b")
emb = embeddings.embed_query("Hello")
print(emb)
```

也可以直接传入**provider**参数。

```python
from langchain_dev_utils.embeddings import load_embeddings

embeddings = load_embeddings("qwen3-embedding-4b", provider="vllm")
emb = embeddings.embed_query("Hello")
print(emb)
```

**3.与官方函数的兼容情况**

与对话模型类似，对于官方 `init_embeddings` 函数已支持的模型提供商，你也可以直接使用 `load_embeddings` 函数进行加载，无需额外注册。因此，如果你需要同时接入多个模型，其中部分提供商为官方支持，另一部分不支持，可以考虑统一使用 `load_embeddings` 进行加载。例如：

```python
from langchain_dev_utils.embeddings import load_embeddings

# 加载模型时，需要同时指定提供商和模型的名称
model = load_embeddings("openai:text-embedding-3-large")
# 或者显式指定 provider 参数
model = load_embeddings("text-embedding-3-large", provider="openai")
```

<BestPractice>
对于本模块功能的使用建议与对话模型模块类似，具体可以参考对话模型模块的使用建议。
</BestPractice>
