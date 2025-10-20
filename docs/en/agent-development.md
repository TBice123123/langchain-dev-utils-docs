# Agent Development

> [!NOTE]
>
> **Feature Overview**: Provides practical tools to facilitate Agent development.
>
> **Prerequisites**: Understanding of LangChain's [Agent](https://docs.langchain.com/oss/python/langchain/agents) and [Middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

## Pre-built Agent

The pre-built agent module primarily provides a function that is functionally identical to LangChain's `create_agent` function, but allows specifying more models via strings (requires registration).

Core functions:

- `create_agent`: Creates a single agent

Parameters:

- model: Model name, must be a string in the format `provider_name:model_name`. Also supports formats supported by `init_chat_model` and `load_chat_model`, where the provider_name for `load_chat_model` needs to be registered using `register_model_provider`.
- Other parameters are identical to LangChain's `create_agent`.

### Usage Example

```python
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
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())


agent = create_agent("vllm:qwen3-4b", tools=[get_current_time], name="time-agent")
# Usage is identical to LangChain's create_agent
response = agent.invoke({"messages": [{"role": "user", "content": "What time is it now?"}]})
print(response)
```

## Middleware

Currently, there are three middleware components, all inheriting from the official middleware:

- `SummarizationMiddleware`: Summarization middleware, mainly used for context compression
- `LLMToolSelectorMiddleware`: LLM tool selection middleware, used for selecting appropriate tools
- `PlanMiddleware`: Task planning middleware, used for task planning

### SummarizationMiddleware

The core function is to compress conversation content, with functionality identical to the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only allows string parameters to specify models, similar to the `create_agent` above, offering a wider range of model choices but requiring registration.

Usage example:

```python
from langchain_dev_utils.agents.middleware import (
    SummarizationMiddleware
)
from langchain_dev_utils.agents import create_agent

agent = create_agent(
    "vllm:qwen3-4b",
    tools=[get_current_time],
    name="time-agent",
    middleware=[
        SummarizationMiddleware(model="vllm:qwen3-4b"),
    ],
)

# BIG_TEXT is a text containing substantial content, omitted here

response = agent.invoke({"messages": [{"role": "user", "content": f"{BIG_TEXT}, analyze this content"}]})
print(response)
```

### LLMToolSelectorMiddleware

The core function is to allow the LLM to select tools when dealing with a large number of tools, with functionality identical to the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector). However, it also only allows string specification of models, similar to the `create_agent` above, offering a wider range of model choices but requiring registration.

Usage example:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolSelectorMiddleware,
)
from langchain_dev_utils.agents import create_agent

agent = create_agent(
    "vllm:qwen3-4b",
    tools=[get_current_time, get_current_weather, search, run_shell],
    name="time-agent",
    middleware=[
        LLMToolSelectorMiddleware(model="vllm:qwen3-4b", max_tools=3),
    ],
)

response = agent.invoke({"messages": [{"role": "user", "content": "What time is it now?"}]})
print(response)
```

### PlanMiddleware

Task planning middleware used for structured decomposition and process management before executing complex tasks.

::: tip 📝
Task planning is an efficient context engineering management strategy. Before executing a task, the large language model first breaks down the overall task into multiple ordered subtasks, forming a task planning list (referred to as a plan in this library). It then executes each subtask in sequence and dynamically updates the task status after completing each step until all subtasks are completed.
:::

This middleware has a similar functional positioning to the official LangChain [Plan middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning), but differs in tool design. The official middleware only provides the `write_todo` tool, which is oriented towards a todo list structure; whereas this library provides two dedicated tools, `write_plan` and `update_plan`, specifically for writing and updating the planning list (plan list).

Whether it's `todo` or `plan`, their essence is the same. Therefore, the key difference between this middleware and the official one lies in the tools provided. The official approach handles addition and modification through a single tool, while this library provides two separate tools - one for adding and one for modifying.

Specifically manifested in the following two functions:

- `create_write_plan_tool`: Creates a function for writing plans
- `create_update_plan_tool`: Creates a function for updating plans

Parameters for these two functions:

- `name`: Custom tool name. If not provided, create_write_plan_tool defaults to `write_plan`, and create_update_plan_tool defaults to `update_plan`
- `description`: Tool description. If not provided, the default tool description is used
- `message_key`: Key used to update messages. If not provided, the default `messages` is used

Usage example:

```python
from langchain_dev_utils.agents.middleware.plan import (
    create_write_plan_tool,
    create_update_plan_tool,
    PlanState,
)
from langchain_dev_utils.agents import create_agent

agent = create_agent(
    model="zai:glm-4.5",
    state_schema=PlanState,
    tools=[create_write_plan_tool(), create_update_plan_tool()],
)
```

Note that to use these two tools, you must ensure that the state Schema contains the `plan` key, otherwise an error will occur. For this, you can use the `PlanState` provided by this library to inherit the state Schema.

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
            "Not fully updated plan, missing:"
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

However, the above usage is not recommended in this library. The best practice should be to use PlanMiddleware.

PlanMiddleware parameter description:

- `system_prompt`: Optional string type, system prompt, functionally similar to the official TodoListMiddleware
- `tools`: Optional BaseTool list type, tool list. If specified, will be added to tools. Must be tools created through create_write_plan_tool and create_update_plan_tool

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.agents.middleware import (
    create_write_plan_tool,
    create_update_plan_tool,
    PlanMiddleware,
)
from langchain_dev_utils.agents import create_agent

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        PlanMiddleware(
            tools=[create_write_plan_tool(), create_update_plan_tool()],
        )
    ],
)

agent.invoke({"messages": [HumanMessage(content="I want to visit New York for a few days, help me plan the itinerary")]})
```
