# State Graph Orchestration

> [!NOTE]
>
> **Feature Overview**: Primarily used to achieve parallel and sequential combinations of multiple state graphs.
>
> **Prerequisites**: Understand LangChain's [Subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs) and [Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send).
>
> **Estimated Reading Time**: 5 minutes

## Sequential Pipeline

Connects state graphs sequentially, one after another, forming a linear execution flow.

Implemented via the following function:

- `sequential_pipeline` - Combines multiple state graphs in a sequential manner.

Supported parameters:

- `sub_graphs`: List of state graphs to combine (must be StateGraph instances)
- `state_schema`: The State Schema for the final generated graph
- `graph_name`: Name of the final generated graph (optional)
- `context_schema`: Context Schema for the final generated graph (optional)
- `input_schema`: Input Schema for the final generated graph (optional)
- `output_schema`: Output Schema for the final generated graph (optional)
- `checkpoint`: LangGraph persistence Checkpoint (optional)
- `store`: LangGraph persistence Store (optional)
- `cache`: LangGraph Cache (optional)

Usage Example:

```python
import datetime
from langchain.agents import AgentState
from langchain_core.messages import HumanMessage
from langchain_dev_utils.agents import create_agent
from langchain_dev_utils.pipeline import sequential_pipeline
from langchain_core.tools import tool
from langchain_dev_utils.chat_models import register_model_provider

register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)

@tool
def get_current_time():
    """Get the current time"""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@tool
def get_current_weather():
    """Get the current weather"""
    return "Sunny"


@tool
def get_current_user():
    """Get the current user"""
    return "Tom"


# Build a sequential pipeline (all subgraphs execute in order)
graph = sequential_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant. You can only answer the current time. If the question is unrelated to time, please directly reply that you cannot answer.",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant. You can only answer the current weather. If the question is unrelated to weather, please directly reply that you cannot answer.",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant. You can only answer the current user. If the question is unrelated to the user, please directly reply that you cannot answer.",
            name="user_agent",
        ),
    ],
    state_schema=AgentState,
)

response = graph.invoke({"messages": [HumanMessage("Hello")]})
print(response)
```

The final generated graph structure is as follows:
![Sequential Pipeline Diagram](/img/sequential.png)

::: tip 📝
For sequentially combined graphs, LangGraph's StateGraph provides the `add_sequence` method as a convenient shorthand. This method is most suitable when the nodes are functions (rather than subgraphs). If the nodes are subgraphs, the code might look like this:

```python
graph = StateGraph(AgentState)
graph.add_sequence([("graph1", graph1), ("graph2", graph2), ("graph3", graph3)])
graph.add_edge("__start__", "graph1")
graph = graph.compile()
```

However, the above approach can still be somewhat verbose. Therefore, using the `sequential_pipeline` function is recommended, as it allows for quick construction of a sequential execution graph with a single line of code, making it more concise and efficient.
:::

## Parallel Pipeline

Combines multiple state graphs in parallel, supporting flexible parallel execution strategies.

Implemented via the following function:

- `parallel_pipeline` - Combines multiple state graphs in a parallel manner.

Supported parameters:

- `sub_graphs`: List of state graphs to combine
- `state_schema`: The State Schema for the final generated graph
- `branches_fn`: Parallel branch function, returns a list of Send objects to control parallel execution
- `graph_name`: Name of the final generated graph (optional)
- `context_schema`: Context Schema for the final generated graph (optional)
- `input_schema`: Input Schema for the final generated graph (optional)
- `output_schema`: Output Schema for the final generated graph (optional)
- `checkpoint`: LangGraph persistence Checkpoint (optional)
- `store`: LangGraph persistence Store (optional)
- `cache`: LangGraph Cache (optional)

Usage Example:

**Basic Parallel Example**

```python
from langchain_dev_utils.pipeline import parallel_pipeline

# Build a parallel pipeline (all subgraphs execute in parallel)
graph = parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant. You can only answer the current time. If the question is unrelated to time, please directly reply that you cannot answer.",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant. You can only answer the current weather. If the question is unrelated to weather, please directly reply that you cannot answer.",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant. You can only answer the current user. If the question is unrelated to the user, please directly reply that you cannot answer.",
            name="user_agent",
        ),
    ],
    state_schema=AgentState,
)
response = graph.invoke({"messages": [HumanMessage("Hello")]})
print(response)
```

The final generated graph structure is as follows:
![Parallel Pipeline Diagram](/img/parallel.png)

**Using Branch Functions to Control Parallel Execution**

Sometimes it's necessary to specify which subgraphs to execute in parallel based on conditions. In such cases, you can use a branch function.
The branch function needs to return a list of `Send` objects.

```python
# Build a parallel pipeline (all subgraphs execute in parallel)
from langgraph.types import Send

graph = parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant. You can only answer the current time. If the question is unrelated to time, please directly reply that you cannot answer.",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant. You can only answer the current weather. If the question is unrelated to weather, please directly reply that you cannot answer.",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant. You can only answer the current user. If the question is unrelated to the user, please directly reply that you cannot answer.",
            name="user_agent",
        ),
    ],
    state_schema=AgentState,
    branches_fn=lambda e: [
        Send("weather_agent", arg={"messages": [HumanMessage("Get the current weather in New York")]}),
        Send("time_agent", arg={"messages": [HumanMessage("Get the current time")]}),
    ],
)


response = graph.invoke({"messages": [HumanMessage("Hello")]})
print(response)
```

Important Notes

- When the `branches_fn` parameter is _not_ provided, all subgraphs execute in parallel.
- When the `branches_fn` parameter _is_ provided, the execution of subgraphs is determined by the return value of this function.
