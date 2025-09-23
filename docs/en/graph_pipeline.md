# Subgraph Orchestration

This module provides two utility functions that allow you to combine your custom LangGraph subgraphs in either serial or parallel arrangements.

## Overview

These utilities enable you to combine multiple subgraphs sharing the same state schema in either parallel or serial configurations.

## Serial Pipeline

Enables combining multiple subgraphs with identical state schemas in a serial (sequential) arrangement.

### Core Function

- `sequential_pipeline`: Combines subgraphs into a serial pipeline.

### Parameters

- `sub_graphs`: List of subgraphs to be combined.
- `state_schema`: The shared State Schema for all subgraphs.
- `graph_name`: Name of the final assembled graph.
- `context_schema`: The shared Context Schema for all subgraphs.
- `input_schema`: Input Schema of the final assembled graph.
- `output_schema`: Output Schema of the final assembled graph.

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

The resulting graph structure:
![alt text](/img/sequential.png)

## Parallel Pipeline

Enables combining multiple subgraphs with identical state schemas in a parallel arrangement.

### Core Function

- `parallel_pipeline`: Combines subgraphs into a parallel pipeline.

### Parameters

- `sub_graphs`: List of subgraphs to be combined.
- `state_schema`: The shared State Schema for all subgraphs.
- `parallel_entry_node`: Entry node for parallel execution (defaults to `__start__`) (note: this node is not included within the parallel section).
- `graph_name`: Name of the final assembled graph.
- `context_schema`: The shared Context Schema for all subgraphs.
- `input_schema`: Input Schema of the final assembled graph.
- `output_schema`: Output Schema of the final assembled graph.

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

The resulting graph structure:
![alt text](/img/parallel.png)

If `parallel_entry_node` is specified, the designated entry node will not be included within the parallel execution group.
Example:

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

The resulting graph structure:
![alt text](/img/parallel_entry.png)

## Next Steps

- [API Reference](./api-reference.md) - API reference documentation
- [Usage Examples](./example.md) - Demonstrations of library usage
