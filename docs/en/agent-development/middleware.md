# Middleware

> [!NOTE]
>
> **Feature Overview**: Provides utility tools for convenient Agent development.
>
> **Prerequisites**: Understand LangChain's [Middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

Middleware are components specifically built for pre-constructed Agents in `langchain`. The official library provides some built-in middleware. This library, based on practical scenarios and its own use cases, offers additional middleware.

## SummarizationMiddleware

The core function is to compress conversation content. Its functionality is completely consistent with the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only allows string parameters to specify the model. Similar to the `create_agent` above, the model selection range is larger, but registration is required.
Usage example:

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
    system_prompt="You are an intelligent AI assistant that can solve user problems",
)
# big_text is a text containing a large amount of content, omitted here
big_messages = [
    HumanMessage(content="Hello, who are you?"),
    AIMessage(content="I am your AI assistant"),
    HumanMessage(content="Write a beautiful long text"),
    AIMessage(content=f"Okay, I will write a beautiful long text, the content is: {big_text}"),
    HumanMessage(content="Why did you write this long text?"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

## LLMToolSelectorMiddleware

The core function is for scenarios with a large number of tools, allowing the LLM to select tools itself. Its functionality is completely consistent with the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector). However, it also only allows string parameters to specify the model. Similar to the `create_agent` above, the model selection range is larger, but registration is required.
Usage example:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolSelectorMiddleware,
)

@tool
def get_current_weather() -> str:
    """Get the current weather"""
    return "The weather is sunny today"


@tool
def search() -> str:
    """Search"""
    return "Search results"


@tool
def run_python() -> str:
    """Run Python code"""
    return "Run Python code"


agent = create_agent(
    "vllm:qwen3-4b",
    tools=[get_current_time, get_current_weather, search, run_python],
    name="agent",
    middleware=[
        LLMToolSelectorMiddleware(model="vllm:qwen3-4b", max_tools=2),
    ],
)

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

## PlanMiddleware

A task planning middleware used for structured decomposition and process management before executing complex tasks.

::: tip 📝
Task planning is an efficient context engineering management strategy. Before executing a task, the large language model first breaks down the overall task into multiple ordered subtasks, forming a task planning list (referred to as a plan in this library). It then executes each subtask in sequence, dynamically updating the task status after completing each step until all subtasks are finished.
:::

This middleware is similar in function and positioning to the official LangChain [Plan middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning), but differs in tool design. The official middleware only provides the `write_todo` tool, which is oriented towards a todo list structure; whereas this library provides three dedicated tools: `write_plan`, `finish_sub_plan`, and `read_plan`, specifically used for writing, modifying, and querying the planning list (plan list).

Whether it's `todo` or `plan`, their essence is the same. Therefore, the key difference between this middleware and the official one lies in the tools provided. The official middleware uses one tool for addition and modification, while this library provides three tools: `write_plan` can be used to write the plan or update the plan content, `finish_sub_plan` is used to update the status of a subtask after it is completed, and `read_plan` is used to query the plan content.

Specifically, it manifests as the following three functions:

- `create_write_plan_tool`: A function to create a tool for writing the plan
- `create_finish_sub_plan_tool`: A function to create a tool for completing a subtask
- `create_read_plan_tool`: A function to create a tool for querying the plan

The parameters received by these three functions are as follows:

- `description`: Tool description. If not provided, the default tool description is used.
- `message_key`: The key used to update messages. If not provided, the default `messages` is used. (The `read_plan` tool does not have this parameter.)

Usage example:

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

Note that to use these three tools, you must ensure that the state Schema includes the key `plan`, otherwise an error will occur. For this, you can use the `PlanState` provided by this library to inherit the state Schema.

::: details write_plan

write_plan has two functions: 1. Writing the plan for the first time. 2. Updating the plan during execution if problems are found with the existing plan.

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

finish_sub_plan is only used to update the status of the current subtask and set the next subtask.

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

read_plan is only used to read the current plan.

```python
@tool(description=description or _DEFAULT_READ_PLAN_TOOL_DESCRIPTION)
def read_plan(runtime: ToolRuntime):
    plan_list = runtime.state.get("plan", [])
    return json.dumps(plan_list)
```

:::

However, the above usage method is not recommended in this library. The best practice should be to use PlanMiddleware.
The parameter description for PlanMiddleware is as follows:

- `system_prompt`: Optional string type, system prompt. Functionally the same as the official TodoListMiddleware.
- `tools`: Optional list of BaseTool type, list of tools. If specified, they will be added to the tools. Must be tools created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool`.

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
    {"messages": [HumanMessage(content="I want to go to New York for a few days, help me plan the itinerary")]}
)
print(response)
```

**Note:**

1. Both parameters of `PlanMiddleware` are optional. If no parameters are passed, the system will default to using `_DEFAULT_PLAN_SYSTEM_PROMPT` as the system prompt and automatically load the toolset created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool`.

2. For the `tools` parameter, only tools created using `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool` are supported. Among them, `create_read_plan_tool` is an optional tool. If only the first two are provided, this middleware can still function normally but will not have the ability to read the plan.

## ModelFallbackMiddleware

Middleware used to fall back to an alternative model when the primary model call fails. Its functionality is completely consistent with the official [ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback). However, it also only allows string parameters to specify the model. Similar to the `create_agent` above, the model selection range is larger, but registration is required. Usage example:

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

response = agent.invoke({"messages": [HumanMessage(content="Hello.")]}),
print(response)
```

## LLMToolEmulator

Middleware used to simulate tool calls using a large language model. Its functionality is completely consistent with the official [LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator). However, it also only allows string parameters to specify the model. Similar to the `create_agent` above, the model selection range is larger, but registration is required. Usage example:

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

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]}),
print(response)
```

## ModelRouterMiddleware

Middleware used to dynamically route to an appropriate model based on the input content.

For this middleware, you need to pass two parameters:

- `router_model`: The model used for routing.
- `model_list`: A list of models. Each model needs to contain the keys `model_name` and `model_description`, and can also optionally contain the `tools` key, representing the tools available to the model. If not provided, all tools will be used by default.
- `router_prompt`: The prompt for the routing model. If None, the default prompt is used.

Usage example:

```python
from langchain_dev_utils.agents.middleware import ModelRouterMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    tools=[],
    middleware=[
        ModelRouterMiddleware(
            router_model="vllm:qwen3-4b",
            model_list=[
                {
                    "model_name": "vllm:qwen3-8b",
                    "model_description": "Suitable for general tasks, such as dialogue, text generation, etc.",
                },
                {
                    "model_name": "openrouter:qwen/qwen3-vl-32b-instruct",
                    "model_description": "Suitable for visual tasks",
                },
                {
                    "model_name": "openrouter:qwen/qwen3-coder-plus",
                    "model_description": "Suitable for code generation tasks",
                },
            ],
        )
    ],
)
print(agent.invoke({"messages": [HumanMessage(content="Help me write a bubble sort code")]}))
```

**Note:** All tools specified in the `tools` parameter of each model in `model_list` should be listed in the `tools` parameter of `create_agent` as well, otherwise an error will occur. The `tools` parameter in `model_list` is used to specify the tools available to the model. For example, in the above example, the `tools` parameter of the third model is only `run_python_code`, and the first two models can use `run_python_code` and `get_current_time`.
