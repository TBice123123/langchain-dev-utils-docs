# 🚀 Getting Started

Welcome to **`langchain-dev-utils`** — a powerful, practical utility library designed specifically for developers building applications with LangChain and LangGraph. We’ve encapsulated commonly used modules to help you build, debug, and optimize large language model (LLM) applications with greater ease, boosting both development efficiency and engineering experience.

## 📌 Core Modules

`langchain-dev-utils` currently offers five core modules:

1. **Model Management**  
   Uniformly register and manage any model provider — call chat and embeddings models with a single function, eliminating the need to repeatedly import third-party integrations.

2. **Message Processing**  
   Flexible message handling utilities: support chunk merging, inference content consolidation, and tool call result parsing.

3. **Tool Enhancement**  
   Extend existing tools with new capabilities (e.g., adding human-in-the-loop support during tool calls).

4. **Context Engineering**  
   Practical tools and corresponding state schemas to simplify context engineering management.

5. **Graph Orchestration**  
   Combine multiple StateGraphs in parallel or serial configurations.

## 🛠️ Quick Start

Install with just one command:

```bash
# Using pip
pip install -U langchain-dev-utils

# Using poetry
poetry add langchain-dev-utils

# Using uv (recommended — ultra-fast installation)
uv add langchain-dev-utils
```

Once installed, simply import and use it in your project.

## 📘 Next Steps

- [Installation](./installation.md) - How to install this library
- [Model Management](./model-management.md) - Provides a unified registration and management system for easy use of chat and embeddings models.
- [Message Processing](./message-processing.md) - Provides utility functions related to Message handling, such as chunk concatenation.
- [Tool Enhancement](./tool-enhancement.md) - Adds new functionality to already defined tools.
- [Context Engineering](./context-engineering.md) - Provides practical tools and associated state schemas for assisting context engineering management.
- [Graph Orchestration](./graph-orchestration.md) - Combines multiple StateGraphs in parallel or sequential configurations.
- [API Reference](./api-reference.md) - API reference documentation
- [Usage Examples](./example.md) - Demonstrates practical usage examples of this library

  > If you are building a simple LLM application, you may only need model management and message processing. If you are building a complex agent system, you may need to use tool enhancement, context engineering, graph orchestration, and other modules in addition to the previous ones.

---

## 💬 Join the Community

- 🐙 [GitHub Repository](https://github.com/TBice123123/langchain-dev-utils) — View source code, submit PRs
- 🐞 [Issues](https://github.com/TBice123123/langchain-dev-utils/issues) — Report bugs or suggest improvements
- 💡 We welcome contributions — code, documentation, or usage examples — to help build a stronger ecosystem of practical LangChain development tools.
