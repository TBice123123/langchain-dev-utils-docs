# 状态图编排

本模块提供了两个工具函数（管道），用于将多个 StateGraph 状态图以并行或串行的方式进行组合，实现复杂的多智能体编排。

## 概述

通过并行或串行的方式组合多个 StateGraph 状态图，构建更复杂的多智能体工作流。

## 串行管道

将状态图按照顺序依次连接，形成串行执行流程。

### 核心函数

- `sequential_pipeline` - 以串行方式组合多个状态图

### 参数说明

- `sub_graphs`: 要组合的状态图列表（必须是 StateGraph 实例）
- `state_schema`: 最终生成图的 State Schema
- `graph_name`: 最终生成图的名称（可选）
- `context_schema`: 最终生成图的 Context Schema（可选）
- `input_schema`: 最终生成图的输入 Schema（可选）
- `output_schema`: 最终生成图的输出 Schema（可选）

### 使用示例

```python
from langgraph.graph import StateGraph
from typing import Annotated, TypedDict
from langchain_dev_utils import sequential_pipeline

def replace(a: int, b: int):
    return b

class State(TypedDict):
    a: Annotated[int, replace]

def add(state: State):
    print(state)
    return {"a": state["a"] + 1}

def make_graph(name: str):
    """创建简单的状态图"""
    sub_graph = StateGraph(State)
    sub_graph.add_node("add", add)
    sub_graph.add_edge("__start__", "add")
    return sub_graph.compile(name=name)

# 构建串行管道
graph = sequential_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
)
```

最终生成的流程图如下：
![串行管道示意图](/img/sequential.png)

## 并行管道

将多个状态图并行组合，支持灵活的并行执行策略。

### 核心函数

- `parallel_pipeline` - 以并行方式组合多个状态图

### 参数说明

- `sub_graphs`: 要组合的状态图列表
- `state_schema`: 最终生成图的 State Schema
- `parallel_entry_graph`: 入口状态图（默认为 `__start__`，指定后该图不参与并行）
- `branches_fn`: 并行分支函数，返回 Send 对象列表控制并行执行
- `graph_name`: 最终生成图的名称（可选）
- `context_schema`: 最终生成图的 Context Schema（可选）
- `input_schema`: 最终生成图的输入 Schema（可选）
- `output_schema`: 最终生成图的输出 Schema（可选）

### 使用示例

#### 基础并行示例

```python
from langgraph.graph import StateGraph
from typing import Annotated, TypedDict
from langchain_dev_utils import parallel_pipeline

def replace(a: int, b: int):
    return b

class State(TypedDict):
    a: Annotated[int, replace]

def add(state: State):
    return {"a": state["a"] + 1}

def make_graph(name: str):
    sub_graph = StateGraph(State)
    sub_graph.add_node("add", add)
    sub_graph.add_edge("__start__", "add")
    return sub_graph.compile(name=name)

# 构建并行管道（所有子图并行执行）
graph = parallel_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
)
```

最终生成的流程图如下：
![并行管道示意图](/img/parallel.png)

#### 指定入口图的并行示例

```python
# 指定 graph1 为入口图，其余图并行执行
graph = parallel_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
    parallel_entry_graph="graph1",
)
```

最终生成的流程图如下：
![带入口的并行管道示意图](/img/parallel_entry.png)

#### 使用分支函数控制并行执行

分支函数需要返回`Send`列表。具体参考[Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send)

```python
from langgraph.prebuilt import Send

# 使用分支函数精确控制并行执行
graph = parallel_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
    branches_fn=lambda state: [
        Send("graph1", arg={"a": state["a"]}),
        Send("graph2", arg={"a": state["a"]}),
        # graph3 不会被执行
    ],
)
```

### 重要注意事项

- 不传入 `branches_fn` 参数时，所有子图都会并行执行（入口图除外）
- 传入 `branches_fn` 参数时，执行哪些子图由该函数的返回值决定
- 如果同时设置了 `parallel_entry_graph` 和 `branches_fn`，请确保分支函数不包含入口节点，避免死循环

## 下一步

- [API 参考](./api-reference.md) - API 参考文档
- [使用示例](./example.md) - 介绍本库的使用示例
