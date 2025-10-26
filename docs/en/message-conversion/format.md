# Format List Content

> [!NOTE]
>
> **Feature Overview**: Provides practical list content formatting functionality.
>
> **Prerequisites**: Understand LangChain's [Message](https://docs.langchain.com/oss/python/langchain/messages).
>
> **Estimated Reading Time**: 2 minutes

Formats a list composed of Documents, Messages, or strings into a single text string.

## Core Function

- `format_sequence`: Format messages

**Function Parameters:**

- `inputs`: A list containing any of the following types:
  - `langchain_core.messages`: HumanMessage, AIMessage, SystemMessage, ToolMessage
  - `langchain_core.documents.Document`
  - `str`
- `separator`: String used to join the content, defaults to `"-"`.
- `with_num`: If `True`, adds numeric prefixes to each item (e.g., `"1. Hello"`), defaults to `False`.

## Usage Example

**Messages**:

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

**Documents**:

```python
format2 = format_sequence(
    [
        Document(page_content="content1"),
        Document(page_content="content2"),
        Document(page_content="content3"),
    ],
    separator="\n",
)
print(format2)
```

**Strings**:

```python
format3 = format_sequence(
    [
        "str1",
        "str2",
        "str3",
    ],
    separator="\n",
    with_num=True,
)
print(format3)
```
