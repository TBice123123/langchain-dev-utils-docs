# State Graph Orchestration

This module provides two utility functions (pipelines) that allow you to combine multiple StateGraphs in either parallel or sequential order.

## Overview

Combine multiple StateGraphs in parallel or sequential order to enable complex multi-agent orchestration.

## Sequential Pipeline

Provides functionality to combine StateGraphs in a sequential pipeline.

### Core Function

- `sequential_pipeline`: Combines StateGraphs into a sequential pipeline.

### Parameters

- `sub_graphs`: A list of state graphs to be combined (must be instances of StateGraph).
- `state_schema`: The shared State Schema among all sub-graphs.
- `graph_name`: The name of the final constructed graph.
- `context_schema`: The shared Context Schema among all sub-graphs.
- `input_schema`: The input Schema of the final constructed graph.
- `output_schema`: The output Schema of the final constructed graph.

### Usage Example

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

The final constructed graph is as follows:
![alt text](/img/sequential.png)

## Parallel Pipeline

Provides functionality to combine StateGraphs in a parallel pipeline.

### Core Function

- `parallel_pipeline`: Combines StateGraphs into a parallel pipeline.

### Parameters

- `sub_graphs`: A list of state graphs to be combined.
- `state_schema`: The shared State Schema among all sub-graphs.
- `parallel_entry_node`: The parallel entry node (default: `__start__`) (note: this node is not included in the parallel nodes).
- `branches_fn`: A branching function that returns a list of `Send` objects, each describing which sub-graph nodes should be executed in parallel during this step.
- `graph_name`: The name of the final constructed graph.
- `context_schema`: The shared Context Schema among all sub-graphs.
- `input_schema`: The input Schema of the final constructed graph.
- `output_schema`: The output Schema of the final constructed graph.

### Usage Example

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

The final constructed graph is as follows:
![alt text](/img/parallel.png)

If `parallel_entry_node` is specified, the parallel entry node will not be included in the list of parallel nodes. For example:

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

The final constructed graph is as follows:
![alt text](/img/parallel_entry.png)

Additionally, you can dynamically determine which sub-graphs should be executed in parallel using LangGraph's `Send` API:

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

The final graph structure is similar to the above, but the key difference is: whereas the previous example executes all three sub-graphs in parallel, this version executes only `graph1` and `graph2`. For details, refer to [Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send).

**Note**:

(1) If the `branches_fn` parameter is not provided, all sub-graphs will execute in parallel, except for the entry node—in this case, the entry node executes sequentially before the others. However, if `branches_fn` is provided, the function's return value determines which sub-graphs to execute. Therefore, if both `parallel_entry_node` and `branches_fn` are set, ensure the returned list from `branches_fn` does not include the entry node; otherwise, it may cause an infinite loop.

(2) All combined state graphs must share common state keys.

## Next Steps

- [API Reference](./api-reference.md) - API reference documentation
- [Usage Examples](./example.md) - Demonstrates practical usage examples of this library
