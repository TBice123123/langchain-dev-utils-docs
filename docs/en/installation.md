# Installation

`LangChain-Dev-Utils` can be installed with a variety of package managers. Pick the one that best fits your workflow.

## Package managers

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

## System requirements

- Python 3.11 or higher

## Dependencies

The package automatically installs the following dependencies:

- `langchain`
- `langgraph`

## Verification

After installation, verify that the package is correctly installed:

```python
import langchain_dev_utils
print(langchain_dev_utils.__version__)
```

## Development install

If you want to contribute to the project or run the tests:

```bash
git clone https://github.com/TBice123123/langchain-dev-utils.git
cd langchain-dev-utils
uv sync --group test
uv run pytest .
```

## Next steps

Once installed, you can move on to:

- [Model Management](./model-management.md) – learn how to register and load models
- [Message Processing](./message-processing.md) – explore message utilities
- [Tool Enhancement](./tool-enhancement.md) – add human review to tools
