# 嵌入模型管理

> [!NOTE]  
> **功能概述**：提供更高效、更便捷的嵌入模型管理，支持多种模型提供商。  
> **前置要求**：了解 LangChain [嵌入模型](https://docs.langchain.com/oss/python/integrations/text_embedding/)。  
> **预计阅读时间**：8 分钟。

## 概述

LangChain 的 `init_embeddings` 函数仅支持有限的嵌入模型提供商。本库提供更灵活的嵌入模型管理方案，特别适用于需要接入未内置支持的嵌入服务（如 vLLM等）的场景。

使用本库的嵌入模型管理功能需要两个步骤：

1. **注册嵌入模型提供商**

使用 `register_embeddings_provider` 注册嵌入模型提供商。其参数定义如下：

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
description="嵌入模型类或标识符"  
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

2. **加载嵌入模型**

使用 `load_embeddings` 实例化具体嵌入模型。其参数定义如下：

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

**注意**：`load_embeddings` 函数同时还能接收任意数量的关键字参数，可用于传递如 `dimension`等额外参数。



## 注册嵌入模型提供商

注册嵌入模型提供商需调用 `register_embeddings_provider`。根据 `embeddings_model` 类型不同，注册方式略有差异。

### 情况一：已有 LangChain 嵌入模型类

若嵌入模型提供商已有现成且合适的LangChain集成（详见 [嵌入模型集成列表](https://docs.langchain.com/oss/python/integrations/text_embedding)），请将相应的嵌入模型类直接传入 `embeddings_model` 参数。

<StepItem step="1" title="设置 provider_name"></StepItem>

传入自定义提供商名称，**不要包含冒号 `:`**。

<StepItem step="2" title="设置 embeddings_model"></StepItem>

传入一个 **`Embeddings` 的子类**。

```python
from langchain_core.embeddings.fake import FakeEmbeddings
from langchain_dev_utils.embeddings import register_embeddings_provider

register_embeddings_provider(
    provider_name="fake_provider",
    embeddings_model=FakeEmbeddings,
)
```

**注意**：`FakeEmbeddings` 仅用于测试。实际使用中必须传入具备真实功能的 `Embeddings` 类。

<StepItem step="3" title="设置 base_url（可选）"></StepItem>

- **通常无需设置**，因为模型类内部已定义 API 地址（如 `api_base` 或 `base_url` 字段）；
- **仅当你需要覆盖默认地址时**才传入 `base_url`；
- 覆盖机制仅对模型类中字段名为 `api_base` 或 `base_url`（含别名）的属性生效。


### 情况二：未有 LangChain 嵌入模型类，但提供商支持 OpenAI 兼容 API

类似于对话模型，很多嵌入模型提供商也提供 **OpenAI 兼容 API**。当无现成 LangChain 集成但支持该协议时，可使用此模式。

系统将使用 `OpenAIEmbeddings`（来自 `langchain-openai`）构建嵌入模型实例，并自动禁用上下文长度检查（设置 `check_embedding_ctx_length=False`）以提升兼容性。

<StepItem step="1" title="设置 provider_name"></StepItem>

传入自定义名称，**不要包含冒号 `:`**。

<StepItem step="2" title="设置 embeddings_model"></StepItem>

必须传入字符串 `"openai-compatible"`。这是当前唯一支持的字符串值。

<StepItem step="3" title="设置 base_url（必需）"></StepItem>

- **必须提供 API 地址**，否则无法初始化；
- 可通过以下任一方式提供：

  **显式传参**：
  ```python
  register_embeddings_provider(
      provider_name="vllm",
      embeddings_model="openai-compatible",
      base_url="http://localhost:8000/v1"
  )
  ```

  **环境变量（推荐）**：
  ```bash
  export VLLM_API_BASE=http://localhost:8000/v1
  ```
  ```python
  register_embeddings_provider(
      provider_name="vllm",
      embeddings_model="openai-compatible"
      # 自动读取 VLLM_API_BASE
  )
  ```

::: info 提示  
环境变量命名规则为 `${PROVIDER_NAME}_API_BASE`（全大写，下划线分隔）。  
对应的 API Key 环境变量为 `${PROVIDER_NAME}_API_KEY`。
:::

::: tip 补充  
vLLM 可部署嵌入模型并暴露 OpenAI 兼容接口，例如：
```bash
vllm serve Qwen/Qwen3-Embedding-4B \
--task embed \
--served-model-name qwen3-embedding-4b \
--host 0.0.0.0 --port 8000
```
服务地址为 `http://localhost:8000/v1`。
:::


## 批量注册

若需注册多个提供商，可使用 `batch_register_embeddings_provider`：

```python
from langchain_dev_utils.embeddings import batch_register_embeddings_provider
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
```

::: warning 注意  
两个注册函数均基于全局字典实现。**必须在应用启动阶段完成所有注册**，禁止运行时动态注册，以避免多线程问题。  
:::


## 加载嵌入模型

使用 `load_embeddings` 初始化嵌入模型实例。参数规则如下：

- 若未传 `provider`，则 `model` 必须为 `provider_name:embeddings_name` 格式；
- 若传 `provider`，则 `model` 仅为 `embeddings_name`。

**示例**：
```python
# 方式一
embedding = load_embeddings("vllm:qwen3-embedding-4b")

# 方式二
embedding = load_embeddings("qwen3-embedding-4b", provider="vllm")
```

### 额外参数支持

可传递任意关键字参数，例如：
```python
embedding = load_embeddings(
    "fake_provider:fake-emb",
    size=1024  # FakeEmbeddings 所需参数
)
```

对于 `"openai-compatible"` 类型，支持 `OpenAIEmbeddings` 的所有参数。

### 兼容官方提供商

对于 LangChain 官方已支持的提供商（如 `openai`），可直接使用 `load_embeddings` 无需注册：

```python
model = load_embeddings("openai:text-embedding-3-large")
# 或
model = load_embeddings("text-embedding-3-large", provider="openai")
```

<BestPractice>
    <p>对于本模块的使用，可以根据下面三种情况进行选择：</p>
    <ol>
        <li>若接入的所有嵌入模型提供商均被官方 <code>init_embeddings</code> 支持，请直接使用官方函数，以获得最佳兼容性。</li>
        <li>若接入的部分嵌入模型提供商为非官方支持，可利用本模块的注册与加载机制，先利用<code>register_embeddings_provider</code>注册模型提供商，然后使用<code>load_embeddings</code>加载模型。</li>
        <li>若接入的嵌入模型提供商暂无适合的集成，但提供商提供了 OpenAI 兼容的 API（如 vLLM、OpenRouter），则推荐利用本模块的功能，先利用<code>register_embeddings_provider</code>注册模型提供商（embeddings_model传入<code>openai-compatible</code>），然后使用<code>load_embeddings</code>加载模型。</li>
    </ol>
</BestPractice>

