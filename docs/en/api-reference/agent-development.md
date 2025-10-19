# Agent Development

## create_agent

A pre-built agent function that provides the exact same functionality as the official LangChain `create_agent`, but extends it with string-based model specification.

```python
def create_agent(  # noqa: PLR0915
    model: str,
    tools: Sequence[BaseTool | Callable | dict[str, Any]] | None = None,
    *,
    system_prompt: str | None = None,
    middleware: Sequence[AgentMiddleware[AgentState[ResponseT], ContextT]] = (),
    response_format: ResponseFormat[ResponseT] | type[ResponseT] | None = None,
    state_schema: type[AgentState[ResponseT]] | None = None,
    context_schema: type[ContextT] | None = None,
    checkpointer: Checkpointer | None = None,
    store: BaseStore | None = None,
    interrupt_before: list[str] | None = None,
    interrupt_after: list[str] | None = None,
    debug: bool = False,
    name: str | None = None,
    cache: BaseCache | None = None,
) -> CompiledStateGraph:
```

**Parameters:**

- `model`: str, required. A model identifier string that can be loaded by the `load_chat_model` function. Can be specified in the "provider:model-name" format.
- `tools`: Sequence of BaseTool, Callable, or dict, or ToolNode type, required. List of tools available to the agent.
- `system_prompt`: Optional str, custom system prompt for the agent.
- `middleware`: Optional AgentMiddleware type, middleware for the agent.
- `response_format`: Optional ResponseFormat type, response format for the agent.
- `state_schema`: Optional StateSchemaType type, state schema for the agent.
- `context_schema`: Optional any type, context schema for the agent.
- `checkpointer`: Optional Checkpointer type, checkpoint for state persistence.
- `store`: Optional BaseStore type, storage for data persistence.
- `interrupt_before`: Optional list of str, nodes to interrupt before execution.
- `interrupt_after`: Optional list of str, nodes to interrupt after execution.
- `debug`: bool, optional. Enable debug mode, defaults to False.
- `name`: Optional str, agent name.
- `cache`: Optional BaseCache type, cache.

**Returns:** CompiledStateGraph type

**Note:** This function provides the exact same functionality as the official LangChain `create_agent`, but extends the model selection. The main difference is that the `model` parameter must be a string that can be loaded by the `load_chat_model` function, allowing for more flexible model selection using registered model providers.

**Example:**

```python
agent = create_agent(model="vllm:qwen3-4b", tools=[get_current_time])
```

## create_write_plan_tool

Creates a write plan tool.

```python
def create_write_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional str, tool name.
- `description`: Optional str, tool description.
- `message_key`: Optional str, key for updating messages, defaults to "messages".

**Returns:** BaseTool type, an instance of the write plan tool.

**Example:**

```python
write_plan_tool = create_write_plan_tool()
```

---

## create_update_plan_tool

Creates an update plan tool.

```python
def create_update_plan_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional str, tool name.
- `description`: Optional str, tool description.
- `message_key`: Optional str, key for updating messages, defaults to "messages".

**Returns:** BaseTool type, an instance of the update plan tool.

**Example:**

```python
update_plan_tool = create_update_plan_tool()
```

---

## create_write_file_tool

Creates a write file tool.

```python
def create_write_file_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional str, tool name.
- `description`: Optional str, tool description.
- `message_key`: Optional str, key for updating messages, defaults to "messages".

**Returns:** BaseTool type, an instance of the write file tool.

**Example:**

```python
write_file_tool = create_write_file_tool()
```

---

## create_ls_file_tool

Creates a list files tool.

```python
def create_ls_file_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional str, tool name.
- `description`: Optional str, tool description.

**Returns:** BaseTool type, an instance of the list files tool.

**Example:**

```python
ls_file_tool = create_ls_file_tool()
```

---

## create_query_file_tool

Creates a query file tool.

```python
def create_query_file_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional str, tool name.
- `description`: Optional str, tool description.

**Returns:** BaseTool type, an instance of the query file tool.

**Example:**

```python
query_file_tool = create_query_file_tool()
```

---

## create_update_file_tool

Creates an update file tool.

```python
def create_update_file_tool(
    name: Optional[str] = None,
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool
```

**Parameters:**

- `name`: Optional str, tool name.
- `description`: Optional str, tool description.
- `message_key`: Optional str, key for updating messages, defaults to "messages".

**Returns:** BaseTool type, an instance of the update file tool.

**Example:**

```python
update_file_tool = create_update_file_tool()
```

---

## PlanStateMixin

Plan state mixin class.

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]

class PlanStateMixin(TypedDict):
    plan: list[Plan]
```

**Fields:**

- `plan`: List of Plan type, list of plans.
- `Plan.content`: str, plan content.
- `Plan.status`: Literal "pending", "in_progress", or "done", plan status.

---

## FileStateMixin

File state mixin class.

```python
class FileStateMixin(TypedDict):
    file: Annotated[dict[str, str], file_reducer]
```

**Fields:**

- `file`: Annotated dict type, both keys and values are strings, file dictionary.

---

## SummarizationMiddleware

Middleware for agent context summarization.

```python
class SummarizationMiddleware(_SummarizationMiddleware):
    def __init__(
        self,
        model: str,
        max_tokens_before_summary: Optional[int] = None,
        messages_to_keep: Optional[int] = None,
        token_counter: Optional[TokenCounter] = None,
        summary_prompt: Optional[str] = None,
        summary_prefix: Optional[str] = None,
    ) -> None:
```

**Parameters:**

- `model`: string, required, model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format
- `max_tokens_before_summary`: optional integer, number of tokens to keep before summarization
- `messages_to_keep`: optional integer, number of messages to keep before summarization
- `token_counter`: optional TokenCounter type, token counter
- `summary_prompt`: optional string, summarization prompt
- `summary_prefix`: optional string, summary prefix

**Example:**

```python
summarization_middleware = SummarizationMiddleware(model="vllm:qwen3-4b")
```

---

## LLMToolSelectorMiddleware

Middleware for agent tool selection.

```python
class LLMToolSelectorMiddleware(_LLMToolSelectorMiddleware):
    def __init__(
        self,
        *,
        model: str,
        system_prompt: Optional[str] = None,
        max_tools: Optional[int] = None,
        always_include: Optional[list[str]] = None,
    ) -> None:
```

**Parameters:**

- `model`: string, required, model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format
- `system_prompt`: optional string, system prompt
- `max_tools`: optional integer, maximum number of tools
- `always_include`: optional list of strings, tools to always include

**Example:**

```python
llm_tool_selector_middleware = LLMToolSelectorMiddleware(model="vllm:qwen3-4b")
```
