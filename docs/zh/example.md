# 使用示例

> 本文通过一个**多智能体围绕特定话题讨论**的完整示例，展示如何在 `langchain` 与 `langgraph` 项目中高效使用 `langchain-dev-utils` 库。该示例深度融合了本库的所有核心模块，帮助你全面掌握五大核心模块的实战用法。

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
src/
├── __init__.py
├── graph.py
├── node.py
├── prompt.py
├── state.py
├── tools.py
├── talker_agents/
│   ├── __init__.py
│   ├── graph.py
│   └── state.py
└── write_note_agent/
    ├── __init__.py
    ├── graph.py
    └── state.py
```

### 注册模型提供商

首先注册模型提供商。根据[模型管理](./model-management.md)的建议，通常在项目的 `__init__.py` 文件中完成注册，确保项目启动时完成初始化。

本次使用四个开源模型：

- `deepseek`：通过 `langchain-deepseek` 集成(其为官方`init_chat_model`支持的模型提供商，无需再次注册)
- `qwen`：通过 `langchain-qwq` 集成 (需要注册，chat_model 传入 ChatQwen)
- `kimi` 和 `glm`：通过 `langchain-openai` 集成 (需要注册，但没有适合的集成库，但提供商均支持 OpenAI 风格的 API，需要使用`langchain-openai`进行接入，chat_model 传入`openai`)

在 `src/__init__.py` 中注册模型提供商：

```python
from langchain_dev_utils import batch_register_model_provider
from langchain_qwq import ChatQwen

batch_register_model_provider(
    [
        {"provider": "dashscope", "chat_model": ChatQwen},
        {
            "provider": "zai",
            "chat_model": "openai",
            "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        },
        {
            "provider": "moonshot",
            "chat_model": "openai",
            "base_url": "https://api.moonshot.cn/v1",
        },
    ]
)
```

可通过以下代码测试注册是否成功：

```python
from langchain_dev_utils import load_chat_model

model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
print(model.invoke("hello"))
```

如能成功运行，说明模型提供商注册成功。

## 主智能体编写

### Tools 编写

主智能体包含三个工具：

- `ls`：列出已有笔记列表
- `query_note`：查询笔记具体内容
- `transfor_to_talk`：路由智能体，根据用户需求转交给多个智能体讨论

使用[上下文工程](./context-engineering.md)提供的工具函数创建前两个工具：

```python
from langchain_dev_utils import create_ls_tool, create_query_note_tool

ls = create_ls_tool(
    name="ls",
    description="""用于列出所有已保存的笔记名称。

    返回：
    list[str]: 包含所有笔记文件名的列表
    """,
)

query_note = create_query_note_tool(
    name="query_note",
    description="""用于查询笔记。

    参数：
    file_name: 笔记名称

    返回：
    str, 查询的笔记内容
    """,
)
```

`transfor_to_talk` 工具实现如下：

```python
from langchain.tools import tool
from typing import Annotated

@tool
async def transfor_to_talk(
    topic: Annotated[str, "当前讨论的话题主题"],
):
    """用于将话题转交给子智能体进行讨论"""
    return "transfor success!"
```

**代码位置：`src/tools.py`**

### State 编写

主智能体状态 Schema：

```python
from typing import Annotated
from langchain_core.messages import AnyMessage
from langchain_dev_utils import NoteStateMixin
from langgraph.graph import MessagesState, add_messages

class State(MessagesState, NoteStateMixin):
    talker_list: list[str]
    talk_messages: Annotated[list[AnyMessage], add_messages]

class StateIn(MessagesState):
    talker_list: list[str]

class StateOut(MessagesState, NoteStateMixin):
    pass
```

**代码位置：`src/state.py`**

状态键定义：

- `messages`：存储主智能体对话消息（继承 `MessagesState`）
- `note`：存储笔记（继承 `NoteStateMixin`）
- `talker_list`：存储参与讨论的智能体
- `talk_messages`：存储讨论结果

### Node 编写

```python
from typing import Literal, cast
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.types import Command
from src.state import State
from src.tools import transfor_to_talk, ls, query_note
from langchain_dev_utils import has_tool_calling, load_chat_model, parse_tool_calling
from src.prompt import MODERATOR_PROMPT

async def moderator(
    state: State,
) -> Command[Literal["__end__", "talk_and_write", "moderator_tools"]]:
    model = load_chat_model("deepseek:deepseek-chat")
    bind_model = model.bind_tools([transfor_to_talk, ls, query_note])

    response = await bind_model.ainvoke(
        [
            SystemMessage(content=MODERATOR_PROMPT),
            *state["messages"],
        ]
    )

    if has_tool_calling(cast(AIMessage, response)):
        tool_call_name, _ = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )

        if tool_call_name == "transfor_to_talk":
            return Command(
                goto="talk_and_write",
                update={"messages": [response]},
            )

        return Command(goto="moderator_tools", update={"messages": [response]})
    return Command(goto="__end__", update={"messages": [response]})

moderator_tools = ToolNode([ls, query_note])
```

**代码位置：`src/node.py`**

使用[消息处理](./message-processing.md)中的 `has_tool_calling` 和 `parse_tool_calling` 函数：

- `has_tool_calling`：判断消息是否包含工具调用
- `parse_tool_calling`：解析工具调用，返回 `(name, args)` 元组列表

### Prompt 编写

主智能体提示词：

```python
MODERATOR_PROMPT = """你的作用是根据用户的提问，提取其中的话题主题并调用`transfor_to_talk`工具将话题转交给子智能体进行讨论。
当子智能体的讨论返回后利用`query_note`工具查询笔记内容"""
```

## 讨论智能体

### Tools 编写

讨论智能体需要 `tavily_search` 工具进行互联网搜索。

安装依赖：

```bash
uv add langchain-tavily
```

基础工具实现：

```python
from langchain_community.tools.tavily_search import TavilySearch

@tool
async def tavily_search(query: Annotated[str, "要搜索的内容"]):
    """互联网搜索工具，用于获取最新的网络信息和资料。注意：为控制上下文长度和降低调用成本，每个任务执行过程中仅可调用一次此工具。"""
    tavily_search = TavilySearch(max_results=5)
    result = await tavily_search.ainvoke({"query": query})
    return result
```

为控制调用频率，使用[工具增强](./tool-enhancement.md)添加人工审核：

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt

async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"我要调用工具 {params['tool_call_name']}，参数为 {params['tool_call_args']}，请确认是否调用"
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "用户拒绝调用该工具"
    else:
        raise ValueError(f"不支持的响应类型: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
async def tavily_search(query: Annotated[str, "要搜索的内容"]):
    """互联网搜索工具，用于获取最新的网络信息和资料。注意：为控制上下文长度和降低调用成本，每个任务执行过程中仅可调用一次此工具。"""
    tavily_search = TavilySearch(max_results=5)
    result = await tavily_search.ainvoke({"query": query})
    return result
```

**代码位置：`src/tools.py`**

**注意：需设置 `TAVILY_API_KEY` 环境变量**

### State 编写

```python
from typing import Annotated
from langchain_core.messages import AnyMessage
from langgraph.graph import MessagesState, add_messages

class TalkState(MessagesState):
    topic: Annotated[str, lambda x, y: y]
    talk_messages: Annotated[list[AnyMessage], add_messages]
    temp_messages: Annotated[list[AnyMessage], add_messages]
    talker_list: list[str]
```

**代码位置：`src/talker_agents/state.py`**

状态键定义：

- `topic`：讨论主题
- `talk_messages`：存储每个子智能体讨论的最终结果
- `temp_messages`：存储讨论的临时消息
- `talker_list`：存储讨论参与者
- `messages`：存储主智能体消息

### Graph 编写

单个讨论智能体实现：

```python
from langgraph.graph import StateGraph
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.types import Command
from typing import Literal, cast
from langchain_core.messages import AIMessage, SystemMessage
from langchain_dev_utils import load_chat_model, has_tool_calling
from src.tools import tavily_search
from src.prompt import TALK_PROMPT

def build_talker_with_name(talker_name: str):
    async def talk(state: TalkState) -> Command[Literal["__end__", "talk_tools"]]:
        model = load_chat_model(talk_name_map[talker_name])
        bind_model = model.bind_tools([tavily_search])
        response = await bind_model.ainvoke(
            [
                SystemMessage(content=TALK_PROMPT.format(topic=state["topic"])),
                *state["temp_messages"],
            ]
        )
        if has_tool_calling(cast(AIMessage, response)):
            return Command(
                goto="talk_tools",
                update={"temp_messages": [response]},
            )
        return Command(
            goto="__end__",
            update={
                "talk_messages": [
                    AIMessage(content=f"{talker_name}: {response.content}\n")
                ],
            },
        )

    talk_tools = ToolNode([tavily_search], messages_key="temp_messages")
    graph = StateGraph(TalkState)
    graph.add_node("talk", talk)
    graph.add_node("talk_tools", talk_tools)

    graph.add_edge("__start__", "talk")
    graph.add_edge("talk_tools", "talk")
    return graph.compile(name=talker_name)
```

智能体接收讨论主题，在 `temp_messages` 临时上下文中进行讨论，最终结果保存到 `talk_messages`。

并行组合多个智能体：

```python
from langchain_dev_utils import parallel_pipeline
from langgraph.types import Send
from typing import Any, cast

def branch_talker(state: TalkState):
    message = state["messages"][-1]
    if has_tool_calling(message=cast(AIMessage, message)):
        _, args = parse_tool_calling(
            cast(AIMessage, message), first_tool_call_only=True
        )
        return [
            Send(
                node=talk_name,
                arg={"topic": cast(dict[str, Any], args).get("topic", "")},
            )
            for talk_name in state["talker_list"]
        ]
    return [Send(node="__end__", arg={})]

talk_name_map = {
    "qwen": "dashscope:qwen3-235b-a22b-instruct-2507",
    "deepseek": "deepseek:deepseek-chat",
    "kimi": "moonshot:moonshot-v1-8k",
    "glm": "zai:glm-4-plus"
}

talkers = parallel_pipeline(
    [
        build_talker_with_name("qwen"),
        build_talker_with_name("deepseek"),
        build_talker_with_name("kimi"),
        build_talker_with_name("glm"),
    ],
    state_schema=TalkState,
    branches_fn=branch_talker,
    graph_name="talk",
)
```

**代码位置：`src/talker_agents/graph.py`**

使用 `parallel_pipeline` 构建并行智能体管道，通过 `branches_fn` 实现用户指定参与讨论的智能体。

### Prompt 编写

讨论智能体提示词：

```python
TALK_PROMPT = """
你的任务是根据用户的主题进行讨论。你可以使用`tavily_search`工具进行互联网搜索。
用户的主题为{topic}
"""
```

## 记录智能体

### State 编写

```python
from typing import Annotated
from langchain_core.messages import AnyMessage
from langgraph.graph import MessagesState, add_messages
from langchain_dev_utils import NoteStateMixin

class WriteState(MessagesState, NoteStateMixin):
    temp_write_note_messages: Annotated[list[AnyMessage], add_messages]
    talk_messages: Annotated[list[AnyMessage], add_messages]
```

**代码位置：`src/write_note_agent/state.py`**

状态键定义：

- `temp_write_note_messages`：存储临时写笔记消息
- `talk_messages`：存储讨论最终结果
- `messages`：存储主智能体消息
- `note`：存储笔记

### Graph 编写

```python
from langgraph.graph import StateGraph
from langgraph.prebuilt.tool_node import ToolNode
from src.write_note_agent.state import WriteState
from langchain_dev_utils import load_chat_model, message_format
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_dev_utils import has_tool_calling, parse_tool_calling
from typing import Any, cast
from src.tools import write_note
from src.prompt import WRITE_NOTE_PROMPT

async def write_note_node(state: WriteState):
    model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
    bind_model = model.bind_tools([write_note])
    response = await bind_model.ainvoke(
        [
            SystemMessage(
                content=WRITE_NOTE_PROMPT.format(
                    messages=message_format(state["talk_messages"])
                )
            )
        ]
    )
    if has_tool_calling(cast(AIMessage, response)):
        _, args = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )
        note_name = cast(dict[str, Any], args).get("file_name")
        return {
            "messages": [
                ToolMessage(
                    content=f"讨论完毕，笔记已经写入{note_name}中！！",
                    tool_call_id=cast(AIMessage, state["messages"][-1]).tool_calls[0]["id"],
                )
            ],
            "temp_write_note_messages": [response],
        }

write_note_tools = ToolNode([write_note], messages_key="temp_write_note_messages")

graph = StateGraph(WriteState)
graph.add_node("write_note", write_note_node)
graph.add_node("write_note_tools", write_note_tools)

graph.add_edge("__start__", "write_note")
graph.add_edge("write_note", "write_note_tools")

write_note_agent = graph.compile(name="write_note_agent")
```

**代码位置：`src/write_note_agent/graph.py`**

写智能体分析各讨论结果并撰写总结笔记，使用 `message_format` 函数将多个 Message 格式化为字符串。

### Tools 编写

使用[上下文工程](./context-engineering.md)创建写笔记工具：

```python
from langchain_dev_utils import create_write_note_tool

write_note = create_write_note_tool(
    name="write_note",
    description="""用于写入笔记的工具。

    参数：
    content: str, 笔记内容
    """,
    message_key="temp_write_note_messages",
)
```

**代码位置：`src/tools.py`**

### Prompt 编写

写智能体提示词：

```python
WRITE_NOTE_PROMPT = """
你的任务是根据多个智能体讨论的内容进行总结并写入笔记。

多个智能体的各自的讨论结果是：
{messages}
"""
```

## 最终图构建

```python
from src.node import moderator, moderator_tools
from langgraph.graph import StateGraph
from src.state import State, StateIn, StateOut
from langchain_dev_utils import sequential_pipeline
from src.talker_agents.graph import talkers
from src.write_note_agent.graph import write_note_agent

graph = StateGraph(State, input_schema=StateIn, output_schema=StateOut)
graph.add_node("moderator", moderator)
graph.add_node("moderator_tools", moderator_tools)

graph.add_node(
    "talk_and_write",
    sequential_pipeline([talkers, write_note_agent], state_schema=State),
)
graph.add_edge("__start__", "moderator")
graph.add_edge("moderator_tools", "moderator")
graph.add_edge("talk_and_write", "moderator")

graph = graph.compile()
```

**代码位置：`src/graph.py`**

使用 `sequential_pipeline` 将 `talkers` 和 `write_note_agent` 串联。

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
