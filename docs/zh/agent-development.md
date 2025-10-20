# Agent 开发

> [!NOTE]
>
> **功能概述**：提供方便进行 Agent 开发的实用工具。
>
> **前置要求**：了解 langchain 的[Agent](https://docs.langchain.com/oss/python/langchain/agents)、[中间件](https://docs.langchain.com/oss/python/langchain/middleware)。
>
> **预计阅读时间**：10 分钟

## 预构建 Agent

预构建智能体模块主要是提供一个和`langchain`的`create_agent`函数功能上完全相同的函数，但是通过字符串指定更多的模型(需要进行注册)。

核心函数:

- `create_agent`：创建单智能体

参数如下:

- model: 模型名称，取值必须为字符串，且格式是`provider_name:model_name`,同时支持`init_chat_model`以及`load_chat_model`支持的格式，其中`load_chat_model`的 provider_name 需要使用`register_model_provider`完成注册。
- 其它参数与`langchain`的`create_agent`完全相同。

### 使用示例

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# 注册模型提供商
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)


@tool
def get_current_time() -> str:
    """获取当前时间戳"""
    return str(datetime.datetime.now().timestamp())


agent = create_agent("vllm:qwen3-4b", tools=[get_current_time])
# 使用方式与 langchain的create_agent完全一致
response = agent.invoke({"messages": [HumanMessage(content="现在几点了？")]})
print(response)
```

## 中间件

目前有三个中间件,均继承于官方的中间件.分别是:

- `SummarizationMiddleware`：摘要中间件，主要用于上下文压缩
- `LLMToolSelectorMiddleware`：LLM 工具选择中间件，用于选择合适的工具
- `PlanMiddleware`：任务规划中间件，用于任务规划

### SummarizationMiddleware

核心作用是压缩对话内容，功能与官方[SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization)完全一致。但是只允许字符串参数指定模型，与上面的`create_agent`一样，模型可以选择的范围更大，但是需要进行注册。
使用示例:

```python
from langchain_core.messages import AIMessage
from langchain_dev_utils.agents.middleware import SummarizationMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        SummarizationMiddleware(
            model="vllm:qwen3-4b",
            max_tokens_before_summary=100,
            messages_to_keep=1,
        )
    ],
    system_prompt="你是一个智能的AI助手，可以解决用户的问题",
)
# big_text 是一个包含大量内容的文本，这里省略
big_messages = [
    HumanMessage(content="你好，你是谁"),
    AIMessage(content="我是你的AI助手"),
    HumanMessage(content="写一段优美的长文本"),
    AIMessage(content=f"好的，我会写一段优美的长文本，内容是：{big_text}"),
    HumanMessage(content="你为啥要写这段长文本呢？"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

### LLMToolSelectorMiddleware

核心作用是用于大量工具的情况下，由 LLM 自己选择工具，功能与官方[LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector)完全一致。但是同样只允许字符串指定模型，与上面的`create_agent`一样，模型可以选择的范围更大，但是需要进行注册。
使用示例:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolSelectorMiddleware,
)

@tool
def get_current_weather() -> str:
    """获取当前天气"""
    return "今天天气晴朗"


@tool
def search() -> str:
    """搜索"""
    return "搜索结果"


@tool
def run_python() -> str:
    """运行Python代码"""
    return "运行Python代码"


agent = create_agent(
    "vllm:qwen3-4b",
    tools=[get_current_time, get_current_weather, search, run_python],
    name="agent",
    middleware=[
        LLMToolSelectorMiddleware(model="vllm:qwen3-4b", max_tools=2),
    ],
)

response = agent.invoke({"messages": [HumanMessage(content="现在几点了？")]})
print(response)
```

### PlanMiddleware

任务规划的中间件，用于在执行复杂任务前进行结构化分解与过程管理。

::: tip 📝
任务规划是一种高效的上下文工程管理策略。在执行任务之前，大模型首先将整体任务拆解为多个有序的子任务，形成任务规划列表（在本库中称为 plan）。随后按顺序执行各子任务，并在每完成一个步骤后动态更新任务状态，直至所有子任务执行完毕。
:::

本中间件与 LangChain 官方提供的 [Plan 中间件](https://docs.langchain.com/oss/python/langchain/middleware#planning)功能定位相似，但在工具设计上存在差异。官方中间件仅提供 `write_todo` 工具，面向的是待办清单（todo list）结构；而本库则提供了 `write_plan` 与 `update_plan` 两个专用工具，专门用于对规划列表（plan list）进行写入与更新操作。

无论是`todo`还是`plan`其本质都是同一个，因此本中间件区别于官方的关键点在于提供的工具，官方的添加和修改是通过一个工具来完成的，而本库则提供了两个工具，一个用于添加，一个用于修改。

具体表现为如下的两个函数:

- `create_write_plan_tool`：创建一个用于写计划的工具的函数
- `create_update_plan_tool`：创建一个用于更新计划的工具的函数

这两个函数接收的参数如下:

- `name`：自定义工具名称，如果不传则 create_write_plan_tool 默认为`write_plan`，create_update_plan_tool 默认为`update_plan`
- `description`：工具描述,如果不传则采用默认的工具描述
- `message_key`：用于更新 messages 的键，若不传入则使用默认的`messages`

使用示例如下:

```python
from langchain_dev_utils.agents.middleware.plan import (
    create_write_plan_tool,
    create_update_plan_tool,
    PlanState,
)

agent = create_agent(
    model="vllm:qwen3-4b",
    state_schema=PlanState,
    tools=[create_write_plan_tool(), create_update_plan_tool()],
)
```

需要注意的是,要使用这两个工具,你必须要保证状态 Schema 中包含 plan 这个键,否则会报错,对此你可以使用本库提供的`PlanState`来继承状态 Schema。

::: details write_plan

```python
 def write_plan(plan: list[str], tool_call_id: Annotated[str, InjectedToolCallId]):
        msg_key = message_key or "messages"
        return Command(
            update={
                "plan": [
                    {
                        "content": content,
                        "status": "pending" if index > 0 else "in_progress",
                    }
                    for index, content in enumerate(plan)
                ],
                msg_key: [
                    ToolMessage(
                        content=f"Plan successfully written, please first execute the {plan[0]} task (no need to change the status to in_process)",
                        tool_call_id=tool_call_id,
                    )
                ],
            }
        )
```

:::

::: details update_plan

```python
def update_plan(
        update_plans: list[Plan],
        tool_call_id: Annotated[str, InjectedToolCallId],
        state: Annotated[PlanStateMixin, InjectedState],
    ):
        plan_list = state.get("plan", [])

        updated_plan_list = []

        for update_plan in update_plans:
            for plan in plan_list:
                if plan["content"] == update_plan["content"]:
                    plan["status"] = update_plan["status"]
                    updated_plan_list.append(plan)

        if len(updated_plan_list) < len(update_plans):
            raise ValueError(
                "Not fullly updated plan, missing:"
                + ",".join(
                    [
                        plan["content"]
                        for plan in update_plans
                        if plan not in updated_plan_list
                    ]
                )
                + "\nPlease check the plan list, the current plan list is:"
                + "\n".join(
                    [plan["content"] for plan in plan_list if plan["status"] != "done"]
                )
            )
        msg_key = message_key or "messages"

        return Command(
            update={
                "plan": plan_list,
                msg_key: [
                    ToolMessage(
                        content="Plan updated successfully", tool_call_id=tool_call_id
                    )
                ],
            }
        )
```

:::

但是上述的使用方式在本库是不推荐的，最佳的做法应该是使用 PlanMiddleware。
PlanMiddleware 的参数说明如下:

- `system_prompt`：可选字符串类型，系统提示词，功能上与官方的 TodoListMiddleware 相同
- `tools`：可选 BaseTool 列表类型，工具列表，指定后会加入到 tools 中，必须是通过 create_write_plan_tool 和 create_update_plan_tool 创建的工具

```python
from langchain_dev_utils.agents.middleware import (
    create_write_plan_tool,
    create_update_plan_tool,
    PlanMiddleware,
)


agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        PlanMiddleware(
            tools=[create_write_plan_tool(), create_update_plan_tool()],
        )
    ],
)


response = agent.invoke(
    {"messages": [HumanMessage(content="我要去New York玩几天，帮我规划行程")]}
)
print(response)
```
