# Tool Calling Handling

> [!NOTE]
>
> **Overview**: Provides utility tools for parsing tool calling parameters.
>
> **Prerequisites**: Familiarity with LangChain's [Tool](https://docs.langchain.com/oss/python/langchain/tools) and [Message](https://docs.langchain.com/oss/python/langchain/messages).
>
> **Estimated Reading Time**: 3 minutes

## Detecting Tool Calls

Detect whether a message contains tool calls.
The core function is:

- `has_tool_calling`: Check if a message contains tool calls

Supported parameters:

- **message**: AIMessage object

Usage example:

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

Provides a utility function to parse tool call parameters and extract argument information from messages.

The core function is:

- `parse_tool_calling`: Parse tool call parameters

Supported parameters:

- **message**: AIMessage object
- **first_tool_call_only**: Whether to parse only the first tool call. If True, returns a single tuple; if False, returns a list of tuples.

Usage example:

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
