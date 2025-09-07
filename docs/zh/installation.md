# 安装

`LangChain-Dev-Utils`可以使用各种包管理器安装。选择最适合您工作流程的工具。

## 包管理器

### 使用 pip

```bash
pip install -U langchain-dev-utils
```

### 使用 poetry

```bash
poetry add langchain-dev-utils
```

### 使用 uv

```bash
uv add langchain-dev-utils
```

## 系统要求

- Python 3.11 或更高版本

## 依赖项

该包会自动安装以下依赖项：

- `langchain`
- `langgraph`

## 验证

安装后，验证包是否正确安装：

```python
import langchain_dev_utils
print(langchain_dev_utils.__version__)
```

## 开发安装

如果您想为项目做贡献或运行测试：

```bash
git clone https://github.com/TBice123123/langchain-dev-utils.git
cd langchain-dev-utils
uv sync --group test
uv run pytest .
```

## 后续步骤

安装后，您可以继续：

- [模型管理](./model-management.md) - 了解如何注册和加载模型
- [消息处理](./message-processing.md) - 探索消息实用工具
- [工具增强](./tool-enhancement.md) - 为工具添加人工审核
