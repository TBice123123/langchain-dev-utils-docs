# API Reference

## Model Management

### register_model_provider

Registers a model provider for chat models.

```python
def register_model_provider(
    provider_name: str,
    chat_model: Union[Type[BaseChatModel], str],
    base_url: Optional[str] = None
) -> None
```

**Parameters**

| Parameter     | Type                            | Required | Description                                  |
| ------------- | ------------------------------- | -------- | -------------------------------------------- |
| provider_name | str                             | Yes      | Custom provider name                         |
| chat_model    | Union[Type[BaseChatModel], str] | Yes      | ChatModel class or supported provider string |
| base_url      | Optional[str]                   | No       | Provider's base URL                          |

**Examples**

```python
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1")
```

---

### batch_register_model_provider

Bulk registers model providers.

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider]
) -> None
```

**Parameters**

| Parameter | Type                    | Required | Description                     |
| --------- | ----------------------- | -------- | ------------------------------- |
| providers | List[ChatModelProvider] | Yes      | List of provider configurations |

**Examples**

```python
batch_register_model_provider([
    {"provider": "dashscope", "chat_model": ChatQwen},
    {"provider": "openrouter", "chat_model": "openai", "base_url": "https://openrouter.ai/api/v1"},
])
```

---

### load_chat_model

Loads a chat model from registered providers.

```python
def load_chat_model(
    model: str,
    model_provider: Optional[str] = None,
    **kwargs
) -> BaseChatModel
```

**Parameters**

| Parameter      | Type          | Required | Description                                                     |
| -------------- | ------------- | -------- | --------------------------------------------------------------- |
| model          | str           | Yes      | Model name in format `model_name` or `provider_name:model_name` |
| model_provider | Optional[str] | No       | Model provider name                                             |
| \*\*kwargs     | Any           | No       | Additional model parameters                                     |

**Returns**

| Type          | Description                |
| ------------- | -------------------------- |
| BaseChatModel | Loaded chat model instance |

**Examples**

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

**Parameters**

| Parameter        | Type                         | Required | Description                                         |
| ---------------- | ---------------------------- | -------- | --------------------------------------------------- |
| provider_name    | str                          | Yes      | Custom provider name                                |
| embeddings_model | Union[Type[Embeddings], str] | Yes      | Embeddings model class or supported provider string |
| base_url         | Optional[str]                | No       | Provider's base URL                                 |

**Examples**

```python
register_embeddings_provider("dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
```

---

### batch_register_embeddings_provider

Bulk registers embedding model providers.

```python
def batch_register_embeddings_provider(
    providers: list[EmbeddingProvider]
) -> None
```

**Parameters**

| Parameter | Type                    | Required | Description                     |
| --------- | ----------------------- | -------- | ------------------------------- |
| providers | List[EmbeddingProvider] | Yes      | List of provider configurations |

**Examples**

```python
batch_register_embeddings_provider([
    {"provider": "dashscope", "embeddings_model": "openai", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"},
    {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
])
```

---

### load_embeddings

Loads an embeddings model from registered providers.

```python
def load_embeddings(
    model: str,
    provider: Optional[str] = None,
    **kwargs
) -> Embeddings
```

**Parameters**

| Parameter  | Type          | Required | Description                                                     |
| ---------- | ------------- | -------- | --------------------------------------------------------------- |
| model      | str           | Yes      | Model name in format `model_name` or `provider_name:model_name` |
| provider   | Optional[str] | No       | Model provider name                                             |
| \*\*kwargs | Any           | No       | Additional model parameters                                     |

**Returns**

| Type       | Description                      |
| ---------- | -------------------------------- |
| Embeddings | Loaded embeddings model instance |

**Examples**

```python
embeddings = load_embeddings("dashscope:text-embedding-v4")
```

---

## Message Processing

### convert_reasoning_content_for_ai_message

Merges reasoning content into the content field of an AIMessage.

```python
def convert_reasoning_content_for_ai_message(
    model_response: AIMessage,
    think_tag: Tuple[str, str] = ("<think>", "</think>")
) -> AIMessage
```

**Parameters**

| Parameter      | Type            | Required | Description                                                                 |
| -------------- | --------------- | -------- | --------------------------------------------------------------------------- |
| model_response | AIMessage       | Yes      | AI message containing reasoning content                                     |
| think_tag      | Tuple[str, str] | No       | Start and end tags for reasoning content, default `("<think>", "</think>")` |

**Returns**

| Type      | Description                           |
| --------- | ------------------------------------- |
| AIMessage | Message with merged reasoning content |

**Examples**

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
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> Iterator[BaseMessageChunk]
```

**Parameters**

| Parameter      | Type                       | Required | Description                                                                 |
| -------------- | -------------------------- | -------- | --------------------------------------------------------------------------- |
| model_response | Iterator[BaseMessageChunk] | Yes      | Iterator of message chunks                                                  |
| think_tag      | Tuple[str, str]            | No       | Start and end tags for reasoning content, default `("<think>", "</think>")` |

**Returns**

| Type                       | Description              |
| -------------------------- | ------------------------ |
| Iterator[BaseMessageChunk] | Processed chunk iterator |

**Examples**

```python
for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

---

### aconvert_reasoning_content_for_chunk_iterator

Asynchronous version of `convert_reasoning_content_for_chunk_iterator`.

```python
async def aconvert_reasoning_content_for_chunk_iterator(
    model_response: AsyncIterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> AsyncIterator[BaseMessageChunk]
```

**Parameters**

| Parameter      | Type                            | Required | Description                                                                 |
| -------------- | ------------------------------- | -------- | --------------------------------------------------------------------------- |
| model_response | AsyncIterator[BaseMessageChunk] | Yes      | Async iterator of message chunks                                            |
| think_tag      | Tuple[str, str]                 | No       | Start and end tags for reasoning content, default `("<think>", "</think>")` |

**Returns**

| Type                            | Description                    |
| ------------------------------- | ------------------------------ |
| AsyncIterator[BaseMessageChunk] | Processed async chunk iterator |

**Examples**

```python
async for chunk in aconvert_reasoning_content_for_chunk_iterator(
    model.astream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

---

### merge_ai_message_chunk

Merges multiple AI message chunks into a single message.

```python
def merge_ai_message_chunk(chunks: Sequence[AIMessageChunk]) -> AIMessage
```

**Parameters**

| Parameter | Type                     | Required | Description                     |
| --------- | ------------------------ | -------- | ------------------------------- |
| chunks    | Sequence[AIMessageChunk] | Yes      | List of message chunks to merge |

**Returns**

| Type      | Description    |
| --------- | -------------- |
| AIMessage | Merged message |

**Examples**

```python
chunks = list(model.stream("Hello"))
merged = merge_ai_message_chunk(chunks)
```

---

### has_tool_calling

Checks if a message contains tool calls.

```python
def has_tool_calling(message: AIMessage) -> bool
```

**Parameters**

| Parameter | Type      | Required | Description      |
| --------- | --------- | -------- | ---------------- |
| message   | AIMessage | Yes      | Message to check |

**Returns**

| Type | Description                                          |
| ---- | ---------------------------------------------------- |
| bool | True if message contains tool calls, False otherwise |

**Examples**

```python
if has_tool_calling(response):
    # Handle tool calls
    pass
```

---

### parse_tool_calling

Parses tool calling parameters from a message.

```python
def parse_tool_calling(
    message: AIMessage,
    first_tool_call_only: bool = False
) -> Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]]
```

**Parameters**

| Parameter            | Type      | Required | Description                                               |
| -------------------- | --------- | -------- | --------------------------------------------------------- |
| message              | AIMessage | Yes      | Message to parse                                          |
| first_tool_call_only | bool      | No       | Whether to return only the first tool call, default False |

**Returns**

| Type                                                                | Description                                    |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]] | Tool call name and parameters, or list of them |

**Examples**

```python
# Get all tool calls
tool_calls = parse_tool_calling(response)

# Get only first tool call
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

**Parameters**

| Parameter | Type                                    | Required | Description                                   |
| --------- | --------------------------------------- | -------- | --------------------------------------------- |
| inputs    | List[Union[BaseMessage, Document, str]] | Yes      | List of items to format                       |
| separator | str                                     | No       | Separator string, default "-"                 |
| with_num  | bool                                    | No       | Whether to add number prefixes, default False |

**Returns**

| Type | Description      |
| ---- | ---------------- |
| str  | Formatted string |

**Examples**

```python
formatted = message_format(messages, separator="\n", with_num=True)
```

---

## Tool Enhancement

### human_in_the_loop

Decorator that adds "human-in-the-loop" approval capability to **synchronous tool functions**.

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters**

| Parameter | Type                            | Required | Description                                               |
| --------- | ------------------------------- | -------- | --------------------------------------------------------- |
| func      | Optional[Callable]              | No       | Synchronous function to decorate (decorator syntax sugar) |
| handler   | Optional[HumanInterruptHandler] | No       | Custom interrupt handler function                         |

**Returns**

| Type     | Description             |
| -------- | ----------------------- |
| BaseTool | Decorated tool instance |

**Examples**

```python
@human_in_the_loop
def get_current_time():
    """Get current time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
```

---

### human_in_the_loop_async

Decorator that adds "human-in-the-loop" approval capability to **asynchronous tool functions**.

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters**

| Parameter | Type                            | Required | Description                                                |
| --------- | ------------------------------- | -------- | ---------------------------------------------------------- |
| func      | Optional[Callable]              | No       | Asynchronous function to decorate (decorator syntax sugar) |
| handler   | Optional[HumanInterruptHandler] | No       | Custom interrupt handler function                          |

**Returns**

| Type     | Description                   |
| -------- | ----------------------------- |
| BaseTool | Decorated async tool instance |

**Examples**

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

**Parameters**

| Parameter   | Type          | Required | Description                                   |
| ----------- | ------------- | -------- | --------------------------------------------- |
| name        | Optional[str] | No       | Tool name                                     |
| description | Optional[str] | No       | Tool description                              |
| message_key | Optional[str] | No       | Key for updating messages, default "messages" |

**Returns**

| Type     | Description              |
| -------- | ------------------------ |
| BaseTool | Write plan tool instance |

**Examples**

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

**Parameters**

| Parameter   | Type          | Required | Description                                   |
| ----------- | ------------- | -------- | --------------------------------------------- |
| name        | Optional[str] | No       | Tool name                                     |
| description | Optional[str] | No       | Tool description                              |
| message_key | Optional[str] | No       | Key for updating messages, default "messages" |

**Returns**

| Type     | Description               |
| -------- | ------------------------- |
| BaseTool | Update plan tool instance |

**Examples**

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

**Parameters**

| Parameter   | Type          | Required | Description                                   |
| ----------- | ------------- | -------- | --------------------------------------------- |
| name        | Optional[str] | No       | Tool name                                     |
| description | Optional[str] | No       | Tool description                              |
| message_key | Optional[str] | No       | Key for updating messages, default "messages" |

**Returns**

| Type     | Description              |
| -------- | ------------------------ |
| BaseTool | Write note tool instance |

**Examples**

```python
write_note_tool = create_write_note_tool()
```

---

### create_ls_tool

Creates a tool for listing existing notes.

```python
def create_ls_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**Parameters**

| Parameter   | Type          | Required | Description      |
| ----------- | ------------- | -------- | ---------------- |
| name        | Optional[str] | No       | Tool name        |
| description | Optional[str] | No       | Tool description |

**Returns**

| Type     | Description              |
| -------- | ------------------------ |
| BaseTool | List notes tool instance |

**Examples**

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

**Parameters**

| Parameter   | Type          | Required | Description      |
| ----------- | ------------- | -------- | ---------------- |
| name        | Optional[str] | No       | Tool name        |
| description | Optional[str] | No       | Tool description |

**Returns**

| Type     | Description              |
| -------- | ------------------------ |
| BaseTool | Query note tool instance |

**Examples**

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

**Parameters**

| Parameter   | Type          | Required | Description                                   |
| ----------- | ------------- | -------- | --------------------------------------------- |
| name        | Optional[str] | No       | Tool name                                     |
| description | Optional[str] | No       | Tool description                              |
| message_key | Optional[str] | No       | Key for updating messages, default "messages" |

**Returns**

| Type     | Description               |
| -------- | ------------------------- |
| BaseTool | Update note tool instance |

**Examples**

```python
update_note_tool = create_update_note_tool()
```

---

## State Graph Orchestration

### sequential_pipeline

Combines multiple subgraphs with the same state in sequential manner.

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

**Parameters**

| Parameter      | Type                   | Required | Description                        |
| -------------- | ---------------------- | -------- | ---------------------------------- |
| sub_graphs     | list[SubGraph]         | Yes      | List of state graphs to combine    |
| state_schema   | type[StateT]           | Yes      | State schema for the final graph   |
| graph_name     | Optional[str]          | No       | Name of the final graph            |
| context_schema | type[ContextT] \| None | No       | Context schema for the final graph |
| input_schema   | type[InputT] \| None   | No       | Input schema for the final graph   |
| output_schema  | type[OutputT] \| None  | No       | Output schema for the final graph  |

**Returns**

| Type               | Description                    |
| ------------------ | ------------------------------ |
| CompiledStateGraph | Created sequential state graph |

**Examples**

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

Combines multiple subgraphs with the same state in parallel manner.

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

**Parameters**

| Parameter            | Type                                     | Required | Description                                                               |
| -------------------- | ---------------------------------------- | -------- | ------------------------------------------------------------------------- |
| sub_graphs           | list[SubGraph]                           | Yes      | List of state graphs to combine                                           |
| state_schema         | type[StateT]                             | Yes      | State schema for the final graph                                          |
| graph_name           | Optional[str]                            | No       | Name of the final graph                                                   |
| parallel_entry_graph | Optional[str]                            | No       | Parallel entry graph, default "**start**"                                 |
| branches_fn          | Optional[Callable[[StateT], list[Send]]] | No       | Parallel branch function, returns Send list to control parallel execution |
| context_schema       | type[ContextT] \| None                   | No       | Context schema for the final graph                                        |
| input_schema         | type[InputT] \| None                     | No       | Input schema for the final graph                                          |
| output_schema        | type[OutputT] \| None                    | No       | Output schema for the final graph                                         |

**Returns**

| Type               | Description                  |
| ------------------ | ---------------------------- |
| CompiledStateGraph | Created parallel state graph |

**Examples**

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

**Fields**

| Field          | Type           | Description           |
| -------------- | -------------- | --------------------- |
| tool_call_name | str            | Tool call name        |
| tool_call_args | Dict[str, Any] | Tool call arguments   |
| tool           | BaseTool       | Tool instance         |
| config         | RunnableConfig | Runtime configuration |

---

### HumanInterruptHandler

Type alias for interrupt handler functions.

```python
HumanInterruptHandler = Callable[[InterruptParams], Any]
```

---

### ChatModelProvider

Chat model provider configuration type.

```python
class ChatModelProvider(TypedDict):
    provider: str
    chat_model: Union[type[BaseChatModel], str]
    base_url: NotRequired[str]
```

**Fields**

| Field      | Type                            | Required | Description                |
| ---------- | ------------------------------- | -------- | -------------------------- |
| provider   | str                             | Yes      | Provider name              |
| chat_model | Union[type[BaseChatModel], str] | Yes      | Chat model class or string |
| base_url   | NotRequired[str]                | No       | Base URL                   |

---

### EmbeddingProvider

Embedding model provider configuration type.

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: Union[type[Embeddings], str]
    base_url: NotRequired[str]
```

**Fields**

| Field            | Type                         | Required | Description                      |
| ---------------- | ---------------------------- | -------- | -------------------------------- |
| provider         | str                          | Yes      | Provider name                    |
| embeddings_model | Union[type[Embeddings], str] | Yes      | Embeddings model class or string |
| base_url         | NotRequired[str]             | No       | Base URL                         |

---

### PlanStateMixin

Plan state mixin class.

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]

class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

**Fields**

| Field        | Type                                      | Description   |
| ------------ | ----------------------------------------- | ------------- |
| plan         | list[Plan]                                | List of plans |
| Plan.content | str                                       | Plan content  |
| Plan.status  | Literal["pending", "in_progress", "done"] | Plan status   |

---

### NoteStateMixin

Note state mixin class.

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

**Fields**

| Field | Type                                    | Description     |
| ----- | --------------------------------------- | --------------- |
| note  | Annotated[dict[str, str], note_reducer] | Note dictionary |
