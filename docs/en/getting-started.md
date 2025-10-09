# 🚀 Getting Started Guide

Welcome to **`langchain-dev-utils`** — a powerful, practical utility library designed specifically for developers building applications with langchain and langgraph. We’ve encapsulated commonly used modules to help you build, debug, and optimize large language model (LLM) applications with greater ease, boosting both development efficiency and engineering experience.

## 📌 Core Feature Modules

`langchain-dev-utils` provides six core feature modules:

Among them, the following five are key modules:

1. **Model Management**  
   Unified registration and management of any model provider, with a single function call to chat and embeddings models, avoiding redundant imports of third-party libraries.

2. **Message Processing**  
   Provides versatile message processing tools, including chunk concatenation, content deduction, and tool call parsing.

3. **Tool Enhancement**  
   Dynamically extend existing tools with new capabilities, such as adding human-in-the-loop support to tool calls.

4. **Context Engineering**  
   Provides practical tools and corresponding State Schemas for context management.

5. **Graph Orchestration**  
   Combines multiple StateGraphs in parallel or serial workflows.

In addition, there is a **prebuilt agent module** that extends the official prebuilt Agent's model selection.

## 🛠️ Quick Start

Install the library with just one command:

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

Once installed, simply import and start using the library in your project.

## 📘 Next Steps

- [Installation](./installation.md) — How to install this library.
- [Model Management](./model-management.md) — Unified registration and management of chat and embedding models.
- [Message Processing](./message-processing.md) — Utility functions for message handling, such as chunk concatenation.
- [Tool Enhancement](./tool-enhancement.md) — Add new functionality to existing tools.
- [Context Engineering](./context-engineering.md) — Practical tools and State Schemas for context management.
- [Graph Orchestration](./graph-orchestration.md) — Combine multiple StateGraphs in parallel or serial workflows.
- [Prebuilt Agent](./prebuilt.md) — Effectively aligns with the prebuilt Agent of the official library, but extends its model selection.
- [API Reference](./api-reference.md) — Complete API documentation.
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage.

> If you’re building a simple LLM application, you’ll likely only need **Model Management** and **Message Processing**.  
> For complex agent systems, you’ll want to leverage additional modules like **Tool Enhancement**, **Context Engineering**, and **Graph Orchestration** on top of the basics.

---

## 💬 Join the Community

- 🐙 [GitHub Repository](https://github.com/TBice123123/langchain-dev-utils) — Browse source code, submit pull requests
- 🐞 [Issue Tracker](https://github.com/TBice123123/langchain-dev-utils/issues) — Report bugs or suggest improvements
- 💡 We welcome contributions — whether it’s code, documentation, or usage examples. Help us build a stronger, more powerful ecosystem of practical langchain development tools!
