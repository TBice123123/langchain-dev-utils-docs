# 子图编排

本模块提供了两个工具函数让你可以将你的编写的 LangGraph 子图以串行和并行的方式组合在一起。

## 概述

用于将多个状态相同的子图以并行或者串行的方式组合在一起。

## 串行管道

提供将多个状态相同的子图以串行的方式组合在一起的功能。

### 核心函数

- `sequential_pipeline`：将子图以串行管道的方式组合在一起。

### 参数

- `sub_graphs`: 用于组合的子图列表。
- `state_schema`: 子图共同的 State Schema。
- `graph_name`: 最后构建的图的名称。
- `context_schema`: 子图共同的 Context Schema。
- `input_schema`: 最后构建的图的输入 Schema。
- `output_schema`: 最后构建的图的输出 Schema。

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
    sub_graph = StateGraph(State)
    sub_graph.add_node("add", add)
    sub_graph.add_edge("__start__", "add")
    return sub_graph.compile(name=name)


graph = sequential_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
)
```

最终构建的图如下：
![alt text](/img/sequential.png)

## 并行管道

提供将多个状态相同的子图以并行的方式组合在一起的功能。

### 核心函数

- `parallel_pipeline`：将子图以并行管道的方式组合在一起。

### 参数

- `sub_graphs`: 用于组合的子图列表。
- `state_schema`: 子图共同的 State Schema。
- `parallel_entry_node`: 并行入口节点(默认为 `__start__`）（注意节点不包含在并行节点中）。
- `graph_name`: 最后构建的图的名称。
- `context_schema`: 子图共同的 Context Schema。
- `input_schema`: 最后构建的图的输入 Schema。
- `output_schema`: 最后构建的图的输出 Schema。

### 使用示例

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


graph = parallel_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
)
```

最终构建的图如下：
![alt text](/img/parallel.png)

如果指定了 `parallel_entry_node`，则并行入口节点将不会被添加到并行节点中。
如下：

```python
from langgraph.graph import StateGraph
from typing import Annotated, TypedDict
from langchain_dev_utils import parallel_pipeline


def replace(a: int, b: int):
    return b


class State(TypedDict):
    a: Annotated[int, replace]


def add(state: State):
    print(state)
    return {"a": state["a"] + 1}


def make_graph(name: str):
    sub_graph = StateGraph(State)
    sub_graph.add_node("add", add)
    sub_graph.add_edge("__start__", "add")
    return sub_graph.compile(name=name)


graph = parallel_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
    parallel_entry_node="graph1",
)
```

最终构建的图如下：
![alt text](/img/parallel_entry.png)

## 下一步

- [API 参考](./api-reference.md) - API 参考文档
- [使用示例](./example.md) - 介绍本库的使用示例
