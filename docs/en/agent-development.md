# Agent Development

> [!NOTE]
>
> **Feature Overview**: Provides practical tools for convenient Agent development.
>
> **Prerequisites**: Understand LangChain's [Agent](https://docs.langchain.com/oss/python/langchain/agents) and [Middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

## Pre-built Agents

The pre-built agent module primarily provides a function identical in functionality to LangChain's `create_agent` function, but allows specifying more models via strings (which require registration).

Core Function:

- `create_agent`: Creates a single agent.

Parameters:

- `model`: The model name, must be a string in the format `provider_name:model_name`. Also supports formats compatible with `init_chat_model` and `load_chat_model`. For `load_chat_model`, the `provider_name` needs to be registered using `register_model_provider`.
- Other parameters are identical to LangChain's `create_agent`.

### Usage Example

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# Register model provider
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)


@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())


agent = create_agent("vllm:qwen3-4b", tools=[get_current_time])
# Usage is identical to LangChain's create_agent
response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

## Middleware

Currently, there are five middleware components, four of which inherit from the official middleware (sharing the same names). They are:

- `SummarizationMiddleware`: Summarization middleware, primarily used for context compression.
- `LLMToolSelectorMiddleware`: LLM tool selection middleware, used for selecting appropriate tools.
- `PlanMiddleware`: Task planning middleware, used for task planning.
- `ModelFallbackMiddleware`: Model fallback middleware, used to fall back to a backup model if the primary model call fails.
- `LLMToolEmulator`: LLM tool emulator middleware, used to emulate tool calls.

### SummarizationMiddleware

The core function is to compress conversation content. Its functionality is identical to the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only allows specifying the model via a string parameter, similar to the `create_agent` above. The model selection range is larger, but registration is required.
Usage Example:

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
    system_prompt="You are an intelligent AI assistant capable of solving user problems.",
)
# big_text is a text containing a large amount of content, omitted here
big_messages = [
    HumanMessage(content="Hello, who are you?"),
    AIMessage(content="I am your AI assistant."),
    HumanMessage(content="Write a beautiful long text."),
    AIMessage(content=f"Okay, I will write a beautiful long text. The content is: {big_text}"),
    HumanMessage(content="Why did you write this long text?"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

### LLMToolSelectorMiddleware

The core function is to allow the LLM to select tools itself when there are a large number of tools. Its functionality is identical to the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector). Similarly, it only allows specifying the model via a string, like the `create_agent` above. The model selection range is larger, but registration is required.
Usage Example:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolSelectorMiddleware,
)

@tool
def get_current_weather() -> str:
    """Get the current weather"""
    return "The weather is sunny today."


@tool
def search() -> str:
    """Search"""
    return "Search results"


@tool
def run_python() -> str:
    """Run Python code"""
    return "Running Python code"


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

### PlanMiddleware

Task planning middleware, used for structured decomposition and process management before executing complex tasks.

::: tip 📝
Task planning is an efficient context engineering management strategy. Before executing a task, the large language model first breaks down the overall task into multiple ordered subtasks, forming a task plan list (referred to as a 'plan' in this library). It then executes each subtask in sequence, dynamically updating the task status after completing each step until all subtasks are finished.
:::

This middleware is similar in function and positioning to the official LangChain [Plan middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning), but differs in tool design. The official middleware only provides the `write_todo` tool, which is oriented towards a todo list structure. This library, however, provides three dedicated tools: `write_plan`, `finish_sub_plan`, and `read_plan`, specifically designed for writing, modifying, and querying the plan list.

Whether it's `todo` or `plan`, their essence is the same. Therefore, the key difference between this middleware and the official one lies in the provided tools. The official middleware uses one tool for both adding and modifying, whereas this library provides three tools: `write_plan` can be used to write or update the plan content, `finish_sub_plan` is used to update the status of a subtask after its completion, and `read_plan` is used to query the plan content.

Specifically, they are represented by the following three functions:

- `create_write_plan_tool`: A function that creates a tool for writing the plan.
- `create_finish_sub_plan_tool`: A function that creates a tool for marking a subtask as finished.
- `create_read_plan_tool`: A function that creates a tool for reading the plan.

These three functions accept the following parameters:

- `description`: The tool description. If not provided, the default tool description is used.
- `message_key`: The key used to update messages. If not provided, the default `messages` is used (the `read_plan` tool does not have this parameter).

Usage Example:

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

Note: To use these three tools, you must ensure that the state Schema includes the `plan` key; otherwise, an error will occur. You can use the `PlanState` provided by this library to inherit the state Schema.

::: details write_plan

`write_plan` has two purposes: 1. Writing the plan for the first time. 2. Updating the plan during execution if problems are found with the existing plan.

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

`finish_sub_plan` is used only to update the status of the current subtask and set the next subtask.

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

`read_plan` is used only to read the current plan.

```python
@tool(description=description or _DEFAULT_READ_PLAN_TOOL_DESCRIPTION)
def read_plan(runtime: ToolRuntime):
    plan_list = runtime.state.get("plan", [])
    return json.dumps(plan_list)
```

:::

However, the usage described above is not recommended in this library. The best practice is to use the `PlanMiddleware`.
Parameters for `PlanMiddleware`:

- `system_prompt`: Optional string type, the system prompt. Functionally similar to the official TodoListMiddleware.
- `tools`: Optional list of BaseTool type, the list of tools. If specified, they will be added to the tools. Must be tools created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool`.

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
    {"messages": [HumanMessage(content="I'm going to New York for a few days, help me plan the itinerary.")]}
)
print(response)
```

**Notes:**

1.  Both parameters of `PlanMiddleware` are optional. If no parameters are passed, the system will default to using `_DEFAULT_PLAN_SYSTEM_PROMPT` as the system prompt and automatically load the toolset created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool`.

2.  For the `tools` parameter, only tools created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool` are supported. Among them, `create_read_plan_tool` is optional; the middleware can still function normally if only the first two are provided, but it will lack the ability to read the plan.

### ModelFallbackMiddleware

Middleware used to fall back to a backup model when the primary model call fails. Its functionality is identical to the official [ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback). Similarly, it only allows specifying the model via a string, like the `create_agent` above. The model selection range is larger, but registration is required. Usage Example:

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

### LLMToolEmulator

Middleware used to emulate tool calls using a large language model. Its functionality is identical to the official [LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator). Similarly, it only allows specifying the model via a string, like the `create_agent` above. The model selection range is larger, but registration is required. Usage Example:

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
