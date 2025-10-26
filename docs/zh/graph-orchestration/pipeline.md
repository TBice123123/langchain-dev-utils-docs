# 状态图编排管道

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
- `checkpoint`: LangGraph 的持久化 Checkpoint（可选）
- `store`: LangGraph 的持久化 Store（可选）
- `cache`: LangGraph 的 Cache（可选）

使用示例:

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
    """获取当前时间"""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@tool
def get_current_weather():
    """获取当前天气"""
    return "晴天"


@tool
def get_current_user():
    """获取当前用户"""
    return "张三"


# 构建顺序管道（所有子图顺序执行）
graph = sequential_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="你是一个时间查询助手,仅能回答当前时间,如果这个问题和时间无关,请直接回答我无法回答",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="你是一个天气查询助手,仅能回答当前天气,如果这个问题和天气无关,请直接回答我无法回答",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="你是一个用户查询助手,仅能回答当前用户,如果这个问题和用户无关,请直接回答我无法回答",
            name="user_agent",
        ),
    ],
    state_schema=AgentState,
)

response = graph.invoke({"messages": [HumanMessage("你好")]})
print(response)
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
- `checkpoint`: LangGraph 的持久化 Checkpoint（可选）
- `store`: LangGraph 的持久化 Store（可选）
- `cache`: LangGraph 的 Cache（可选）

使用示例:

**基础并行示例**

```python
from langchain_dev_utils.pipeline import parallel_pipeline

# 构建并行管道（所有子图并行执行）
graph = parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="你是一个时间查询助手,仅能回答当前时间,如果这个问题和时间无关,请直接回答我无法回答",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="你是一个天气查询助手,仅能回答当前天气,如果这个问题和天气无关,请直接回答我无法回答",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="你是一个用户查询助手,仅能回答当前用户,如果这个问题和用户无关,请直接回答我无法回答",
            name="user_agent",
        ),
    ],
    state_schema=AgentState,
)
response = graph.invoke({"messages": [HumanMessage("你好")]})
print(response)
```

最终生成的图结构如下：
![并行管道示意图](/img/parallel.png)

**使用分支函数控制并行执行**

有些时候需要根据条件指定并行执行哪些子图，这时可以使用分支函数。
分支函数需要返回`Send`列表。

```python
# 构建并行管道（所有子图并行执行）
from langgraph.types import Send

graph = parallel_pipeline(
    sub_graphs=[
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_time],
            system_prompt="你是一个时间查询助手,仅能回答当前时间,如果这个问题和时间无关,请直接回答我无法回答",
            name="time_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_weather],
            system_prompt="你是一个天气查询助手,仅能回答当前天气,如果这个问题和天气无关,请直接回答我无法回答",
            name="weather_agent",
        ),
        create_agent(
            model="vllm:qwen3-4b",
            tools=[get_current_user],
            system_prompt="你是一个用户查询助手,仅能回答当前用户,如果这个问题和用户无关,请直接回答我无法回答",
            name="user_agent",
        ),
    ],
    state_schema=AgentState,
    branches_fn=lambda e: [
        Send("weather_agent", arg={"messages": [HumanMessage("获取当前New York天气")]}),
        Send("time_agent", arg={"messages": [HumanMessage("获取当前时间")]}),
    ],
)


response = graph.invoke({"messages": [HumanMessage("你好")]})
print(response)
```

重要注意事项

- 不传入 `branches_fn` 参数时，所有子图都会并行执行。
- 传入 `branches_fn` 参数时，执行哪些子图由该函数的返回值决定。
