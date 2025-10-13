# API Reference

## Model Management

### register_model_provider

Register a provider for chat models.

```python
def register_model_provider(
    provider_name: str,
    chat_model: Union[Type[BaseChatModel], str],
    base_url: Optional[str] = None
) -> None
```

**Parameters:**

- `provider_name`: String, required, custom provider name
- `chat_model`: ChatModel class or supported provider string, required
- `base_url`: Optional string, provider's BaseURL

**Example:**

```python
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai-compatible", base_url="https://openrouter.ai/api/v1")
```

---

### batch_register_model_provider

Batch register model providers.

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider]
) -> None
```

**Parameters:**

- `providers`: List of ChatModelProvider, required, list of provider configurations

**Example:**

```python
batch_register_model_provider([
    {"provider": "dashscope", "chat_model": ChatQwen},
    {"provider": "openrouter", "chat_model": "openai-compatible", "base_url": "https://openrouter.ai/api/v1"},
])
```

---

### load_chat_model

Load a chat model from a registered provider.

```python
def load_chat_model(
    model: str,
    model_provider: Optional[str] = None,
    **kwargs
) -> BaseChatModel
```

**Parameters:**

- `model`: String, required, model name in the format `model_name` or `provider_name:model_name`
- `model_provider`: Optional string, model provider name
- `**kwargs`: Any type, optional, additional model parameters

**Returns:** BaseChatModel type, loaded chat model instance

**Example:**

```python
model = load_chat_model("dashscope:qwen-flash")
```

---

### register_embeddings_provider

Register a provider for embedding models.

```python
def register_embeddings_provider(
    provider_name: str,
    embeddings_model: Union[Type[Embeddings], str],
    base_url: Optional[str] = None
) -> None
```

**Parameters:**

- `provider_name`: String, required, custom provider name
- `embeddings_model`: Embeddings model class or supported provider string, required
- `base_url`: Optional string, provider's BaseURL

**Example:**

```python
register_embeddings_provider("dashscope", "openai-compatible", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
```

---

### batch_register_embeddings_provider

Batch register embedding model providers.

```python
def batch_register_embeddings_provider(
    providers: list[EmbeddingProvider]
) -> None
```

**Parameters:**

- `providers`: List of EmbeddingProvider, required, list of provider configurations

**Example:**

```python
batch_register_embeddings_provider([
    {"provider": "dashscope", "embeddings_model": "openai-compatible", "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"},
    {"provider": "siliconflow", "embeddings_model": SiliconFlowEmbeddings},
])
```

---

### load_embeddings

Load an embedding model from a registered provider.

```python
def load_embeddings(
    model: str,
    provider: Optional[str] = None,
    **kwargs
) -> Embeddings
```

**Parameters:**

- `model`: String, required, model name in the format `model_name` or `provider_name:model_name`
- `provider`: Optional string, model provider name
- `**kwargs`: Any type, optional, additional model parameters

**Returns:** Embeddings type, loaded embedding model instance

**Example:**

```python
embeddings = load_embeddings("dashscope:text-embedding-v4")
```

---

## Message Processing

### convert_reasoning_content_for_ai_message

Merge reasoning content from AIMessage into the content field.

```python
def convert_reasoning_content_for_ai_message(
    model_response: AIMessage,
    think_tag: Tuple[str, str] = ("<think>", "</think>")
) -> AIMessage
```

**Parameters:**

- `model_response`: AIMessage type, required, AI message containing reasoning content
- `think_tag`: Tuple of strings, optional, start and end tags for reasoning content, defaults to `("<think>", "</think>")`

**Returns:** AIMessage type, message with merged reasoning content

**Example:**

```python
response = convert_reasoning_content_for_ai_message(
    response, think_tag=("<start>", "<end>")
)
```

---

### convert_reasoning_content_for_chunk_iterator

Merge reasoning content for streaming message chunks.

```python
def convert_reasoning_content_for_chunk_iterator(
    model_response: Iterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> Iterator[BaseMessageChunk]
```

**Parameters:**

- `model_response`: Iterator of BaseMessageChunk, required, iterator of message chunks
- `think_tag`: Tuple of strings, optional, start and end tags for reasoning content, defaults to `("<think>", "</think>")`

**Returns:** Iterator of BaseMessageChunk type, processed message chunk iterator

**Example:**

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

**Parameters:**

- `model_response`: AsyncIterator of BaseMessageChunk, required, async iterator of message chunks
- `think_tag`: Tuple of strings, optional, start and end tags for reasoning content, defaults to `("<think>", "</think>")`

**Returns:** AsyncIterator of BaseMessageChunk type, processed async message chunk iterator

**Example:**

```python
async for chunk in aconvert_reasoning_content_for_chunk_iterator(
    model.astream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

---

### merge_ai_message_chunk

Merge multiple AI message chunks into a single message.

```python
def merge_ai_message_chunk(
    chunks: Sequence[AIMessageChunk]
) -> AIMessage
```

**Parameters:**

- `chunks`: Sequence of AIMessageChunk, required, list of message chunks to merge

**Returns:** AIMessage type, merged message

**Example:**

```python
chunks = list(model.stream("Hello"))
merged = merge_ai_message_chunk(chunks)
```

---

### has_tool_calling

Check if a message contains tool calls.

```python
def has_tool_calling(
    message: AIMessage
) -> bool
```

**Parameters:**

- `message`: AIMessage type, required, message to check

**Returns:** Boolean type, returns True if the message contains tool calls, otherwise False

**Example:**

```python
if has_tool_calling(response):
    # Handle tool calls
    pass
```

---

### parse_tool_calling

Parse tool call parameters from a message.

```python
def parse_tool_calling(
    message: AIMessage,
    first_tool_call_only: bool = False
) -> Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]]
```

**Parameters:**

- `message`: AIMessage type, required, message to parse
- `first_tool_call_only`: Boolean type, optional, whether to return only the first tool call, defaults to False

**Returns:** Tuple of tool call name and parameters, or list of tuples of tool call names and parameters

**Example:**

```python
# Get all tool calls
tool_calls = parse_tool_calling(response)

# Get only the first tool call
name, args = parse_tool_calling(response, first_tool_call_only=True)
```

---

### message_format

Format messages, documents, or string lists into a single string.

```python
def message_format(
    inputs: List[Union[BaseMessage, Document, str]],
    separator: str = "-",
    with_num: bool = False
) -> str
```

**Parameters:**

- `inputs`: List of BaseMessage, Document, or string, required, list of items to format
- `separator`: String type, optional, separator string, defaults to "-"
- `with_num`: Boolean type, optional, whether to add numeric prefixes, defaults to False

**Returns:** String type, formatted string

**Example:**

```python
formatted = message_format(messages, separator="\n", with_num=True)
```

---

## Tool Enhancement

### human_in_the_loop

Decorator to add "human-in-the-loop" manual review capability for **synchronous tool functions**.

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func`: Optional callable type, synchronous function to decorate (decorator syntax sugar)
- `handler`: Optional HumanInterruptHandler type, custom interrupt handler function

**Returns:** BaseTool type, decorated tool instance

**Example:**

```python
@human_in_the_loop
def get_current_time():
    """Get current time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
```

---

### human_in_the_loop_async

Decorator to add "human-in-the-loop" manual review capability for **asynchronous tool functions**.

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func`: Optional callable type, asynchronous function to decorate (decorator syntax sugar)
- `handler`: Optional HumanInterruptHandler type, custom interrupt handler function

**Returns:** BaseTool type, decorated asynchronous tool instance

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

Create a write plan tool.

```python
def create_write_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional string, tool name
- `description`: Optional string, tool description
- `message_key`: Optional string, key for updating messages, defaults to "messages"

**Returns:** BaseTool type, write plan tool instance

**Example:**

```python
write_plan_tool = create_write_plan_tool()
```

---

### create_update_plan_tool

Create an update plan tool.

```python
def create_update_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional string, tool name
- `description`: Optional string, tool description
- `message_key`: Optional string, key for updating messages, defaults to "messages"

**Returns:** BaseTool type, update plan tool instance

**Example:**

```python
update_plan_tool = create_update_plan_tool()
```

---

### create_write_note_tool

Create a write note tool.

```python
def create_write_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional string, tool name
- `description`: Optional string, tool description
- `message_key`: Optional string, key for updating messages, defaults to "messages"

**Returns:** BaseTool type, write note tool instance

**Example:**

```python
write_note_tool = create_write_note_tool()
```

---

### create_ls_tool

Create a list notes tool.

```python
def create_ls_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional string, tool name
- `description`: Optional string, tool description

**Returns:** BaseTool type, list notes tool instance

**Example:**

```python
ls_tool = create_ls_tool()
```

---

### create_query_note_tool

Create a query note tool.

```python
def create_query_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional string, tool name
- `description`: Optional string, tool description

**Returns:** BaseTool type, query note tool instance

**Example:**

```python
query_note_tool = create_query_note_tool()
```

---

### create_update_note_tool

Create an update note tool.

```python
def create_update_note_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional string, tool name
- `description`: Optional string, tool description
- `message_key`: Optional string, key for updating messages, defaults to "messages"

**Returns:** BaseTool type, update note tool instance

**Example:**

```python
update_note_tool = create_update_note_tool()
```

---

## State Graph Orchestration

### sequential_pipeline

Combine multiple subgraphs with the same state in a sequential manner.

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

- `sub_graphs`: List of SubGraph, required, list of state graphs to combine
- `state_schema`: StateT type, required, State Schema of the final generated graph
- `graph_name`: Optional string, name of the final generated graph
- `context_schema`: ContextT type or None, optional, Context Schema of the final generated graph
- `input_schema`: InputT type or None, optional, input Schema of the final generated graph
- `output_schema`: OutputT type or None, optional, output Schema of the final generated graph

**Returns:** CompiledStateGraph type, created sequential state graph

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

Combine multiple subgraphs with the same state in a parallel manner.

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

- `sub_graphs`: List of SubGraph, required, list of state graphs to combine
- `state_schema`: StateT type, required, State Schema of the final generated graph
- `graph_name`: Optional string, name of the final generated graph
- `parallel_entry_graph`: Optional string, parallel entry graph, defaults to "**start**"
- `branches_fn`: Optional callable type, parallel branch function, returns a list of Send to control parallel execution
- `context_schema`: ContextT type or None, optional, Context Schema of the final generated graph
- `input_schema`: InputT type or None, optional, input Schema of the final generated graph
- `output_schema`: OutputT type or None, optional, output Schema of the final generated graph

**Returns:** CompiledStateGraph type, created parallel state graph

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

## Pre-built Agent

### create_agent

Pre-built agent function, providing exactly the same functionality as the official langgraph `create_react_agent`, but with extended model selection.

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

- `model`: String, required, model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format
- `tools`: Sequence of BaseTool, Callable, or dict, or ToolNode type, required, list of tools available to the agent
- `prompt`: Optional Prompt type, custom prompt for the agent
- `response_format`: Optional StructuredResponseSchema or tuple of string and StructuredResponseSchema type, response format specification
- `pre_model_hook`: Optional RunnableLike type, runnable object executed before model inference
- `post_model_hook`: Optional RunnableLike type, runnable object executed after model inference
- `state_schema`: Optional StateSchemaType type, state schema of the agent
- `context_schema`: Optional Any type, context schema of the agent
- `checkpointer`: Optional Checkpointer type, checkpoint for state persistence
- `store`: Optional BaseStore type, storage for data persistence
- `interrupt_before`: Optional list of strings, nodes to interrupt before execution
- `interrupt_after`: Optional list of strings, nodes to interrupt after execution
- `debug`: Boolean type, optional, enable debug mode, defaults to False
- `version`: Literal "v1" or "v2" type, optional, agent version, defaults to "v2"
- `name`: Optional string, agent name
- `deprecated_kwargs`: Any type, optional, deprecated parameters for backward compatibility

**Returns:** CompiledStateGraph type, created agent graph

**Note:** This function provides exactly the same functionality as the official `langgraph` `create_react_agent`, but with extended model selection. The main difference is that the `model` parameter must be a string that can be loaded by the `load_chat_model` function, allowing for more flexible model selection using registered model providers.

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

- `tool_call_name`: String type, tool call name
- `tool_call_args`: Dictionary of string to any value, tool call parameters
- `tool`: BaseTool type, tool instance
- `config`: RunnableConfig type, runtime configuration

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

**Fields:**

- `provider`: String type, required, provider name
- `chat_model`: BaseChatModel type or string type, required, chat model class or string
- `base_url`: Not required string type, base URL

---

### EmbeddingProvider

Embedding model provider configuration type.

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: Union[type[Embeddings], str]
    base_url: NotRequired[str]
```

**Fields:**

- `provider`: String type, required, provider name
- `embeddings_model`: Embeddings type or string type, required, embedding model class or string
- `base_url`: Not required string type, base URL

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

**Fields:**

- `plan`: List of Plan type, list of plans
- `Plan.content`: String type, plan content
- `Plan.status`: Literal "pending", "in_progress", or "done" type, plan status

---

### NoteStateMixin

Note state mixin class.

```python
class NoteStateMixin(TypedDict):
    note: Annotated[dict[str, str], note_reducer]
```

**Fields:**

- `note`: Annotated dictionary type, both keys and values are strings, note dictionary
