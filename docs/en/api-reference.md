# API Reference

## Model Management

### register_model_provider

Registers a provider for chat models.

```python
def register_model_provider(
    provider_name: str,
    chat_model: Union[Type[BaseChatModel], str],
    base_url: Optional[str] = None
) -> None
```

**Parameters:**

- `provider_name`: Required `str`, custom provider name.
- `chat_model`: Required `BaseChatModel` class or supported provider string.
- `base_url`: Optional `str`, the provider's base URL.

**Example:**

```python
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1")
```

---

### batch_register_model_provider

Registers multiple model providers in batch.

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider]
) -> None
```

**Parameters:**

- `providers`: Required `list[ChatModelProvider]`, list of provider configurations.

**Example:**

```python
batch_register_model_provider([
    {"provider": "dashscope", "chat_model": ChatQwen},
    {"provider": "openrouter", "chat_model": "openai", "base_url": "https://openrouter.ai/api/v1"},
])
```

---

### load_chat_model

Loads a chat model from a registered provider.

```python
def load_chat_model(
    model: str,
    model_provider: Optional[str] = None,
    enable_reasoning_parse: bool = False,
    **kwargs
) -> BaseChatModel
```

**Parameters:**

- `model`: Required `str`, model name in format `model_name` or `provider_name:model_name`.
- `model_provider`: Optional `str`, name of the model provider.
- `enable_reasoning_parse`: Optional `bool`, whether to enable chain-of-thought (`reasoning_content`) output. Default: `False`.
- `**kwargs`: Optional additional model parameters.

**Returns:** Instance of `BaseChatModel`.

**Example:**

```python
model = load_chat_model("dashscope:qwen-flash")
```

---

### register_embeddings_provider

Registers a provider for embedding models.

```python
def register_embeddings_provider(
    provider_name: str,
    embeddings_model: Union[Type[Embeddings], str],
    base_url: Optional[str] = None
) -> None
```

**Parameters:**

- `provider_name`: Required `str`, custom provider name.
- `embeddings_model`: Required `Embeddings` class or supported provider string.
- `base_url`: Optional `str`, the provider's base URL.

**Example:**

```python
register_embeddings_provider("dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
```

---

### batch_register_embeddings_provider

Registers multiple embedding model providers in batch.

```python
def batch_register_embeddings_provider(
    providers: list[EmbeddingProvider]
) -> None
```

**Parameters:**

- `providers`: Required `list[EmbeddingProvider]`, list of provider configurations.

**Example:**

```python
batch_register_embeddings_provider([
    {"provider": "dashscope", "embeddings_model": "openai", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"},
    {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
])
```

---

### load_embeddings

Loads an embedding model from a registered provider.

```python
def load_embeddings(
    model: str,
    provider: Optional[str] = None,
    **kwargs
) -> Embeddings
```

**Parameters:**

- `model`: Required `str`, model name in format `model_name` or `provider_name:model_name`.
- `provider`: Optional `str`, name of the model provider.
- `**kwargs`: Optional additional model parameters.

**Returns:** Instance of `Embeddings`.

**Example:**

```python
embeddings = load_embeddings("dashscope:text-embedding-v4")
```

---

## Message Processing

### convert_reasoning_content_for_ai_message

Merges reasoning content from an `AIMessage` into its content field.

```python
def convert_reasoning_content_for_ai_message(
    model_response: AIMessage,
    think_tag: Tuple[str, str] = ("\<think\>", "\</think\>")
) -> AIMessage
```

**Parameters:**

- `model_response`: Required `AIMessage`, AI message containing reasoning content.
- `think_tag`: Optional `Tuple[str, str]`, start and end tags for reasoning content. Default: `("<think>", "</think>")`.

**Returns:** `AIMessage` with merged reasoning content.

**Example:**

```python
response = convert_reasoning_content_for_ai_message(
    response, think_tag=("<start>", "<end>")
)
```

---

### convert_reasoning_content_for_chunk_iterator

Merges reasoning content for streaming message chunks.

```python
def convert_reasoning_content_for_chunk_iterator(
    model_response: Iterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("\<think\>", "\</think\>"),
) -> Iterator[BaseMessageChunk]
```

**Parameters:**

- `model_response`: Required `Iterator[BaseMessageChunk]`, iterator of message chunks.
- `think_tag`: Optional `Tuple[str, str]`, start and end tags for reasoning content. Default: `("<think>", "</think>")`.

**Returns:** Iterator of processed message chunks.

**Example:**

```python
for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("Hello"), think_tag=("\<think\>", "\</think\>")
):
    print(chunk.content, end="", flush=True)
```

---

### aconvert_reasoning_content_for_chunk_iterator

Asynchronous version of `convert_reasoning_content_for_chunk_iterator`.

```python
async def aconvert_reasoning_content_for_chunk_iterator(
    model_response: AsyncIterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("\<think\>", "\</think\>"),
) -> AsyncIterator[BaseMessageChunk]
```

**Parameters:**

- `model_response`: Required `AsyncIterator[BaseMessageChunk]`, async iterator of message chunks.
- `think_tag`: Optional `Tuple[str, str]`, start and end tags for reasoning content. Default: `("<think>", "</think>")`.

**Returns:** Async iterator of processed message chunks.

**Example:**

```python
async for chunk in aconvert_reasoning_content_for_chunk_iterator(
    model.astream("Hello"), think_tag=("\<think\>", "\</think\>")
):
    print(chunk.content, end="", flush=True)
```

---

### merge_ai_message_chunk

Merges multiple AI message chunks into a single message.

```python
def merge_ai_message_chunk(
    chunks: Sequence[AIMessageChunk]
) -> AIMessage
```

**Parameters:**

- `chunks`: Required `Sequence[AIMessageChunk]`, list of message chunks to merge.

**Returns:** Merged `AIMessage`.

**Example:**

```python
chunks = list(model.stream("Hello"))
merged = merge_ai_message_chunk(chunks)
```

---

### has_tool_calling

Checks if a message contains tool calls.

```python
def has_tool_calling(
    message: AIMessage
) -> bool
```

**Parameters:**

- `message`: Required `AIMessage`, message to inspect.

**Returns:** `True` if the message contains tool calls, otherwise `False`.

**Example:**

```python
if has_tool_calling(response):
    # Handle tool calls
    pass
```

---

### parse_tool_calling

Parses tool call arguments from a message.

```python
def parse_tool_calling(
    message: AIMessage,
    first_tool_call_only: bool = False
) -> Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]]
```

**Parameters:**

- `message`: Required `AIMessage`, message to parse.
- `first_tool_call_only`: Optional `bool`, whether to return only the first tool call. Default: `False`.

**Returns:** Tuple of tool name and arguments, or a list of such tuples.

**Example:**

```python
# Get all tool calls
tool_calls = parse_tool_calling(response)

# Get only the first tool call
name, args = parse_tool_calling(response, first_tool_call_only=True)
```

---

### message_format

Formats a list of messages, documents, or strings into a single string.

```python
def message_format(
    inputs: List[Union[BaseMessage, Document, str]],
    separator: str = "-",
    with_num: bool = False
) -> str
```

**Parameters:**

- `inputs`: Required `List[Union[BaseMessage, Document, str]]`, list of items to format.
- `separator`: Optional `str`, separator string. Default: `"-"`.
- `with_num`: Optional `bool`, whether to add numeric prefixes. Default: `False`.

**Returns:** Formatted string.

**Example:**

```python
formatted = message_format(messages, separator="\n", with_num=True)
```

---

## Tool Augmentation

### human_in_the_loop

Decorator that adds human-in-the-loop review capability to **synchronous tool functions**.

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func`: Optional callable, the synchronous function to decorate (syntactic sugar).
- `handler`: Optional `HumanInterruptHandler`, custom interrupt handler.

**Returns:** Decorated `BaseTool` instance.

**Example:**

```python
@human_in_the_loop
def get_current_time():
    """Get current time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
```

---

### human_in_the_loop_async

Decorator that adds human-in-the-loop review capability to **asynchronous tool functions**.

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func`: Optional callable, the asynchronous function to decorate (syntactic sugar).
- `handler`: Optional `HumanInterruptHandler`, custom interrupt handler.

**Returns:** Decorated async `BaseTool` instance.

**Example:**

```python
@human_in_the_loop_async
async def get_current_time():
    """Get current time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
```

---

## Context Engineering Tools

### create_write_plan_tool

Creates a tool for writing plans.

```python
def create_write_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional `str`, tool name.
- `description`: Optional `str`, tool description.
- `message_key`: Optional `str`, key used to update messages. Default: `"messages"`.

**Returns:** Instance of `BaseTool`.

**Example:**

```python
write_plan_tool = create_write_plan_tool()
```

---

### create_update_plan_tool

Creates a tool for updating plans.

```python
def create_update_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional `str`, tool name.
- `description`: Optional `str`, tool description.
- `message_key`: Optional `str`, key used to update messages. Default: `"messages"`.

**Returns:** Instance of `BaseTool`.

**Example:**

```python
update_plan_tool = create_update_plan_tool()
```

---

### create_write_note_tool

Creates a tool for writing notes.

```python
def create_write_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional `str`, tool name.
- `description`: Optional `str`, tool description.
- `message_key`: Optional `str`, key used to update messages. Default: `"messages"`.

**Returns:** Instance of `BaseTool`.

**Example:**

```python
write_note_tool = create_write_note_tool()
```

---

### create_ls_tool

Creates a tool for listing notes.

```python
def create_ls_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional `str`, tool name.
- `description`: Optional `str`, tool description.

**Returns:** Instance of `BaseTool`.

**Example:**

```python
ls_tool = create_ls_tool()
```

---

### create_query_note_tool

Creates a tool for querying notes.

```python
def create_query_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional `str`, tool name.
- `description`: Optional `str`, tool description.

**Returns:** Instance of `BaseTool`.

**Example:**

```python
query_note_tool = create_query_note_tool()
```

---

### create_update_note_tool

Creates a tool for updating notes.

```python
def create_update_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional `str`, tool name.
- `description`: Optional `str`, tool description.
- `message_key`: Optional `str`, key used to update messages. Default: `"messages"`.

**Returns:** Instance of `BaseTool`.

**Example:**

```python
update_note_tool = create_update_note_tool()
```

---

## State Graph Orchestration

### sequential_pipeline

Combines multiple subgraphs with the same state schema sequentially.

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

**Parameters:**

- `sub_graphs`: Required `list[SubGraph]`, list of subgraphs to combine.
- `state_schema`: Required `type[StateT]`, state schema of the resulting graph.
- `graph_name`: Optional `str`, name of the resulting graph.
- `context_schema`: Optional `type[ContextT]`, context schema of the resulting graph.
- `input_schema`: Optional `type[InputT]`, input schema of the resulting graph.
- `output_schema`: Optional `type[OutputT]`, output schema of the resulting graph.

**Returns:** `CompiledStateGraph`.

**Example:**

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

Combines multiple subgraphs with the same state schema in parallel.

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

**Parameters:**

- `sub_graphs`: Required `list[SubGraph]`, list of subgraphs to combine.
- `state_schema`: Required `type[StateT]`, state schema of the resulting graph.
- `graph_name`: Optional `str`, name of the resulting graph.
- `parallel_entry_graph`: Optional `str`, entry point for parallel execution. Default: `"__start__"`.
- `branches_fn`: Optional `Callable`, function returning a list of `Send` objects to control parallel execution.
- `context_schema`: Optional `type[ContextT]`, context schema of the resulting graph.
- `input_schema`: Optional `type[InputT]`, input schema of the resulting graph.
- `output_schema`: Optional `type[OutputT]`, output schema of the resulting graph.

**Returns:** `CompiledStateGraph`.

**Example:**

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

## Prebuilt Agents

### create_agent

Prebuilt agent function offering the same functionality as LangGraph’s official `create_react_agent`, but with extended model selection support.

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

**Parameters:**

- `model`: Required `str`, model identifier loadable via `load_chat_model`. Can be in `"provider:model-name"` format.
- `tools`: Required `Sequence[BaseTool | Callable | dict]` or `ToolNode`, list of tools available to the agent.
- `prompt`: Optional `Prompt`, custom prompt for the agent.
- `response_format`: Optional `StructuredResponseSchema` or tuple, defines structured output format.
- `pre_model_hook`: Optional `RunnableLike`, runnable executed before model inference.
- `post_model_hook`: Optional `RunnableLike`, runnable executed after model inference.
- `state_schema`: Optional `StateSchemaType`, agent state schema.
- `context_schema`: Optional `Type[Any]`, agent context schema.
- `checkpointer`: Optional `Checkpointer`, for state persistence.
- `store`: Optional `BaseStore`, for data persistence.
- `interrupt_before`: Optional `list[str]`, nodes to interrupt before execution.
- `interrupt_after`: Optional `list[str]`, nodes to interrupt after execution.
- `debug`: Optional `bool`, enable debug mode. Default: `False`.
- `version`: Optional `Literal["v1", "v2"]`, agent version. Default: `"v2"`.
- `name`: Optional `str`, agent name.
- `deprecated_kwargs`: Optional, for backward compatibility.

**Returns:** `CompiledStateGraph`.

**Note:** This function provides identical functionality to LangGraph’s `create_react_agent`, but extends model selection flexibility via the `load_chat_model` system.

**Example:**

```python
agent = create_agent(model="moonshot:kimi-k2-0905-preview", tools=[get_current_time])
```

---

## Type Definitions

### InterruptParams

Parameter type passed to interrupt handler functions.

```python
class InterruptParams(TypedDict):
    tool_call_name: str
    tool_call_args: Dict[str, Any]
    tool: BaseTool
    config: RunnableConfig
```

**Fields:**

- `tool_call_name`: `str`, name of the tool call.
- `tool_call_args`: `Dict[str, Any]`, arguments of the tool call.
- `tool`: `BaseTool`, tool instance.
- `config`: `RunnableConfig`, runtime configuration.

---

### HumanInterruptHandler

Type alias for interrupt handler functions.

```python
HumanInterruptHandler = Callable[[InterruptParams], Any]
```

---

### ChatModelProvider

Configuration type for chat model providers.

```python
class ChatModelProvider(TypedDict):
    provider: str
    chat_model: Union[type[BaseChatModel], str]
    base_url: NotRequired[str]
```

**Fields:**

- `provider`: Required `str`, provider name.
- `chat_model`: Required `BaseChatModel` class or `str`.
- `base_url`: Optional `str`, base URL.

---

### EmbeddingProvider

Configuration type for embedding model providers.

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: Union[type[Embeddings], str]
    base_url: NotRequired[str]
```

**Fields:**

- `provider`: Required `str`, provider name.
- `embeddings_model`: Required `Embeddings` class or `str`.
- `base_url`: Optional `str`, base URL.

---

### PlanStateMixin

Mixin class for plan-related state.

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]

class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

**Fields:**

- `plan`: `list[Plan]`, list of plans.
- `Plan.content`: `str`, plan content.
- `Plan.status`: `Literal["pending", "in_progress", "done"]`, plan status.

---

### NoteStateMixin

Mixin class for note-related state.

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

**Fields:**

- `note`: Annotated `dict[str, str]`, dictionary of notes with string keys and values.
