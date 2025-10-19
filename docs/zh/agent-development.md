# Agent 开发

> [!NOTE]
>
> **功能概述**：提供方便进行 Agent 开发的实用工具。
>
> **前置要求**：了解 langchain 的[Agent](https://docs.langchain.com/oss/python/langchain/agents)、[中间件](https://docs.langchain.com/oss/python/langchain/middleware)、[上下文工程管理](https://docs.langchain.com/oss/python/langchain/context-engineering)。
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


agent = create_agent("vllm:qwen3-4b", tools=[get_current_time], name="time-agent")
# 使用方式与 langchain的create_agent完全一致
response = agent.invoke({"messages": [{"role": "user", "content": "现在几点了？"}]})
print(response)

```

## 上下文工程管理

### 任务规划(待办事项)

任务规划是上下文管理的常用方法,由大模型在执行任务前,先对任务进行分解,分解为多个子任务,然后依次执行,每完成一个子任务,大模型会更新任务状态,直到所有子任务都完成。(即 todo list,不过本库中叫做 plan)。

提供了两个工具`write_plan`和`update_plan`来实现上述的上下文管理方式。

具体表现为:

- `create_write_plan_tool`：创建一个用于写计划的工具
- `create_update_plan_tool`：创建一个用于更新计划的工具

这两个函数接收的参数如下:

- `name`：自定义工具名称，如果不传则 create_write_plan_tool 默认为`write_plan`，create_update_plan_tool 默认为`update_plan`
- `description`：工具描述,如果不传则采用默认的工具描述
- `message_key`：用于更新 messages 的键，若不传入则使用默认的`messages`

使用示例如下:

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

需要注意的是,要使用这两个工具,你必须要保证状态 Schema 中包含 plan 这个键,否则会报错,对此你可以使用本库提供的`PlanStateMixin`来继承状态 Schema。

同时对于上面的两个工具的内部实现如下:

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

### 文件系统

文件系统则是另一种常用的上下文管理方式,可以用于大模型长期记忆的保存,多智能体的上下文隔离,以及上下文压缩。

本库提供了针对文件系统的`write_file`,`read_file`,`ls_file`,`update_file`四个工具。

具体表现为:

- `create_write_file_tool`：创建一个用于写文件的工具
- `create_read_file_tool`：创建一个用于读文件的工具
- `create_ls_file_tool`：创建一个用于列出文件的工具
- `create_update_file_tool`：创建一个用于更新文件的工具

对于`create_write_file_tool`和`create_update_file_tool`,支持的参数有：

- `name`：自定义工具名称，如果不传则 create_write_file_tool 默认为`write_file`，create_read_file_tool 默认为`read_file`，create_ls_file_tool 默认为`ls_file`，create_update_file_tool 默认为`update_file`
- `description`：工具描述,如果不传则采用默认的工具描述
- `message_key`：用于更新 messages 的键，若不传入则使用默认的`messages`

而对于`create_read_file_tool`和`create_ls_file_tool`,则不支持`message_key`参数。

使用示例如下:

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

:::tip 文件系统的进一步说明
有些时候文件系统用于压缩上下文,例如某个工具是一个搜索工具,可能会返回大量的内容,此时可以将这些内容存入到文件中,而对智能体仅返回一个文件路径,这样可以避免上下文过长导致的问题。
在本库中实现上述需要,你需要直接操作状态 Schema 中的`files`这个键,而不是使用上述工具,例如下面代码:

```python
import datetime
from langchain_core.messages import ToolMessage
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.types import Command
from typing import Annotated

@tool
async def tavily_search(
    query: Annotated[str, "要搜索的内容"],
    tool_call_id: Annotated[str, InjectedToolCallId],
):
    """互联网搜索工具，用于获取最新的网络信息和资料。注意：为控制上下文长度和降低调用成本，每个任务执行过程中仅可调用一次此工具。"""
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
                    content=f"搜索结果存于文件{file_name}",
                    tool_call_id=tool_call_id,
                )
            ],
            "file": {file_name: content},
        }
    )
```

:::

同时对于上面四个工具的内部实现如下:

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

## 中间件

目前有两个中间件,均继承于官方的中间件.分别是:

- `SummarizationMiddleware`：摘要中间件,主要用于上下文压缩
- `LLMToolSelectorMiddleware`：LLM 工具选择中间件,用于选择合适的工具

使用示例:

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

response = agent.invoke({"messages": [{"role": "user", "content": "现在几点了？"}]})
print(response)
```

与官方的唯一的区别就是允许更多的字符串参数指定模型(需要注册)。
