# Context Engineering

The Context Engineering module provides a suite of utilities for handling AI context, including plan management tools, note management tools, and more.

## Overview

This module is primarily designed for AI context management functionality and currently offers tools for plan (scheduling) management and note (annotation) management.

## Plan Management

This section provides tools to assist large models in creating or updating plans, along with corresponding state mixin classes.

### Core Functions

- `create_write_plan_tool`: Creates a tool for writing plans
- `create_update_plan_tool`: Creates a tool for updating plans

### Parameters

- `name`: Custom tool name; if not provided, `create_write_plan_tool` defaults to `write_plan`, and `create_update_plan_tool` defaults to `update_plan`
- `description`: Tool description; if not provided, the default description will be used
- `message_key`: Key for updating messages. Defaults to `messages` if not provided.

### Usage Example

```python
from langchain_dev_utils import create_write_plan_tool, create_update_plan_tool

tools=[create_write_plan_tool(), create_update_plan_tool()] # Create plan tools
```

### Plan State Mixin Class

```python
class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

You can inherit your custom state class from `PlanStateMixin` to include the `plan` field in your state.
Example:

```python
class State(PlanStateMixin):
    other: str
```

## Note Management

This section provides tools to assist large models in recording notes, along with corresponding state mixin classes.

### Core Functions

- `create_write_note_tool`: Creates a tool for writing notes
- `create_ls_tool`: Creates a tool for listing notes
- `create_query_note_tool`: Creates a tool for querying notes

### Parameters

- `name`: Custom tool name; if not provided, `create_write_note_tool` defaults to `write_note`, `create_ls_tool` defaults to `ls`, and `create_query_note_tool` defaults to `query_note`
- `description`: Tool description; if not provided, the default description will be used
- `message_key`: Key for updating messages. Defaults to `messages` if not provided. (Only `create_write_note_tool` can be provided)

### Usage Example

```python
from langchain_dev_utils import create_write_note_tool, create_ls_tool, create_query_note_tool

tools=[create_write_note_tool(), create_ls_tool(), create_query_note_tool()] # Create note tools
```

### Note State Mixin Class

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

**note_reducer** is a reducer function designed to handle the `note` state — it is responsible for merging new notes into the existing note state.

You can inherit your custom state class from `NoteStateMixin` to include the `note` field in your state.
Example:

```python
class State(NoteStateMixin):
    other: str
```

**Note**: You may define a class that inherits from both `NoteStateMixin` and `PlanStateMixin`, as well as `langgraph`’s `MessageState`.

```python
from langgraph.graph.state import MessageState
from langchain_dev_utils import NoteStateMixin, PlanStateMixin

class State(NoteStateMixin, PlanStateMixin, MessageState):
    other: str
```
