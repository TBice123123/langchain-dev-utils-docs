# Context Engineering

The Context Engineering module provides a set of advanced and commonly used tools for managing large model contexts.

## Overview

This module is primarily designed for AI context management. Currently, it implements Plan management for task planning, and Note management for context writing and reading.

## Plan Management

This section provides tools to help large models create or update plans, along with corresponding state schemas.

### Core Functions

- `create_write_plan_tool`: Creates a tool for writing a plan.
- `create_update_plan_tool`: Creates a tool for updating a plan.

### Parameters

- `name`: Custom tool name. If not provided, `create_write_plan_tool` defaults to `write_plan`, and `create_update_plan_tool` defaults to `update_plan`.
- `description`: Tool description. If not provided, default descriptions are used.
- `message_key`: The key used to update the `messages` field. If not provided, the default key `messages` is used.

### Usage Example

```python
from langchain_dev_utils import create_write_plan_tool, create_update_plan_tool

tools = [create_write_plan_tool(), create_update_plan_tool()]  # Create plan tools
```

### Plan State Schema

```python
class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

You can inherit `PlanStateMixin` in your custom state class to include a `plan` field in your state. For example:

```python
class State(PlanStateMixin):
    other: str
```

## Note Management

This section provides tools to help large models record and manage notes, along with corresponding state schemas.

### Core Functions

- `create_write_note_tool`: Creates a tool for writing a note.
- `create_ls_tool`: Creates a tool for listing existing notes.
- `create_query_note_tool`: Creates a tool for querying notes.
- `create_update_note_tool`: Creates a tool for updating a note.

### Parameters

- `name`: Custom tool name. If not provided, defaults are as follows:
  - `create_write_note_tool` → `write_note`
  - `create_ls_tool` → `ls`
  - `create_query_note_tool` → `query_note`
  - `create_update_note_tool` → `update_note`
- `description`: Tool description. If not provided, default descriptions are used.
- `message_key`: The key used to update the `messages` field. Only `create_write_note_tool` and `create_update_note_tool` support this parameter. If not provided, the default key `messages` is used.

### Usage Example

```python
from langchain_dev_utils import create_write_note_tool, create_ls_tool, create_query_note_tool, create_update_note_tool

tools = [create_write_note_tool(), create_ls_tool(), create_query_note_tool(), create_update_note_tool()]  # Create note tools
```

### Note State Schema

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

**note_reducer** is a reducer specifically designed to handle note updates. It merges new notes into the existing `note` state.

You can inherit `NoteStateMixin` in your custom state class to include a `note` field. For example:

```python
class State(NoteStateMixin):
    other: str
```

**Note**: You can combine multiple mixins via multiple inheritance, including `NoteStateMixin`, `PlanStateMixin`, and `langgraph`'s `MessageState`.

```python
from langgraph.graph.state import MessageState
from langchain_dev_utils import NoteStateMixin, PlanStateMixin

class State(NoteStateMixin, PlanStateMixin, MessageState):
    other: str
```

## Next Steps

- [Graph Orchestration](./graph-orchestration.md) - Combines multiple StateGraphs in parallel or sequential configurations.
- [API Reference](./api-reference.md) - API reference documentation
- [Usage Examples](./example.md) - Demonstrates practical usage examples of this library
