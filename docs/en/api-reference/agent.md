# Agent Module API Reference

## create_agent

Pre-built agent function that provides identical functionality to LangChain's official `create_agent`, but extends model specification via strings.

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

- `model`: string, required, model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format
- `tools`: Sequence of BaseTool, Callable, or dict, or ToolNode type, required, list of tools available to the agent
- `system_prompt`: optional string, custom system prompt for the agent
- `middleware`: optional AgentMiddleware type, middleware for the agent
- `response_format`: optional ResponseFormat type, response format for the agent
- `state_schema`: optional StateSchemaType type, state schema for the agent
- `context_schema`: optional any type, context schema for the agent
- `checkpointer`: optional Checkpointer type, checkpoint for state persistence
- `store`: optional BaseStore type, storage for data persistence
- `interrupt_before`: optional list of strings, nodes to interrupt before execution
- `interrupt_after`: optional list of strings, nodes to interrupt after execution
- `debug`: boolean, optional, enable debug mode, defaults to False
- `name`: optional string, agent name
- `cache`: optional BaseCache type, cache

**Returns:** CompiledStateGraph type

**Note:** This function provides identical functionality to LangChain's official `create_agent` but extends model selection. The main difference is that the `model` parameter must be a string that can be loaded by the `load_chat_model` function, allowing for more flexible model selection using registered model providers.

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
    agent_system_prompt: Optional[str] = None,
) -> BaseTool:
```

**Parameters:**

- `agent`: CompiledStateGraph type, required, the agent
- `tool_name`: optional string, tool name
- `tool_description`: optional string, tool description
- `agent_system_prompt`: optional string, agent system prompt

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

- `description`: optional string, tool description
- `message_key`: optional string, key for updating messages, defaults to "messages"

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

- `description`: optional string, tool description
- `message_key`: optional string, key for updating messages, defaults to "messages"

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

- `description`: optional string, tool description

**Returns:** BaseTool type, tool instance

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

- `model`: string, required, model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format
- `max_tokens_before_summary`: optional integer, number of tokens to keep before summarization
- `messages_to_keep`: optional integer, number of messages to keep before summarization
- `token_counter`: optional TokenCounter type, token counter
- `summary_prompt`: optional string, summarization prompt
- `summary_prefix`: optional string, summarization prefix

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

- `model`: string, required, model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format
- `system_prompt`: optional string, system prompt
- `max_tools`: optional integer, maximum number of tools
- `always_include`: optional list of strings, tools to always include

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
        tools: Optional[list[BaseTool]] = None,
    ) -> None:
```

**Parameters:**

- `system_prompt`: optional string, system prompt
- `tools`: optional list of BaseTool, tool list

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

- `first_model`: string, required, model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format
- `additional_models`: optional list of strings, list of fallback models

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

- `model`: string, required, model identifier string that can be loaded by `load_chat_model`. Can be specified in "provider:model-name" format
- `tools`: optional list of BaseTool, tool list

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

- `router_model`: Model for routing, accepts string type (loaded using `load_chat_model`) or directly passed ChatModel
- `model_list`: Model list, each model needs to contain `model_name` and `model_description` keys, and can optionally include `tools`, `model_kwargs`, `model_system_prompt` keys, representing the tools available to the model (defaults to all tools if not provided), additional parameters passed to the model (e.g., temperature, top_p, etc.), and the model's system prompt respectively.
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

- `plan`: optional list type, plan list
- `plan.content`: plan content
- `plan.status`: plan status, values are `pending`, `in_progress`, `done`

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
