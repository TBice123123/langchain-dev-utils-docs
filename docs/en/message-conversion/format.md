# Format List Content

> [!NOTE]
>
> **Overview**: Provides functionality to format common list content into a single string.
>
> **Prerequisites**: Familiarity with LangChain's [Message](https://docs.langchain.com/oss/python/langchain/messages).
>
> **Estimated Reading Time**: 2 minutes

Formats a list composed of Documents, Messages, or strings into a single text string.

## Core Function

- `format_sequence`: Formats messages

**Function Parameters:**

- **inputs**: A list containing any of the following types:
  - langchain_core.messages: HumanMessage, AIMessage, SystemMessage, ToolMessage
  - langchain_core.documents.Document
  - str
- **separator**: String used to join the content, defaults to "-".
- **with_num**: If True, adds a numerical prefix to each item (e.g., "1. Hello"), defaults to False.

## Usage Examples

### Message

```python
from langchain_core.documents import Document
from langchain_core.messages import AIMessage
from langchain_dev_utils.message_convert import format_sequence

formatted1 = format_sequence(
    [
        AIMessage(content="Hello1"),
        AIMessage(content="Hello2"),
        AIMessage(content="Hello3"),
    ]
)
print(formatted1)
```

Output:

```
-Hello1
-Hello2
-Hello3
```

### Document

```python
formatted2 = format_sequence(
    [
        Document(page_content="content1"),
        Document(page_content="content2"),
        Document(page_content="content3"),
    ],
    separator=">",
)
print(formatted2)
```

Output:

```
>content1
>content2
>content3
```

### String

```python
formatted3 = format_sequence(
    [
        "str1",
        "str2",
        "str3",
    ],
    separator=">",
    with_num=True,
)
print(formatted3)
```

Output:

```
>1. str1
>2. str2
>3. str3
```
