# Tool Call Handling

> [!NOTE]
>
> **Feature Overview**: Provides utilities for parsing tool call arguments.
>
> **Prerequisites**: Understanding of LangChain's [Tool](https://docs.langchain.com/oss/python/langchain/tools) and [Message](https://docs.langchain.com/oss/python/langchain/messages).
>
> **Estimated Reading Time**: 3 minutes

## Overview

Provides utilities to detect and parse tool call arguments.

## Detecting Tool Calls

Detects if a message contains a tool call.
The core function is:

- `has_tool_calling`: Checks if the message contains a tool call

Its parameters are as follows:
<Params
name="message"
type="AIMessage"
description="The AIMessage object to be checked"
:required="true"
:default="null"
/>

Usage example:

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils.tool_calling import has_tool_calling

@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())

response = model.bind_tools([get_current_time]).invoke("What time is it now?")
print(has_tool_calling(response))
```

## Parsing Tool Call Arguments

Provides a utility function to parse tool call arguments, extracting parameter information from a message.

The core function is:

- `parse_tool_calling`: Parses tool call arguments

Its parameters are as follows:

<Params
name="message"
type="AIMessage"
description="The AIMessage object containing tool call information"
:required="true"
:default="null"
/>
<Params
name="first_tool_call_only"
type="bool"
description="Whether to parse only the first tool call. If True, returns a single tuple; if False, returns a list of tuples."
:required="false"
:default="false"
/>

Usage example:

```python
import datetime
from langchain_core.tools import tool
from langchain_dev_utils.tool_calling import has_tool_calling, parse_tool_calling

@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())

response = model.bind_tools([get_current_time]).invoke("What time is it now?")

if has_tool_calling(response):
    name, args = parse_tool_calling(
        response, first_tool_call_only=True
    )
    print(name, args)
```