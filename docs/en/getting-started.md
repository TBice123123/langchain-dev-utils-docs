# 🚀 Getting Started Guide

Welcome to **`langchain-dev-utils`** — a high-efficiency utility library designed specifically for LangChain and LangGraph developers. We’ve encapsulated commonly used functional modules to help you build, debug, and optimize Large Language Model (LLM) applications more easily—boosting your development efficiency and engineering experience.

## 📌 Core Functional Modules

Currently, `langchain-dev-utils` provides four core modules:

1. **Model Management**  
   Unified registration and management of any model provider. Invoke chat and embeddings models with just one function call—no more repetitive imports of third-party integration libraries.

2. **Message Processing**  
   Flexible message handling tools: supports chunk merging, reasoning content consolidation, tool call parsing, and more.

3. **Tool Enhancement**  
   Simplifies the LangChain Tools development workflow with built-in decorators, making it effortless to write or modify tools.

4. **Context Engineering**  
   Provides advanced tools and state mixin classes for context engineering, helping developers easily implement context management.

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

Once installed, you can import and start using it in your project immediately.

## 📘 Next Learning Steps

- [Installation](./installation.md) — How to install this library
- [Model Management](./model-management.md) — Unified management interface for easily using chat and embeddings models
- [Message Processing](./message-processing.md) — A series of utility functions for Message objects, including chunk merging and more
- [Tool Enhancement](./tool-enhancement.md) — Further simplifies defining and developing LangChain tools
- [Context Engineering](./context-engineering.md) — Advanced tools and corresponding state mixin classes for context engineering
- [API Reference](./api-reference.md) — API reference documentation
- [Example](./example.md) — Example of using the library

---

## 💬 Join Our Community

- 🐙 [GitHub Repository](https://github.com/TBice123123/langchain-dev-utils) — View source code and submit PRs
- 🐞 [Issue Tracker](https://github.com/TBice123123/langchain-dev-utils/issues) — Report bugs or suggest features
- 💡 Contributions of code, documentation, or use cases are warmly welcomed — let’s build together a more powerful LangChain utility ecosystem!
