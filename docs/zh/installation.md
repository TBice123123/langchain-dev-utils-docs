# 安装

`langchain-dev-utils`可以使用各种包管理器安装。选择最适合您工作流程的工具。

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

## 执行测试

如果您想为项目做贡献或运行测试：

```bash
git clone https://github.com/TBice123123/langchain-dev-utils.git
cd langchain-dev-utils
uv sync --group test
uv run pytest .
```

## 后续步骤

安装后，您可以继续：

- [模型管理](./model-management.md) - 提供统一的注册管理方式，方便开发者使用 chat 和 embeddings 模型。
- [消息处理](./message-processing.md) - 提供与 Message 相关的工具函数，例如 chunk 拼接。
- [工具增强](./tool-enhancement.md) - 在已定义的 tools 中添加新的功能。
- [上下文工程](./context-engineering.md) - 提供用于帮助上下文工程管理的实用性 tools 以及相关的状态 Schema。
- [状态图编排](./graph-orchestration.md) - 将多个状态图(StateGraph)以并行或者串行的方式组合在一起。
- [API 参考](./api-reference.md) - API 参考文档
- [使用示例](./example.md) - 介绍本库的使用示例
