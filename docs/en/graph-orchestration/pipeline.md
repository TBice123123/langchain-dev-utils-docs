# State Graph Orchestration Pipeline

> [!NOTE]
>
> **Feature Overview**: Primarily used for implementing parallel and serial combinations of multiple state graphs.
>
> **Prerequisites**: Understanding of langchain's [subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs) and [Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send).
>
> **Estimated Reading Time**: 5 minutes

## Serial Pipeline

Connects state graphs in sequence to form a serial execution flow.

Implemented through the following function:

- `sequential_pipeline` - Combines multiple state graphs in a serial manner

Its parameters are as follows:

<Params :params="[
{
name: 'sub_graphs',
type: 'list[StateGraph]',
description: 'List of state graphs to combine (must be StateGraph instances).',
required: true,
},
{
name: 'state_schema',
type: 'dict',
description: 'State Schema of the final generated graph.',
required: true,
},
{
name: 'graph_name',
type: 'string',
description: 'Name of the final generated graph.',
required: false,
},
{
name: 'context_schema',
type: 'dict',
description: 'Context Schema of the final generated graph.',
required: false,
},
{
name: 'input_schema',
type: 'dict',
description: 'Input Schema of the final generated graph.',
required: false,
},
{
name: 'output_schema',
type: 'dict',
description: 'Output Schema of the final generated graph.',
required: false,
},
{
name: 'checkpoint',
type: 'BaseCheckpointSaver',
description: 'LangGraph persistent Checkpoint.',
required: false,
},
{
name: 'store',
type: 'BaseStore',
description: 'LangGraph persistent Store.',
required: false,
},
{
name: 'cache',
type: 'BaseCache',
description: 'LangGraph Cache.',
required: false,
},
]"/>

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


# Build a sequential pipeline (all subgraphs execute in sequence)
graph = sequential_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer the current time. If this question is not related to time, please directly answer that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer the current weather. If this question is not related to weather, please directly answer that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer the current user. If this question is not related to the user, please directly answer that you cannot answer",
            name="user_agent",
        ),
    ],
    state_schema=AgentState,
)

response = graph.invoke({"messages": [HumanMessage("Hello")]})
print(response)
```

The final generated graph structure is as follows:
![Serial Pipeline Diagram](/img/sequential.png)

::: tip 📝
For serially combined graphs, LangGraph's StateGraph provides the add_sequence method as a convenient shorthand. This method is most suitable when nodes are functions (rather than subgraphs). If nodes are subgraphs, the code might look like:

```python
graph = StateGraph(AgentState)
graph.add_sequence([("graph1", graph1), ("graph2", graph2), ("graph3", graph3)])
graph.add_edge("__start__", "graph1")
graph = graph.compile()
```

However, the above approach is still somewhat cumbersome. Therefore, it's more recommended to use the sequential_pipeline function, which can quickly build a serial execution graph with a single line of code, making it more concise and efficient.
:::

## Parallel Pipeline

Combines multiple state graphs in parallel, supporting flexible parallel execution strategies.

Implemented through the following function:

- `parallel_pipeline` - Combines multiple state graphs in a parallel manner

Its parameters are as follows:

<Params :params="[
{
name: 'sub_graphs',
type: 'list[StateGraph]',
description: 'List of state graphs to combine.',
required: true,
},
{
name: 'state_schema',
type: 'dict',
description: 'State Schema of the final generated graph.',
required: true,
},
{
name: 'branches_fn',
type: 'Callable[[Any], list[Send]]',
description: 'Parallel branch function that receives state as input and returns a list of Send objects to control which subgraphs are executed in parallel.',
required: false,
},
{
name: 'graph_name',
type: 'string',
description: 'Name of the final generated graph.',
required: false,
},
{
name: 'context_schema',
type: 'dict',
description: 'Context Schema of the final generated graph.',
required: false,
},
{
name: 'input_schema',
type: 'dict',
description: 'Input Schema of the final generated graph.',
required: false,
},
{
name: 'output_schema',
type: 'dict',
description: 'Output Schema of the final generated graph.',
required: false,
},
{
name: 'checkpoint',
type: 'BaseCheckpointSaver',
description: 'LangGraph persistent Checkpoint.',
required: false,
},
{
name: 'store',
type: 'BaseStore',
description: 'LangGraph persistent Store.',
required: false,
},
{
name: 'cache',
type: 'BaseCache',
description: 'LangGraph Cache.',
required: false,
},
]"/>

Usage example:

### Basic Parallel Example

```python
from langchain_dev_utils.pipeline import parallel_pipeline

# Build a parallel pipeline (all subgraphs execute in parallel)
graph = parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer the current time. If this question is not related to time, please directly answer that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer the current weather. If this question is not related to weather, please directly answer that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer the current user. If this question is not related to the user, please directly answer that you cannot answer",
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

### Using Branch Function to Control Parallel Execution

Sometimes you need to specify which subgraphs are executed in parallel based on conditions. In this case, you can use a branch function.
The branch function needs to return a list of `Send` objects.

```python
# Build a parallel pipeline (all subgraphs execute in parallel)
from langgraph.types import Send

graph = parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer the current time. If this question is not related to time, please directly answer that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer the current weather. If this question is not related to weather, please directly answer that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer the current user. If this question is not related to the user, please directly answer that you cannot answer",
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

**Important Notes**

- When the `branches_fn` parameter is not provided, all subgraphs will be executed in parallel.
- When the `branches_fn` parameter is provided, which subgraphs are executed is determined by the return value of this function.
