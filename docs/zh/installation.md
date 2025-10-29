# 安装

`langchain-dev-utils`可以使用各种包管理器安装。选择最适合您工作流程的工具。

## 包管理器

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

上述会安装`langchain-dev-utils`以及它的基础依赖。如果你想要使用它的完整功能你需要执行下面的命令：

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

## 系统要求

- Python 3.11 或更高版本

## 依赖项

该包会自动安装以下依赖项：

- `langchain`
- `langgraph` (安装`langchain`时会同时也会安装)

如果是 standard 版本，还会安装以下依赖项：

- `langchain-openai`

## 验证

安装后，验证包是否正确安装：

```python
import langchain_dev_utils
print(langchain_dev_utils.__version__)
```

## 执行测试

如果您想为项目做贡献或运行测试：

```bash
git clone https://github.com/TBice123123/langchain-dev-utils.git
cd langchain-dev-utils
uv sync --group test
uv run pytest .
```

**注意：**

- 您需要新建一个 `.env` 文件，并写入相关的`API_KEY`以及`API_BASE`。
- 目前所有测试用例均已通过验证。若运行时出现个别与模型相关的失败，有可能是因为模型不稳定导致的，请尝试重新运行测试。
