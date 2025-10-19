# State Graph Orchestration

> [!NOTE]
>
> **Feature Overview**: Primarily used to achieve parallel and sequential composition of multiple state graphs.
>
> **Prerequisites**: Understand LangChain's [Subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs) and [Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send).
>
> **Estimated Reading Time**: 5 minutes

## Sequential Pipeline

Connects state graphs sequentially, forming a linear execution flow.

Implemented via the following function:

- `sequential_pipeline` - Combines multiple state graphs in a sequential manner.

Supported parameters:

- `sub_graphs`: List of state graphs to combine (must be StateGraph instances)
- `state_schema`: The State Schema for the final generated graph
- `graph_name`: Name of the final generated graph (optional)
- `context_schema`: Context Schema for the final generated graph (optional)
- `input_schema`: Input Schema for the final generated graph (optional)
- `output_schema`: Output Schema for the final generated graph (optional)

Usage Example:

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
    """Create a simple state graph"""
    sub_graph = StateGraph(State)
    sub_graph.add_node("add", add)
    sub_graph.add_edge("__start__", "add")
    return sub_graph.compile(name=name)

# Build a sequential pipeline
graph = sequential_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
)
```

The final generated graph structure is as follows:
![Sequential Pipeline Diagram](/img/sequential.png)

::: tip 📝
For sequentially composed graphs, LangGraph's StateGraph provides the `add_sequence` method as a convenient shorthand. This method is most suitable when the nodes are functions (rather than subgraphs). If the nodes are subgraphs, the code might look like this:

```python
graph = StateGraph(AgentState)
graph.add_sequence([("graph1", graph1), ("graph2", graph2), ("graph3", graph3)])
graph.add_edge("__start__", "graph1")
graph = graph.compile()
```

However, the above approach can still be somewhat verbose. Therefore, using the `sequential_pipeline` function is recommended, as it allows for quickly building a sequential execution graph with a single line of code, making it more concise and efficient.
:::

## Parallel Pipeline

Combines multiple state graphs in parallel, supporting flexible parallel execution strategies.

Implemented via the following function:

- `parallel_pipeline` - Combines multiple state graphs in a parallel manner.

Supported parameters:

- `sub_graphs`: List of state graphs to combine
- `state_schema`: The State Schema for the final generated graph
- `branches_fn`: Parallel branch function that returns a list of Send objects to control parallel execution
- `graph_name`: Name of the final generated graph (optional)
- `context_schema`: Context Schema for the final generated graph (optional)
- `input_schema`: Input Schema for the final generated graph (optional)
- `output_schema`: Output Schema for the final generated graph (optional)

Usage Example:

**Basic Parallel Example**

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

# Build a parallel pipeline (all subgraphs execute in parallel)
graph = parallel_pipeline(
    sub_graphs=[
        make_graph("graph1"),
        make_graph("graph2"),
        make_graph("graph3"),
    ],
    state_schema=State,
)
```

The final generated graph structure is as follows:
![Parallel Pipeline Diagram](/img/parallel.png)

**Controlling Parallel Execution Using a Branch Function**

Sometimes it's necessary to specify which subgraphs execute in parallel based on conditions. In such cases, a branch function can be used.
The branch function needs to return a list of `Send` objects.

```python
from langgraph.prebuilt import Send

# Use a branch function to precisely control parallel execution
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

Important Notes

- When the `branches_fn` parameter is not provided, all subgraphs execute in parallel.
- When the `branches_fn` parameter is provided, which subgraphs execute is determined by the return value of this function.
