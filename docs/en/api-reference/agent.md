# Agent Module API Reference

## create_agent

Prebuilt agent function that provides identical functionality to the official LangChain `create_agent`, but extends model specification via strings.

```python
def create_agent(  # noqa: PLR0915
    model: str,
    tools: Sequence[BaseTool | Callable | dict[str, Any]] | None = None,
    *,
    system_prompt: str | SystemMessage | None = None,
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

- `model`: str, required. Model identifier string loadable by `load_chat_model`. Can be specified in "provider:model-name" format
- `tools`: Sequence of BaseTool, Callable, or dict, or ToolNode type, required. List of tools available to the agent
- `system_prompt`: Optional str, custom system prompt for the agent
- `middleware`: Optional AgentMiddleware type, agent middleware
- `response_format`: Optional ResponseFormat type, agent response format
- `state_schema`: Optional StateSchemaType type, agent state schema
- `context_schema`: Optional any type, agent context schema
- `checkpointer`: Optional Checkpointer type, checkpoint for state persistence
- `store`: Optional BaseStore type, storage for data persistence
- `interrupt_before`: Optional list of str, nodes to interrupt before execution
- `interrupt_after`: Optional list of str, nodes to interrupt after execution
- `debug`: bool, optional, enable debug mode, defaults to False
- `name`: Optional str, agent name
- `cache`: Optional BaseCache type, cache

**Returns:** CompiledStateGraph type

**Note:** This function provides identical functionality to the official LangChain `create_agent` but extends model selection. The main difference is that the `model` parameter must be a string loadable by the `load_chat_model` function, allowing more flexible model selection using registered model providers.

**Example:**

```python
agent = create_agent(model="vllm:qwen3-4b", tools=[get_current_time])
```

## wrap_agent_as_tool

```python
def wrap_agent_as_tool(
    agent: CompiledStateGraph,
    tool_name: Optional[str] = None,
    tool_description: Optional[str] = None,
    pre_input_hooks: Optional[
        tuple[
            Callable[[str, ToolRuntime], str],
            Callable[[str, ToolRuntime], Awaitable[str]],
        ]
        | Callable[[str, ToolRuntime], str]
    ] = None,
    post_output_hooks: Optional[
        tuple[
            Callable[[str, list[AnyMessage], ToolRuntime], Any],
            Callable[[str, list[AnyMessage], ToolRuntime], Awaitable[Any]],
        ]
        | Callable[[str, list[AnyMessage], ToolRuntime], Any]
    ] = None,
) -> BaseTool:
```

**Parameters:**

- `agent`: CompiledStateGraph type, required, the agent
- `tool_name`: Optional str, tool name
- `tool_description`: Optional str, tool description
- `pre_input_hooks`: Optional tuple or function type, agent input preprocessing function
- `post_output_hooks`: Optional tuple or function type, agent output post-processing function

**Returns:** BaseTool type, tool instance

**Example:**

```python
tool = wrap_agent_as_tool(agent)
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

- `description`: Optional str, tool description
- `message_key`: Optional str, key for updating messages, defaults to "messages"

**Returns:** BaseTool type, tool instance

**Example:**

```python
write_plan_tool = create_write_plan_tool()
```

## create_finish_sub_plan_tool

Creates a tool for updating execution status after completing subtasks.

```python
def create_finish_sub_plan_tool(
    description: Optional[str] = None,
    message_key: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `description`: Optional str, tool description
- `message_key`: Optional str, key for updating messages, defaults to "messages"

**Returns:** BaseTool type, tool instance

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

- `description`: Optional str, tool description

**Returns:** BaseTool type, tool instance

**Example:**

```python
read_plan_tool = create_read_plan_tool()
```
## SummarizationMiddleware

Middleware for intelligent agent context summarization.

```python
class SummarizationMiddleware(_SummarizationMiddleware):
    def __init__(
        self,
        model: str,
        *,
        trigger: ContextSize | list[ContextSize] | None = None,
        keep: ContextSize = ("messages", _DEFAULT_MESSAGES_TO_KEEP),
        token_counter: TokenCounter = count_tokens_approximately,
        summary_prompt: str = DEFAULT_SUMMARY_PROMPT,
        trim_tokens_to_summarize: int | None = _DEFAULT_TRIM_TOKEN_LIMIT,
        **deprecated_kwargs: Any,
    ) -> None:
```

**Parameters:**

- `model`：str, required. Model identifier string loadable by `load_chat_model`. Can be specified in "provider:model-name" format
- `trigger`：Optional ContextSize type or list of ContextSize type, trigger context size for summarization
- `keep`：Optional ContextSize type, keep context size
- `token_counter`：Optional TokenCounter type, token counter function
- `summary_prompt`：Optional str, summary prompt
- `trim_tokens_to_summarize`：Optional int, token limit for summarization

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

- `model`: str, required. Model identifier string loadable by `load_chat_model`. Can be specified in "provider:model-name" format
- `system_prompt`: Optional str, system prompt
- `max_tools`: Optional int, maximum number of tools
- `always_include`: Optional list of str, tools to always include

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
        system_prompt: Optional[str] = None,
        write_plan_tool_description: Optional[str] = None,
        finish_sub_plan_tool_description: Optional[str] = None,
        read_plan_tool_description: Optional[str] = None,
        use_read_plan_tool: bool = True,
        message_key: Optional[str] = None,
    ) -> None:
```

**Parameters:**

- `system_prompt`: Optional str, system prompt
- `write_plan_tool_description`: Optional str, description for the write_plan tool
- `finish_sub_plan_tool_description`: Optional str, description for the finish_sub_plan tool
- `read_plan_tool_description`: Optional str, description for the read_plan tool
- `use_read_plan_tool`: Optional bool, whether to use the read_plan tool
- `message_key`: Optional str, key for updating messages, defaults to "messages"

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

- `first_model`: str, required. Model identifier string loadable by `load_chat_model`. Can be specified in "provider:model-name" format
- `additional_models`: Optional list of str, list of fallback models

**Example:**

```python
model_fallback_middleware = ModelFallbackMiddleware(
    "vllm:qwen3-4b",
    "vllm:qwen3-8b"
)
```

## LLMToolEmulator

Middleware for using large language models to emulate tool calls.

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

- `model`: str, required. Model identifier string loadable by `load_chat_model`. Can be specified in "provider:model-name" format
- `tools`: Optional list of BaseTool, list of tools

**Example:**

```python
llm_tool_emulator = LLMToolEmulator(model="vllm:qwen3-4b", tools=[get_current_time])
```

## ModelRouterMiddleware

Middleware for dynamically routing to appropriate models based on input content.

```python
class ModelRouterMiddleware(AgentMiddleware):
    state_schema = ModelRouterState
    def __init__(
        self,
        router_model: str | BaseChatModel,
        model_list: list[ModelDict],
        router_prompt: Optional[str] = None,
    ) -> None:
```

**Parameters:**

- `router_model`: Model for routing, accepts string type (loaded using `load_chat_model`) or directly pass a ChatModel
- `model_list`: List of models, each model needs to contain `model_name` and `model_description` keys, and can optionally include `tools`, `model_kwargs`, `model_system_prompt` keys, representing the tools available to the model (defaults to all tools if not provided), additional parameters passed to the model (e.g., temperature, top_p, etc.), and the model's system prompt respectively.
- `router_prompt`: Prompt for the routing model, uses default prompt if None

**Example:**

```python
model_router_middleware = ModelRouterMiddleware(
    router_model="vllm:qwen3-4b",
    model_list=[
        {
            "model_name": "vllm:qwen3-4b",
            "model_description": "Suitable for general tasks like dialogue, text generation, etc."
        },
        {
            "model_name": "vllm:qwen3-8b",
            "model_description": "Suitable for complex tasks like code generation, data analysis, etc.",
        },
    ]
)
```

## PlanState

State schema for Plan.

```python
class Plan(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "done"]


class PlanState(AgentState):
    plan: NotRequired[list[Plan]]
```

- `plan`: Optional list type, list of plans
- `plan.content`: Plan content
- `plan.status`: Plan status, values are `pending`, `in_progress`, `done`

## ModelDict

Type for model list.

```python
class ModelDict(TypedDict):
    model_name: str
    model_description: str
    tools: NotRequired[list[BaseTool | dict[str, Any]]]
    model_kwargs: NotRequired[dict[str, Any]]
    model_system_prompt: NotRequired[str]
```

## SelectModel

Tool class for model selection.

```python
class SelectModel(BaseModel):
    """Tool for model selection - Must call this tool to return the finally selected model"""

    model_name: str = Field(
        ...,
        description="Selected model name (must be the full model name, for example, openai:gpt-4o)",
    )
```
