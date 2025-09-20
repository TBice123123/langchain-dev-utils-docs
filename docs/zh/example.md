# 使用示例

接下来的示例将展示如何在`langChain`和`LangGraph`中使用`langchain-dev-utils`。我们将构建一个简单的旅游出行规划助手。

通过这次示例，你不仅能够学会`langchain-dev-utils`的部分核心工具函数，还能了解怎么做好一个智能体的上下文管理，下面，让我们开始吧！

### 创建项目

本次项目采用`uv`进行构建,我们使用如下命令：

```bash
uv init travel-planner-assistant
```

创建完成后，进入项目目录，并安装依赖：

```bash
cd travel-planner-assistant
```

你需要安装`langchain`、`langgraph`、`langchain-dev-utils`。

```bash
uv add langchain langgraph langchain-dev-utils
```

接下来我们需要创建目录结构（同时创建相关文件）。
最终得到的目录结构如下：

```
travel-planner-assistant/
└── src/
    └── agent/
        ├── __init__.py
        ├── prompts/
        │   ├── __init__.py
        │   └── prompt.py
        ├── sub_agent/
        │   ├── __init__.py
        │   ├── graph.py
        │   └── node.py
        ├── utils/
        │   ├── __init__.py
        │   └── context.py
        ├── write_agent/
        │   ├── __init__.py
        │   ├── graph.py
        │   └── node.py
        ├── graph.py
        ├── node.py
        ├── state.py
        └── tools.py
```

大体上，这个项目包括了三个智能体：主智能体、子智能体和写智能体。其中主智能体负责控制整个流程，子智能体负责处理每个划分后的子任务、写智能体其实又分为两个并行的节点分别用于写入笔记和完成任务结果摘要。
我们下面依次完成。

### 注册模型提供商

智能体的核心是大语言模型，因此需要先解决模型调用的问题，对于本项目的大语言模型，只需要保证其具备一定的工具调用和推理能力即可。
本次例子中，我们使用`Qwen`、`Kimi`、`GLM`、`DeepSeek`这四款顶尖的开源系列模型。你当然可以根据你的喜好选择别的模型。

首先，要调用模型，你需要安装对应的集成库。你需要安装`langchain-deepseek`、`langchain-qwq`这两个库分别用于接入 DeepSeek 和 Qwen。而对于另外两个模型你完全可以采用`langchain-openai`来接入，且这两个库依赖于`langchain-openai`，因此你无需再次安装。

假设你已经安装了，那么我们可以通过实例化`chat model`的方式来调用，但是很麻烦，尤其是本项目有多个智能体每个地方都需要调用模型，而且每个地方的模型可能都不太一样，如果采用传统的方式可能你要写很多次 from ... import ...语句，这个很麻烦，且后续要换模型，尤其是换不同类型的模型，这样就更麻烦了。对此，`langchain`官方提供了`init_chat_model`，它可以通过传入模型名称字符串来初始化一个`chat model`，无需再导入这个模型对应的库，这样就很方便了，但是又有一个很麻烦的问题，那就是这个函数支持的模型有限，像上述我们提到的开源模型，除了`deepseek`支持以外别的都不支持。因此这里我们就要使用`langchain-dev-utils`这个库了。
下面就介绍一下如何使用，对于这个库提供了两个工具函数`register_model_provider`和`load_chat_model`。首先需要注册模型提供商，然后才能类似`init_chat_model`一样使用。

于是你需要注意一点：由于注册模型提供商的函数采用了一个全局字典来存储模型提供商，因此必须保证在项目启动完成后就完成注册，而不能在后续调用的时候再次注册，以防止多线程并发导致的线程安全问题。

> 对于字典来说，对其进行写入是非线程安全的，而对于读取是线程安全的。

我们在`src`下的`__init__.py`下进行注册。这样一定能保证项目启动完成后就完成注册。
我们需要写入如下代码:

```python
from langchain_dev_utils import batch_register_model_provider
from langchain_qwq import ChatQwen
from langchain_siliconflow import ChatSiliconFlow


batch_register_model_provider(
    [
        {
            "provider": "dashscope",
            "chat_model": ChatQwen,
        },
        {
            "provider": "siliconflow",
            "chat_model": ChatSiliconFlow,
        },
        {
            "provider": "zai",
            "chat_model": "openai",
            "base_url": "https://open.bigmodel.cn/api/paas/v4",
        },
        {
            "provider": "moonshot",
            "chat_model": "openai",
            "base_url": "https://api.moonshot.cn/v1",
        },
    ]
)
```

对于上面的代码需要解释以下几点：

1. 这里没有采用上述所说的`register_model_provider`，而是采用了`batch_register_model_provider`，其实`batch_register_model_provider`内部就是多次调用`register_model_provider`，这样就能一个函数批量注册多个模型提供者，进一步方便开发者了。需要注意的是，这个时候参数是一个字典组成的列表，每个字典包含`provider`、`chat_model`和`base_url`三个键值对。
2. 对于`chat_model`，它接收两个类型的值，一种是`chat_model`，另一种是字符串。对于`chat_model`由于`langchain-qwq`中有`ChatQwen`可以用于接入 Qwen 模型，因此该列表的第一个元素的对应的值传入了`ChatQwen`。而对于`Kimi`和`GLM`,由于其没有合适的集成库同时又因为其完全兼容`OpenAI`风格，因此我们这里传入了`openai`，表示通过`langchain_openai`的`ChatOpenAI`来接入，这个时候需要明确传入`base_url`的值或者设置对应的 APIBASE 环境变量。（这里需要说明的是传入字符串意味着使用`langchain`的`init_chat_model`函数来创建模型）

### 主智能体

其核心任务在于分析用户需求并分解任务，然后将每个任务交给子智能体处理。

首先我们先完成 tools 的编写。对于 tools，主智能体需要有`write_plan`、`update_plan`、`write_note`、`ls`、`query_note`这几个函数，用于处理上下文。同时还要有一个`transfor_task_to_subagent`函数用于将任务交接给子智能体。
我们在`src`下的 tools.py 文件下写入如下内容：

```python
from typing import Annotated

from langchain_core.tools import tool
from langchain_tavily.tavily_search import TavilySearch

from langchain_dev_utils import (
    create_write_note_tool,
    create_write_plan_tool,
    create_update_plan_tool,
    create_ls_tool,
    create_query_note_tool,
)


write_plan = create_write_plan_tool(
    name="write_plan",
    description="""用于写入计划的工具,只能使用一次，在最开始的时候使用，后续请使用update_plan更新。
参数：
plan: list[str], 待写入的计划列表，这是一个字符串列表，每个字符串都是一个计划内容content
""",
)

update_plan = create_update_plan_tool(
    name="update_plan",
    description="""用于更新计划的工具，可以多次使用来更新计划进度。
    参数：
    update_plans: list[Todo] - 需要更新的计划列表，每个元素是一个包含以下字段的字典：
        - content: str, 计划内容，必须与现有计划内容完全一致
        - status: str, 计划状态，只能是"in_progress"（进行中）或"done"（已完成）

    使用说明：
    1. 每次调用只需传入需要更新状态的计划，无需传入所有计划
    2. 必须同时包含至少一个"done"状态的计划和至少一个"in_progress"状态的计划
        - 将已完成的计划设置为"done"
        - 将接下来要执行的计划设置为"in_progress"
    3. content字段必须与现有计划内容精确匹配

    示例：
    假设当前计划列表为：
    [
        {"content":"计划1"，"status":"done"}
        {"content":"计划2"，"status":"in_progress"}
        {"content":"计划3"，"status":"pending"}
    ]
    当完成"计划1"并准备开始"计划2"时，应传入：
    [
        {"content":"计划1", "status":"done"},
        {"content":"计划2", "status":"in_progress"}
    ]
    """,
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

write_note = create_write_note_tool(
    name="write_note",
    description="""用于写入笔记的工具。

    参数：
    content: str, 笔记内容

    """,
    message_key="write_note_messages",
)


@tool
async def transfor_task_to_subagent(
    content: Annotated[
        str,
        "当前待执行的todo任务内容，必须与todo列表中待办事项的content字段完全一致，但是当子智能体执行的任务有误时，重试的时候可以适当改写",
    ],
):
    """用于执行todo任务的工具。

    参数：
    content: str, 待执行的todo任务内容，必须与todo列表中待办事项的content字段完全一致，但是当子智能体执行的任务有误时，重试的时候可以适当改写

    例如当前的todo list是
    [
        {"content":"待办1"，"status":"done"}
        {"content":"待办2"，"status":"in_progress"}
        {"content":"待办3"，"status":"pending"}

    ]
    则可以知道当前执行的是待办2，则输入的content应该为"待办2"。
    """

    return "transfor success!"

```

对于除了`transfor_task_to_subagent`之外的工具，我们均采用了`langchain-dev-utils`提供的工具函数创建。
以`create_write_note_tool`为例，这个函数有三个参数分别是`name`、`description`和`message_key`。这三个值都是可选的，但是这里我们均传入了。对于`name`和`description`其分别决定了最终的 tool 对象的 name 和 description。而对于`message_key`，则决定了这个 tool 执行完毕后其返回的 ToolMessage 应该插入的存储 Messages 的 key。
接下来我们需要编写这个智能体的状态。在`langGraph`中，智能体用状态图来描述，这个状态就是这个图的核心内容。
由于`create_write_plan_tool`、`create_update_plan_tool`、`create_ls_tool`、`create_query_note_tool`和`create_write_note_tool`需要用到`note`、`plan`两个核心的字段，因此我们需要定义这两个字段，`langGraph`中可以使用`TypedDict`来定义状态，但是这样很麻烦，`langchain-dev-utils`中提供了两个状态混合类`PlanStateMixin`和`NoteStateMixin`，可以通过继承这两个类来快速创建这两个核心字段。

> 至于为啥要这样做比较好，是因为对于 plan 其是一个列表，且每个元素又是一个 plan 字典，使用者需要明确这个字典的结构，而对于 note 其又是一个字典，正常情况下`langGraph`会根据返回的更新值进行覆盖，但对于 note 来说，我们需要的则是新增，因此需要传入 reducer 函数，这个又很麻烦，对此`langchain-dev-utils`提供了`PlanStateMixin`和`NoteStateMixin`，你只需要继承这两个类即可，无需考虑复杂的 reducer 函数和状态的结构。

我们在`src`下的`state.py`文件下写入如下内容：

```python
from typing import Annotated

from langchain_core.messages import AnyMessage
from langgraph.graph.message import MessagesState, add_messages
from langchain_dev_utils import PlanStateMixin, NoteStateMixin


class StateInput(MessagesState):
    pass


class State(MessagesState, PlanStateMixin, NoteStateMixin, total=False):
    task_messages: Annotated[list[AnyMessage], add_messages]
    now_task_message_index: int
    write_note_messages: Annotated[list[AnyMessage], add_messages]
```

完成上述内容后，需要实现`node.py`文件。在`src`文件夹下创建`node.py`文件，写入如下内容：

```python
from typing import Literal, cast

from langchain_core.messages import AIMessage, SystemMessage
from langchain_dev_utils import has_tool_calling, load_chat_model, parse_tool_calling
from langgraph.prebuilt import ToolNode
from langgraph.runtime import get_runtime
from langgraph.types import Command

from src.agent.state import State
from src.agent.tools import (
    ls,
    query_note,
    transfor_task_to_subagent,
    update_plan,
    write_plan,
)
from src.agent.utils.context import Context


async def call_model(state: State) -> Command[Literal["tools", "subagent", "__end__"]]:
    run_time = get_runtime(Context)
    model = load_chat_model(
        model=run_time.context.todo_model,
    )

    tools = [
        write_plan,
        update_plan,
        transfor_task_to_subagent,
        ls,
        query_note,
    ]
    bind_model = model.bind_tools(tools, parallel_tool_calls=False)
    messages = state["messages"]

    response = await bind_model.ainvoke(
        [SystemMessage(content=run_time.context.todo_prompt), *messages]
    )

    if has_tool_calling(cast(AIMessage, response)):
        name, _ = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )
        if name == "transfor_task_to_subagent":
            return Command(
                goto="subagent",
                update={
                    "messages": [response],
                    "now_task_message_index": len(
                        state["task_messages"] if "task_messages" in state else []
                    ),
                },
            )

        return Command(goto="tools", update={"messages": [response]})

    return Command(goto="__end__", update={"messages": [response]})


tool_node = ToolNode([write_plan, update_plan, ls, query_note])
```

对于上述实现，我们需要强调的具体如下

```python
run_time = get_runtime(Context)
model = load_chat_model(
    model=run_time.context.todo_model,
)
```

这里采用了`langchain-dev-utils`中的`load_chat_model`来创建 chat model 对象，同时引入了`langGraph`的`Context`来动态的调整模型名称。对于这个`Context`我们需要在`src/utils/context.py`文件中定义。
具体如下：

```python
from dataclasses import dataclass
from typing import Annotated

from src.agent.prompts.prompt import (
    SUBAGENT_PROMPT,
    SUMMARY_PROMPT,
    TODO_MODEL_PROMPT,
    WRITE_PROMPT,
)


@dataclass
class Context:
    todo_model: Annotated[str, "用于执行todo任务规划和执行的模型"] = (
        "moonshot:kimi-k2-0905-preview"
    )
    sub_model: Annotated[str, "用于执行每个任务的模型"] = "deepseek:deepseek-chat"
    write_model: Annotated[str, "用于执行记笔记任务的模型"] = (
        "dashscope:qwen3-next-80b-a3b-instruct"
    )
    summary_model: Annotated[str, "用于执行总结任务的模型"] = "zai:glm-4.5-air"
    todo_prompt: Annotated[str, "用于执行todo任务的prompt"] = TODO_MODEL_PROMPT
    sub_prompt: Annotated[str, "用于执行每个任务的prompt"] = SUBAGENT_PROMPT
    write_prompt: Annotated[str, "用于执行记笔记任务的prompt"] = WRITE_PROMPT
    summary_prompt: Annotated[str, "用于执行总结任务的prompt"] = SUMMARY_PROMPT
```

当然通过上述的代码，你也应该知道本次的几个智能体都采用了哪些模型了吧。除了定义模型外，context 中还定义了每个智能体的提示词。

同时：

```python
if has_tool_calling(cast(AIMessage, response)):
        name, _ = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )
        if name == "transfor_task_to_subagent":
            return Command(
                goto="subagent",
                update={
                    "messages": [response],
                    "now_task_message_index": len(
                        state["task_messages"] if "task_messages" in state else []
                    ),
                },
            )
```

这段代码又采用了`langchain-dev-utils`中的`has_tool_calling`和`parse_tool_calling`来判断是否有工具调用以及获取工具调用的名称和对应参数。
当然你也可以采用下面这段代码

```python
if isinstance(response, AIMessage) and hasattr(response, "tool_calls") and len(response.tool_calls) > 0:
```

来判断，这个`has_tool_calling`就是对这段代码进行了封装。当然也非常推荐直接使用`has_tool_calling`，因为这样写更加简单。同时，对于工具调用结果我们还需要解析，主要是要解析是否有交接给子智能体的情况，即是否调用了`transfor_task_to_subagent`工具。这里我们采用了`langchain-dev-utils`中的`parse_tool_calling`来解析工具调用的名称和对应参数。当然我们设置了`first_tool_call_only=True`，这样它只会返回第一个工具调用的解析结果，否则它则会返回元组组成的列表，每个元组都是(name, args)。如果解析到了工具调用且工具调用的名称为`transfor_task_to_subagent`，则交接给子智能体。
最后，对于主智能体的提示词如下：

```markdown
你是一个智能任务助手，专门帮助用户高效完成各种任务。

请严格按照以下步骤执行用户任务：

1. **任务分解** - 将用户任务拆分为具体的子任务，并调用 write_plan 工具创建完整的任务列表
2. **任务执行** - 按顺序执行任务列表中的每个子任务：
   - 首次必须调用 write_plan 工具写入任务列表
   - 完成每个任务后，立即调用 update_plan 工具更新任务状态
3. **结果总结** - 当所有任务都完成后，向用户提供完整的执行总结报告

重要提醒：

- 必须首先使用 write_plan 工具初始化任务列表
- 每完成一个任务都要及时更新任务状态
- 确保任务执行的完整性和准确性
- 每个任务都必须实际执行，且你只需要将任务委派给 sub agent，你本身不应该执行任务，所有任务全交给 sub agent 执行，sub agent 的结果会保存到文件中，执行完成后再调用 update_todo 进行更新，不能仅调用工具而不执行任务
- 对于任务执行结果的查询：你可以通过 ls 工具查看文件记录，也可以通过 query_note 查询相关笔记内容。但请注意，并非所有任务完成后返回都需要查询笔记，请根据任务性质和实际需要灵活调用 query_note 函数。
```

### 子智能体

对于子智能体，我们提供的工具是`tavily_seach`其实现如下：

```python
async def tavily_search(query: Annotated[str, "要搜索的内容"]):
    """互联网搜索工具，用于获取最新的网络信息和资料。注意：为控制上下文长度和降低调用成本，每个任务执行过程中仅可调用一次此工具。"""
    tavily_search = TavilySearch(
        max_results=5,
    )
    result = await tavily_search.ainvoke({"query": query})
    return result

```

同样它位于`src/agent/tools.py`文件中。

接下来我们需要关注的是实现子智能体的逻辑，主要在 node 中，我们需要在`src/agent/sub_agent/node.py`文件中实现如下代码：

```python
from typing import Literal, cast

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_dev_utils import (
    has_tool_calling,
    load_chat_model,
    message_format,
    parse_tool_calling,
)
from langgraph.prebuilt import ToolNode
from langgraph.runtime import get_runtime
from langgraph.types import Command

from src.agent.state import State
from src.agent.tools import get_weather, query_note, tavily_search
from src.agent.utils.context import Context


async def subagent_call_model(state: State) -> Command[Literal["sub_tools", "__end__"]]:
    run_time = get_runtime(Context)
    last_ai_message = cast(AIMessage, state["messages"][-1])

    _, args = parse_tool_calling(last_ai_message, first_tool_call_only=True)
    task_name = cast(dict, args).get("content", "")

    model = load_chat_model(model=run_time.context.sub_model).bind_tools(
        [get_weather, tavily_search, query_note]
    )

    task_messages = state["task_messages"] if "task_messages" in state else []

    now_task_message_index = (
        state["now_task_message_index"] if "now_task_message_index" in state else 0
    )

    messages = task_messages[now_task_message_index:]

    notes = state["note"] if "note" in state else {}

    user_requirement = state["messages"][0].content

    response = await model.ainvoke(
        [
            SystemMessage(
                content=run_time.context.sub_prompt.format(
                    task_name=task_name,
                    history_files=message_format(list(notes.keys()))
                    if notes
                    else "当前没有笔记",
                    user_requirement=user_requirement,
                )
            ),
            HumanMessage(content=f"我的任务是：{task_name}，请帮我完成"),
            *messages,
        ]
    )

    if has_tool_calling(cast(AIMessage, response)):
        return Command(
            goto="sub_tools",
            update={"task_messages": [response]},
        )

    return Command(
        goto="__end__",
        update={
            "task_messages": [response],
        },
    )


sub_tools = ToolNode(
    [get_weather, tavily_search, query_note], messages_key="task_messages"
)
```

对于这段代码，我们采用了独立的上下文窗口（通过`task_messages`和`now_task_message_index`）,同时为了能让子智能体了解之前的任务的执行过程，我们会在后续的`write_agent`中实现笔记的记录，对于子智能体我们提供了`query_note`函数并在其系统提示词中暴力拼接已有的笔记名词，这里则用到了`langchain-dev-utils`中的`message_format`来格式化消息。它接收一个列表，每个列表元素可以是如下类型：

- str
- message
- document
  然后它就会返回一个将上述内容进行拼接的字符串。
  例如你传入的是一个字符串组成的数组例如`["笔记1","笔记2"，"笔记3"]`，那么它可能会返回如下内容：

```python
"""
-笔记1
-笔记2
-笔记3
"""
```

完成`node.py`的定义后，我们需要实现`graph.py`。
实现的内容如下：

```python
from langgraph.graph.state import StateGraph

from src.agent.state import State
from src.agent.sub_agent.node import sub_tools, subagent_call_model


def build_sub_agent():
    subgraph = StateGraph(State)
    subgraph.add_node("subagent_call_model", subagent_call_model)
    subgraph.add_node("sub_tools", sub_tools)
    subgraph.add_edge("__start__", "subagent_call_model")
    subgraph.add_edge("sub_tools", "subagent_call_model")

    return subgraph.compile()
```

同样对于子智能体，其提示词如下：

```markdown
你是一个专业的 AI 任务执行助手，专注于高效完成指定的子任务。

## 任务上下文

用户总体需求：{user_requirement}
**当前子任务：{task_name}**

## 执行准则

### 1. 精准理解

- 仔细分析任务的核心目标和具体要求
- 识别任务的关键约束条件和成功标准
- 理解任务在整体需求中的作用和位置
- 专注执行当前子任务，用户总体需求仅作为背景参考

### 2. 智能规划

- 评估可用工具和资源，选择最优执行路径
- 考虑任务的复杂度和依赖关系
- 制定清晰的执行步骤

### 3. 高效执行

- 提供准确、可操作的解决方案
- 确保输出结果符合预期质量标准
- 优先处理核心功能，避免过度设计

### 4. 简洁沟通

- 直接回应任务要求，避免冗余解释
- 使用清晰的结构化输出
- 重点突出关键信息和结果

## 历史信息查询

当前可用的历史任务记录：
{history_files}

**重要提示：**

- 如果当前任务需要依赖之前的执行结果，请优先使用 **query_note** 工具查询相关历史记录
- 如果没有相关历史记录或任务独立执行，则直接开始任务执行
- 充分利用历史信息避免重复工作，提高执行效率
- 工具使用约束：**tavily_search**工具在每个任务仅限调用一次，请合理规划搜索策略以获取最全面的信息,这点非常重要，请注意！

现在开始执行任务，请根据上述要求提供高质量的解决方案。
```

### 写智能体

写智能体的实现如下，需要分别实现`src/agent/write_agent/node.py`和`src/agent/write_agent/graph.py`

```python
from typing import cast

from langchain_core.messages import AIMessage, ToolMessage
from langchain_dev_utils import load_chat_model
from langgraph.prebuilt import ToolNode
from langgraph.runtime import get_runtime

from src.agent.state import State
from src.agent.tools import write_note
from src.agent.utils.context import Context


async def write(state: State):
    run_time = get_runtime(Context)
    task_messages = state["task_messages"] if "task_messages" in state else []

    write_model = load_chat_model(
        model=run_time.context.write_model,
    ).bind_tools([write_note], tool_choice="write_note")

    task_content = task_messages[-1].content

    response = cast(
        AIMessage,
        await write_model.ainvoke(
            run_time.context.write_prompt.format(task_result=task_content)
        ),
    )

    return {
        "write_note_messages": [response],
    }


async def summary(state: State):
    run_time = get_runtime(Context)
    task_messages = state["task_messages"] if "task_messages" in state else []
    summary_model = load_chat_model(model=run_time.context.summary_model)

    task_content = task_messages[-1].content
    response = cast(
        AIMessage,
        await summary_model.ainvoke(
            run_time.context.summary_prompt.format(task_result=task_content)
        ),
    )
    tool_call_id = cast(AIMessage, state["messages"][-1]).tool_calls[0]["id"]
    return {
        "messages": [
            ToolMessage(
                content=f"任务执行完成！此任务结果摘要：{response.content}",
                tool_call_id=tool_call_id,
            ),
        ],
    }


write_tool = ToolNode([write_note], messages_key="write_note_messages")
```

```python
from langgraph.graph.state import StateGraph

from src.agent.state import State
from src.agent.write_agent.node import summary, write, write_tool


def build_write_agent():
    subgraph = StateGraph(State)
    subgraph.add_node("write", write)
    subgraph.add_node("write_tool", write_tool)
    subgraph.add_node("summary", summary)
    subgraph.add_edge("__start__", "write")
    subgraph.add_edge("__start__", "summary")
    subgraph.add_edge("write", "write_tool")
    subgraph.add_edge("summary", "write_tool")
    subgraph.add_edge("write_tool", "__end__")

    return subgraph.compile()
```

其提示词如下：

写入笔记的智能体的提示词

```markdown
请根据当前的任务的返回结果，调用`write_note`函数将笔记内容进行写入
{task_result}

请确保笔记内容是 Markdown 格式，且你应该对当前任务的返回结果进行概述和重写，确保语义通顺。
文件名请使用简洁明确的名称，无需包含文件扩展名（如.md）。
```

总结任务完成情况的智能体的提示词

```markdown
请根据当前的任务的返回结果，写一个简洁明了的概括
{task_result}

请确保摘要的内容简短，不能长篇大论，且摘要的内容要简洁明了，不能有冗余信息。尽量避免重复和无关紧要的内容。
```

### 后续内容

后续需要完成`src/agent/graph.py`的内容

```python
from dotenv import load_dotenv
from langgraph.graph.state import StateGraph

from src.agent.node import call_model, tool_node
from src.agent.state import State, StateInput
from src.agent.sub_agent.graph import build_sub_agent
from src.agent.utils.context import Context
from src.agent.write_agent.graph import build_write_agent

load_dotenv(dotenv_path=".env", override=True)


def build_graph_with_langgraph_studio():
    graph = StateGraph(State, input_schema=StateInput, context_schema=Context)
    graph.add_node("call_model", call_model)
    graph.add_node("tools", tool_node)
    graph.add_node("subagent", build_sub_agent())
    graph.add_node("write_note", build_write_agent())

    graph.add_edge("__start__", "call_model")
    graph.add_edge("tools", "call_model")
    graph.add_edge("subagent", "write_note")
    graph.add_edge("write_note", "call_model")

    return graph.compile()
```

最后需要在项目根目录新建`langgraph.json`写入如下内容：

```json
{
  "dependencies": ["."],
  "graphs": {
    "todo-agent": "./src/agent/graph.py:build_graph_with_langgraph_studio"
  }
}
```

然后创建`.env`文件写入相关的环境变量。

所有内容完成后你可以安装`langgraph-cli`进行测试。

```bash
uv add langgraph-cli[inmem]
```

然后使用 langgraph dev 运行。
最终你可以在`langGraph Studio`中看到如下所示的图结构：
![graph](/img/graph.png)
