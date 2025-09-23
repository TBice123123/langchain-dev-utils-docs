# API Reference

This section provides complete documentation for all functions and classes in LangChain Dev Utils.

## Model Management

### `register_model_provider`

Register a model provider for chat models.

**Function signature:**

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
- `base_url` (Optional[str]): Base URL for the provider

**Examples:**

```python
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1")
```

### `batch_register_model_provider`

Batch register model providers.

**Function signature:**

```python
def batch_register_model_provider(
     providers: list[ChatModelProvider],
) -> None
```

**Parameters:**

- `providers` (List[ChatModelProvider]): List of providers, each containing `provider`, `chat_model`, and `base_url`.

**Examples:**

```python
batch_register_model_provider([
    {"provider": "dashscope", "chat_model": ChatQwen},
    {"provider": "openrouter", "chat_model": "openai", "base_url": "https://openrouter.ai/api/v1  "},
])
```

### `load_chat_model`

Load a chat model from a registered provider.

**Function signature:**

```python
def load_chat_model(
    model: str,
    model_provider: Optional[str] = None,
    **kwargs
) -> BaseChatModel
```

**Parameters:**

- `model` (str): Model name, format as `model_name` or `provider_name:model_name`
- `model_provider` (Optional[str]): Model provider name
- `**kwargs`: Additional model parameters

**Return value:**

- `BaseChatModel`: Loaded chat model instance

**Examples:**

```python
model = load_chat_model("dashscope:qwen-flash")
```

### `register_embeddings_provider`

Register a provider for embedding models.

**Function signature:**

```python
def register_embeddings_provider(
    provider_name: str,
    embeddings_model: Union[Type[Embeddings], str],
    base_url: Optional[str] = None
) -> None
```

**Parameters:**

- `provider_name` (str): Custom provider name
- `embeddings_model` (Union[Type[Embeddings], str]): Embedding model class or supported provider string
- `base_url` (Optional[str]): Base URL for the provider

**Examples:**

```python
register_embeddings_provider("dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1   ")
```

### `batch_register_embeddings_provider`

Batch register embedding model providers.
**Function signature:**

```python
def batch_register_embeddings_provider(
   providers: list[EmbeddingProvider]
)
-> None
```

**Parameters:**

- `providers` (List[EmbeddingProvider]): List of providers, each containing `provider`, `embeddings_model`, and `base_url`.

**Examples:**

```python
batch_register_embeddings_provider([
    {"provider": "dashscope", "embeddings_model": "openai", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1  "},
    {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
])
```

### `load_embeddings`

Load an embedding model from a registered provider.

**Function signature:**

```python
def load_embeddings(
    model: str,
    provider: Optional[str] = None,
    **kwargs
) -> Embeddings
```

**Parameters:**

- `model` (str): Model name, format as `model_name` or `provider_name:model_name`
- `provider` (Optional[str]): Model provider name
- `**kwargs`: Additional model parameters

**Return value:**

- `Embeddings`: Loaded embedding model instance

**Examples:**

```python
embeddings = load_embeddings("dashscope:text-embedding-v4")
```

## Message Processing

### `convert_reasoning_content_for_ai_message`

Merge reasoning content in AIMessage into the content field.

**Function signature:**

```python
def convert_reasoning_content_for_ai_message(
    model_response: AIMessage,
    think_tag: Tuple[str, str] = ("<think>", "</think>")
) -> AIMessage
```

**Parameters:**

- `model_response` (AIMessage): AI message response
- `think_tag` (Tuple[str, str]): Start and end tags for reasoning content, default is <think></think>

**Return value:**

- `AIMessage`: Message with merged reasoning content

**Examples:**

```python
response = convert_reasoning_content_for_ai_message(
    response, think_tag=("<start>", "<end>")
)
```

### `convert_reasoning_content_for_chunk_iterator`

Merge reasoning content for streaming message chunks.

**Function signature:**

```python
def convert_reasoning_content_for_chunk_iterator(
    model_response: Iterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> Iterator[BaseMessageChunk]
```

**Parameters:**

- `model_response` (Iterator[BaseMessageChunk]): Iterator of message chunks
- `think_tag` (Tuple[str, str]): Start and end tags for reasoning content, default is <think></think>

**Return value:**

- `Iterator[BaseMessageChunk]`: Processed chunk iterator

**Examples:**

```python
for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

### `aconvert_reasoning_content_for_chunk_iterator`

Asynchronous version of reasoning content conversion for streaming.

**Function signature:**

```python
async def aconvert_reasoning_content_for_chunk_iterator(
    model_response: AsyncIterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> AsyncIterator[BaseMessageChunk]:
```

**Parameters:**

- `model_response` (AsyncIterator[BaseMessageChunk]): Async iterator of message chunks
- `think_tag` (Tuple[str, str]): Start and end tags for reasoning content, default is <think></think>

**Return value:**

- `AsyncIterator[BaseMessageChunk]`: Processed async chunk iterator

**Examples:**

```python
async for chunk in aconvert_reasoning_content_for_chunk_iterator(
    model.astream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

### `merge_ai_message_chunk`

Merge multiple AI message chunks into a single message.

**Function signature:**

```python
def merge_ai_message_chunk(chunks: Sequence[AIMessageChunk]) -> AIMessage
```

**Parameters:**

- `chunks` (Sequence[AIMessageChunk]): List of message chunks to merge

**Return value:**

- `AIMessage`: Merged message

**Examples:**

```python
chunks = list(model.stream("Hello"))
merged = merge_ai_message_chunk(chunks)
```

### `has_tool_calling`

Check if a message contains tool calls.

**Function signature:**

```python
def has_tool_calling(message: AIMessage) -> bool
```

**Parameters:**

- `message` (AIMessage): Message to check

**Return value:**

- `bool`: Returns True if the message contains tool calls

**Examples:**

```python
if has_tool_calling(response):
    # Handle tool call
    pass
```

### `parse_tool_calling`

Parse tool call arguments from a message.

**Function signature:**

```python
def parse_tool_calling(
    message: AIMessage,
    first_tool_call_only: bool = False
) -> Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]]
```

**Parameters:**

- `message` (AIMessage): Message to parse
- `first_tool_call_only` (bool): Whether to return only the first tool call

**Return value:**

- `Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]]`: Tool call name and arguments

**Examples:**

```python
name, args = parse_tool_calling(response, first_tool_call_only=True)
```

### `message_format`

Format messages, documents, or string lists into a single string.

**Function signature:**

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
- `with_num` (bool): Whether to add numeric prefix

**Return value:**

- `str`: Formatted string

**Examples:**

```python
formatted = message_format(messages, separator="\n", with_num=True)
```

## Tool Enhancement

### `human_in_the_loop`

Decorator that adds "human-in-the-loop" manual review capability to **synchronous tool functions**. Triggers an interrupt before tool execution, waiting for human confirmation, editing, or response.

**Function signature:**

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func` (Optional[Callable])  
  The function to be decorated. **Do not pass manually — used only for decorator syntax sugar.**

- `handler` (Optional[HumanInterruptHandler])  
  Custom interrupt handling function. Type is:
  ```python
  HumanInterruptHandler = Callable[[InterruptParams], Any]
  ```
  If not provided, uses default `default_handler` (supports `accept` / `edit` / `response`).

**Return value:**

Returns a `BaseTool` instance

### `human_in_the_loop_async`

Decorator that adds "human-in-the-loop" manual review capability to **asynchronous tool functions**. Supports `await` calls.

**Function signature:**

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func` (Optional[Callable])  
  The async function to be decorated. **Do not pass manually.**

- `handler` (Optional[HumanInterruptHandler])  
  Custom interrupt handling function. Type is:
  ```python
  HumanInterruptHandler = Callable[[InterruptParams], Any]
  ```
  If not provided, uses default `default_handler_async` (supports `accept` / `edit` / `response`).

**Note**: Although the handler must be an async function.

**Return value:**

Same as `human_in_the_loop`, returns an async-compatible `BaseTool` instance.

## Context Engineering

### `create_write_plan_tool`

Creates a tool for writing plans.

**Function Signature:**

```python
def create_write_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Name of the tool
- `description` (Optional[str]): Description of the tool
- `message_key` (Optional[str]): Key for updating messages. Defaults to `messages` if not provided.

**Returns:**

- `BaseTool`: The created tool instance

---

### `create_update_plan_tool`

Creates a tool for updating plans.

**Function Signature:**

```python
def create_update_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Name of the tool
- `description` (Optional[str]): Description of the tool
- `message_key` (Optional[str]): Key for updating messages. Defaults to `messages` if not provided.

**Returns:**

- `BaseTool`: The created tool instance

---

### `create_write_note_tool`

Creates a tool for writing notes.

**Function Signature:**

```python
def create_write_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Name of the tool
- `description` (Optional[str]): Description of the tool
- `message_key` (Optional[str]): Key for updating messages. Defaults to `messages` if not provided.

**Returns:**

- `BaseTool`: The created tool instance

---

### `create_ls_tool`

Creates a tool for listing notes.

**Function Signature:**

```python
def create_ls_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Name of the tool
- `description` (Optional[str]): Description of the tool

**Returns:**

- `BaseTool`: The created tool instance

---

### `create_query_note_tool`

Creates a tool for querying notes.

**Function Signature:**

```python
def create_query_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `name` (Optional[str]): Name of the tool
- `description` (Optional[str]): Description of the tool

**Returns:**

- `BaseTool`: The created tool instance

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

- `name` (Optional[str]): Name of the tool
- `description` (Optional[str]): Description of the tool
- `message_key` (Optional[str]): Key for updating messages. Defaults to `messages` if not provided.

**Returns:**

- `BaseTool`: The created tool instance

## Subgraph Composition

### `sequential_pipeline`

Combines multiple subgraphs with identical state schemas in a serial (sequential) manner.

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

- `sub_graphs` (list[SubGraph]): List of subgraphs to combine.
- `state_schema` (type[StateT]): Shared state schema for all subgraphs.
- `graph_name` (Optional[str]): Name of the final assembled graph.
- `context_schema` (type[ContextT] | None): Shared context schema for all subgraphs.
- `input_schema` (type[InputT] | None): Input schema for the final graph.
- `output_schema` (type[OutputT] | None): Output schema for the final graph.

**Returns:**

- `CompiledStateGraph`: The assembled graph instance.

---

### `parallel_pipeline`

Combines multiple subgraphs with identical state schemas in a parallel manner.

**Function Signature:**

```python
def parallel_pipeline(
    sub_graphs: list[SubGraph],
    state_schema: type[StateT],
    graph_name: Optional[str] = None,
    parallel_entry_node: Optional[str] = None,
    context_schema: type[ContextT] | None = None,
    input_schema: type[InputT] | None = None,
    output_schema: type[OutputT] | None = None,
) -> CompiledStateGraph[StateT, ContextT, InputT, OutputT]:
```

**Parameters:**

- `sub_graphs` (list[SubGraph]): List of subgraphs to combine.
- `state_schema` (type[StateT]): Shared state schema for all subgraphs.
- `graph_name` (Optional[str]): Name of the final assembled graph.
- `parallel_entry_node` (Optional[str]): Entry node name for parallel execution (this node is excluded from the parallel section).
- `context_schema` (type[ContextT] | None): Shared context schema for all subgraphs.
- `input_schema` (type[InputT] | None): Input schema for the final graph.
- `output_schema` (type[OutputT] | None): Output schema for the final graph.

**Returns:**

- `CompiledStateGraph`: The assembled graph instance.

## Type definitions

### `InterruptParams`

Parameter type passed to the `handler` function, containing tool call context:

```python
class InterruptParams(TypedDict):
    tool_call_name: str           # Tool name (string)
    tool_call_args: Dict[str, Any] # Tool call arguments (dictionary)
    tool: BaseTool                # Tool object for subsequent invoke/ainvoke
    config: RunnableConfig        # LangChain runtime configuration
```

### `HumanInterruptHandler`

Type alias for interrupt handler functions:

```python
from typing import Callable, Any

HumanInterruptHandler = Callable[[InterruptParams], Any]
```

### `ChatModelProvider`

Parameter type passed to `batch_register_model_provider`

```python
class ChatModelProvider(TypedDict):
    provider: str
    chat_model: Union[type[BaseChatModel], str]
    base_url: NotRequired[str]
```

### `EmbeddingProvider`

Parameter type passed to `batch_register_embeddings_provider`

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: Union[type[Embeddings], str]
    base_url: NotRequired[str]
```

### `PlanStateMixin`

Plan State Mixin Class

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]


class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

### `NoteStateMixin`

Note State Mixin Class

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

## Next steps

- [Example](./example.md) - Example of using the library
