# 格式化列表内容

> [!NOTE]
>
> **功能概述**：提供将常用的列表内容格式化为一个字符串的功能。
>
> **前置要求**：了解 langchain 的[Message](https://docs.langchain.com/oss/python/langchain/messages)。
>
> **预计阅读时间**：2 分钟

将由 Document、Message 或字符串组成的列表格式化为单个文本字符串。

## 核心函数

- `format_sequence`：格式化消息

**函数参数：**

- **inputs**：包含以下任意类型的列表：
  - langchain_core.messages：HumanMessage、AIMessage、SystemMessage、ToolMessage
  - langchain_core.documents.Document
  - str
- **separator**：用于连接内容的字符串，默认为 "-"。
- **with_num**：如果为 True，为每个项目添加数字前缀（例如 "1. 你好"），默认为 False。

## 使用示例

### Message

```python
from langchain_core.documents import Document
from langchain_core.messages import AIMessage
from langchain_dev_utils.message_convert import format_sequence

formated1 = format_sequence(
    [
        AIMessage(content="Hello1"),
        AIMessage(content="Hello2"),
        AIMessage(content="Hello3"),
    ]
)
print(formated1)
```

输出结果：

```
-Hello1
-Hello2
-Hello3
```

### Document

```python
format2 = format_sequence(
    [
        Document(page_content="content1"),
        Document(page_content="content2"),
        Document(page_content="content3"),
    ],
    separator=">",
)
print(format2)

```

输出结果：

```
>content1
>content2
>content3
```

### String

```python
format3 = format_sequence(
    [
        "str1",
        "str2",
        "str3",
    ],
    separator=">",
    with_num=True,
)
print(format3)
```

输出结果：

```
>1. str1
>2. str2
>3. str3
```
