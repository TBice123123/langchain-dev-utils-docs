# Format List Content

> [!NOTE]
>
> **Feature Overview**: Provides the functionality to format commonly used list content into a single string.
>
> **Prerequisites**: Familiarity with Langchain's [Message](https://docs.langchain.com/oss/python/langchain/messages).
>
> **Estimated Reading Time**: 2 minutes

Formats a list composed of Documents, Messages, or strings into a single text string.

## Core Function

- `format_sequence`: Formats messages

Its parameters are as follows:  
Its parameters are as follows:

<Params
name="inputs"
type="list[Message | Document | string]"
description="A list containing any of the following types: Message, Document, str"
:required="true"
:default="null"
/>
<Params
name="separator"
type="string"
description="String used to join the contents; defaults to '-'"
:required="false"
:default="null"
/>
<Params
name="with_num"
type="bool"
description="If True, adds a numerical prefix to each item; defaults to False"
:required="false"
:default="null"
/>

Usage examples are as follows:

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

Output:

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

Output:

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

Output:

```
>1. str1
>2. str2
>3. str3
```
