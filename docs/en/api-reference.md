# API Reference Documentation

This section provides complete documentation for all functions and classes in LangChain Dev Utils.

## Model Management

### `register_model_provider`

Registers a model provider for chat models.

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
- `base_url` (Optional[str]): Base URL for the provider

**Example:**

```python
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1")
```

---

### `batch_register_model_provider`

Batch-register model providers.

**Function Signature:**

```python
def batch_register_model_provider(
     providers: list[ChatModelProvider],
) -> None
```

**Parameters:**

- `providers` (List[ChatModelProvider]): List of providers, each containing `provider`, `chat_model`, and `base_url`.

**Example:**

```python
batch_register_model_provider([
    {"provider": "dashscope", "chat_model": ChatQwen},
    {"provider": "openrouter", "chat_model": "openai", "base_url": "https://openrouter.ai/api/v1"},
])
```

---

### `load_chat_model`

Loads a chat model from a registered provider.

**Function Signature:**

```python
def load_chat_model(
    model: str,
    model_provider: Optional[str] = None,
    **kwargs
) -> BaseChatModel
```

**Parameters:**

- `model` (str): Model name, in format `model_name` or `provider_name:model_name`
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

Registers a provider for embedding models.

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
- `embeddings_model` (Union[Type[Embeddings], str]): Embedding model class or supported provider string
- `base_url` (Optional[str]): Base URL for the provider

**Example:**

```python
register_embeddings_provider("dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
```

---

### `batch_register_embeddings_provider`

Batch-register embedding model providers.

**Function Signature:**

```python
def batch_register_embeddings_provider(
   providers: list[EmbeddingProvider]
) -> None
```

**Parameters:**

- `providers` (List[EmbeddingProvider]): List of providers, each containing `provider`, `embeddings_model`, and `base_url`.

**Example:**

```python
batch_register_embeddings_provider([
    {"provider": "dashscope", "embeddings_model": "openai", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"},
    {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
])
```

---

### `load_embeddings`

Loads an embedding model from a registered provider.

**Function Signature:**

```python
def load_embeddings(
    model: str,
    provider: Optional[str] = None,
    **kwargs
) -> Embeddings
```

**Parameters:**

- `model` (str): Model name, in format `model_name` or `provider_name:model_name`
- `provider` (Optional[str]): Model provider name
- `**kwargs`: Additional model parameters

**Returns:**

- `Embeddings`: Loaded embedding model instance

**Example:**

```python
embeddings = load_embeddings("dashscope:text-embedding-v4")
```

---

## Message Processing

### `convert_reasoning_content_for_ai_message`

Merges reasoning content into the content field of an AIMessage.

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

Merges reasoning content for streaming message chunks.

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

Asynchronous version for streaming reasoning content processing.

**Function Signature:**

```python
async def aconvert_reasoning_content_for_chunk_iterator(
    model_response: AsyncIterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> AsyncIterator[BaseMessageChunk]:
```

**Parameters:**

- `model_response` (AsyncIterator[BaseMessageChunk]): Asynchronous iterator of message chunks
- `think_tag` (Tuple[str, str]): Start and end tags for reasoning content, default is `<think></think>`

**Returns:**

- `AsyncIterator[BaseMessageChunk]`: Processed asynchronous chunk iterator

**Example:**

```python
async for chunk in aconvert_reasoning_content_for_chunk_iterator(
    model.astream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

---

### `merge_ai_message_chunk`

Merges multiple AI message chunks into a single message.

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

Checks whether a message contains tool calls.

**Function Signature:**

```python
def has_tool_calling(message: AIMessage) -> bool
```

**Parameters:**

- `message` (AIMessage): Message to check

**Returns:**

- `bool`: True if message contains tool calls

**Example:**

```python
if has_tool_calling(response):
    # Handle tool calls
    pass
```

---

### `parse_tool_calling`

Parses tool call parameters from a message.

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

- `Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]`: Tool call name and parameters

**Example:**

```python
name, args = parse_tool_calling(response, first_tool_call_only=True)
```

---

### `message_format`

Formats a list of messages, documents, or strings into a single string.

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
- `with_num` (bool): Whether to add numeric prefixes

**Returns:**

- `str`: Formatted string

**Example:**

```python
formatted = message_format(messages, separator="\n", with_num=True)
```

---

## Tool Enhancement

### `human_in_the_loop`

Decorator that adds "human-in-the-loop" manual review capability to **synchronous tool functions**. Triggers an interruption before tool execution, awaiting human confirmation, editing, or response.

**Function Signature:**

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func` (Optional[Callable]):  
  Function to decorate. **Do not manually pass — used only for decorator syntax sugar.**

- `handler` (Optional[HumanInterruptHandler]):  
  Custom interrupt handler function. Type:
  ```python
  HumanInterruptHandler = Callable[[InterruptParams], Any]
  ```
  If not provided, uses default `default_handler` (supports `accept` / `edit` / `response`).

**Returns:**

- `BaseTool`: Decorated tool instance

---

### `human_in_the_loop_async`

Decorator that adds "human-in-the-loop" manual review capability to **asynchronous tool functions**. Supports `await` calls.

**Function Signature:**

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func` (Optional[Callable]):  
  Asynchronous function to decorate. **Do not manually pass.**

- `handler` (Optional[HumanInterruptHandler]):  
  Custom interrupt handler function. Type:
  ```python
  HumanInterruptHandler = Callable[[InterruptParams], Any]
  ```
  If not provided, uses default `default_handler_async` (supports `accept` / `edit` / `response`).

**Note**: The handler must be an asynchronous function.

**Returns:**

Same as `human_in_the_loop`, returns an async-compatible `BaseTool` instance.

---

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

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description
- `message_key` (Optional[str]): Key to update messages; if not provided, defaults to `messages`

**Returns:**

- `BaseTool`: Created tool instance

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

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description
- `message_key` (Optional[str]): Key to update messages; if not provided, defaults to `messages`

**Returns:**

- `BaseTool`: Created tool instance

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

- `name` (Optional[str]): Tool name
- `description` (Optional[str]): Tool description
- `message_key` (Optional[str]): Key to update messages; if not provided, defaults to `messages`

**Returns:**

- `BaseTool`: Created tool instance

---

### `create_ls_tool`

Creates a tool for listing existing notes.

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

Creates a tool for querying notes.

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

Creates a tool for updating notes.

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
- `message_key` (Optional[str]): Key to update messages; if not provided, defaults to `messages`

**Returns:**

- `BaseTool`: Created tool instance

---

## State Graph Orchestration

### `sequential_pipeline`

Combines multiple sub-graphs with the same state schema in serial order.

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

- `sub_graphs` (list[SubGraph]): List of sub-graphs
- `state_schema` (type[StateT]): Common state schema
- `graph_name` (Optional[str]): Name of the final constructed graph
- `context_schema` (type[ContextT] | None): Common context schema
- `input_schema` (type[InputT] | None): Common input schema
- `output_schema` (type[OutputT] | None): Common output schema

**Returns:**

- `CompiledStateGraph`: Created graph

---

### `parallel_pipeline`

Combines multiple sub-graphs with the same state schema in parallel.

**Function Signature:**

```python
def parallel_pipeline(
    sub_graphs: list[SubGraph],
    state_schema: type[StateT],
    graph_name: Optional[str] = None,
    parallel_entry_node: Optional[str] = None,
    branches_fn: Optional[Callable[[StateT], list[Send]]] = None,
    context_schema: type[ContextT] | None = None,
    input_schema: type[InputT] | None = None,
    output_schema: type[OutputT] | None = None,
) -> CompiledStateGraph[StateT, ContextT, InputT, OutputT]:
```

**Parameters:**

- `sub_graphs` (list[SubGraph]): List of sub-graphs
- `state_schema` (type[StateT]): Common state schema
- `graph_name` (Optional[str]): Name of the final constructed graph
- `parallel_entry_node` (Optional[str]): Parallel entry node
- `branches_fn` (Optional[Callable[[StateT], list[Send]]]): Function to determine which sub-graphs to execute in parallel
- `context_schema` (type[ContextT] | None): Common context schema
- `input_schema` (type[InputT] | None): Common input schema
- `output_schema` (type[OutputT] | None): Common output schema

**Returns:**

- `CompiledStateGraph`: Created graph

## Type Definitions

### `InterruptParams`

Parameter type passed to `handler` functions, containing tool call context:

```python
class InterruptParams(TypedDict):
    tool_call_name: str           # Tool name (string)
    tool_call_args: Dict[str, Any] # Tool call parameters (dictionary)
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

Parameter type for `batch_register_model_provider`

```python
class ChatModelProvider(TypedDict):
    provider: str
    chat_model: Union[type[BaseChatModel], str]
    base_url: NotRequired[str]
```

### `EmbeddingProvider`

Parameter type for `batch_register_embeddings_provider`

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: Union[type[Embeddings], str]
    base_url: NotRequired[str]
```

### `PlanStateMixin`

Plan state mixin class

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]


class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

### `NoteStateMixin`

Note state mixin class

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

## Next Steps

- [Usage Examples](./example.md) - Demonstrates practical usage examples of this library
