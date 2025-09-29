# State Graph Orchestration

This module provides two utility functions (called pipelines in this utils library) for combining multiple StateGraphs in parallel or sequential order to achieve complex multi-agent orchestration.

## Overview

Combine multiple StateGraphs through parallel or sequential approaches to build more complex multi-agent workflows.

## Sequential Pipeline

Connect state graphs in sequence to form a serial execution flow.

### Core Functions

- `sequential_pipeline` - Combines multiple state graphs sequentially

### Parameters

- `sub_graphs`: List of state graphs to combine (must be StateGraph instances)
- `state_schema`: State Schema for the final graph
- `graph_name`: Name of the final graph (optional)
- `context_schema`: Context Schema for the final graph (optional)
- `input_schema`: Input Schema for the final graph (optional)
- `output_schema`: Output Schema for the final graph (optional)

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
    """Create a simple state graph"""
    sub_graph = StateGraph(State)
    sub_graph.add_node("add", add)
    sub_graph.add_edge("__start__", "add")
    return sub_graph.compile(name=name)

# Build sequential pipeline
graph = sequential_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
)
```

The final generated graph is as follows:
![Sequential Pipeline Diagram](/img/sequential.png)

::: tip 📝
For sequentially composed graphs, LangGraph's StateGraph provides the add_sequence method as a convenient shorthand. This method works best when each node is a function (rather than a subgraph). If the nodes are subgraphs, the code might look like this:

python
graph = StateGraph(AgentState)
graph.add_sequence([("graph1", graph1), ("graph2", graph2), ("graph3", graph3)])
graph.add_edge("**start**", "graph1")
graph = graph.compile()
However, the above approach can still be somewhat verbose. Therefore, it's recommended to use the sequential_pipeline function instead, which allows you to quickly build a sequentially executed graph with just a single line of code—making it much more concise and efficient.
:::

## Parallel Pipeline

Combine multiple state graphs in parallel, supporting flexible parallel execution strategies.

### Core Functions

- `parallel_pipeline` - Combines multiple state graphs in parallel

### Parameters

- `sub_graphs`: List of state graphs to combine
- `state_schema`: State Schema for the final graph
- `parallel_entry_graph`: Entry state graph (defaults to `__start__`; when specified, this graph does not participate in parallel execution)
- `branches_fn`: Parallel branching function that returns a list of Send objects to control parallel execution
- `graph_name`: Name of the final graph (optional)
- `context_schema`: Context Schema for the final graph (optional)
- `input_schema`: Input Schema for the final graph (optional)
- `output_schema`: Output Schema for the final graph (optional)

### Usage Examples

#### Basic Parallel Example

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

# Build parallel pipeline (all subgraphs execute in parallel)
graph = parallel_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
)
```

The final generated graph is as follows:
![Parallel Pipeline Diagram](/img/parallel.png)

#### Parallel Example with Entry Graph

```python
# Specify graph1 as entry graph, other graphs execute in parallel
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

The final generated flowchart is as follows:
![Parallel Pipeline with Entry Diagram](/img/parallel_entry.png)

#### Controlling Parallel Execution with Branch Function

The branch function needs to return a list of `Send` objects. For details, refer to [Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send)

```python
from langgraph.prebuilt import Send

# Use branch function to precisely control parallel execution
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
        # graph3 will not be executed
    ],
)
```

### Important Notes

- When `branches_fn` parameter is not provided, all subgraphs execute in parallel (except the entry graph)
- When `branches_fn` parameter is provided, which subgraphs to execute is determined by the function's return value
- If both `parallel_entry_graph` and `branches_fn` are set, ensure the branch function does not include the entry node to avoid infinite loops

## Next Steps

- [API Reference](./api-reference.md) — Complete API documentation
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage
