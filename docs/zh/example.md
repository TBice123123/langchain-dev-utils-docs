# 使用示例

> 本文通过一个**多智能体示例**，展示如何在 `langchain` 与 `langgraph` 项目中高效使用 `langchain-dev-utils` 库。该示例深度融合了本库的所有核心模块，帮助你全面掌握本库的核心模块的实战用法。

## 流程说明

本多智能体架构会针对用户输入的话题主题进行完整的分析，由主智能体将话题拆分为若干子话题，并分发给多个子智能体并行处理。每个子智能体负责对分配到的子话题进行分析，并将分析结果以笔记形式记录。随后，由一个大模型对所有子智能体生成的子话题分析报告进行汇总，形成最终的总结报告。

具体流程如下：

- 用户输入话题主题；
- 主智能体（Dispatcher）对话题进行分解，并分发给多个子智能体并行执行；
- 各子智能体（Talker）执行分析任务，并将分析结果写入笔记；
- 最终一个大模型（Summary）整合各子智能体的分析内容，生成最终总结报告。

## 项目搭建

### 项目初始化

本项目采用 `uv` 作为项目管理工具，首先需要安装 `uv`。

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Windows 系统可使用：

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

安装完成后，使用 `uv` 创建项目：

```bash
uv init langchain-dev-utils-example
```

进入项目目录：

```bash
cd langchain-dev-utils-example
```

### 安装依赖

确保已安装 `python`，如未安装可使用 `uv` [安装 Python](https://docs.astral.sh/uv/guides/install-python/)。

安装项目依赖：

```bash
uv add langchain langgraph langchain-dev-utils
```

安装 `langgraph-cli` 用于调试：

```bash
uv add langgraph-cli[inmem] --group dev
```

### 搭建项目目录

在项目中建立 `src` 目录，所有代码将放置于此。确保项目目录结构如下：

```
langchain-dev-utils-example/
├── src/
│   ├── summary_agents/
│   │   ├── __init__.py
│   │   └── node.py
│   └── talker_agents/
│       ├── __init__.py
│       ├── agent.py
│       ├── graph.py
│       └── state.py
│   ├── __init__.py
│   ├── graph.py
│   ├── node.py
│   ├── prompt.py
│   ├── state.py
│   └── tools.py
├── .env
├── .gitignore
├── .python-version
├── langgraph.json
├── pyproject.toml
├── README.md
└── uv.lock
```

### 注册模型提供商

首先注册模型提供商。根据[模型管理](./model-management.md)中的内容，我们需要在项目启动的时候完成模型提供商的注册，故可以考虑在项目中的`__init__.py`文件中编写注册代码，确保项目启动时完成注册。

本次使用四个开源模型：
分别是`deepseek`、`qwen`、`kimi`和`glm`。
这四个模型均提供了 OpenAI 兼容 API，故可以直接使用 chat_model 为`openai-compatible`来进行集成。但是要注意的是，由于 deepseek 是官方`init_chat_model`支持的模型提供商，无需再次注册。

在 `src/__init__.py` 中注册模型提供商：

```python
from langchain_dev_utils.chat_models import batch_register_model_provider
from dotenv import load_dotenv

load_dotenv()

batch_register_model_provider(
    [
        {
            "provider": "dashscope",
            "chat_model": "openai-compatible",
        },
        {
            "provider": "zai",
            "chat_model": "openai-compatible",
        },
        {
            "provider": "moonshot",
            "chat_model": "openai-compatible",
        },
    ]
)

```

**注意**：上述代码没有传入`base_url`，因为在`.env`文件中已经配置了。因此你需要在`.env`文件中配置`DASHSCOPE_API_BASE`、`ZAI_API_BASE`、`MOONSHOT_API_BASE`。同时也需要配置`DASHSCOPE_API_KEY`、`ZAI_API_KEY`、`MOONSHOT_API_KEY`。
可通过以下代码测试注册是否成功：

```python
from langchain_dev_utils.chat_models import load_chat_model

model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
print(model.invoke("hello"))
```

如能成功运行，说明模型提供商注册成功。

## 主智能体编写

### Tools 编写

主智能体包含四个工具：

- `ls`：列出已有笔记列表
- `query_file`：查询笔记具体内容
- `transfor_to_talk`：路由智能体，根据用户需求转交给多个智能体讨论
- `ask_human_for_more_details`：向用户请求更多话题细节

使用[Agent 开发](./agent-development.md)提供的工具函数创建前两个工具：

```python
from langchain_dev_utils.agents.file_system import (
    create_ls_file_tool,
    create_query_file_tool
)


ls = create_ls_file_tool(
    name="ls",
    description="""用于列出所有已保存的笔记名称。

    返回：
    list[str]: 包含所有笔记文件名的列表

    """,
)

query_file = create_query_file_tool(
    name="query_file",
    description="""用于查询文件。

    参数：
    file_name:文件名称

    返回：
    str, 查询的文件内容

    """,
)

```

`transfor_to_talk` 工具实现如下：

```python
from langchain.tools import tool
from typing import Annotated

@tool
async def transfor_to_talk(
    sub_topics: Annotated[
        list[str],
        "当前讨论话题的子话题列表",
    ],
):
    """用于将话题转交给子智能体进行进行讨论"""

    return "transfor success!"
```

`ask_human_for_more_details` 工具实现：

需要使用`langgraph`中的`interrupt`函数就能实现中途打断询问用户。你可以直接使用这个函数实现。也可以参照下面的实现。
这个实现使用了[工具调用](./tool-calling.md)的装饰器`human_in_the_loop_async`。

```python
from langchain_dev_utils.tool_calling import InterruptParams, human_in_the_loop_async

async def handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"对于该话题，我有一些疑问： {params['tool_call_args'].get('question')}。"
    )
    return response["answer"]


@human_in_the_loop_async(handler=handler)
async def ask_human_for_more_details(
    question: Annotated[str, "对于当前讨论话题的疑问"],
):
    """用于获取用户对当前讨论话题的更多细节"""
    return "ask human for more details"

```

**代码位置：`src/tools.py`**

### State 编写

主智能体状态 Schema：

```python
from typing import Annotated, TypedDict

from langchain_core.messages import AnyMessage
from langchain_dev_utils.agents.file_system import FileStateMixin
from langgraph.graph import add_messages


class State(FileStateMixin):
    talker_list: list[str]
    topic: str
    dispatcher_messages: Annotated[list[AnyMessage], add_messages]


class StateIn(TypedDict):
    talker_list: list[str]
    topic: str


class StateOut(FileStateMixin):
    pass
```

**代码位置：`src/state.py`**

状态键定义：

- `topic`：存储用户输入的话题主题
- `talker_list`：存储参与讨论的智能体
- `dispatcher_messages`：存储主智能体对话消息
- `file`：存储文件（继承 `FileStateMixin`）

### Node 编写

```python
from typing import Literal, cast
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.types import Command
from src.state import State
from src.tools import ask_human_for_more_details, transfor_to_talk, ls, query_file
from langchain_dev_utils.tool_calling import has_tool_calling, parse_tool_calling
from langchain_dev_utils.chat_models import load_chat_model
from src.prompt import DISPATCHER_PROMPT


async def dispatcher(
    state: State,
) -> Command[Literal["__end__", "talker", "dispatcher_tools"]]:
    model = load_chat_model("deepseek:deepseek-chat")
    bind_model = model.bind_tools(
        [transfor_to_talk, ls, query_file, ask_human_for_more_details]
    )

    response = await bind_model.ainvoke(
        [
            SystemMessage(
                content=DISPATCHER_PROMPT.format(
                    topic=state["topic"],
                    num=len(state["talker_list"]),
                )
            ),
            *state["dispatcher_messages"],
        ]
    )

    if has_tool_calling(cast(AIMessage, response)):
        tool_call_name, _ = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )

        if tool_call_name == "transfor_to_talk":
            return Command(
                goto="talker",
                update={
                    "dispatcher_messages": [response],
                },
            )

        return Command(
            goto="dispatcher_tools", update={"dispatcher_messages": [response]}
        )
    return Command(goto="__end__", update={"dispatcher_messages": [response]})


dispatcher_tools = ToolNode(
    [ls, query_file, ask_human_for_more_details], messages_key="dispatcher_messages"
)
```

**代码位置：`src/node.py`**

使用[工具调用](./tool-calling.md)中的 `has_tool_calling` 和 `parse_tool_calling` 函数：

- `has_tool_calling`：判断消息是否包含工具调用
- `parse_tool_calling`：解析工具调用，返回 `(name, args)` 元组列表

### Prompt 编写

主智能体提示词：

```markdown
你是一个话题讨论的协调者和问题分解者。
你的任务非常明确：

使用 `transfor_to_talk` 工具，将话题 “{topic}” 分解为 {num} 个子话题，并将每个子话题的讨论结果写入笔记中。
该工具执行完毕后，会直接返回一个结果，这个结果就是若干子话题的最后总结报告。

如果你需要向用户询问话题的更多细节，你可以使用`ask_human_for_more_details`工具。

附加说明：

你拥有 `query_file` 和 `ls` 工具的使用权限。如果你想要强调某个子话题的讨论结果，可以使用`query_file`和`ls`工具。
```

## 讨论智能体

### Tools 编写

讨论智能体需要 `tavily_search` 工具进行互联网搜索。

安装依赖：

```bash
uv add tavily-python
```

对应的工具实现：

```python
from tavily import AsyncTavilyClient
async def tavily_search(query: Annotated[str, "要搜索的内容"]):
    """互联网搜索工具，用于获取最新的网络信息和资料。注意：为控制上下文长度和降低调用成本，每个任务执行过程中仅可调用一次此工具。"""
    tavily_search = AsyncTavilyClient(
        api_key=os.getenv("TAVILY_API_KEY"),
    )
    result = await tavily_search.search(query, max_results=3)
    return result
```

此外还有一个用于写入文件的工具

```python
from langchain_dev_utils.agents.file_system import create_write_file_tool
write_file = create_write_file_tool(
    name="write_file",
    description="""用于写入文件的工具。

    参数：
    content: str, 文件内容

    """,
)
```

**代码位置：`src/tools.py`**

**注意：需设置 `TAVILY_API_KEY` 环境变量**

### State 编写

```python
from langchain_core.messages import AnyMessage
from langgraph.graph import add_messages
from typing import Annotated
from langchain_dev_utils.agents.file_system import FileStateMixin
from langchain.agents import AgentState


class TalkState(AgentState, FileStateMixin):
    talker_list: list[str]
    sub_topic: Annotated[str, lambda x, y: y]
    dispatcher_messages: Annotated[list[AnyMessage], add_messages]
```

**代码位置：`src/talker_agents/state.py`**

状态键定义：

- `sub_topic`：当前子智能体需要分析的子话题
- `talker_list`：存储讨论参与者
- `dispatcher_messages`：存储主智能体消息
- `messages`：子智能体执行的上下文窗口

### Graph 编写

#### talker agent 的编写

```python
from typing import Literal
from langchain_dev_utils.chat_models import load_chat_model
from langchain_dev_utils.tool_calling import has_tool_calling
from langgraph.graph import StateGraph
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.types import Command
from src.prompt import TALK_PROMPT
from src.tools import tavily_search, write_file
from src.talker_agents.state import TalkState
from langchain_core.messages import SystemMessage


def create_talker_agent(model_name: str, agent_name: str):
    model = load_chat_model(model_name).bind_tools([tavily_search, write_file])

    async def call_model(
        state: TalkState,
    ) -> Command[Literal["__end__", "talker_tool_node"]]:
        response = await model.ainvoke(
            [
                SystemMessage(
                    content=TALK_PROMPT.format(
                        topic=state["sub_topic"],
                    )
                ),
                *state["messages"],
            ]
        )
        if has_tool_calling(response):
            return Command(
                goto="talker_tool_node",
                update={
                    "messages": [response],
                },
            )

        return Command(goto="__end__", update={"messages": [response]})

    graph = StateGraph(TalkState)
    graph.add_node("call_model", call_model)
    graph.add_node("talker_tool_node", ToolNode([tavily_search, write_file]))
    graph.add_edge("__start__", "call_model")
    graph.add_edge("call_model", "__end__")
    graph.add_edge("talker_tool_node", "call_model")
    graph = graph.compile(
        name=agent_name,
    )
    return graph
```

**代码位置：`src/talker_agents/agent.py`**

### 并行组合 Talker Agent

```python
from src.talker_agents.state import TalkState

talk_name_map = {
    "qwen": "dashscope:qwen3-235b-a22b-instruct-2507",
    "kimi": "moonshot:kimi-k2-0905-preview",
    "glm": "zai:glm-4.5",
    "deepseek": "deepseek:deepseek-chat",
}


def branch_talker(state: TalkState):
    message = state["dispatcher_messages"][-1]
    if has_tool_calling(message=cast(AIMessage, message)):
        _, args = parse_tool_calling(
            cast(AIMessage, message), first_tool_call_only=True
        )

        sub_topics = cast(dict[str, Any], args).get("sub_topics", "")

        return [
            Send(
                node=talk_name,
                arg={
                    "sub_topic": sub_topic,
                    "messages": [HumanMessage(content="请帮我讨论这个话题")],
                },
            )
            for sub_topic, talk_name in zip(
                sub_topics,
                state["talker_list"] if "talker_list" in state else ["kimi", "qwen"],
            )
        ]

    return [Send(node="__end__", arg={})]


talkers = parallel_pipeline(
    [
        create_talker_agent(talker_model, talker_name)
        for talker_name, talker_model in talk_name_map.items()
    ],
    state_schema=TalkState,
    branches_fn=branch_talker,
    graph_name="talk",
)
```

然后对于这些子智能体利用[状态图编排](./graph-orchestration.md) 构建并行智能体管道，通过 `branches_fn` 实现用户指定参与讨论的智能体。

### Prompt 编写

讨论智能体提示词：

```markdown
你的任务是根据用户的主题进行讨论。你可以使用`tavily_search`工具进行互联网搜索。
用户的主题为{topic}

完成后，必须使用`write_file`工具将最终结果写入笔记。
```

## 总结节点

### Node 的编写

代码实现如下：

```python
from langchain_dev_utils.chat_models import load_chat_model
from langchain_dev_utils.message_convert import format_sequence
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from typing import cast
from src.state import State
from src.prompt import SUMMARY_PROMPT


async def summary_node(
    state: State,
):
    model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
    response = await model.ainvoke(
        [
            SystemMessage(
                content=SUMMARY_PROMPT.format(
                    result=format_sequence(
                        [state["file"][file_name] for file_name in state["file"]],
                        separator="-" * 10 + "\n",
                    )
                )
            )
        ]
    )

    tool_call_id = cast(AIMessage, state["dispatcher_messages"][-1]).tool_calls[0]["id"]

    return {
        "dispatcher_messages": [
            ToolMessage(
                content=f"讨论的总结:{response.content}", tool_call_id=tool_call_id
            )
        ]
    }
```

**代码位置：`src/summary_agent/node.py`**

## Prompt 编写

```markdown
你的任务是根据多个智能体讨论的内容进行总结。

各个智能体的讨论结果是
{result}
```

这里使用了[消息处理](./message-conversion.md)中的`format_sequence`函数将字符串列表格式化为字符串。

## 最终图构建

```python
from src.node import (
    dispatcher,
    dispatcher_tools,
)
from langgraph.graph import StateGraph
from src.state import State, StateIn, StateOut
from src.talker_agents.graph import talkers
from src.summary_agents.node import summary_node


graph = StateGraph(State, input_schema=StateIn, output_schema=StateOut)
graph.add_node("dispatcher", dispatcher)
graph.add_node("dispatcher_tools", dispatcher_tools)


graph.add_node("talker", talkers)
graph.add_node("summary", summary_node)
graph.add_edge("__start__", "dispatcher")
graph.add_edge("dispatcher_tools", "dispatcher")
graph.add_edge("talker", "summary")
graph.add_edge("summary", "dispatcher")


graph = graph.compile()
```

**代码位置：`src/graph.py`**

在项目根目录创建 `langgraph.json`：

```json
{
  "dependencies": ".",
  "graphs": {
    "graph": "./src/graph.py:graph"
  }
}
```

运行 `LangGraph Studio`：

```bash
langgraph dev
```

最终图结构如下：

![最终图](/img/graph.png)
