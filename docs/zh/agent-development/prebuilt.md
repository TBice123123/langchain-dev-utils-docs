# 预构建

> [!NOTE]
>
> **功能概述**：提供方便进行 Agent 开发的实用工具。
>
> **前置要求**：了解 langchain 的[Agent](https://docs.langchain.com/oss/python/langchain/agents)、[Multi-Agent](https://docs.langchain.com/oss/python/langchain/multi-agent)。
>
> **预计阅读时间**：8 分钟

## 预构建智能体函数

LangChain v1 版本中，官方提供的 `create_agent` 函数可以用于创建单智能体,其中 model 参数支持传入 BaseChatModel 实例或特定字符串（当传入字符串时，仅限于 `init_chat_model` 支持的模型）。为扩展字符串指定模型的灵活性，本库提供了功能相同的 `create_agent` 函数，使您能直接使用`load_chat_model`支持的模型（需要提取注册）。

核心函数：

- `create_agent`：创建单智能体

其参数如下:
<Params
name="model"
type="string"
description="对话模型名称，取值必须为字符串，且格式是 provider_name:model_name，同时支持 init_chat_model 以及 load_chat_model 支持的格式，其中 load_chat_model 的 provider_name 需要使用 register_model_provider 完成注册。"
:required="true"
:default="null"
/>

**注意**：其它参数和 langchain 的 create_agent 一样。

**使用示例**

```python
from langchain_core.messages import HumanMessage
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

agent = create_agent("vllm:qwen3-4b", tools=[get_current_time])
# 使用方式与 langchain的create_agent完全一致
response = agent.invoke({"messages": [HumanMessage(content="现在几点了？")]})
print(response)
```

## 封装 Agent 为 Tool

将智能体封装为工具是多智能体系统中的一种常见实现模式，LangChain 官方文档对此有详细阐述。为此，本库提供了预构建函数 `wrap_agent_as_tool` 来实现此模式，该函数能够将一个智能体实例封装成一个可供其它智能体调用的工具。

核心函数：

- `wrap_agent_as_tool`：将 Agent 封装为 Tool

其参数如下:

<Params
name="agent"
type="CompiledStateGraph"
description="智能体，取值必须为 langgraph 的 CompiledStateGraph。"
:required="true"
:default="null"
/>
<Params
name="tool_name"
type="string"
description="工具的名称。如果不传则工具默认名称是`transfor_to_agent_name`。"
:required="false"
:default="null"
/>
<Params
name="tool_description"
type="string"
description="工具的描述。如果不传则使用默认的描述内容。"
:required="false"
:default="null"
/>
<Params
name="pre_input_hooks"
type="Callable | tuple[Callable, AwaitableCallable]"
description="预处理钩子函数，可以是单个同步函数或一个二元组。如果是二元组，则第一个函数是同步函数，第二个函数是异步函数，用于在智能体运行前对输入进行预处理。"
:required="false"
:default="null"
/>
<Params
name="post_output_hooks"
type="Callable | tuple[Callable, AwaitableCallable]"
description="后处理钩子函数，可以是单个同步函数或一个二元组。如果是二元组，则第一个函数是同步函数，第二个函数是异步函数，用于在智能体运行完成后，对其返回的完整消息列表进行后处理。"
:required="false"
:default="null"
/>

**使用示例**

```python
import datetime
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_dev_utils.agents import wrap_agent_as_tool, create_agent

@tool
def get_current_time() -> str:
    """获取当前时间戳"""
    return str(datetime.datetime.now().timestamp())

# 定义一个用于查询时间的智能体
time_agent = create_agent(
    "vllm:qwen3-4b", tools=[get_current_time], name="time_agent"
)
call_time_agent_tool = wrap_agent_as_tool(
    time_agent, tool_name="call_time_agent", tool_description="调用时间智能体"
)
# 将其作为一个工具
agent = create_agent("vllm:qwen3-4b", tools=[call_time_agent_tool], name="agent")

response = agent.invoke({"messages": [HumanMessage(content="现在几点了？")]})
print(response)
```

### 使用钩子函数

本函数提供了几个钩子函数，用于在调用智能体前后进行一些操作。

#### 1. pre_input_hooks

在智能体运行前对输入进行预处理。可用于输入增强、上下文注入、格式校验、权限检查等。

支持传入以下类型：

- 若传入 **单个同步函数**，则该函数同时用于同步（`invoke`）和异步（`ainvoke`）调用路径（异步路径中不会 `await`，直接调用）。
- 若传入 **二元组 `(sync_func, async_func)`**：
  - 第一个函数用于同步调用路径；
  - 第二个函数（必须是 `async def`）用于异步调用路径，并会被 `await`。

你传入的函数接收两个参数：

- `request: str`：原始工具调用输入；
- `runtime: ToolRuntime`：`langchain`的`ToolRuntime`。

你传入的函数必须返回处理后的 `str`，作为 agent 的实际输入。

**示例**：

```python
def process_input(request: str, runtime: ToolRuntime) -> str:
    return "<task_description>" + request + "</task_description>"

# 或支持异步
async def process_input_async(request: str, runtime: ToolRuntime) -> str:
    return "<task_description>" + request + "</task_description>"

# 使用
call_agent_tool = wrap_agent_as_tool(
    agent,
    pre_input_hooks=(process_input, process_input_async)
)
```

#### 2. post_output_hooks

在智能体运行完成后，对其返回的完整消息列表进行后处理，以生成工具的最终返回值。可用于结果提取、结构化转换等。

支持传入以下类型：

- 若传入 **单个函数**，该函数用于同步和异步路径（异步路径中不 `await`）。
- 若传入 **二元组 `(sync_func, async_func)`**：
  - 第一个用于同步路径；
  - 第二个（`async def`）用于异步路径，并会被 `await`。

你传入的函数接收三个参数：

- `request: str`：（可能已处理的）原始输入；
- `messages: List[AnyMessage]`：agent 返回的完整消息历史（来自 `response["messages"]`）；
- `runtime: ToolRuntime`：`langchain`的`ToolRuntime`。

你传入的函数返回的值可以是能够被序列化为一个字符串或者是`Command`对象。

**示例**：

```python
from langgraph.types import Command

def process_output_sync(request: str, messages: list, runtime: ToolRuntime) -> Command:
    return Command(update={
        "messages":[ToolMessage(content=messages[-1].content, tool_call_id=runtime.tool_call_id)]
    })

async def process_output_async(request: str, messages: list, runtime: ToolRuntime) -> Command:
    return Command(update={
        "messages":[ToolMessage(content=messages[-1].content, tool_call_id=runtime.tool_call_id)]
    })

# 使用
call_agent_tool = wrap_agent_as_tool(
    agent,
    post_output_hooks=(process_output_sync, process_output_async)
)
```

- 若未提供 `pre_input_hooks`，输入原样传递；
- 若未提供 `post_output_hooks`，默认返回 `response["messages"][-1].content`（即最后一条消息的文本内容）。

**注意**：当该 Agent（CompiledStateGraph）作为 `wrap_agent_as_tool` 的 agent 参数时，该 Agent 必须定义 name 属性。
