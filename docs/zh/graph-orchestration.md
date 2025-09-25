# 状态图编排

本模块提供了两个工具函数（管道）让你可以将多个状态图 StateGraph 以并行或者串行的方式组合在一起。

## 概述

将多个状态图 StateGraph 以并行或者串行的方式组合在一起。以实现较为复杂的多智能体编排。

## 串行管道

提供将状态图以串行的方式组合在一起的功能。

### 核心函数

- `sequential_pipeline`：将状态图以串行管道的方式组合在一起。

### 参数

- `sub_graphs`: 用于组合的状态图列表（必须是状态图，即 StateGraph 的实例）。
- `state_schema`: 最后构建的图的 State Schema。
- `graph_name`: 最后构建的图的名称。
- `context_schema`: 最后构建的图的 Context Schema。
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

提供将状态图以并行的方式组合在一起的功能。

### 核心函数

- `parallel_pipeline`：将状态图以并行管道的方式组合在一起。

### 参数

- `sub_graphs`: 用于组合的状态图列表。
- `state_schema`: 最后构建的图的 State Schema。
- `parallel_entry_node`: 并行入口节点(默认为 `__start__`）（注意节点不包含在并行节点中）。
- `branches_fn`: 并行分支函数，返回一个列表，每一个列表都是 Send 类型，用于描述本次执行需要并行执行的状态图节点。
- `graph_name`: 最后构建的图的名称。
- `context_schema`: 最后构建的图的 Context Schema。
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

此外你还可以决定当前执行有哪些状态图需要并行执行，这要用到`LangGraph`中的`Send`API。

```python
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
        ],
    )
```

最终构建的图结构和上述类似，但是唯一的区别是，上述的图三个子图都会并行执行，而这个则会只执行`graph1`和`graph2`，具体参考[Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send)。

**注意**：

（1）不传入`branches_fn`参数，则所有的子图都会并行执行，除非这个子图为入口节点。此时这个入口节点与其它子图是串行执行的。但是当传入了`branches_fn`参数，则需要执行哪些子图由这个函数的返回值决定，因此如果你同时设置了`parallel_entry_node`和`branches_fn`，请注意这个函数的返回值中的列表中不能包含入口节点，否则会陷入死循环。

（2）对于这些组合的状态图它们之间必须要有共享的状态键值。

## 下一步

- [API 参考](./api-reference.md) - API 参考文档
- [使用示例](./example.md) - 介绍本库的使用示例
