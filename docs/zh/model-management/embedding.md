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

- **provider_name**：嵌入模型提供商名称，类型为 str
- **embeddings_model**：嵌入模型，类型为 langchain 的 Embeddings 或者 str
- **base_url**：嵌入模型基础 URL，类型为 str，仅在 embeddings_model 为 str 时生效

### 设置 provider_name

与对话模型提供商类似，`provider_name`参数接收一个字符串，该字符串可以自定义。

### 设置 embeddings_model

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

### 设置 base_url（可选）

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

## 加载嵌入模型

加载嵌入模型的函数是`load_embeddings`，其接收以下参数：

- **model**：嵌入模型名称，类型为 str
- **provider**：嵌入模型提供商名称，类型为 str，可选
- **kwargs**：其它额外的参数

对于**model**参数，其支持的格式如下：

- provider_name:embeddings_name
- embeddings_name

其中**provider_name**为`register_embeddings_provider`函数中注册的`provider_name`。

对于**provider**参数，含义和上述的**provider_name**相同，允许不传，但是此时**model**参数必须为**provider_name:embeddings_name**格式，如果传入，则**model**参数必须为**embeddings_name**格式。
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
            "provider": "fake_provider",
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
    "fake_provider:fake-emb", size=1024
)  # size参数不是必须的,是FakeEmbeddings进行初始化必须要传入的,你的Embeddings模型可能不需要
emb = embedding.embed_query("Hello")
print(emb)
```

## 注意

`register_embeddings_provider` 及其对应的批量注册函数 `batch_register_embeddings_provider` 均基于一个全局字典实现。为避免多线程并发问题，请务必在项目启动阶段完成所有注册操作，切勿在运行时动态注册。
