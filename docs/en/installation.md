# Installation

`LangChain-Dev-Utils` can be installed using various package managers. Choose the one that best fits your workflow.

## Package Managers

### Using pip

```bash
pip install -U langchain-dev-utils
```

### Using poetry

```bash
poetry add langchain-dev-utils
```

### Using uv

```bash
uv add langchain-dev-utils
```

## System Requirements

- Python 3.11 or higher

## Dependencies

This package automatically installs the following dependencies:

- `langchain`
- `langgraph`

## Verification

After installation, verify that the package was installed correctly:

```python
import langchain_dev_utils
print(langchain_dev_utils.__version__)
```

## Development Installation

If you’d like to contribute to the project or run tests:

```bash
git clone https://github.com/TBice123123/langchain-dev-utils.git
cd langchain-dev-utils
uv sync --group test
uv run pytest .
```

## Next Steps

After installation, continue with:

- [Model Management](./model-management.md) - Provides a unified registration and management system for easy use of chat and embeddings models.
- [Message Processing](./message-processing.md) - Provides utility functions related to Message handling, such as chunk concatenation.
- [Tool Enhancement](./tool-enhancement.md) - Adds new functionality to already defined tools.
- [Context Engineering](./context-engineering.md) - Provides practical tools and associated state schemas for assisting context engineering management.
- [Graph Orchestration](./graph-orchestration.md) - Combines multiple StateGraphs in parallel or sequential configurations.
- [API Reference](./api-reference.md) - API reference documentation
- [Usage Examples](./example.md) - Demonstrates practical usage examples of this library
