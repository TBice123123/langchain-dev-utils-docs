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

The package will automatically install the following dependencies:

- `langchain`
- `langgraph`

## Verification

After installation, verify that the package is correctly installed:

```python
import langchain_dev_utils
print(langchain_dev_utils.__version__)
```

## Development Installation

If you’d like to contribute to the project or run tests locally:

```bash
git clone https://github.com/TBice123123/langchain-dev-utils.git
cd langchain-dev-utils
uv sync --group test
uv run pytest .
```

## Next Steps

After installation, you can proceed to:

- [Model Management](./model-management.md) — Unified interface for easily using chat and embeddings models
- [Message Processing](./message-processing.md) — Utility functions for Message objects, including chunk merging and more
- [Tool Enhancement](./tool-enhancement.md) — Simplifies defining and developing LangChain tools
- [Context Engineering](./context-engineering.md) — Advanced tools and state mixin classes for context management
- [API Reference](./api-reference.md) — Complete API documentation
