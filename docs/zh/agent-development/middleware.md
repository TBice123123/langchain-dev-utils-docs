# 中间件

> [!NOTE]
>
> **功能概述**：提供方便进行 Agent 开发的实用工具。
>
> **前置要求**：了解 langchain 的[中间件](https://docs.langchain.com/oss/python/langchain/middleware)。
>
> **预计阅读时间**：10 分钟

中间件是专门针对`langchain`预构建的 Agent 而构建的组件。官方提供了一些内置的中间件。本库则根据实际情况和本库的使用场景，提供了更多的中间件。

## SummarizationMiddleware

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

## LLMToolSelectorMiddleware

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

## PlanMiddleware

任务规划的中间件，用于在执行复杂任务前进行结构化分解与过程管理。

::: tip 📝
任务规划是一种高效的上下文工程管理策略。在执行任务之前，大模型首先将整体任务拆解为多个有序的子任务，形成任务规划列表（在本库中称为 plan）。随后按顺序执行各子任务，并在每完成一个步骤后动态更新任务状态，直至所有子任务执行完毕。
:::

本中间件与 LangChain 官方提供的 [Plan 中间件](https://docs.langchain.com/oss/python/langchain/middleware#planning)功能定位相似，但在工具设计上存在差异。官方中间件仅提供 `write_todo` 工具，面向的是待办清单（todo list）结构；而本库则提供了 `write_plan` 、`finish_sub_plan`、`read_plan` 三个专用工具，专门用于对规划列表（plan list）进行写入、修改、查询等操作。

无论是`todo`还是`plan`其本质都是同一个，因此本中间件区别于官方的关键点在于提供的工具，官方的添加和修改是通过一个工具来完成的，而本库则提供了三个工具，其中`write_plan`可用于写入计划或者更新计划内容，`finish_sub_plan`则用于在完成某个子任务后更新其状态，`read_plan`用于查询计划内容。

具体表现为如下的三个函数:

- `create_write_plan_tool`：创建一个用于写计划的工具的函数
- `create_finish_sub_plan_tool`：创建一个用于完成子任务的工具的函数
- `create_read_plan_tool`：创建一个用于查询计划的工具的函数

这三个函数接收的参数如下:

- `description`：工具描述,如果不传则采用默认的工具描述
- `message_key`：用于更新 messages 的键，若不传入则使用默认的`messages` （`read_plan`工具无此参数）

使用示例如下:

```python
from langchain_dev_utils.agents.middleware.plan import (
    create_write_plan_tool,
    create_finish_sub_plan_tool,
    create_read_plan_tool,
    PlanState,
)

agent = create_agent(
    model="vllm:qwen3-4b",
    state_schema=PlanState,
    tools=[create_write_plan_tool(), create_finish_sub_plan_tool(), create_read_plan_tool()],
)
```

需要注意的是,要使用这三个工具,你必须要保证状态 Schema 中包含 plan 这个键,否则会报错,对此你可以使用本库提供的`PlanState`来继承状态 Schema。

::: details write_plan

write_plan 有两个作用：1 是第一次进行计划的写入。2 是在计划的执行过程中，如果发现现有计划有问题，可以进行更新。

```python
@tool(description=description or _DEFAULT_WRITE_PLAN_TOOL_DESCRIPTION,)
def write_plan(plan: list[str], runtime: ToolRuntime):
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
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )

```

:::

::: details finish_sub_plan

finish_sub_plan 则是仅用于更新当前子任务的状态，以及设置下一个子任务。

```python
@tool(description=description or _DEFAULT_FINISH_SUB_PLAN_TOOL_DESCRIPTION,)
def finish_sub_plan(runtime: ToolRuntime,):
    msg_key = message_key or "messages"
    plan_list = runtime.state.get("plan", [])

    sub_finish_plan = ""
    sub_next_plan = ",all sub plan are done"
    for plan in plan_list:
        if plan["status"] == "in_progress":
            plan["status"] = "done"
            sub_finish_plan = f"finish sub plan:**{plan['content']}**"

    for plan in plan_list:
        if plan["status"] == "pending":
            plan["status"] = "in_progress"
            sub_next_plan = f",next plan:**{plan['content']}**"
            break

    return Command(
        update={
            "plan": plan_list,
            msg_key: [
                ToolMessage(
                    content=sub_finish_plan + sub_next_plan,
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )
```

:::

::: details read_plan

read_plan 则是仅用于读取当前的计划。

```python
@tool(description=description or _DEFAULT_READ_PLAN_TOOL_DESCRIPTION)
def read_plan(runtime: ToolRuntime):
    plan_list = runtime.state.get("plan", [])
    return json.dumps(plan_list)
```

:::

但是上述的使用方式在本库是不推荐的，最佳的做法应该是使用 PlanMiddleware。
PlanMiddleware 的参数说明如下:

- `system_prompt`：可选字符串类型，系统提示词，功能上与官方的 TodoListMiddleware 相同
- `tools`：可选 BaseTool 列表类型，工具列表，指定后会加入到 tools 中，必须是通过 `create_write_plan_tool`、`create_finish_sub_plan_tool` 以及 `create_read_plan_tool` 创建的工具

```python
from langchain_dev_utils.agents.middleware import (
    create_write_plan_tool,
    create_finish_sub_plan_tool,
    create_read_plan_tool,
    PlanMiddleware,
)


agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        PlanMiddleware(
            tools=[create_write_plan_tool(), create_finish_sub_plan_tool(), create_read_plan_tool()],
        )
    ],
)


response = agent.invoke(
    {"messages": [HumanMessage(content="我要去New York玩几天，帮我规划行程")]}
)
print(response)
```

**注意:**

1. `PlanMiddleware` 的两个参数均为可选。若不传入任何参数，系统将默认使用 `_DEFAULT_PLAN_SYSTEM_PROMPT` 作为系统提示词，并自动加载由 `create_write_plan_tool`、`create_finish_sub_plan_tool` 及 `create_read_plan_tool` 创建的工具集。

2. 对于 `tools` 参数，仅支持使用 `create_write_plan_tool`、`create_finish_sub_plan_tool` 和 `create_read_plan_tool` 所创建的工具。其中，`create_read_plan_tool`为可选工具，仅传入前两者时，此中间件仍可正常运行，但将不具备读取计划的功能。

## ModelFallbackMiddleware

用于在调用模型失败时回退到备用模型的中间件。功能与官方[ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback)完全一致。但是同样只允许字符串指定模型，与上面的`create_agent`一样，模型可以选择的范围更大，但是需要进行注册。使用示例:

```python
from langchain_dev_utils.agents.middleware import (
    ModelFallbackMiddleware,
)

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        ModelFallbackMiddleware(
           "vllm:qwen3-8b",
           "openrouter:meta-llama/llama-3.3-8b-instruct:free",
        )
    ],
)

response = agent.invoke({"messages": [HumanMessage(content="你好。")]}),
print(response)
```

## LLMToolEmulator

用于使用大模型来模拟工具调用的中间件。功能与官方[LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator)完全一致。但是同样只允许字符串指定模型，与上面的`create_agent`一样，模型可以选择的范围更大，但是需要进行注册。使用示例:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolEmulator,
)

agent = create_agent(
    model="vllm:qwen3-4b",
    tools=[get_current_time],
    middleware=[
        LLMToolEmulator(
            model="vllm:qwen3-4b"
        )
    ],
)

response = agent.invoke({"messages": [HumanMessage(content="现在几点了？")]}),
print(response)
```

## ModelRouterMiddleware

用于根据输入内容动态路由到合适模型的中间件。

对于此中间件，你需要传入两个参数:

- `router_model`: 用于路由的模型
- `model_list`: 模型列表，每个模型需要包含`model_name`和`model_description`两个键，同时也可以选择性地包含`tools`这个键，代表模型可用的工具，如果不传则默认是使用全部工具。
- `router_prompt`: 路由模型的提示词，如果为 None 则使用默认的提示词

使用示例:

```python
from langchain_dev_utils.agents.middleware import ModelRouterMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    tools=[run_python_code,get_current_time],
    middleware=[
        ModelRouterMiddleware(
            router_model="vllm:qwen3-4b",
            model_list=[
                {
                    "model_name": "vllm:qwen3-8b",
                    "model_description": "适合普通任务，如对话、文本生成等",
                },
                {
                    "model_name": "openrouter:qwen/qwen3-vl-32b-instruct",
                    "model_description": "适合视觉任务",
                },
                {
                    "model_name": "openrouter:qwen/qwen3-coder-plus",
                    "model_description": "适合代码生成任务",
                    "tools": [run_python_code],
                },
            ],
        )
    ],
)
print(agent.invoke({"messages": [HumanMessage(content="帮我写一个冒泡排序代码")]}))
```

**注意：** `model_list`中的每个`tools`参数中的所有工具都应同时在`create_agent`的`tools`参数中列出，否则会报错。对于`model_list`中的`tools`参数，作用是指定模型可用的工具。例如上述例子，则第三个模型的`tools`只有`run_python_code`，而剩余的两个模型则可以使用`run_python_code`和`get_current_time`。
