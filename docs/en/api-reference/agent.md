# Agent Module API Reference

## create_agent

Pre-built agent function that provides identical functionality to the official LangChain `create_agent`, but extends model specification with strings.

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

- `model`: String, required. A model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format.
- `tools`: Sequence of BaseTool, Callable, or dict, or ToolNode type, required. List of tools available to the agent.
- `system_prompt`: Optional string. Custom system prompt for the agent.
- `middleware`: Optional AgentMiddleware type. Middleware for the agent.
- `response_format`: Optional ResponseFormat type. Response format for the agent.
- `state_schema`: Optional StateSchemaType type. State schema for the agent.
- `context_schema`: Optional any type. Context schema for the agent.
- `checkpointer`: Optional Checkpointer type. Checkpoint for state persistence.
- `store`: Optional BaseStore type. Storage for data persistence.
- `interrupt_before`: Optional list of strings. Nodes to interrupt before execution.
- `interrupt_after`: Optional list of strings. Nodes to interrupt after execution.
- `debug`: Boolean, optional. Enable debug mode, defaults to False.
- `name`: Optional string. Agent name.
- `cache`: Optional BaseCache type. Cache.

**Return Value:** CompiledStateGraph type

**Note:** This function provides identical functionality to the official LangChain `create_agent`, but extends model selection. The main difference is that the `model` parameter must be a string that can be loaded by the `load_chat_model` function, allowing for more flexible model selection using registered model providers.

**Example:**

```python
agent = create_agent(model="vllm:qwen3-4b", tools=[get_current_time])
```

## create_write_plan_tool

Creates a tool for writing or updating plans.

```python
def create_write_plan_tool(
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `description`: Optional string. Tool description.
- `message_key`: Optional string. Key for updating messages, defaults to "messages".

**Return Value:** BaseTool type, tool instance.

**Example:**

```python
write_plan_tool = create_write_plan_tool()
```

## create_finish_sub_plan_tool

Creates a tool for updating execution status after completing a subtask.

```python
def create_finish_sub_plan_tool(
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `description`: Optional string. Tool description.
- `message_key`: Optional string. Key for updating messages, defaults to "messages".

**Return Value:** BaseTool type, tool instance.

**Example:**

```python
finish_sub_plan_tool = create_finish_sub_plan_tool()
```

## create_read_plan_tool

Creates a tool for reading execution status.

```python
def create_read_plan_tool(
    description: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `description`: Optional string. Tool description.

**Return Value:** BaseTool type, tool instance.

**Example:**

```python
read_plan_tool = create_read_plan_tool()
```

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

- `model`: String, required. A model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format.
- `max_tokens_before_summary`: Optional integer. Number of tokens to retain before summarization.
- `messages_to_keep`: Optional integer. Number of messages to retain before summarization.
- `token_counter`: Optional TokenCounter type. Token counter.
- `summary_prompt`: Optional string. Summarization prompt.
- `summary_prefix`: Optional string. Summarization prefix.

**Example:**

```python
summarization_middleware = SummarizationMiddleware(model="vllm:qwen3-4b")
```

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

- `model`: String, required. A model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format.
- `system_prompt`: Optional string. System prompt.
- `max_tools`: Optional integer. Maximum number of tools.
- `always_include`: Optional list of strings. Tools to always include.

**Example:**

```python
llm_tool_selector_middleware = LLMToolSelectorMiddleware(model="vllm:qwen3-4b")
```

## PlanMiddleware

Middleware for agent plan management.

```python
class PlanMiddleware(AgentMiddleware):
    state_schema = PlanState

    def __init__(
        self,
        *,
        system_prompt: str = WRITE_PLAN_TOOL_DESCRIPTION,
        tools: Optional[list[BaseTool]] = None,
    ) -> None:
```

**Parameters:**

- `system_prompt`: Optional string. System prompt.
- `tools`: Optional list of BaseTool type. List of tools.

**Example:**

```python
plan_middleware = PlanMiddleware()
```

## ModelFallbackMiddleware

Middleware for agent model fallback.

```python
class ModelFallbackMiddleware(_ModelFallbackMiddleware):
    def __init__(
        self,
        first_model: str,
        *additional_models: str,
    ) -> None:
```

**Parameters:**

- `first_model`: String, required. A model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format.
- `additional_models`: Optional list of strings. List of fallback models.

**Example:**

```python
model_fallback_middleware = ModelFallbackMiddleware(
    "vllm:qwen3-4b",
    "vllm:qwen3-8b"
)
```

## LLMToolEmulator

Middleware for using large language models to simulate tool calls.

```python
class LLMToolEmulator(_LLMToolEmulator):
    def __init__(
        self,
        *,
        model: str,
        tools: list[str | BaseTool] | None = None,
    ) -> None:
```

**Parameters:**

- `model`: String, required. A model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format.
- `tools`: Optional list of BaseTool type. List of tools.

**Example:**

```python
llm_tool_emulator = LLMToolEmulator(model="vllm:qwen3-4b", tools=[get_current_time])
```

## PlanState

State Schema for Plan.

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]


class PlanState(AgentState):
    plan: NotRequired[list[Plan]]
```

- `plan`: Optional list type. List of plans.
- `plan.content`: Plan content.
- `plan.status`: Plan status, values can be `pending`, `in_progress`, or `done`.
