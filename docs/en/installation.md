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

**Note:**

- You need to create a `.env` file and write the relevant `API_KEY` and `API_BASE`.
- Currently, all test cases have passed verification. If individual test cases fail during runtime, it may be due to unstable models. Please try running the tests again.
