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

## Next steps

- [Getting Started](./getting-started.md) - Return to overview
- [Installation Guide](./installation.md) - Installation instructions
