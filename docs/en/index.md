# langchain-dev-utils

When building complex large language model applications using LangChain and LangGraph, the development process is not always efficient. Developers often need to write substantial boilerplate code for routine functionalities. To help developers focus more on core business logic, `langchain-dev-utils` was created.

This is a lightweight yet practical utility library focused on enhancing the development experience with LangChain and LangGraph. It provides a series of ready-to-use utility functions, thereby reducing repetitive code and enhancing code consistency and readability. By simplifying the development path, `langchain-dev-utils` enables you to prototype features faster and iterate more smoothly, helping you build clearer and more reliable AI large model applications.

## 📦 Installation

This library can be installed using all Python dependency management tools, such as pip, poetry, uv, etc. Specific installation methods are as follows:

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

Additionally, if you want to learn more about installation methods, please refer to [Installation](./installation.md).

## 📚 Documentation

- [Model Management](./model-management.md) - Provides a unified registration and management approach, making it convenient for developers to use chat and embeddings models.
- [Message Conversion](./message-conversion.md) - Provides utility functions related to the Message class, including reasoning chain concatenation, chunk merging, list string formatting, etc.
- [Tool Calling](./tool-calling.md) - Provides utility functions related to tool calling, including tool call detection and parameter parsing, adding human review to tool calls, etc.
- [Agent Development](./agent-development.md) - Provides utility functions to facilitate Agent development, including further encapsulation of official Agent creation functions, common middleware, etc.
- [State Graph Orchestration Pipeline](./graph-orchestration.md) - Provides pipeline utility functions to combine multiple state subgraphs (StateGraph) in parallel or sequential manner.

### 🛠️ Key Features

- **Unified Model Management**: Centralized registration and management of Chat and Embeddings models simplifies model invocation and switching, improving development efficiency.
- **More Flexible Message Handling**: Provides rich Message-class utility functions supporting chain-of-thought concatenation, streaming chunk merging, message formatting, etc., facilitating the construction of complex dialogue logic.
- **More Powerful Tool Calling Support**: Built-in capabilities for tool call detection, parameter parsing, and human-in-the-loop review enhance the safety and controllability of Agent interactions with external tools.
- **More Efficient Agent Development**: Wraps official Agent creation workflows and integrates common middleware to accelerate the building and iteration of intelligent agents.
- **More Flexible State Graph Composition**: Supports combining multiple StateGraphs in serial or parallel, enabling visual and modular orchestration of complex workflows.

**Note**：The first four modules are mainly for `langchain`, and the last module is mainly for `langgraph`.

### 📖 GitHub Repository

Visit the [GitHub repository](https://github.com/TBice123123/langchain-dev-utils) to view the source code and issues.
