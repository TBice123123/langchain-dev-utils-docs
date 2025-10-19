# 状态图编排

> [!NOTE]
>
> **功能概述**：主要用于实现多个状态图的并行和串行组合。
>
> **前置要求**：了解 langchain 的[子图](https://docs.langchain.com/oss/python/langgraph/use-subgraphs),[Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send)。
>
> **预计阅读时间**：5 分钟

## 串行管道

将状态图按照顺序依次连接，形成串行执行流程。

通过下面函数实现:

- `sequential_pipeline` - 以串行方式组合多个状态图

支持的参数如下:

- `sub_graphs`: 要组合的状态图列表（必须是 StateGraph 实例）
- `state_schema`: 最终生成图的 State Schema
- `graph_name`: 最终生成图的名称（可选）
- `context_schema`: 最终生成图的 Context Schema（可选）
- `input_schema`: 最终生成图的输入 Schema（可选）
- `output_schema`: 最终生成图的输出 Schema（可选）

使用示例:

```python
from langgraph.graph import StateGraph
from typing import Annotated, TypedDict
from langchain_dev_utils.pipeline import sequential_pipeline

def replace(a: int, b: int):
    return b

class State(TypedDict):
    a: Annotated[int, replace]

def add(state: State):
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

最终生成的图结构如下：
![串行管道示意图](/img/sequential.png)

::: tip 📝
对于串行组合的图，langgraph 的 StateGraph 提供了 add_sequence 方法作为简便写法。该方法最适合在节点为函数（而非子图）时使用。若节点为子图，代码可能如下：

```python
graph = StateGraph(AgentState)
graph.add_sequence([("graph1", graph1), ("graph2", graph2), ("graph3", graph3)])
graph.add_edge("__start__", "graph1")
graph = graph.compile()
```

不过，上述写法仍显繁琐。因此，更推荐使用 sequential_pipeline 函数，它能通过一行代码快速构建串行执行图，更为简洁高效。
:::

## 并行管道

将多个状态图并行组合，支持灵活的并行执行策略。

通过下面函数实现:

- `parallel_pipeline` - 以并行方式组合多个状态图

支持的参数如下:

- `sub_graphs`: 要组合的状态图列表
- `state_schema`: 最终生成图的 State Schema
- `branches_fn`: 并行分支函数，返回 Send 对象列表控制并行执行
- `graph_name`: 最终生成图的名称（可选）
- `context_schema`: 最终生成图的 Context Schema（可选）
- `input_schema`: 最终生成图的输入 Schema（可选）
- `output_schema`: 最终生成图的输出 Schema（可选）

使用示例:

**基础并行示例**

```python
from langgraph.graph import StateGraph
from typing import Annotated, TypedDict
from langchain_dev_utils.pipeline import parallel_pipeline

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

最终生成的图结构如下：
![并行管道示意图](/img/parallel.png)

**使用分支函数控制并行执行**

有些时候需要根据条件指定并行执行哪些子图，这时可以使用分支函数。
分支函数需要返回`Send`列表。

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

重要注意事项

- 不传入 `branches_fn` 参数时，所有子图都会并行执行。
- 传入 `branches_fn` 参数时，执行哪些子图由该函数的返回值决定。
