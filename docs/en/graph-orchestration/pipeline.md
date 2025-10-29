# State Graph Orchestration Pipeline

> [!NOTE]
>
> **Feature Overview**: Mainly used to implement parallel and sequential combinations of multiple state graphs.
>
> **Prerequisites**: Understand LangChain's [Subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs) and [Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send).
>
> **Estimated Reading Time**: 5 minutes

## Sequential Pipeline

Connects state graphs in sequence to form a serial execution flow.

Implemented through the following function:

- `sequential_pipeline` - Combines multiple state graphs in sequential order

Supported parameters:

- **sub_graphs**: List of state graphs to combine (must be StateGraph instances)
- **state_schema**: State Schema for the final generated graph
- **graph_name**: Name of the final generated graph (optional)
- **context_schema**: Context Schema for the final generated graph (optional)
- **input_schema**: Input Schema for the final generated graph (optional)
- **output_schema**: Output Schema for the final generated graph (optional)
- **checkpoint**: LangGraph's persistence Checkpoint (optional)
- **store**: LangGraph's persistence Store (optional)
- **cache**: LangGraph's Cache (optional)

Usage example:

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
    """Get current time"""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@tool
def get_current_weather():
    """Get current weather"""
    return "Sunny"


@tool
def get_current_user():
    """Get current user"""
    return "Zhang San"


# Build sequential pipeline (all subgraphs execute in order)
graph = sequential_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer current time. If the question is unrelated to time, please directly reply that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer current weather. If the question is unrelated to weather, please directly reply that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer current user. If the question is unrelated to user, please directly reply that you cannot answer",
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
For sequentially combined graphs, LangGraph's StateGraph provides the add_sequence method as a convenient shorthand. This method is most suitable when nodes are functions (rather than subgraphs). If nodes are subgraphs, the code might look like this:

```python
graph = StateGraph(AgentState)
graph.add_sequence([("graph1", graph1), ("graph2", graph2), ("graph3", graph3)])
graph.add_edge("__start__", "graph1")
graph = graph.compile()
```

However, the above approach is still somewhat verbose. Therefore, it's recommended to use the sequential_pipeline function, which can quickly build a sequential execution graph with a single line of code, making it more concise and efficient.
:::

## Parallel Pipeline

Combines multiple state graphs in parallel, supporting flexible parallel execution strategies.

Implemented through the following function:

- `parallel_pipeline` - Combines multiple state graphs in parallel

Supported parameters:

- **sub_graphs**: List of state graphs to combine
- **state_schema**: State Schema for the final generated graph
- **branches_fn**: Parallel branch function that returns a list of Send objects to control parallel execution
- **graph_name**: Name of the final generated graph (optional)
- **context_schema**: Context Schema for the final generated graph (optional)
- **input_schema**: Input Schema for the final generated graph (optional)
- **output_schema**: Output Schema for the final generated graph (optional)
- **checkpoint**: LangGraph's persistence Checkpoint (optional)
- **store**: LangGraph's persistence Store (optional)
- **cache**: LangGraph's Cache (optional)

Usage example:

**Basic Parallel Example**

```python
from langchain_dev_utils.pipeline import parallel_pipeline

# Build parallel pipeline (all subgraphs execute in parallel)
graph = parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer current time. If the question is unrelated to time, please directly reply that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer current weather. If the question is unrelated to weather, please directly reply that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer current user. If the question is unrelated to user, please directly reply that you cannot answer",
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

Sometimes you need to specify which subgraphs to execute in parallel based on conditions. In such cases, you can use branch functions.
Branch functions need to return a list of `Send` objects.

```python
# Build parallel pipeline (all subgraphs execute in parallel)
from langgraph.types import Send

graph = parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer current time. If the question is unrelated to time, please directly reply that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer current weather. If the question is unrelated to weather, please directly reply that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer current user. If the question is unrelated to user, please directly reply that you cannot answer",
            name="user_agent",
        ),
    ],
    state_schema=AgentState,
    branches_fn=lambda e: [
        Send("weather_agent", arg={"messages": [HumanMessage("Get current New York weather")]}),
        Send("time_agent", arg={"messages": [HumanMessage("Get current time")]}),
    ],
)

response = graph.invoke({"messages": [HumanMessage("Hello")]})
print(response)
```

Important Notes

- When the `branches_fn` parameter is not provided, all subgraphs will execute in parallel.
- When the `branches_fn` parameter is provided, which subgraphs execute is determined by the return value of this function.
