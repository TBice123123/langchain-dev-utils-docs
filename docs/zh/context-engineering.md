# 上下文工程

上下文工程模块提供了一系列用于处理 AI 上下文的实用工具，包括 plan 管理工具、note 管理工具等。

## 概述

本模块主要用于 AI 的上下文管理功能目前提供了 plan（计划）管理和 note（笔记）管理工具。

## Plan 管理

该部分提供了一些用于帮助大模型制定计划或者更新计划的工具，以及对应的状态混合类。

### 核心函数

- `create_write_plan_tool`：创建一个用于写计划的工具
- `create_update_plan_tool`：创建一个用于更新计划的工具

### 参数

- `name`：自定义工具名称，如果不传则 create_write_plan_tool 默认为`write_plan`，create_update_plan_tool 默认为`update_plan`
- `description`：工具描述,如果不传则采用默认的工具描述
- `message_key`：用于更新 messages 的键，若不传入则使用默认的`messages`

### 使用示例

```python
from langchain_dev_utils import create_write_plan_tool, create_update_plan_tool

tools=[create_write_plan_tool(), create_update_plan_tool()] # 创建计划工具
```

### Plan 状态混合类

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

该部分提供了一些用于帮助大模型记录笔记的工具，以及对应的状态混合类。

### 核心函数

- `create_write_note_tool`：创建一个用于写笔记的工具
- `create_ls_tool`：创建一个用于列出已有的笔记的工具
- `create_query_note_tool`：创建一个用于查询笔记的工具

### 参数

- `name`：自定义工具名称，如果不传则 create_write_note_tool 默认为`write_note`，create_ls_tool 默认为`ls`，create_query_note_tool 默认为`query_note`
- `description`：工具描述,如果不传则采用默认的工具描述
- `message_key`：用于更新 messages 的键，若不传入则使用默认的`messages` （仅`create_write_note_tool` 可以传入）

### 使用示例

```python
from langchain_dev_utils import create_write_note_tool, create_ls_tool, create_query_note_tool

tools=[create_write_note_tool(), create_ls_tool(), create_query_note_tool()] # 创建笔记工具
```

### Note 状态混合类

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

- [API 参考](./api-reference.md) - API 参考文档
