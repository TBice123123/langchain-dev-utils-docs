# Agent Development

> [!NOTE]
>
> **Feature Overview**: Provides practical tools to facilitate Agent development.
>
> **Prerequisites**: Understand LangChain's [Agent](https://docs.langchain.com/oss/python/langchain/agents) and [Middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

## Pre-built Agents

The pre-built agent module primarily provides a function that is functionally identical to LangChain's `create_agent` function, but allows specifying more models via strings (registration required).

Core Function:

- `create_agent`: Creates a single agent.

Parameters:

- `model`: The model name, must be a string in the format `provider_name:model_name`. Also supports formats compatible with `init_chat_model` and `load_chat_model`. For `load_chat_model`, the `provider_name` must be registered using `register_model_provider`.
- Other parameters are identical to LangChain's `create_agent`.

### Usage Example

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# Register a model provider
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

Currently, there are three middleware components, all inheriting from the official ones. They are:

- `SummarizationMiddleware`: Summarization middleware, primarily used for context compression.
- `LLMToolSelectorMiddleware`: LLM tool selection middleware, used for selecting appropriate tools.
- `PlanMiddleware`: Task planning middleware, used for task planning.

### SummarizationMiddleware

The core function is to compress conversation content. Its functionality is identical to the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only allows specifying the model via a string parameter. Similar to `create_agent` above, it supports a wider range of models, but registration is required.

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
# big_text is a text containing a large amount of content, omitted here.
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

The core function is to allow the LLM to select tools itself when there are a large number of tools. Its functionality is identical to the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector). Similarly, it only allows specifying the model via a string. Like `create_agent` above, it supports a wider range of models, but registration is required.

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
Task planning is an efficient strategy for managing context engineering. Before executing a task, the large language model first breaks down the overall task into multiple ordered subtasks, forming a task plan list (referred to as a 'plan' in this library). It then executes each subtask in sequence, dynamically updating the task status after completing each step until all subtasks are finished.
:::

This middleware is similar in function and positioning to the official LangChain [Plan Middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning), but differs in tool design. The official middleware only provides the `write_todo` tool, which is oriented towards a todo list structure. This library, however, provides two dedicated tools: `write_plan` and `update_plan`, specifically designed for writing to and updating the plan list.

Whether it's `todo` or `plan`, their essence is the same. Therefore, the key difference between this middleware and the official one lies in the provided tools. The official middleware uses one tool for both adding and modifying, whereas this library provides two separate tools: one for adding and one for modifying.

Specifically, the following two functions are provided:

- `create_write_plan_tool`: A function to create a tool for writing the plan.
- `create_update_plan_tool`: A function to create a tool for updating the plan.

Parameters for these two functions:

- `name`: Custom tool name. If not provided, `create_write_plan_tool` defaults to `write_plan` and `create_update_plan_tool` defaults to `update_plan`.
- `description`: Tool description. If not provided, the default tool description is used.
- `message_key`: The key used to update messages. If not provided, the default `messages` is used.

Usage Example:

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

Note: To use these two tools, you must ensure that the state Schema includes the `plan` key, otherwise an error will occur. You can use the `PlanState` provided by this library to inherit the state Schema.

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

However, the usage method above is not recommended in this library. The best practice is to use the `PlanMiddleware`.
Parameter description for `PlanMiddleware`:

- `system_prompt`: Optional string type, system prompt. Functionally the same as the official `TodoListMiddleware`.
- `tools`: Optional list of `BaseTool` type, list of tools. If specified, they will be added to the tools. Must be tools created by `create_write_plan_tool` and `create_update_plan_tool`.

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
    {"messages": [HumanMessage(content="I want to visit New York for a few days, help me plan the itinerary.")]}
)
print(response)
```
