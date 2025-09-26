# API Reference Documentation

This section provides complete documentation for all functions and classes in `langchain-dev-utils`.

## Model Management

### `register_model_provider`

Register a model provider for chat models.

**Function Signature:**

```python
def register_model_provider(
    provider_name: str,
    chat_model: Union[Type[BaseChatModel], str],
    base_url: Optional[str] = None
) -> None
```

**Parameters:**

- `provider_name` (str): Custom provider name
- `chat_model` (Union[Type[BaseChatModel], str]): ChatModel class or supported provider string
- `base_url` (Optional[str]): Provider's BaseURL

**Example:**

```python
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1")
```

---

### `batch_register_model_provider`

Batch register model providers.

**Function Signature:**

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider],
) -> None
```

**Parameters:**

- `providers` (List[ChatModelProvider]): List of providers, each containing `provider`, `chat_model`, and `base_url`

**Example:**

```python
batch_register_model_provider([
    {"provider": "dashscope", "chat_model": ChatQwen},
    {"provider": "openrouter", "chat_model": "openai", "base_url": "https://openrouter.ai/api/v1"},
])
```

---

### `load_chat_model`

Load a chat model from registered providers.

**Function Signature:**

```python
def load_chat_model(
    model: str,
    model_provider: Optional[str] = None,
    **kwargs
) -> BaseChatModel
```

**Parameters:**

- `model` (str): Model name in format `model_name` or `provider_name:model_name`
- `model_provider` (Optional[str]): Model provider name
- `**kwargs`: Additional model parameters

**Returns:**

- `BaseChatModel`: Loaded chat model instance

**Example:**

```python
model = load_chat_model("dashscope:qwen-flash")
```

---

### `register_embeddings_provider`

Register a provider for embedding models.

**Function Signature:**

```python
def register_embeddings_provider(
    provider_name: str,
    embeddings_model: Union[Type[Embeddings], str],
    base_url: Optional[str] = None
) -> None
```

**Parameters:**

- `provider_name` (str): Custom provider name
- `embeddings_model` (Union[Type[Embeddings], str]): Embeddings model class or supported provider string
- `base_url` (Optional[str]): Provider's BaseURL

**Example:**

```python
register_embeddings_provider("dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
```

---

### `batch_register_embeddings_provider`

Batch register embedding model providers.

**Function Signature:**

```python
def batch_register_embeddings_provider(
    providers: list[EmbeddingProvider]
) -> None
```

**Parameters:**

- `providers` (List[EmbeddingProvider]): List of providers, each containing `provider`, `embeddings_model`, and `base_url`

**Example:**

```python
batch_register_embeddings_provider([
    {"provider": "dashscope", "embeddings_model": "openai", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"},
    {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
])
```

---

### `load_embeddings`

Load an embeddings model from registered providers.

**Function Signature:**

```python
def load_embeddings(
    model: str,
    provider: Optional[str] = None,
    **kwargs
) -> Embeddings
```

**Parameters:**

- `model` (str): Model name in format `model_name` or `provider_name:model_name`
- `provider` (Optional[str]): Model provider name
- `**kwargs`: Additional model parameters

**Returns:**

- `Embeddings`: Loaded embeddings model instance

**Example:**

```python
embeddings = load_embeddings("dashscope:text-embedding-v4")
```

---

## Message Processing

### `convert_reasoning_content_for_ai_message`

Merge reasoning content into the content field of an AIMessage.

**Function Signature:**

```python
def convert_reasoning_content_for_ai_message(
    model_response: AIMessage,
    think_tag: Tuple[str, str] = ("<think>", "</think>")
) -> AIMessage
```

**Parameters:**

- `model_response` (AIMessage): AI message response
- `think_tag` (Tuple[str, str]): Start and end tags for reasoning content, default is `<think></think>`

**Returns:**

- `AIMessage`: Message with merged reasoning content

**Example:**

```python
response = convert_reasoning_content_for_ai_message(
    response, think_tag=("<start>", "<end>")
)
```

---

### `convert_reasoning_content_for_chunk_iterator`

Merge reasoning content for streaming message chunks.

**Function Signature:**

```python
def convert_reasoning_content_for_chunk_iterator(
    model_response: Iterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> Iterator[BaseMessageChunk]
```

**Parameters:**

- `model_response` (Iterator[BaseMessageChunk]): Iterator of message chunks
- `think_tag` (Tuple[str, str]): Start and end tags for reasoning content, default is `<think></think>`

**Returns:**

- `Iterator[BaseMessageChunk]`: Processed chunk iterator

**Example:**

```python
for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

---

### `aconvert_reasoning_content_for_chunk_iterator`

Async version of reasoning content conversion for streaming.

**Function Signature:**

```python
async def aconvert_reasoning_content_for_chunk_iterator(
    model_response: AsyncIterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> AsyncIterator[BaseMessageChunk]:
```

**Parameters:**

- `model_response` (AsyncIterator[BaseMessageChunk]): Async iterator of message chunks
- `think_tag` (Tuple[str, str]): Start and end tags for reasoning content, default is `<think></think>`

**Returns:**

- `AsyncIterator[BaseMessageChunk]`: Processed async chunk iterator

**Example:**

```python
async for chunk in aconvert_reasoning_content_for_chunk_iterator(
    model.astream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

---

### `merge_ai_message_chunk`

Merge multiple AI message chunks into a single message.

**Function Signature:**

```python
def merge_ai_message_chunk(chunks: Sequence[AIMessageChunk]) -> AIMessage
```

**Parameters:**

- `chunks` (Sequence[AIMessageChunk]): List of message chunks to merge

**Returns:**

- `AIMessage`: Merged message

**Example:**

```python
chunks = list(model.stream("Hello"))
merged = merge_ai_message_chunk(chunks)
```

---

### `has_tool_calling`

Check if a message contains tool calls.

**Function Signature:**

```python
def has_tool_calling(message: AIMessage) -> bool
```

**Parameters:**

- `message` (AIMessage): Message to check

**Returns:**

- `bool`: True if the message contains tool calls

**Example:**

```python
if has_tool_calling(response):
    # Handle tool calling
    pass
```

---

### `parse_tool_calling`

Parse tool calling arguments from a message.

**Function Signature:**

```python
def parse_tool_calling(
    message: AIMessage,
    first_tool_call_only: bool = False
) -> Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]
```

**Parameters:**

- `message` (AIMessage): Message to parse
- `first_tool_call_only` (bool): Whether to return only the first tool call

**Returns:**

- `Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]`: Tool call name and arguments

**Example:**

```python
name, args = parse_tool_calling(response, first_tool_call_only=True)
```

---

### `message_format`

Format messages, documents, or string lists into a single string.

**Function Signature:**

```python
def message_format(
    inputs: List[Union[BaseMessage, Document, str]],
    separator: str = "-",
    with_num: bool = False
) -> str
```

**Parameters:**

- `inputs` (List[Union[BaseMessage, Document, str]]): List of items to format
- `separator` (str): Separator string
- `with_num` (bool): Whether to add number prefixes

**Returns:**

- `str`: Formatted string

**Example:**

```python
formatted = message_format(messages, separator="\n", with_num=True)
```

---

## Tool Enhancement

### `human_in_the_loop`

Decorator to add "human-in-the-loop" review capability to **synchronous tool functions**. Triggers interruption before tool execution, waiting for human confirmation, editing, or response.

**Function Signature:**

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func` (Optional[Callable])  
  Function to decorate. **Do not manually pass - only for decorator syntax sugar.**

- `handler` (Optional[HumanInterruptHandler])  
  Custom interrupt handler function. Type is:
  ```python
  HumanInterruptHandler = Callable[[InterruptParams], Any]
  ```
  If not provided, uses default `default_handler` (supports `accept` / `edit` / `response`).

**Returns:**

- `BaseTool`: Decorated tool instance

---

### `human_in_the_loop_async`

Decorator to add "human-in-the-loop" review capability to **asynchronous tool functions**. Supports `await` calls.

**Function Signature:**

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func` (Optional[Callable])  
  Async function to decorate. **Do not manually pass.**

- `handler` (Optional[HumanInterruptHandler])  
  Custom interrupt handler function. Type is:
  ```python
  HumanInterruptHandler = Callable[[InterruptParams], Any]
  ```
  If not provided, uses default `default_handler_async` (supports `accept` / `edit` / `response`).

**Note**: Handler must be an async function.

**Returns:**

Same as `human_in_the_loop`, returns async-compatible `BaseTool` instance.

---

## Context Engineering

### `create_write_plan_tool`

Create a tool for writing plans.

**Function Signature:**

```python
def create_write_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description
- `message_key` (Optional[str]): Key for updating messages, uses default `messages` if not provided

**Returns:**

- `BaseTool`: Created tool instance

---

### `create_update_plan_tool`

Create a tool for updating plans.

**Function Signature:**

```python
def create_update_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description
- `message_key` (Optional[str]): Key for updating messages, uses default `messages` if not provided

**Returns:**

- `BaseTool`: Created tool instance

---

### `create_write_note_tool`

Create a tool for writing notes.

**Function Signature:**

```python
def create_write_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description
- `message_key` (Optional[str]): Key for updating messages, uses default `messages` if not provided

**Returns:**

- `BaseTool`: Created tool instance

---

### `create_ls_tool`

Create a tool for listing existing notes.

**Function Signature:**

```python
def create_ls_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description

**Returns:**

- `BaseTool`: Created tool instance

---

### `create_query_note_tool`

Create a tool for querying notes.

**Function Signature:**

```python
def create_query_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description

**Returns:**

- `BaseTool`: Created tool instance

---

### `create_update_note_tool`

Create a tool for updating notes.

**Function Signature:**

```python
def create_update_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description
- `message_key` (Optional[str]): Key for updating messages, uses default `messages` if not provided

**Returns:**

- `BaseTool`: Created tool instance

---

## State Graph Orchestration

### `sequential_pipeline`

Combine multiple subgraphs with the same state in sequential order.

**Function Signature:**

```python
def sequential_pipeline(
    sub_graphs: list[SubGraph],
    state_schema: type[StateT],
    graph_name: Optional[str] = None,
    context_schema: type[ContextT] | None = None,
    input_schema: type[InputT] | None = None,
    output_schema: type[OutputT] | None = None,
) -> CompiledStateGraph[StateT, ContextT, InputT, OutputT]:
```

**Parameters:**

- `sub_graphs` (list[SubGraph]): List of state graphs to combine
- `state_schema` (type[StateT]): State Schema for the final graph
- `graph_name` (Optional[str]): Name of the final graph
- `context_schema` (type[ContextT] | None): Context Schema for the final graph
- `input_schema` (type[InputT] | None): Input Schema for the final graph
- `output_schema` (type[OutputT] | None): Output Schema for the final graph

**Returns:**

- `CompiledStateGraph`: Created graph

---

### `parallel_pipeline`

Combine multiple subgraphs with the same state in parallel.

**Function Signature:**

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
) -> CompiledStateGraph[StateT, ContextT, InputT, OutputT]:
```

**Parameters:**

- `sub_graphs` (list[SubGraph]): List of state graphs to combine
- `state_schema` (type[StateT]): State Schema for the final graph
- `graph_name` (Optional[str]): Name of the final graph
- `parallel_entry_graph` (Optional[str]): Parallel entry graph (defaults to `__start__`, specified graph does not participate in parallel execution)
- `branches_fn` (Optional[Callable[[StateT], list[Send]]]): Parallel branch function, returns Send list to control parallel execution
- `context_schema` (type[ContextT] | None): Context Schema for the final graph
- `input_schema` (type[InputT] | None): Input Schema for the final graph
- `output_schema` (type[OutputT] | None): Output Schema for the final graph

**Returns:**

- `CompiledStateGraph`: Created graph

## Type Definitions

### `InterruptParams`

Parameter type passed to `handler` function, containing tool call context:

```python
class InterruptParams(TypedDict):
    tool_call_name: str
    tool_call_args: Dict[str, Any]
    tool: BaseTool
    config: RunnableConfig
```

### `HumanInterruptHandler`

Type alias for interrupt handler function:

```python
from typing import Callable, Any

HumanInterruptHandler = Callable[[InterruptParams], Any]
```

### `ChatModelProvider`

Parameter type for `batch_register_model_provider`:

```python
class ChatModelProvider(TypedDict):
    provider: str
    chat_model: Union[type[BaseChatModel], str]
    base_url: NotRequired[str]
```

### `EmbeddingProvider`

Parameter type for `batch_register_embeddings_provider`:

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: Union[type[Embeddings], str]
    base_url: NotRequired[str]
```

### `PlanStateMixin`

Plan state mixin class:

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]


class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

### `NoteStateMixin`

Note state mixin class:

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

## Next Steps

- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage
