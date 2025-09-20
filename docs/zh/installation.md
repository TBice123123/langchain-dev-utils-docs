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

- [模型管理](./model-management.md) - 提供统一的管理方式，方便开发者使用 chat 和 embeddings 模型。
- [消息处理](./message-processing.md) - 提供针对 Message 类的一系列工具函数，涵盖 chunk 合并等内容。
- [工具增强](./tool-enhancement.md) - 进一步的方便开发者定义和开发 langchain 的 tools。
- [上下文工程](./context-engineering.md) - 提供上下文工程的高级 tools 和对应的状态混合类。
- [API 参考](./api-reference.md) - API 参考文档
- [使用示例](./example.md) - 介绍本库的使用示例
