# API 参考

## 模型管理

### register_model_provider

注册聊天模型的提供者。

```python
def register_model_provider(
    provider_name: str,
    chat_model: Union[Type[BaseChatModel], str],
    base_url: Optional[str] = None
) -> None
```

**参数说明：**

- `provider_name`：字符串类型，必填，自定义提供者名称
- `chat_model`：ChatModel 类或支持的提供者字符串类型，必填
- `base_url`：可选字符串类型，提供者的 BaseURL

**示例：**

```python
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai-compatible", base_url="https://openrouter.ai/api/v1")
```

---

### batch_register_model_provider

批量注册模型提供者。

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider]
) -> None
```

**参数说明：**

- `providers`：ChatModelProvider 列表类型，必填，提供者配置列表

**示例：**

```python
batch_register_model_provider([
    {"provider": "dashscope", "chat_model": ChatQwen},
    {"provider": "openrouter", "chat_model": "openai-compatible", "base_url": "https://openrouter.ai/api/v1"},
])
```

---

### load_chat_model

从已注册的提供者加载聊天模型。

```python
def load_chat_model(
    model: str,
    model_provider: Optional[str] = None,
    **kwargs
) -> BaseChatModel
```

**参数说明：**

- `model`：字符串类型，必填，模型名称，格式为 `model_name` 或 `provider_name:model_name`
- `model_provider`：可选字符串类型，模型提供者名称
- `**kwargs`：任意类型，可选，额外的模型参数

**返回值：** BaseChatModel 类型，加载的聊天模型实例

**示例：**

```python
model = load_chat_model("dashscope:qwen-flash")
```

---

### register_embeddings_provider

注册嵌入模型的提供者。

```python
def register_embeddings_provider(
    provider_name: str,
    embeddings_model: Union[Type[Embeddings], str],
    base_url: Optional[str] = None
) -> None
```

**参数说明：**

- `provider_name`：字符串类型，必填，自定义提供者名称
- `embeddings_model`：嵌入模型类或支持的提供者字符串类型，必填
- `base_url`：可选字符串类型，提供者的 BaseURL

**示例：**

```python
register_embeddings_provider("dashscope", "openai-compatible", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
```

---

### batch_register_embeddings_provider

批量注册嵌入模型提供者。

```python
def batch_register_embeddings_provider(
    providers: list[EmbeddingProvider]
) -> None
```

**参数说明：**

- `providers`：EmbeddingProvider 列表类型，必填，提供者配置列表

**示例：**

```python
batch_register_embeddings_provider([
    {"provider": "dashscope", "embeddings_model": "openai-compatible", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"},
    {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
])
```

---

### load_embeddings

从已注册的提供者加载嵌入模型。

```python
def load_embeddings(
    model: str,
    provider: Optional[str] = None,
    **kwargs
) -> Embeddings
```

**参数说明：**

- `model`：字符串类型，必填，模型名称，格式为 `model_name` 或 `provider_name:model_name`
- `provider`：可选字符串类型，模型提供者名称
- `**kwargs`：任意类型，可选，额外的模型参数

**返回值：** Embeddings 类型，加载的嵌入模型实例

**示例：**

```python
embeddings = load_embeddings("dashscope:text-embedding-v4")
```

---

## 消息处理

### convert_reasoning_content_for_ai_message

将 AIMessage 中的推理内容合并到内容字段中。

```python
def convert_reasoning_content_for_ai_message(
    model_response: AIMessage,
    think_tag: Tuple[str, str] = ("<think>", "</think>")
) -> AIMessage
```

**参数说明：**

- `model_response`：AIMessage 类型，必填，包含推理内容的 AI 消息
- `think_tag`：字符串元组类型，可选，推理内容的开始和结束标签，默认 `("<think>", "</think>")`

**返回值：** AIMessage 类型，合并推理内容后的消息

**示例：**

```python
response = convert_reasoning_content_for_ai_message(
    response, think_tag=("<start>", "<end>")
)
```

---

### convert_reasoning_content_for_chunk_iterator

为流式消息块合并推理内容。

```python
def convert_reasoning_content_for_chunk_iterator(
    model_response: Iterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> Iterator[BaseMessageChunk]
```

**参数说明：**

- `model_response`：BaseMessageChunk 迭代器类型，必填，消息块的迭代器
- `think_tag`：字符串元组类型，可选，推理内容的开始和结束标签，默认 `("<think>", "</think>")`

**返回值：** BaseMessageChunk 迭代器类型，处理后的消息块迭代器

**示例：**

```python
for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

---

### aconvert_reasoning_content_for_chunk_iterator

`convert_reasoning_content_for_chunk_iterator` 的异步版本。

```python
async def aconvert_reasoning_content_for_chunk_iterator(
    model_response: AsyncIterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> AsyncIterator[BaseMessageChunk]
```

**参数说明：**

- `model_response`：BaseMessageChunk 异步迭代器类型，必填，消息块的异步迭代器
- `think_tag`：字符串元组类型，可选，推理内容的开始和结束标签，默认 `("<think>", "</think>")`

**返回值：** BaseMessageChunk 异步迭代器类型，处理后的异步消息块迭代器

**示例：**

```python
async for chunk in aconvert_reasoning_content_for_chunk_iterator(
    model.astream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

---

### merge_ai_message_chunk

将多个 AI 消息块合并为单个消息。

```python
def merge_ai_message_chunk(
    chunks: Sequence[AIMessageChunk]
) -> AIMessage
```

**参数说明：**

- `chunks`：AIMessageChunk 序列类型，必填，待合并的消息块列表

**返回值：** AIMessage 类型，合并后的消息

**示例：**

```python
chunks = list(model.stream("Hello"))
merged = merge_ai_message_chunk(chunks)
```

---

### has_tool_calling

检查消息是否包含工具调用。

```python
def has_tool_calling(
    message: AIMessage
) -> bool
```

**参数说明：**

- `message`：AIMessage 类型，必填，待检查的消息

**返回值：** 布尔类型，如果消息包含工具调用返回 True，否则返回 False

**示例：**

```python
if has_tool_calling(response):
    # 处理工具调用
    pass
```

---

### parse_tool_calling

从消息中解析工具调用参数。

```python
def parse_tool_calling(
    message: AIMessage,
    first_tool_call_only: bool = False
) -> Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]]
```

**参数说明：**

- `message`：AIMessage 类型，必填，待解析的消息
- `first_tool_call_only`：布尔类型，可选，是否仅返回第一个工具调用，默认 False

**返回值：** 工具调用名称和参数的元组，或工具调用名称和参数元组的列表

**示例：**

```python
# 获取所有工具调用
tool_calls = parse_tool_calling(response)

# 仅获取第一个工具调用
name, args = parse_tool_calling(response, first_tool_call_only=True)
```

---

### message_format

将消息、文档或字符串列表格式化为单个字符串。

```python
def message_format(
    inputs: List[Union[BaseMessage, Document, str]],
    separator: str = "-",
    with_num: bool = False
) -> str
```

**参数说明：**

- `inputs`：BaseMessage、Document 或字符串的列表类型，必填，待格式化的项目列表
- `separator`：字符串类型，可选，分隔符字符串，默认 "-"
- `with_num`：布尔类型，可选，是否添加数字前缀，默认 False

**返回值：** 字符串类型，格式化后的字符串

**示例：**

```python
formatted = message_format(messages, separator="\n", with_num=True)
```

---

## 工具增强

### human_in_the_loop

为**同步工具函数**添加"人在回路"人工审核能力的装饰器。

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**参数说明：**

- `func`：可选可调用类型，待装饰的同步函数（装饰器语法糖）
- `handler`：可选 HumanInterruptHandler 类型，自定义中断处理函数

**返回值：** BaseTool 类型，装饰后的工具实例

**示例：**

```python
@human_in_the_loop
def get_current_time():
    """获取当前时间"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
```

---

### human_in_the_loop_async

为**异步工具函数**添加"人在回路"人工审核能力的装饰器。

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**参数说明：**

- `func`：可选可调用类型，待装饰的异步函数（装饰器语法糖）
- `handler`：可选 HumanInterruptHandler 类型，自定义中断处理函数

**返回值：** BaseTool 类型，装饰后的异步工具实例

**示例：**

```python
@human_in_the_loop_async
async def get_current_time():
    """获取当前时间"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
```

---

## 上下文工程工具

### create_write_plan_tool

创建写计划工具。

```python
def create_write_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**参数说明：**

- `name`：可选字符串类型，工具名称
- `description`：可选字符串类型，工具描述
- `message_key`：可选字符串类型，用于更新 messages 的键，默认 "messages"

**返回值：** BaseTool 类型，写计划工具实例

**示例：**

```python
write_plan_tool = create_write_plan_tool()
```

---

### create_update_plan_tool

创建更新计划工具。

```python
def create_update_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**参数说明：**

- `name`：可选字符串类型，工具名称
- `description`：可选字符串类型，工具描述
- `message_key`：可选字符串类型，用于更新 messages 的键，默认 "messages"

**返回值：** BaseTool 类型，更新计划工具实例

**示例：**

```python
update_plan_tool = create_update_plan_tool()
```

---

### create_write_note_tool

创建写笔记工具。

```python
def create_write_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**参数说明：**

- `name`：可选字符串类型，工具名称
- `description`：可选字符串类型，工具描述
- `message_key`：可选字符串类型，用于更新 messages 的键，默认 "messages"

**返回值：** BaseTool 类型，写笔记工具实例

**示例：**

```python
write_note_tool = create_write_note_tool()
```

---

### create_ls_tool

创建列出笔记工具。

```python
def create_ls_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**参数说明：**

- `name`：可选字符串类型，工具名称
- `description`：可选字符串类型，工具描述

**返回值：** BaseTool 类型，列出笔记工具实例

**示例：**

```python
ls_tool = create_ls_tool()
```

---

### create_query_note_tool

创建查询笔记工具。

```python
def create_query_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**参数说明：**

- `name`：可选字符串类型，工具名称
- `description`：可选字符串类型，工具描述

**返回值：** BaseTool 类型，查询笔记工具实例

**示例：**

```python
query_note_tool = create_query_note_tool()
```

---

### create_update_note_tool

创建更新笔记工具。

```python
def create_update_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**参数说明：**

- `name`：可选字符串类型，工具名称
- `description`：可选字符串类型，工具描述
- `message_key`：可选字符串类型，用于更新 messages 的键，默认 "messages"

**返回值：** BaseTool 类型，更新笔记工具实例

**示例：**

```python
update_note_tool = create_update_note_tool()
```

---

## 状态图编排

### sequential_pipeline

将多个状态相同的子图以串行方式组合。

```python
def sequential_pipeline(
    sub_graphs: list[SubGraph],
    state_schema: type[StateT],
    graph_name: Optional[str] = None,
    context_schema: type[ContextT] | None = None,
    input_schema: type[InputT] | None = None,
    output_schema: type[OutputT] | None = None,
) -> CompiledStateGraph[StateT, ContextT, InputT, OutputT]
```

**参数说明：**

- `sub_graphs`：SubGraph 列表类型，必填，要组合的状态图列表
- `state_schema`：StateT 类型，必填，最终生成图的 State Schema
- `graph_name`：可选字符串类型，最终生成图的名称
- `context_schema`：ContextT 类型或 None，可选，最终生成图的 Context Schema
- `input_schema`：InputT 类型或 None，可选，最终生成图的输入 Schema
- `output_schema`：OutputT 类型或 None，可选，最终生成图的输出 Schema

**返回值：** CompiledStateGraph 类型，创建的串行状态图

**示例：**

```python
sequential_pipeline(
    sub_graphs=[graph1, graph2],
    state_schema=State,
    graph_name="sequential_pipeline",
    context_schema=Context,
    input_schema=Input,
    output_schema=Output,
)
```

---

### parallel_pipeline

将多个状态相同的子图以并行方式组合。

```python
def parallel_pipeline(
    sub_graphs: list[SubGraph],
    state_schema: type[StateT],
    graph_name: Optional[str] = None,
    parallel_entry_graph: Optional[str] = None,
    branches_fn: Optional[Callable[[StateT], list[Send]]] = None,
    context_schema: type[ContextT] | None = None,
    input_schema: type[InputT] | None = None,
    output_schema: type[OutputT] | None = None,
) -> CompiledStateGraph[StateT, ContextT, InputT, OutputT]
```

**参数说明：**

- `sub_graphs`：SubGraph 列表类型，必填，要组合的状态图列表
- `state_schema`：StateT 类型，必填，最终生成图的 State Schema
- `graph_name`：可选字符串类型，最终生成图的名称
- `parallel_entry_graph`：可选字符串类型，并行入口图，默认 "**start**"
- `branches_fn`：可选可调用类型，并行分支函数，返回 Send 列表控制并行执行
- `context_schema`：ContextT 类型或 None，可选，最终生成图的 Context Schema
- `input_schema`：InputT 类型或 None，可选，最终生成图的输入 Schema
- `output_schema`：OutputT 类型或 None，可选，最终生成图的输出 Schema

**返回值：** CompiledStateGraph 类型，创建的并行状态图

**示例：**

```python
parallel_pipeline(
    sub_graphs=[graph1, graph2],
    state_schema=State,
    graph_name="parallel_pipeline",
    parallel_entry_graph="__start__",
    branches_fn=lambda state: [Send("graph1", state), Send("graph2", state)],
    context_schema=Context,
    input_schema=Input,
    output_schema=Output,
)
```

---

## 预构建 Agent

### create_agent

预构建智能体函数，提供与 langgraph 官方 `create_react_agent` 完全相同的功能，但拓展了模型选择。

```python
def create_agent(
    model: str,
    tools: Union[Sequence[Union[BaseTool, Callable, dict[str, Any]]], ToolNode],
    *,
    prompt: Optional[Prompt] = None,
    response_format: Optional[
        Union[StructuredResponseSchema, tuple[str, StructuredResponseSchema]]
    ] = None,
    pre_model_hook: Optional[RunnableLike] = None,
    post_model_hook: Optional[RunnableLike] = None,
    state_schema: Optional[StateSchemaType] = None,
    context_schema: Optional[Type[Any]] = None,
    checkpointer: Optional[Checkpointer] = None,
    store: Optional[BaseStore] = None,
    interrupt_before: Optional[list[str]] = None,
    interrupt_after: Optional[list[str]] = None,
    debug: bool = False,
    version: Literal["v1", "v2"] = "v2",
    name: Optional[str] = None,
    **deprecated_kwargs: Any,
) -> CompiledStateGraph
```

**参数说明：**

- `model`：字符串类型，必填，可由 `load_chat_model` 加载的模型标识符字符串。可指定为 "provider:model-name" 格式
- `tools`：BaseTool、Callable 或字典序列，或 ToolNode 类型，必填，智能体可用的工具列表
- `prompt`：可选 Prompt 类型，智能体的自定义提示词
- `response_format`：可选 StructuredResponseSchema 或字符串与 StructuredResponseSchema 的元组类型，响应格式规范
- `pre_model_hook`：可选 RunnableLike 类型，模型推理前执行的可运行对象
- `post_model_hook`：可选 RunnableLike 类型，模型推理后执行的可运行对象
- `state_schema`：可选 StateSchemaType 类型，智能体的状态模式
- `context_schema`：可选任意类型，智能体的上下文模式
- `checkpointer`：可选 Checkpointer 类型，状态持久化的检查点
- `store`：可选 BaseStore 类型，数据持久化的存储
- `interrupt_before`：可选字符串列表类型，执行前要中断的节点
- `interrupt_after`：可选字符串列表类型，执行后要中断的节点
- `debug`：布尔类型，可选，启用调试模式，默认为 False
- `version`：字面量 "v1" 或 "v2" 类型，可选，智能体版本，默认为 "v2"
- `name`：可选字符串类型，智能体名称
- `deprecated_kwargs`：任意类型，可选，用于向后兼容的已弃用参数

**返回值：** CompiledStateGraph 类型，创建的智能体图

**注意：** 此函数提供与 `langgraph` 官方 `create_react_agent` 完全相同的功能，但拓展了模型选择。主要区别在于 `model` 参数必须是可由 `load_chat_model` 函数加载的字符串，允许使用注册的模型提供者进行更灵活的模型选择。

**示例：**

```python
agent = create_agent(model="moonshot:kimi-k2-0905-preview", tools=[get_current_time])
```

---

## 类型定义

### InterruptParams

传递给中断处理函数的参数类型。

```python
class InterruptParams(TypedDict):
    tool_call_name: str
    tool_call_args: Dict[str, Any]
    tool: BaseTool
    config: RunnableConfig
```

**字段说明：**

- `tool_call_name`：字符串类型，工具调用名称
- `tool_call_args`：字符串到任意值的字典类型，工具调用参数
- `tool`：BaseTool 类型，工具实例
- `config`：RunnableConfig 类型，运行配置

---

### HumanInterruptHandler

中断处理器函数的类型别名。

```python
HumanInterruptHandler = Callable[[InterruptParams], Any]
```

---

### ChatModelProvider

聊天模型提供者配置类型。

```python
class ChatModelProvider(TypedDict):
    provider: str
    chat_model: Union[type[BaseChatModel], str]
    base_url: NotRequired[str]
```

**字段说明：**

- `provider`：字符串类型，必填，提供者名称
- `chat_model`：BaseChatModel 类型或字符串类型，必填，聊天模型类或字符串
- `base_url`：非必需字符串类型，基础 URL

---

### EmbeddingProvider

嵌入模型提供者配置类型。

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: Union[type[Embeddings], str]
    base_url: NotRequired[str]
```

**字段说明：**

- `provider`：字符串类型，必填，提供者名称
- `embeddings_model`：Embeddings 类型或字符串类型，必填，嵌入模型类或字符串
- `base_url`：非必需字符串类型，基础 URL

---

### PlanStateMixin

计划状态混入类。

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]

class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

**字段说明：**

- `plan`：Plan 列表类型，计划列表
- `Plan.content`：字符串类型，计划内容
- `Plan.status`：字面量 "pending"、"in_progress" 或 "done" 类型，计划状态

---

### NoteStateMixin

笔记状态混入类。

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

**字段说明：**

- `note`：注解字典类型，键和值均为字符串，笔记字典
