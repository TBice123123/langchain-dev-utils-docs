# 🚀 入门指南

欢迎使用 **`langchain-dev-utils`** —— 专为 LangChain 与 LangGraph 开发者打造的高效实用工具库。我们封装了常用功能模块，助你更轻松地构建、调试和优化大型语言模型（LLM）应用，提升开发效率与工程体验。

## 📌 核心功能模块

目前，`langchain-dev-utils` 提供五大核心模块：

1. **模型管理**  
   统一注册与管理任何的模型提供商，一个函数调用 chat 与 embeddings 模型，告别重复导入第三方集成库。

2. **消息处理**  
   提供灵活的消息处理工具：支持 chunks 合并、推理内容合并、工具调用解析等。

3. **工具增强**  
   在已有的 tools 中添加新的功能（例如增加工具调用中的人在回路支持）。

4. **上下文工程**  
   提供方便上下文工程管理的实用性工具以及对应的状态 Schema。

5. **状态图编排**  
   将多个状态图（StateGraph）以并行或者串行的方式组合在一起。

## 🛠️ 快速开始

只需一行命令即可安装：

```bash
# 使用 pip
pip install -U langchain-dev-utils

# 使用 poetry
poetry add langchain-dev-utils

# 使用 uv（推荐，极速安装）
uv add langchain-dev-utils
```

安装完成后，即可在项目中导入使用。

## 📘 下一步学习路径

- [安装](./installation.md) - 如何安装本库
- [模型管理](./model-management.md) - 提供统一的注册管理方式，方便开发者使用 chat 和 embeddings 模型。
- [消息处理](./message-processing.md) - 提供与 Message 相关的工具函数，例如 chunk 拼接。
- [工具增强](./tool-enhancement.md) - 在已定义的 tools 中添加新的功能。
- [上下文工程](./context-engineering.md) - 提供用于帮助上下文工程管理的实用性 tools 以及相关的状态 Schema。
- [状态图编排](./graph-orchestration.md) - 将多个状态图(StateGraph)以并行或者串行的方式组合在一起。
- [API 参考](./api-reference.md) - API 参考文档
- [使用示例](./example.md) - 介绍本库的使用示例

> 如果你构建的是简单的大模型应用，那么你可能需要的是模型管理和消息处理。如果构建的是复杂的智能体系统，那么你可能在之前的基础上额外还要使用工具增强、上下文工程、状态图编排等模块。

---

## 💬 加入社区

- 🐙 [GitHub 仓库](https://github.com/TBice123123/langchain-dev-utils) —— 查看源码、提交 PR
- 🐞 [问题反馈](https://github.com/TBice123123/langchain-dev-utils/issues) —— 报告 Bug 或提出建议
- 💡 欢迎贡献代码、文档或使用案例，共建更强大的 LangChain 实用开发工具生态。
