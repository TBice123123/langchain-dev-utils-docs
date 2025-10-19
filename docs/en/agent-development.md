# Agent Development

> [!NOTE]
>
> **Feature Overview**: Provides practical tools for convenient Agent development.
>
> **Prerequisites**: Understand LangChain's [Agent](https://docs.langchain.com/oss/python/langchain/agents), [Middleware](https://docs.langchain.com/oss/python/langchain/middleware), and [Context Engineering Management](https://docs.langchain.com/oss/python/langchain/context-engineering).
>
> **Estimated Reading Time**: 10 minutes

## Pre-built Agents

The pre-built agent module primarily provides a function identical in functionality to LangChain's `create_agent` function, but allows specifying more models via strings (which require registration).

Core Function:

- `create_agent`: Creates a single agent.

Parameters are as follows:

- model: The model name, must be a string value in the format `provider_name:model_name`. Also supports formats compatible with `init_chat_model` and `load_chat_model`. For `load_chat_model`, the provider_name needs to be registered using `register_model_provider`.
- Other parameters are identical to LangChain's `create_agent`.

### Usage Example

```python
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# Register the model provider
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)


@tool
def get_current_time() -> str:
    """Get the current timestamp."""
    return str(datetime.datetime.now().timestamp())


agent = create_agent("vllm:qwen3-4b", tools=[get_current_time], name="time-agent")
# Usage is identical to LangChain's create_agent
response = agent.invoke({"messages": [{"role": "user", "content": "What time is it now?"}]})
print(response)

```

## Context Engineering Management

### Task Planning (To-do List)

Task planning is a common method for context management. It involves the LLM decomposing a task into multiple subtasks before execution, then executing them sequentially. After completing each subtask, the LLM updates the task status until all subtasks are finished. (Essentially a todo list, but referred to as 'plan' in this library).

Two tools, `write_plan` and `update_plan`, are provided to implement the aforementioned context management method.

Specifically:

- `create_write_plan_tool`: Creates a tool for writing a plan.
- `create_update_plan_tool`: Creates a tool for updating a plan.

The parameters for these two functions are as follows:

- `name`: Custom tool name. If not provided, `create_write_plan_tool` defaults to `write_plan` and `create_update_plan_tool` defaults to `update_plan`.
- `description`: Tool description. If not provided, the default tool description is used.
- `message_key`: The key used to update messages. If not provided, the default `messages` is used.

Usage example:

```python
from langchain_dev_utils.agents.factory import create_agent
from langchain.agents import AgentState
from langchain_dev_utils.agents.plan import (
    create_write_plan_tool,
    create_update_plan_tool,
    PlanStateMixin,
)

tools = [
    create_write_plan_tool(),
    create_update_plan_tool(),
]


class PlanAgentState(AgentState, PlanStateMixin):
    pass


agent = create_agent(
    "vllm:qwen3-4b", tools=tools, name="plan-agent", state_schema=PlanAgentState
)
```

Note that to use these two tools, you must ensure that the state Schema includes the `plan` key, otherwise an error will occur. You can use the `PlanStateMixin` provided by this library to inherit the state Schema.

The internal implementations of the two tools above are as follows:

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

### File System

The file system is another common context management method. It can be used for saving long-term memory for LLMs, context isolation for multiple agents, and context compression.

This library provides four tools for the file system: `write_file`, `read_file`, `ls_file`, and `update_file`.

Specifically:

- `create_write_file_tool`: Creates a tool for writing files.
- `create_read_file_tool`: Creates a tool for reading files.
- `create_ls_file_tool`: Creates a tool for listing files.
- `create_update_file_tool`: Creates a tool for updating files.

For `create_write_file_tool` and `create_update_file_tool`, the supported parameters are:

- `name`: Custom tool name. If not provided, `create_write_file_tool` defaults to `write_file`, `create_read_file_tool` defaults to `read_file`, `create_ls_file_tool` defaults to `ls_file`, and `create_update_file_tool` defaults to `update_file`.
- `description`: Tool description. If not provided, the default tool description is used.
- `message_key`: The key used to update messages. If not provided, the default `messages` is used.

For `create_read_file_tool` and `create_ls_file_tool`, the `message_key` parameter is not supported.

Usage example:

```python
from langchain_dev_utils.agents.factory import create_agent
from langchain.agents import AgentState
from langchain_dev_utils.agents.file_system import (
    create_write_file_tool,
    create_update_file_tool,
    create_ls_file_tool,
    create_query_file_tool,
    FileStateMixin,
)

tools = [
    create_write_file_tool(),
    create_update_file_tool(),
    create_ls_file_tool(),
    create_query_file_tool(),
]


class FileAgentState(AgentState, FileStateMixin):
    pass


agent = create_agent(
    "vllm:qwen3-4b", tools=tools, name="file-agent", state_schema=FileAgentState
)
```

:::tip Further Explanation of the File System
Sometimes the file system is used for context compression. For example, if a tool is a search tool that might return a large amount of content, this content can be stored in a file, and only a file path is returned to the agent. This avoids issues caused by excessively long context.
To implement the above requirement in this library, you need to directly manipulate the `files` key in the state Schema, rather than using the tools mentioned above. For example, see the code below:

```python
import datetime
from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.types import Command
from typing import Annotated

@tool
async def tavily_search(
    query: Annotated[str, "Content to search for"],
    tool_call_id: Annotated[str, InjectedToolCallId],
):
    """Internet search tool for obtaining the latest online information and data. Note: To control context length and reduce invocation costs, this tool can only be called once during the execution of each task."""
    tavily_search = TavilySearch(
        max_results=5,
    )
    result = await tavily_search.ainvoke({"query": query})

    content = ""
    for item in result:
        content += item.content

    file_name = (
        "tavily_search_result_" + str(datetime.datetime.now().timestamp()) + ".md"
    )
    return Command(
        update={
            "messages": [
                ToolMessage(
                    content=f"Search results stored in file {file_name}",
                    tool_call_id=tool_call_id,
                )
            ],
            "file": {file_name: content},
        }
    )
```

:::

The internal implementations of the four tools above are as follows:

::: details write_file

```python
def write_file(
        file_name: Annotated[str, "the name of the file"],
        content: Annotated[str, "the content of the file"],
        tool_call_id: Annotated[str, InjectedToolCallId],
        state: Annotated[FileStateMixin, InjectedState],
        write_mode: Annotated[
            Literal["write", "append"], "the write mode of the file"
        ] = "write",
    ):
        files = state.get("file", {})
        if write_mode == "append":
            content = files.get(file_name, "") + content
        if write_mode == "write" and file_name in files:
            # if the file already exists, append a suffix to the file name when write_mode is "write"
            file_name = file_name + "_" + str(len(files[file_name]))
        msg_key = message_key or "messages"
        return Command(
            update={
                "file": {file_name: content},
                msg_key: [
                    ToolMessage(
                        content=f"file {file_name} written successfully, content is {content}",
                        tool_call_id=tool_call_id,
                    )
                ],
            }
        )
```

:::

::: details update_file

```python
def update_file(
        file_name: Annotated[str, "the name of the file"],
        origin_content: Annotated[str, "the original content of the file"],
        new_content: Annotated[str, "the new content of the file"],
        tool_call_id: Annotated[str, InjectedToolCallId],
        state: Annotated[FileStateMixin, InjectedState],
        replace_all: Annotated[bool, "replace all the origin content"] = False,
    ):
        msg_key = message_key or "messages"
        files = state.get("file", {})
        if file_name not in files:
            raise ValueError(f"Error: File {file_name} not found")

        if origin_content not in files.get(file_name, ""):
            raise ValueError(
                f"Error: Origin content {origin_content} not found in file {file_name}"
            )

        if replace_all:
            new_content = files.get(file_name, "").replace(origin_content, new_content)
        else:
            new_content = files.get(file_name, "").replace(
                origin_content, new_content, 1
            )
        return Command(
            update={
                "file": {file_name: new_content},
                msg_key: [
                    ToolMessage(
                        content=f"file {file_name} updated successfully, content is {new_content}",
                        tool_call_id=tool_call_id,
                    )
                ],
            }
        )
```

:::

::: details ls

```python
def ls(state: Annotated[FileStateMixin, InjectedState]):
        files = state.get("file", {})
        return list(files.keys())
```

:::

::: details query_file

```python
def query_file(file_name: str, state: Annotated[FileStateMixin, InjectedState]):
        files = state.get("file", {})
        if file_name not in files:
            raise ValueError(f"Error: File {file_name} not found")

        content = files.get(file_name)

        if not content or content.strip() == "":
            raise ValueError(f"Error: File {file_name} is empty")

        return content
```

:::

## Middleware

Currently, there are two middleware components, both inheriting from the official middleware. They are:

- `SummarizationMiddleware`: Summarization middleware, primarily used for context compression.
- `LLMToolSelectorMiddleware`: LLM tool selection middleware, used for selecting appropriate tools.

Usage Example:

```python
from langchain_dev_utils.agents.middleware import (
    SummarizationMiddleware,
    LLMToolSelectorMiddleware,
)
from langchain_dev_utils.agents import create_agent

agent = create_agent(
    "vllm:qwen3-4b",
    tools=[get_current_time],
    name="time-agent",
    middleware=[
        SummarizationMiddleware(model="vllm:qwen3-4b"),
        LLMToolSelectorMiddleware(model="vllm:qwen3-4b", max_tools=3),
    ],
)

response = agent.invoke({"messages": [{"role": "user", "content": "What time is it now?"}]})
print(response)
```

The only difference from the official middleware is that it allows more string parameters to specify the model (registration required).
