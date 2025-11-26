# State Graph Orchestration Pipeline

> [!NOTE]
>
> **Feature Overview**: Mainly used for implementing parallel and sequential combinations of multiple state graphs.
>
> **Prerequisites**: Understanding of LangChain's [subgraphs](https://docs.langchain.com/oss/python/langgraph/use-subgraphs), [Send](https://docs.langchain.com/oss/python/langgraph/graph-api#send).
>
> **Estimated Reading Time**: 5 minutes

## Overview

Provides utilities for convenient state graph orchestration. Mainly includes the following features:

- Orchestrate multiple state graphs in sequence to form a sequential execution flow.
- Orchestrate multiple state graphs in parallel to form a parallel execution flow.

## Sequential Orchestration

Connect state graphs sequentially to form a sequential execution flow.

Implemented through the following function:

- `create_sequential_pipeline` - Combine multiple state graphs in a sequential manner

Its parameters are:
<Params
name="sub_graphs"
type="list[StateGraph | CompiledStateGraph]"
description="List of state graphs to combine (must be StateGraph or CompiledStateGraph instances)."
:required="true"
:default="null"
/>
<Params
name="state_schema"
type="dict"
description="State Schema of the final generated graph."
:required="true"
:default="null"
/>
<Params
name="graph_name"
type="string"
description="Name of the final generated graph."
:required="false"
:default="null"
/>
<Params
name="context_schema"
type="dict"
description="Context Schema of the final generated graph."
:required="false"
:default="null"
/>
<Params
name="input_schema"
type="dict"
description="Input Schema of the final generated graph."
:required="false"
:default="null"
/>

<Params
name="output_schema"
type="dict"
description="Output Schema of the final generated graph."
:required="false"
:default="null"
/>

<Params
name="checkpoint"
type="BaseCheckpointSaver"
description="LangGraph's persistent Checkpoint."
:required="false"
:default="null"
/>

<Params
name="store"
type="BaseStore"
description="LangGraph's persistent Store."
:required="false"
:default="null"
/>

<Params
name="cache"
type="BaseCache"
description="LangGraph's Cache."
:required="false"
:default="null"
/>

Usage example:

```python
import datetime
from langchain.agents import AgentState
from langchain_core.messages import HumanMessage
from langchain_dev_utils.agents import create_agent
from langchain_dev_utils.pipeline import create_sequential_pipeline
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
    return "John Doe"


# Build sequential pipeline (all subgraphs execute in sequence)
graph = create_sequential_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer current time. If the question is not related to time, please directly answer that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer current weather. If the question is not related to weather, please directly answer that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer current user. If the question is not related to user, please directly answer that you cannot answer",
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
For serially combined graphs, LangGraph's StateGraph provides the add_sequence method as a convenient syntax. This method is most suitable when nodes are functions (not subgraphs). If nodes are subgraphs, the code might look like:

```python
graph = StateGraph(AgentState)
graph.add_sequence([("graph1", graph1), ("graph2", graph2), ("graph3", graph3)])
graph.add_edge("__start__", "graph1")
graph = graph.compile()
```

However, the above syntax is still somewhat cumbersome. Therefore, it's more recommended to use the `create_sequential_pipeline` function, which can quickly build a sequential execution graph with one line of code, making it more concise and efficient.
:::

## Parallel Orchestration

Combine multiple state graphs in parallel, supporting flexible parallel execution strategies.

Implemented through the following function:

- `create_parallel_pipeline` - Combine multiple state graphs in a parallel manner

Its parameters are:

<Params
name="sub_graphs"
type="list[StateGraph | CompiledStateGraph]"
description="List of state graphs to combine (must be StateGraph or CompiledStateGraph instances)."
:required="true"
:default="null"
/>
<Params
name="state_schema"
type="dict"
description="State Schema of the final generated graph."
:required="true"
:default="null"
/>
<Params
name="branches_fn"
type="Callable[[Any], list[Send]]"
description="Parallel branch function, receives state as input and returns a list of Send objects to control which subgraphs are executed in parallel."
:required="false"
:default="null"
/>
<Params
name="graph_name"
type="string"
description="Name of the final generated graph."
:required="false"
:default="null"
/>
<Params
name="context_schema"
type="dict"
description="Context Schema of the final generated graph."
:required="false"
:default="null"
/>
<Params
name="input_schema"
type="dict"
description="Input Schema of the final generated graph."
:required="false"
:default="null"
/>

<Params
name="output_schema"
type="dict"
description="Output Schema of the final generated graph."
:required="false"
:default="null"
/>

<Params
name="checkpoint"
type="BaseCheckpointSaver"
description="LangGraph's persistent Checkpoint."
:required="false"
:default="null"
/>

<Params
name="store"
type="BaseStore"
description="LangGraph's persistent Store."
:required="false"
:default="null"
/>

<Params
name="cache"
type="BaseCache"
description="LangGraph's Cache."
:required="false"
:default="null"
/>
Usage example:

### Basic Parallel Example

```python
from langchain_dev_utils.pipeline import create_parallel_pipeline

# Build parallel pipeline (all subgraphs execute in parallel)
graph = create_parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer current time. If the question is not related to time, please directly answer that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer current weather. If the question is not related to weather, please directly answer that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer current user. If the question is not related to user, please directly answer that you cannot answer",
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

Sometimes you need to specify which subgraphs to execute in parallel based on conditions, in which case you can use a branch function.
The branch function needs to return a list of `Send`.

```python
# Build parallel pipeline (all subgraphs execute in parallel)
from langgraph.types import Send

graph = create_parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="You are a time query assistant, can only answer current time. If the question is not related to time, please directly answer that you cannot answer",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="You are a weather query assistant, can only answer current weather. If the question is not related to weather, please directly answer that you cannot answer",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="You are a user query assistant, can only answer current user. If the question is not related to user, please directly answer that you cannot answer",
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

- When the `branches_fn` parameter is not passed, all subgraphs will execute in parallel.
- When the `branches_fn` parameter is passed, which subgraphs to execute is determined by the return value of this function.