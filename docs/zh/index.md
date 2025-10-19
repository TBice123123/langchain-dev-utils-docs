# langchain-dev-utils

在使用 langchain 和 langgraph 构建复杂的大语言模型应用时，其开发过程并不总是高效的，开发者往往需要为常规功能编写大量样板代码。为了帮助开发者更专注于核心业务的编写，`langchain-dev-utils` 应运而生。

这是一个轻量但实用的工具库，聚焦于提升 langchain 与 langgraph 的开发体验。它提供了一系列开箱即用的实用性工具函数，从而做到减少重复代码，增强代码的一致性与可读性。通过简化开发路径，`langchain-dev-utils` 让您能够更快地实现功能原型、更顺畅地推进迭代，助力构建更清晰、更可靠的 AI 大模型应用。

## 📦 安装

本库可以使用所有的 Python 依赖管理工具进行安装，例如 pip、poetry、uv 等。具体安装方式如下：

::: code-group

```sh[pip]
pip install -U langchain-dev-utils
```

```sh[poetry]
poetry add langchain-dev-utils
```

```sh[uv]
uv add langchain-dev-utils
```

:::

另外，如果你想要了解更多的安装方式请参考[安装](./installation.md)。

## 📚 文档

- [模型管理](./model-management.md) - 提供统一的注册管理方式，方便开发者使用 chat 和 embeddings 模型。
- [消息转换](./message-conversion.md) - 提供与 Message 类相关的工具函数包括思维链拼接、chunk 合并、列表字符串格式化等。
- [工具调用](./tool-calling.md) - 提供与工具调用相关的工具函数，包括工具调用检测与参数解析、在工具调用中添加人工审核等。
- [Agent 开发](./agent-development.md) - 提供方便进行 Agent 开发的工具函数，包括官方 Agent 创建函数的进一步封装、常用中间件、上下文工程管理等。
- [状态图编排](./graph-orchestration.md) - 提供管道工具函数，将多个状态子图(StateGraph)以并行或者串行的方式组合在一起。

### 🛠️ 主要特性

- **统一模型管理**：提供集中化的 chat 与 embeddings 模型注册与调用机制，简化多模型接入与切换，提升开发效率与一致性。
- **高效的消息处理**：提供与消息处理相关的工具函数，支持工具调用检测与结果解析、大模型流式返回处理等实用函数。
- **工具调用增强**：提供与工具调用相关的工具函数，进一步方便工具调用的过程实现。
- **更高效的 Agent 开发**：提供上下文工程管理、中间件等工具函数和 Python 类，方便进行 Agent 开发。
- **灵活状态图编排**：支持以并行或串行方式组合多个 StateGraph，实现复杂工作流的灵活编排。

### 📖 GitHub 仓库

访问 [GitHub 仓库](https://github.com/TBice123123/langchain-dev-utils) 查看源代码和问题。
