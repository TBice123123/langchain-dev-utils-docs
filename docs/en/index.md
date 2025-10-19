# langchain-dev-utils

When building complex large language model applications using LangChain and LangGraph, the development process isn't always efficient. Developers often need to write substantial boilerplate code for routine functionalities. To help developers focus more on core business logic, `langchain-dev-utils` was created.

This is a lightweight yet practical utility library focused on enhancing the development experience with LangChain and LangGraph. It provides a series of ready-to-use utility functions, thereby reducing repetitive code and enhancing code consistency and readability. By simplifying development paths, `langchain-dev-utils` enables you to prototype features faster and iterate more smoothly, helping you build clearer and more reliable AI large model applications.

## 📦 Installation

This library can be installed using all Python dependency management tools, such as pip, poetry, uv, etc. The specific installation methods are as follows:

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

Additionally, if you want to learn more about installation options, please refer to [Installation](./installation.md).

## 📚 Documentation

- [Model Management](./model-management.md) - Provides a unified registration and management approach, making it convenient for developers to use chat and embeddings models.
- [Message Conversion](./message-conversion.md) - Provides utility functions related to the Message class, including chain-of-thought concatenation, chunk merging, list string formatting, etc.
- [Tool Calling](./tool-calling.md) - Provides utility functions related to tool calling, including tool call detection and parameter parsing, adding human review to tool calls, etc.
- [Agent Development](./agent-development.md) - Provides utility functions for convenient Agent development, including further encapsulation of official Agent creation functions, common middleware, context engineering management, etc.
- [State Graph Orchestration](./graph-orchestration.md) - Provides pipeline utility functions to combine multiple state subgraphs (StateGraph) in parallel or sequential manner.

### 🛠️ Key Features

- **Unified Model Management**: Provides centralized registration and invocation mechanisms for chat and embeddings models, simplifying multi-model integration and switching, and improving development efficiency and consistency.
- **Efficient Message Processing**: Provides utility functions related to message processing, supporting tool call detection and result parsing, handling LLM streaming responses, and other practical functions.
- **Enhanced Tool Calling**: Provides utility functions related to tool calling, further facilitating the implementation of the tool calling process.
- **More Efficient Agent Development**: Provides utility functions and Python classes for context engineering management, middleware, etc., facilitating Agent development.
- **Flexible State Graph Orchestration**: Supports combining multiple StateGraphs in parallel or sequential manner, enabling flexible orchestration of complex workflows.

### 📖 GitHub Repository

Visit the [GitHub Repository](https://github.com/TBice123123/langchain-dev-utils) to view the source code and issues.
