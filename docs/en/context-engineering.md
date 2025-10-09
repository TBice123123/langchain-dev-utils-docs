# Context Engineering

The Context Engineering module provides a set of advanced and commonly used tools for managing large language model contexts.

## Overview

This module is primarily used for AI context management. It currently implements Plan management for task planning and Note management for context writing and reading. The current implementation references the `langgraph` official project `deepagents`.

## Plan Management

This section provides tools to help large language models create or update plans, along with corresponding state schemas.

### Core Functions

- `create_write_plan_tool`: Creates a tool for writing plans
- `create_update_plan_tool`: Creates a tool for updating plans

### Parameters

- `name`: Custom tool name. If not provided, defaults to `write_plan` for create_write_plan_tool and `update_plan` for create_update_plan_tool
- `description`: Tool description. If not provided, uses the default tool description
- `message_key`: Key for updating messages. If not provided, uses the default `messages`

### Implementation Principles

Plan management tools maintain a task list in the state, where each task contains content and status (pending/in_progress/done). The tools update the state through `Command` objects to implement task creation and status changes.

- `create_write_plan_tool`: Creates initial plans, automatically setting the first task to "in_progress" and remaining tasks to "pending"
- `create_update_plan_tool`: Updates task status, supports batch updating multiple task statuses, and validates update completeness

### Implementation Details

#### write_plan Tool Implementation

```python
def write_plan(plan: list[str], tool_call_id: Annotated[str, InjectedToolCallId]):
    msg_key = message_key or "messages"
    return Command(
        update={
            "plan": [
                {
                    "content": content,
                    "status": "pending" if index > 0 else "in_progress",
                }
                for index, content in enumerate(plan)
            ],
            msg_key: [
                ToolMessage(
                    content=f"Plan successfully written, please first execute the {plan[0]} task",
                    tool_call_id=tool_call_id,
                )
            ],
        }
    )
```

**Core Logic**:

1. Receives a task list and converts each task into an object containing content and status
2. Automatically sets the first task to "in_progress" and others to "pending"
3. Updates state through `Command` object and returns confirmation message

#### update_plan Tool Implementation

```python
def update_plan(update_plans: list[Plan], tool_call_id: Annotated[str, InjectedToolCallId],
                state: Annotated[PlanStateMixin, InjectedState]):
    plan_list = state["plan"] if "plan" in state else []
    updated_plan_list = []

    for update_plan in update_plans:
        for plan in plan_list:
            if plan["content"] == update_plan["content"]:
                plan["status"] = update_plan["status"]
                updated_plan_list.append(plan)

    if len(updated_plan_list) < len(update_plans):
        raise ValueError("Not fully updated plan, missing: " +
                        ",".join([plan["content"] for plan in update_plans
                                if plan not in updated_plan_list]))

    return Command(update={"plan": plan_list, msg_key: [ToolMessage(...)]})
```

**Core Logic**:

1. Retrieves current plan list from state
2. Exactly matches task content and updates status
3. Validates all requested updates have been successfully executed
4. Updates state through `Command` object and returns confirmation message

### Usage Example

```python
from langchain_dev_utils import create_write_plan_tool, create_update_plan_tool

tools=[create_write_plan_tool(), create_update_plan_tool()] # Create plan tools
```

### Plan State Schema

```python
class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

You can inherit your custom state class from PlanStateMixin to include plan in the state.
For example:

```python
class State(PlanStateMixin):
    other: str
```

## Note Management

This section provides tools to help large language models record and manage notes, along with corresponding state schemas.

### Core Functions

- `create_write_note_tool`: Creates a tool for writing notes
- `create_ls_tool`: Creates a tool for listing existing notes
- `create_query_note_tool`: Creates a tool for querying notes
- `create_update_note_tool`: Creates a tool for updating notes

### Parameters

- `name`: Custom tool name. If not provided, defaults to `write_note` for create_write_note_tool, `ls` for create_ls_tool, `query_note` for create_query_note_tool, and `update_note` for create_update_note_tool
- `description`: Tool description. If not provided, uses the default tool description
- `message_key`: Key for updating messages. If not provided, uses the default `messages` (only applicable to `create_write_note_tool` and `create_update_note_tool`)

### Implementation Principles

Note management tools maintain a dictionary in the state to store notes, with note names as keys and note content as values. The tools update the state through `Command` objects to implement note creation, querying, listing, and updating.

- `create_write_note_tool`: Writes notes, supports automatic renaming to avoid overwriting
- `create_ls_tool`: Lists all note names
- `create_query_note_tool`: Queries specific note content, includes error handling
- `create_update_note_tool`: Updates note content, supports exact replacement and global replacement

### Implementation Details

The implementations of `ls` and `query_note` are relatively simple and won't be elaborated here.

#### write_note Tool Implementation

```python
def write_note(file_name: str, content: str, tool_call_id: str,
               state: Annotated[NoteStateMixin, InjectedState]):
    if file_name in state["note"] if "note" in state else {}:
        notes = state["note"] if "note" in state else {}
        file_name = file_name + "_" + str(len(notes[file_name]))

    msg_key = message_key or "messages"
    return Command(
        update={
            "note": {file_name: content},
            msg_key: [ToolMessage(content=f"note {file_name} written successfully",
                                tool_call_id=tool_call_id)],
        }
    )
```

**Core Logic**:

1. Checks if note name already exists, automatically adds numeric suffix if it does
2. Updates state through `Command` object and returns confirmation message

#### update_note Tool Implementation

```python
def update_note(file_name: str, origin_content: str, new_content: str,
                tool_call_id: str, state: Annotated[NoteStateMixin, InjectedState],
                replace_all: bool = False):
    note = state["note"] if "note" in state else {}
    if file_name not in note:
        raise ValueError(f"Error: Note {file_name} not found")

    if origin_content not in note.get(file_name, ""):
        raise ValueError(f"Error: Origin content {origin_content} not found in note {file_name}")

    if replace_all:
        new_content = note.get(file_name, "").replace(origin_content, new_content)
    else:
        new_content = note.get(file_name, "").replace(origin_content, new_content, 1)

    return Command(update={"note": {file_name: new_content}, msg_key: [ToolMessage(...)]})
```

**Core Logic**:

1. Validates note existence and original content matching
2. Decides between global replacement or single replacement based on `replace_all` parameter
3. Updates state through `Command` object and returns confirmation message

#### note_reducer Function

```python
def note_reducer(left: dict | None, right: dict | None):
    if left is None:
        return right
    elif right is None:
        return left
    else:
        return {**left, **right}
```

**Core Logic**:

1. Handles null values during state merging
2. Uses dictionary unpacking syntax to merge two dictionaries
3. Ensures correct merging of changes when multiple operations update the note state simultaneously

### Usage Example

```python
from langchain_dev_utils import create_write_note_tool, create_ls_tool, create_query_note_tool, create_update_note_tool

tools=[create_write_note_tool(), create_ls_tool(), create_query_note_tool(), create_update_note_tool()] # Create note tools
```

### Note State Schema

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

**note_reducer** is a reducer for handling notes, used to add new notes to the corresponding note state.

You can inherit your custom state class from NoteStateMixin to include notes in the state.
For example:

```python
class State(NoteStateMixin):
    other: str
```

**Note**: You can create custom classes with multiple inheritance from NoteStateMixin and PlanStateMixin, as well as `langgraph`'s MessageState

```python
from langgraph.graph.state import MessageState
from langchain_dev_utils import NoteStateMixin, PlanStateMixin

class State(NoteStateMixin, PlanStateMixin, MessageState):
    other: str
```

## Next Steps

- [Graph Orchestration](./graph-orchestration.md) — Combine multiple StateGraphs in parallel or serial workflows.
- [Prebuilt Agent](./prebuilt.md) — Effectively aligns with the prebuilt Agent of the official library, but extends its model selection.
- [API Reference](./api-reference.md) — Complete API documentation.
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage.
