# Installation

`langchain-dev-utils` can be installed using various package managers. Choose the one that best fits your workflow.

## Package Managers

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

If you want to use the complete functionality of this package, you need to execute the following command:

::: code-group

```sh[pip]
pip install -U langchain-dev-utils[standard]
```

```sh[poetry]
poetry add langchain-dev-utils[standard]
```

```sh[uv]
uv add langchain-dev-utils[standard]
```

:::

## System Requirements

- Python 3.11 or higher

## Dependencies

This package automatically installs the following dependencies:

- `langchain`
- `langgraph`

If it is a standard version, it will also install the following dependencies:

- `langchain-openai`

## Verification

After installation, verify that the package has been installed correctly:

```python
import langchain_dev_utils
print(langchain_dev_utils.__version__)
```

## Running Tests

If you wish to contribute to the project or run tests:

```bash
git clone https://github.com/TBice123123/langchain-dev-utils.git
cd langchain-dev-utils
uv sync --group test
uv run pytest .
```

## Next Steps

After installation, you can proceed with:

- [Model Management](./model-management.md) — Unified registration and management of chat and embedding models.
- [Message Processing](./message-processing.md) — Utility functions for message handling, such as chunk concatenation.
- [Tool Enhancement](./tool-enhancement.md) — Add new functionality to existing tools.
- [Context Engineering](./context-engineering.md) — Practical tools and State Schemas for context management.
- [Graph Orchestration](./graph-orchestration.md) — Combine multiple StateGraphs in parallel or serial workflows.
- [Prebuilt Agent](./prebuilt.md) — Effectively aligns with the prebuilt Agent of the official library, but extends its model selection.
- [API Reference](./api-reference.md) — Complete API documentation.
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage.
