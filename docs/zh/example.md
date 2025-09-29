# 使用示例

> 本文通过一个**多智能体围绕特定话题讨论**的完整示例，展示如何在 `langchain` 与 `langgraph` 项目中高效使用 `langchain-dev-utils` 库。该示例深度融合了本库的所有核心模块，帮助你全面掌握本库五大模块的实战用法。

## 项目搭建

### 项目初始化

本项目采用`uv`作为项目管理工具，首先需要下载`uv`。

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

如果是 windows 系统，可以使用

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

安装好后，使用`uv`创建项目。

```bash
uv init langchain-dev-utils-example
```

进入项目目录

```bash
cd langchain-dev-utils-example
```

### 安装依赖

在此之前你需要确保你的电脑里面已经安装了`python`，如果没有你可以使用`uv`[安装 python](https://docs.astral.sh/uv/guides/install-python/)。
确保你的电脑已经有了`python`后，使用`uv`安装依赖。

```bash
uv add langchain langgraph langchain-dev-utils
```

除了上述依赖以外，你还需要安装`langgraph-cli`用于调试。

```bash
uv add langgraph-cli[inmem] --group dev
```

### 搭建项目目录

接下来请在项目中建立`src`目录，然后在`src`目录下创建`__init__.py`文件。接下来我们的所有代码都放在`src`目录下。
请确保你的项目目录结构如下所示：

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

接下来我们第一步要做的就是注册模型提供商。需使用`langchain-dev-utils`提供的`register_model_provider`函数。但是由于本次我们需要使用多个不同种类的模型，需要注册多个模型提供商，因此要使用更加方便的`batch_register_model_provider`函数。根据[模型管理](./model-management.md)的介绍，我们通常建议把注册模型提供商放到项目的`__init__.py`文件中，确保能够在项目启动完成后完成注册。

本次我们使用的模型是四个比较顶尖的开源模型，分别是`deepseek-v3.1`、`qwen3-235b-a22b-instruct-2507`、`kimi-k2-0955`、`glm-4.5`。对于`deepseek`和`qwen`模型，有对应的`langchain`集成（`langchain-deepseek`、`langchain-qwq`），而`kimi`和`glm`模型则没有比较适合的`langchain`集成，因此我们选择使用`langchain-openai`来集成。
故我们需要注册的提供商和对应的方式如下：

- deepseek 模型：安装`langchain-deepseek`，无需注册模型提供商，因为其是`init_chat_model`的支持的提供商，可以直接调用无需注册。
- qwen 模型：安装`langchain-qwq`，然后注册提供商，此时`chat_model`需要传入具体的 ChatModel 类。
- kimi 模型：安装`langchain-openai`，然后注册提供商，此时`chat_model`需要传入字符串值`openai`且同时传入`base_url`。
- glm 模型：安装`langchain-openai`，然后注册提供商，此时`chat_model`需要传入字符串值`openai`且同时传入`base_url`。

当然你也可以选择别的模型，方法和上面相同。
我们需要在`src/__init__.py`文件中注册模型提供商，代码如下：

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

当然你可以试一下是否注册成功了，测试的代码可以参考如下：

```python
from langchain_dev_utils import load_chat_model

model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
print(model.invoke("hello"))
```

如果程序能够成功运行，说明模型提供商注册成功。

### 主智能体编写

接下来我们先完成主智能体的编写吧。

#### tools 的编写

对主智能体，它有以下三个工具。

- ls: 用于列出已有的笔记列表
- query_note: 用于查询笔记的具体内容
- transfor_to_talk: 用于路由的智能体，根据用户需求将其转交给多个智能体讨论。

对于`ls`和`query_note`工具，我们这里使用[上下文工程](./context-engineering.md)中提供的两个工具函数`create_ls_tool`和`create_query_note_tool`来实现，具体使用方式如下：

```python
from langchain_dev_utils import (
    create_ls_tool,
    create_query_note_tool,
)


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
    file_name:笔记名称

    返回：
    str, 查询的笔记内容

    """,
)
```

而对于`transfor_to_talk`工具，我们需要自行完成编写，具体实现可以参考如下：

```python
@tool
async def transfor_to_talk(
    topic: Annotated[
        str,
        "当前讨论的话题主题",
    ],
):
    """用于将话题转交给子智能体进行进行讨论"""

    return "transfor success!"
```

**注意：上述的代码都在`src/tools.py`中**

#### state 的编写

本次主智能体的状态 Schema 如下：

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

**注意：上述的代码都在`src/state.py`中**
我们对主智能体状态键(state key)的定义如下：

- `messages`: 用于存储主智能体的对话消息
- `note`: 用于存储笔记
- `talker_list`: 用于存储参与讨论的智能体
- `talk_messages`: 用于存储参与讨论的智能体的讨论的结果

这里需要注意的是`message`键是通过继承`MessagesState`实现的，`note`键是通过继承`NoteStateMixin`实现的。通过继承这两个状态类，你就可以非常简单的实现这两个状态键，而无需自行编写（主要麻烦点是要编写 reducer）。

除了图的状态 State,我们还定义了`StateIn`和`StateOut`，其中`StateIn`用于表示输入状态，`StateOut`用于表示输出状态，这两个都是用于面向使用者的。

#### node 的编写

node 的编写代码如下（`src/node.py`）：

```python
from typing import Literal, cast
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.types import Command
from src.state import State
from src.tools import transfor_to_talk, ls, query_note
from langchain_dev_utils import (
    has_tool_calling,
    load_chat_model,
    parse_tool_calling,
)
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
                update={
                    "messages": [response],
                },
            )

        return Command(goto="moderator_tools", update={"messages": [response]})
    return Command(goto="__end__", update={"messages": [response]})


moderator_tools = ToolNode([ls, query_note])
```

需要注意的是，这里使用了[消息处理](./message-processing.md)中的`has_tool_calling`和`parse_tool_calling`函数。

`has_tool_calling`用于判断消息是否包含工具调用，`parse_tool_calling`用于解析工具调用。对于解析工具调用，默认会返回一个由(name,args)组成的元组的列表，如果传递了`first_tool_call_only=True`，则只返回第一个工具调用的(name,args)的元组。
对于解析的工具调用，如果其名字是`transfor_to_talk`则将其转发给子智能体进行讨论。

#### prompt 编写

对于主智能体的提示词，参考如下：

```python
MODERATOR_PROMPT = """你的作用是根据用户的提问，提取其中的话题主题并调用`transfor_to_talk`工具将话题转交给子智能体进行讨论。
当子智能体的讨论返回后利用`query_note`工具查询笔记内容"""
```

### 讨论智能体

#### tools 的编写

对于参与讨论的子智能体，它需要一个`tavily_search`工具，用于搜索互联网内容。

首先需要安装`langchain-tavily`:

```python
uv add langchain-tavily
```

其 tool 实现如下：

```python
@tool
async def tavily_search(query: Annotated[str, "要搜索的内容"]):
    """互联网搜索工具，用于获取最新的网络信息和资料。注意：为控制上下文长度和降低调用成本，每个任务执行过程中仅可调用一次此工具。"""
    tavily_search = TavilySearch(
        max_results=5,
    )
    result = await tavily_search.ainvoke({"query": query})
    return result
```

**注意：确保你设置了`TAVILY_API_KEY`环境变量，否则会报错。**

同时，这个 tavily_search 工具,可能有些用户不想要调用太多次这个工具，因为它会带来较长的上下文影响模型的回答速度，因此我们可以对这个工具添加人工审核，即[工具增强](./tool-enhancement.md)这里面的一个很重要的功能。

由于这个函数是异步的，因此我们需要使用`human_in_the_loop_async`装饰器，同时我们希望的是实现高度的定制性，因此需要传入`handler`。

故其实现如下：

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
    tavily_search = TavilySearch(
        max_results=5,
    )
    result = await tavily_search.ainvoke({"query": query})
    return result
```

**注意：该代码也位于`src/tools.py`中**

#### state 的编写

对于子智能体的状态，我们编写如下（位于`src/talker_agents/state.py`)：

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

对于子智能的状态，其包含以下状态键。

- topic: 讨论的主题
- talk_messages: 用于存储每个子智能体讨论的最终结果
- temp_messages: 用于存储讨论的临时消息
- talker_list: 用于存储讨论的参与者
- messages: 用于存储主智能体的消息

#### graph 的编写

对于子智能体的 graph 实现如下（位于`src/talker_agents/graph.py`)：

```python

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
                update={
                    "temp_messages": [response],
                },
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

这是一个非常简单的智能体实现，首先它会接收到本次讨论的主题 topic，然后会根据这个主题进行讨论，讨论过程中会调用工具，此时所有的结果都会在`temp_messages`提供的临时上下文窗口中进行。当完成讨论后，会将最终的结果保存到`talk_messages`中（表明是哪个智能体的讨论结果）。

对于讨论智能体，本次共有 4 个，它们是并行的关系。除此之外，我们还希望用户可以指定此次讨论的参与者，因此，我们添加了一个`talker_list`状态，用于存储讨论的参与者。

接下来就是组合这些智能体构建一个新的图。
代码如下（位于`src/talker_agents/graph.py`）：

```python
def branch_talker(state: TalkState):
    message = state["messages"][-1]
    if has_tool_calling(message=cast(AIMessage, message)):
        _, args = parse_tool_calling(
            cast(AIMessage, message), first_tool_call_only=True
        )
        return [
            Send(
                node=talk_name,
                arg={
                    "topic": cast(dict[str, Any], args).get("topic", ""),
                },
            )
            for talk_name in state["talker_list"]
        ]

    return [Send(node="__end__", arg={})]


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

这里使用了`langchain-dev-utils`中的`parallel_pipeline`，用于构建并行的智能体管道。同时为了实现用户指定可以讨论的智能体，我们需要传入`branches_fn`。在本文中就是`branch_talker`。
这个函数的实现也非常简单，首先是根据`messages`获取`topic`，然后根据`state`中的`talker_list`来依次生成`Send`对象，其`node`就是要转发的智能体名称，`arg`就是传递的`topic`。

到此完成了讨论智能体的构建。

#### prompt 的编写

讨论智能体的提示词如下：

```python

TALK_PROMPT = """
你的任务是根据用户的主题进行讨论。你可以使用`tavily_search`工具进行互联网搜索。
用户的主题为{topic}
"""
```

### 记录智能体

#### state 的编写

位于`src/write_note_agent/state.py`

```python
from typing import Annotated
from langchain_core.messages import AnyMessage
from langgraph.graph import MessagesState, add_messages
from langchain_dev_utils import NoteStateMixin


class WriteState(MessagesState, NoteStateMixin):
    temp_write_note_messages: Annotated[list[AnyMessage], add_messages]
    talk_messages: Annotated[list[AnyMessage], add_messages]
```

其包含以下状态键。

- temp_write_note_messages: 用于存储临时的写笔记消息
- talk_messages: 用于存储讨论的最终结果
- messages: 用于存储主智能体的消息
- note：用于存储笔记

#### graph 的编写

位于`src/write_note_agent/graph.py`

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


async def write_note_node(
    state: WriteState,
):
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
                    tool_call_id=cast(AIMessage, state["messages"][-1]).tool_calls[0][
                        "id"
                    ],
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

写智能体的实现也非常简单，它通过分析每个讨论子智能体的最终结果，然后撰写总结笔记。
这里同时也用到了[消息处理](./message-processing.md)中的`message_format`函数，用于将若干个 Message 格式化为一个字符串。

#### tools 的编写

写智能体的工具是`write_note`同样是使用[上下文工程](./context-engineering.md)中的`create_write_note_tool`创建的。
代码实现如下：

```python

write_note = create_write_note_tool(
    name="write_note",
    description="""用于写入笔记的工具。

    参数：
    content: str, 笔记内容

    """,
    message_key="temp_write_note_messages",
)
```

**注意：位于`src/tools.py`中**

#### prompt 的编写

写智能体的提示词如下：

```python
WRITE_NOTE_PROMPT = """
你的任务是根据多个智能体讨论的内容进行总结并写入笔记。


多个智能体的各自的讨论结果是
{messages}
"""
```

### 最终图的构建

参考代码如下：

```python
from src.node import (
    moderator,
    moderator_tools,
)
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

其中由于`talkers`和`write_note_agent`是串行的，因此这里使用了[状态图编排](./graph-orchestration.md)中的`sequential_pipeline`。

最后在项目根目录新建`langgraph.json`写入如下：

```json
{
  "dependencies": ".",
  "graphs": {
    "graph": "./src/graph.py:graph"
  }
}
```

然后启动`langgraph server`，最终你应该能看到如下图所示的图结构。
![最终图](/img/graph.png)
