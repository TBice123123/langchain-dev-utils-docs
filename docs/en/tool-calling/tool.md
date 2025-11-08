# Tool Call Processing

> [!NOTE]
>
> **Feature Overview**: Provides utility tools for parsing tool call parameters.
>
> **Prerequisites**: Understand LangChain's [Tool](https://docs.langchain.com/oss/python/langchain/tools), [Message](https://docs.langchain.com/oss/python/langchain/messages).
>
> **Estimated Reading Time**: 3 minutes

## Detecting Tool Calls

Detect whether a message contains tool calls.
The core function is:

- `has_tool_calling`: Check if a message contains tool calls

Its parameters are as follows:
<Params
name="message"
type="AIMessage"
description="AIMessage object to be checked"
:required="true"
:default="null"
/>

Usage Example:

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils.tool_calling import has_tool_calling

@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())

response = model.bind_tools([get_current_time]).invoke("What time is it now?")
print(has_tool_calling(response))
```

## Parsing Tool Call Parameters

Provides a utility function to parse tool call parameters and extract parameter information from messages.

The core function is:

- `parse_tool_calling`: Parse tool call parameters

Its parameters are as follows:

<Params
name="message"
type="AIMessage"
description="AIMessage object containing tool call information"
:required="true"
:default="null"
/>
<Params
name="first_tool_call_only"
type="bool"
description="Whether to parse only the first tool call. If True, returns a single tuple; if False, returns a list of tuples."
:required="false"
:default="null"
/>

Usage Example:

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils.tool_calling import has_tool_calling, parse_tool_calling

@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())

response = model.bind_tools([get_current_time]).invoke("What time is it now?")

if has_tool_calling(response):
    name, args = parse_tool_calling(
        response, first_tool_call_only=True
    )
    print(name, args)
```
