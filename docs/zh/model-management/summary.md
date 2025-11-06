# 最佳实践指南

## 使用基本原则

### 优先使用官方函数（当使用的所有模型均为官方支持时）

如果你**只使用 LangChain 官方已支持的模型**（如 OpenAI、Anthropic、Google、Mistral 等），请直接使用官方构造方式：

```python
from langchain.chat_models import init_chat_model
from langchain.embeddings import init_embeddings

model = init_chat_model("gpt-4o-mini", model_provider="openai") #对话模型
embeddings = init_embeddings("text-embedding-3-large", provider="openai") #嵌入模型
```

> **优点**：无需额外注册，使用方便，且官方维护稳定

### 仅在需要非官方模型时，才引入本库（`langchain_dev_utils`）

当你需要使用：

- 任何未被 `init_chat_model` / `init_embeddings` 支持的模型提供商
- 模型提供商没有合适的`langchain`集成库，但是提供了 OpenAI 兼容风格的 API 接口

## 注册模型提供商建议

### 注册时机与方式

- **在项目启动时完成所有模型提供商注册**，后续不要再次注册，以免造成多线程并发写入导致错误。
- **注册单个提供商**：使用 `register_model_provider` / `register_embeddings_provider`
- **注册多个提供商**：使用 `batch_register_model_provider` / `batch_register_embeddings_provider`

### 命名规范

- `provider_name` 应使用有意义的命名，如 `vllm`、`openrouter` 等
- 避免使用冒号 `:`，因为该符号用于分隔提供商与模型名称

## 提供商配置建议

### 环境变量管理

**使用环境变量管理敏感信息和地址**：

```bash
# vLLM 本地部署
export VLLM_API_BASE=http://localhost:8000/v1
export VLLM_API_KEY=vllm

# OpenRouter
export OPENROUTER_API_KEY=sk-xxx
export OPENROUTER_API_BASE=https://openrouter.ai/api/v1
```

### `tool_choice` 参数配置

**针对具体场景考虑是否需要配置 `tool_choice` 参数**：

常见的情形是**结构化输出不稳定时**。配置 `tool_choice` 参数可提高稳定性，尤其是模型提供商支持强制调用指定工具时，配置 `tool_choice` 包含 `"specific"`，确保结构化输出不为 `None`

## 模型加载与参数传递

### 基础加载方式

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_dev_utils.embeddings import load_embeddings

# 方式1：provider_name:model_name 格式
model = load_chat_model("vllm:qwen3-4b")
embeddings = load_embeddings("vllm:qwen3-embedding-4b")

# 方式2：分别指定模型名称和提供商
model = load_chat_model("qwen3-4b", model_provider="vllm")
embeddings = load_embeddings("qwen3-embedding-4b", provider="vllm")
```

### 传递额外参数

加载模型时，可以通过 `kwargs` 传递模型初始化所需的额外参数，如 `temperature`、`max_tokens` 等。

```python
# 对话模型：传递温度和额外请求体参数
model = load_chat_model(
    "vllm:qwen3-4b",
    temperature=0.7,
    extra_body={"chat_template_kwargs": {"enable_thinking": False}} # 传递给API的额外参数
)
```

> **注意**：传递的额外参数取决于你使用的具体模型实现。请参考对应模型的文档来确认可用的参数,如果是 openai-compatible 的模型，可以参考`ChatOpenAI`和`OpenAIEmbeddings`。
