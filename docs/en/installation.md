# Installation

`langchain-dev-utils` can be installed using various package managers. Choose the tool that best fits your workflow.

## Prerequisites

- Python 3.11 or higher
- A Python package manager (`uv` is recommended)
- An `API Key` from any LLM provider

## Installation Methods

`langchain-dev-utils` supports installation via package managers such as `pip`, `poetry`, and `uv`.

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

The commands above will install `langchain-dev-utils` and its core dependencies. If you want to use its full functionality, execute the following commands:

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

## Dependencies

The package automatically installs the following dependencies:

- `langchain`
- `langgraph` (installed alongside `langchain`)

For the standard version, the following dependencies are also installed:

- `langchain-openai`

## Verification

After installation, verify that the package was installed correctly:

```python
import langchain_dev_utils
print(langchain_dev_utils.__version__)
```

## Running Tests

If you wish to contribute to the project or run the tests:

```bash
git clone https://github.com/TBice123123/langchain-dev-utils.git
cd langchain-dev-utils
uv sync --group test
uv run pytest .
```

**Note:**

- You need to create a new `.env` file and include the relevant `API_KEY` and `API_BASE` values.
- All test cases have currently passed verification. If individual model-related failures occur during execution, they might be due to model instability; please try running the tests again.
