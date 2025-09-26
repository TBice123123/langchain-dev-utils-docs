# 🚀 Getting Started Guide

Welcome to **`langchain-dev-utils`** — a powerful, practical utility library designed specifically for developers building applications with langchain and langgraph. We’ve encapsulated commonly used modules to help you build, debug, and optimize large language model (LLM) applications with greater ease, boosting both development efficiency and engineering experience.

## 📌 Core Feature Modules

`langchain-dev-utils` currently offers five core modules:

1. **Model Management**  
   Unified registration and management of any model provider — invoke chat and embedding models with a single function call, eliminating the need to repeatedly import third-party integrations.

2. **Message Processing**  
   Flexible utilities for handling messages: supports chunk merging, inference content aggregation, tool call parsing, and more.

3. **Tool Enhancement**  
   Dynamically extend existing tools with new capabilities — for example, adding human-in-the-loop support during tool invocation.

4. **Context Engineering**  
   Practical tools and corresponding State Schemas to simplify context management, enabling better handling of multi-turn conversations and external context.

5. **Graph Orchestration**  
   Combine multiple StateGraphs in parallel or sequential workflows to build complex, scalable agent systems.

## 🛠️ Quick Start

Install the library with just one command:

```bash
# Using pip
pip install -U langchain-dev-utils

# Using Poetry
poetry add langchain-dev-utils

# Using uv (recommended — ultra-fast installation)
uv add langchain-dev-utils
```

Once installed, simply import and start using the library in your project.

## 📘 Next Steps

- [Installation](./installation.md) — How to install this library
- [Model Management](./model-management.md) — Unified registration and management of chat and embedding models
- [Message Processing](./message-processing.md) — Utility functions for message handling, such as chunk concatenation
- [Tool Enhancement](./tool-enhancement.md) — Add new functionality to existing tools
- [Context Engineering](./context-engineering.md) — Practical tools and State Schemas for context management
- [Graph Orchestration](./graph-orchestration.md) — Combine multiple StateGraphs in parallel or serial workflows
- [API Reference](./api-reference.md) — Complete API documentation
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage

> If you’re building a simple LLM application, you’ll likely only need **Model Management** and **Message Processing**.  
> For complex agent systems, you’ll want to leverage additional modules like **Tool Enhancement**, **Context Engineering**, and **Graph Orchestration** on top of the basics.

---

## 💬 Join the Community

- 🐙 [GitHub Repository](https://github.com/TBice123123/langchain-dev-utils) — Browse source code, submit pull requests
- 🐞 [Issue Tracker](https://github.com/TBice123123/langchain-dev-utils/issues) — Report bugs or suggest improvements
- 💡 We welcome contributions — whether it’s code, documentation, or usage examples. Help us build a stronger, more powerful ecosystem of practical langchain development tools!
