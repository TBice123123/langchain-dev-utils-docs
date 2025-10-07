# Langchain Dev Utils

欢迎使用`langchain-dev-utils`文档！

`langchain-dev-utils` 是一个专为使用 `langchain` 和 `langgraph` 构建大模型应用的开发者打造的综合性工具库，集成了高效实用的开发工具函数。

## 快速开始

### 🚀 开始使用

从[入门指南](./getting-started.md)开始，了解库的功能和特性。

### 📦 安装

按照[安装指南](./installation.md)在您的项目中设置库。

### 📚 文档

- [入门指南](./getting-started.md) - 概述和快速开始
- [安装](./installation.md) - 如何安装本库
- [模型管理](./model-management.md) - 提供统一的注册管理方式，方便开发者使用 chat 和 embeddings 模型。
- [消息处理](./message-processing.md) - 提供与 Message 相关的工具函数，例如 chunk 拼接。
- [工具增强](./tool-enhancement.md) - 在已定义的 tools 中添加新的功能。
- [上下文工程](./context-engineering.md) - 提供用于帮助上下文工程管理的实用性 tools 以及相关的状态 Schema。
- [状态图编排](./graph-orchestration.md) - 将多个状态图(StateGraph)以并行或者串行的方式组合在一起。
- [API 参考](./api-reference.md) - API 参考文档
- [使用示例](./example.md) - 介绍本库的使用示例

### 🛠️ 主要特性

- **统一模型管理**：提供集中化的 chat 与 embeddings 模型注册与调用机制，简化多模型接入与切换，提升开发效率与一致性。
- **高效的消息处理**：提供与消息处理相关的工具函数，支持工具调用检测与结果解析、大模型流式返回处理等实用函数。
- **可扩展工具增强**：在现有工具基础上灵活添加新功能，支持动态扩展与定制化能力，满足多样化业务需求。
- **高级上下文工程**：提供上下文感知的高级工具以及对应的状态 Schema，增强模型对多轮对话、历史信息与外部上下文的理解与利用能力。
- **灵活状态图编排**：支持以并行或串行方式组合多个 StateGraph，实现复杂工作流的灵活编排。

### 📖 GitHub 仓库

访问 [GitHub 仓库](https://github.com/TBice123123/langchain-dev-utils) 查看源代码和问题。

---

文档最后更新：2025-10-07
