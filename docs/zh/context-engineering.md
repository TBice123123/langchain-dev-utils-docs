# 上下文工程

上下文工程模块提供了一系列较为高级且常见的大模型上下文管理的工具。

## 概述

本模块主要用于 AI 的上下文管理。目前针对任务规划实现了 Plan 管理，以及上下文写出与写入实现了 Note 管理。目前的实现参考了`langgraph`官方项目`deepagents`。

## Plan 管理

该部分提供了一些用于帮助大模型制定计划或者更新计划的工具，以及对应的状态 Schema。

### 核心函数

- `create_write_plan_tool`：创建一个用于写计划的工具
- `create_update_plan_tool`：创建一个用于更新计划的工具

### 参数

- `name`：自定义工具名称，如果不传则 create_write_plan_tool 默认为`write_plan`，create_update_plan_tool 默认为`update_plan`
- `description`：工具描述,如果不传则采用默认的工具描述
- `message_key`：用于更新 messages 的键，若不传入则使用默认的`messages`

### 实现原理

Plan 管理工具通过在状态中维护一个任务列表，每个任务包含内容和状态（pending/in_progress/done）。工具通过 `Command` 对象更新状态，实现任务的创建和状态变更。

- `create_write_plan_tool`：创建初始计划，自动将第一个任务设置为 "in_progress"，其余任务设置为 "pending"
- `create_update_plan_tool`：更新任务状态，支持批量更新多个任务的状态，并验证更新的完整性

### 实现细节

#### write_plan 工具实现

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

**核心逻辑**：

1. 接收任务列表，将每个任务转换为包含内容和状态的对象
2. 自动将第一个任务设置为 "in_progress"，其余设置为 "pending"
3. 通过 `Command` 对象更新状态并返回确认消息

#### update_plan 工具实现

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

**核心逻辑**：

1. 从状态中获取当前计划列表
2. 精确匹配任务内容并更新状态
3. 验证所有请求的更新都已成功执行
4. 通过 `Command` 对象更新状态并返回确认消息

### 使用示例

```python
from langchain_dev_utils import create_write_plan_tool, create_update_plan_tool

tools=[create_write_plan_tool(), create_update_plan_tool()] # 创建计划工具
```

### Plan 状态 Schema

```python
class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

你可以将自定义状态类继承 PlanStateMixin，这样就可以在状态中包含 plan 了。
例如：

```python
class State(PlanStateMixin):
    other: str
```

## Note 管理

该部分提供了一些用于帮助大模型记录笔记的工具，以及对应的状态 Schema。

### 核心函数

- `create_write_note_tool`：创建一个用于写笔记的工具
- `create_ls_tool`：创建一个用于列出已有的笔记的工具
- `create_query_note_tool`：创建一个用于查询笔记的工具
- `create_update_note_tool`：创建一个用于更新笔记的工具

### 参数

- `name`：自定义工具名称，如果不传则 create_write_note_tool 默认为`write_note`，create_ls_tool 默认为`ls`，create_query_note_tool 默认为`query_note`，create_update_note_tool 默认为`update_note`
- `description`：工具描述,如果不传则采用默认的工具描述
- `message_key`：用于更新 messages 的键，若不传入则使用默认的`messages` （仅`create_write_note_tool` 、`create_update_note_tool`可以传入）

### 实现原理

Note 管理工具通过在状态中维护一个字典来存储笔记，键为笔记名称，值为笔记内容。工具通过 `Command` 对象更新状态，实现笔记的创建、查询、列表和更新。

- `create_write_note_tool`：写入笔记，支持自动重命名避免覆盖
- `create_ls_tool`：列出所有笔记名称
- `create_query_note_tool`：查询特定笔记内容，包含错误处理
- `create_update_note_tool`：更新笔记内容，支持精确替换和全局替换

### 实现细节

`ls`和`query_note`实现比较简单这里就不再赘述了。

#### write_note 工具实现

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

**核心逻辑**：

1. 检查笔记名称是否已存在，如果存在则自动添加数字后缀
2. 通过 `Command` 对象更新状态并返回确认消息

#### update_note 工具实现

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

**核心逻辑**：

1. 验证笔记存在性和原内容匹配性
2. 根据 `replace_all` 参数决定是全局替换还是单次替换
3. 通过 `Command` 对象更新状态并返回确认消息

#### note_reducer 函数

```python
def note_reducer(left: dict | None, right: dict | None):
    if left is None:
        return right
    elif right is None:
        return left
    else:
        return {**left, **right}
```

**核心逻辑**：

1. 处理状态合并时的空值情况
2. 使用字典解包语法合并两个字典
3. 确保多个操作同时更新 note 状态时能够正确合并变更

### 使用示例

```python
from langchain_dev_utils import create_write_note_tool, create_ls_tool, create_query_note_tool, create_update_note_tool

tools=[create_write_note_tool(), create_ls_tool(), create_query_note_tool(), create_update_note_tool()] # 创建笔记工具
```

### Note 状态 Schema

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

**note_reducer** 是一个用于处理 note 的 reducer，它用于将新的笔记添加到 对应的 note 状态中。

你可以将自定义状态类继承 NoteStateMixin，这样就可以在状态中包含 note 了。
例如：

```python
class State(NoteStateMixin):
    other: str
```

**注意**：你可以自定义类多重继承 NoteStateMixin 和 PlanStateMixin，以及`langgraph`的 MessageState

```python
from langgraph.graph.state import MessageState
from langchain_dev_utils import NoteStateMixin, PlanStateMixin

class State(NoteStateMixin, PlanStateMixin, MessageState):
    other: str
```

## 下一步

- [状态图编排](./graph-orchestration.md) - 将多个状态图(StateGraph)以并行或者串行的方式组合在一起。
- [预构建 Agent](./prebuilt.md) - 效果与官方预构建的 Agent 对齐，但是拓展了其模型选择。
- [API 参考](./api-reference.md) - API 参考文档。
- [使用示例](./example.md) - 介绍本库的使用示例。
