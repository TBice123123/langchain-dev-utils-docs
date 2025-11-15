# Middleware

> [!NOTE]
>
> **Overview**: Utility components designed to facilitate Agent development.
>
> **Prerequisites**: Familiarity with LangChain's [Middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

Middleware are components specifically built for LangChain’s pre-built Agents. The official LangChain library provides several built-in middleware. This library extends that functionality by offering additional middleware tailored to practical use cases and our specific requirements. These can be broadly categorized into:

- Enhanced wrappers around official middleware
- Custom middleware developed within this library

## Wrapped Official Middleware

These are refined versions of LangChain’s official middleware, similar in spirit to this library’s `create_agent` function. They support specifying models via strings compatible with `load_chat_model` (model registration is required).

The following four middleware are currently provided:

- `SummarizationMiddleware`
- `LLMToolSelectorMiddleware`
- `ModelFallbackMiddleware`
- `LLMToolEmulator`

### SummarizationMiddleware

Its core purpose is to compress conversation history, identical in functionality to the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only accepts model specifications as strings.

**Usage Example**:

```python
from langchain_core.messages import AIMessage
from langchain_dev_utils.agents.middleware import SummarizationMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        SummarizationMiddleware(
            model="vllm:qwen3-4b",
            max_tokens_before_summary=100,
            messages_to_keep=1,
        )
    ],
    system_prompt="You are an intelligent AI assistant capable of solving user problems.",
)
# big_text is a placeholder for a large block of text
big_messages = [
    HumanMessage(content="Hello, who are you?"),
    AIMessage(content="I'm your AI assistant."),
    HumanMessage(content="Write a beautiful long passage."),
    AIMessage(content=f"Sure, here is a beautiful long passage: {big_text}"),
    HumanMessage(content="Why did you write this long passage?"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

### LLMToolSelectorMiddleware

Designed for scenarios with many tools, this middleware uses an LLM to select the most relevant subset before invoking the main model—functionally identical to the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector), but only accepts string-based model specs.

**Usage Example**:

```python
from langchain_dev_utils.agents.middleware import LLMToolSelectorMiddleware

@tool
def get_current_weather() -> str:
    """Get current weather."""
    return "Sunny today"

@tool
def search() -> str:
    """Perform a search."""
    return "Search results"

@tool
def run_python() -> str:
    """Execute Python code."""
    return "Python executed"

agent = create_agent(
    "vllm:qwen3-4b",
    tools=[get_current_time, get_current_weather, search, run_python],
    name="agent",
    middleware=[
        LLMToolSelectorMiddleware(model="vllm:qwen3-4b", max_tools=2),
    ],
)

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

### ModelFallbackMiddleware

This middleware enables fallback to alternative models when the primary model fails—functionally equivalent to the official [ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback), but restricted to string-based model identifiers.

**Usage Example**:

```python
from langchain_dev_utils.agents.middleware import ModelFallbackMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        ModelFallbackMiddleware(
           "vllm:qwen3-8b",
           "openrouter:meta-llama/llama-3.3-8b-instruct:free",
        )
    ],
)

response = agent.invoke({"messages": [HumanMessage(content="Hello.")]})
print(response)
```

### LLMToolEmulator

This middleware simulates tool execution using an LLM for testing or prototyping—identical to the official [LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator), but only accepts string-based model specs.

**Usage Example**:

```python
from langchain_dev_utils.agents.middleware import LLMToolEmulator

agent = create_agent(
    model="vllm:qwen3-4b",
    tools=[get_current_time],
    middleware=[
        LLMToolEmulator(
            model="vllm:qwen3-4b"
        )
    ],
)

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

## Custom Middleware in This Library

### PlanMiddleware

A middleware for **task planning**, enabling structured decomposition and process management for complex tasks.

::: tip 📝  
Task planning is an effective context engineering strategy. Before executing a task, the LLM first breaks it down into an ordered list of subtasks (called a _plan_ in this library). It then executes these subtasks sequentially, dynamically updating their status after each step until completion.
:::

This middleware serves a similar purpose to LangChain’s official [Planning Middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning), but differs in tool design. The official version provides only a `write_todo` tool for managing a todo list, whereas this library offers three specialized tools for managing a _plan list_:

- `write_plan`: create or update the plan
- `finish_sub_plan`: mark a subtask as completed
- `read_plan`: query the current plan

These correspond to the following factory functions:

- `create_write_plan_tool()`: creates a tool for writing/updating plans
- `create_finish_sub_plan_tool()`: creates a tool for marking subtasks as finished
- `create_read_plan_tool()`: creates a tool for reading the current plan

Each function accepts the following optional parameters:

<Params  
name="description"  
type="string"  
description="Tool description. If omitted, a default description is used."  
:required="false"  
:default="null"  
/>  
<Params  
name="message_key"  
type="string"  
description="Key used to update the messages field. Defaults to 'messages' if not provided. (Not applicable to read_plan.)"  
:required="false"  
:default="null"  
/>

**Basic Usage**:

```python
from langchain_dev_utils.agents.middleware.plan import (
    create_write_plan_tool,
    create_finish_sub_plan_tool,
    create_read_plan_tool,
    PlanState,
)

agent = create_agent(
    model="vllm:qwen3-4b",
    state_schema=PlanState,
    tools=[create_write_plan_tool(), create_finish_sub_plan_tool(), create_read_plan_tool()],
)
```

> ⚠️ **Note**: To use these tools, your state schema **must** include a `plan` key. You can inherit from the provided `PlanState` to ensure compatibility.

However, **direct use of these individual tools is discouraged**. Instead, use `PlanMiddleware`, which handles everything automatically.

**PlanMiddleware Parameters**:

<Params  
name="system_prompt"  
type="string"  
description="Optional system prompt."  
:required="false"  
:default="null"  
/>  
<Params  
name="write_plan_tool_description"  
type="string"  
description="Description for the write_plan tool."  
:required="false"  
:default="null"  
/>  
<Params  
name="finish_sub_plan_tool_description"  
type="string"  
description="Description for the finish_sub_plan tool."  
:required="false"  
:default="null"  
/>  
<Params  
name="read_plan_tool_description"  
type="string"  
description="Description for the read_plan tool."  
:required="false"  
:default="null"  
/>  
<Params  
name="use_read_plan_tool"  
type="bool"  
description="Whether to enable the read_plan tool."  
:required="false"  
:default="true"  
/>

**Recommended Usage**:

```python
from langchain_dev_utils.agents.middleware import PlanMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        PlanMiddleware(
            use_read_plan_tool=True,  # Set to False to disable read_plan
        )
    ],
)

response = agent.invoke(
    {"messages": [HumanMessage(content="I'm going to New York for a few days. Help me plan my itinerary.")]}
)
print(response)
```

`PlanMiddleware` **requires** `write_plan` and `finish_sub_plan`. The `read_plan` tool is enabled by default but can be disabled via `use_read_plan_tool=False`.

<BestPractice>  
In most cases, **use `PlanMiddleware` directly** instead of manually integrating the three underlying tools. The middleware automatically manages prompts and agent state, significantly reducing complexity.
</BestPractice>

### ModelRouterMiddleware

`ModelRouterMiddleware` dynamically **routes requests to the most suitable model** based on input content. A dedicated “router model” analyzes the user query and selects the best model from a predefined list.

**Parameters**:

<Params  
name="router_model"  
type="BaseChatModel | string"  
description="The model used to make routing decisions. Can be a string (e.g., 'vllm:qwen3-4b', loaded via load_chat_model) or an instantiated BaseChatModel."  
:required="true"  
:default="null"  
/>  
<Params  
name="model_list"  
type="list[dict]"  
description="A list of model configurations. Each dict must include 'model_name' (str) and 'model_description' (str), and may optionally include 'tools' (list[BaseTool]), 'model_kwargs' (dict), and 'model_system_prompt' (str)."  
:required="true"  
:default="null"  
/>  
<Params  
name="router_prompt"  
type="string"  
description="Custom prompt for the router model. If None (default), a built-in template is used."  
:required="false"  
:default="null"  
/>

**Usage Example**

First, define your model list:

```python
model_list = [
    {
        "model_name": "vllm:qwen3-8b",
        "model_description": "Suitable for general tasks like chatting and text generation",
        "model_kwargs": {
            "temperature": 0.7,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": False}}
        },
        "model_system_prompt": "You are an assistant skilled at general tasks such as conversation and text generation.",
    },
    {
        "model_name": "openrouter:qwen/qwen3-vl-32b-instruct",
        "model_description": "Optimized for vision-related tasks",
        "tools": [],  # Explicitly disable all tools
    },
    {
        "model_name": "openrouter:qwen/qwen3-coder-plus",
        "model_description": "Specialized for code generation",
        "tools": [run_python_code],  # Only allow run_python_code
    },
]
```

Then enable the middleware when creating the agent:

```python
from langchain_dev_utils.agents.middleware import ModelRouterMiddleware
from langchain_core.messages import HumanMessage

agent = create_agent(
    model="vllm:qwen3-4b",  # Placeholder; actual model is selected dynamically
    tools=[run_python_code, get_current_time],
    middleware=[
        ModelRouterMiddleware(
            router_model="vllm:qwen3-4b",
            model_list=model_list,
        )
    ],
)

# The middleware automatically selects the best model based on input
response = agent.invoke({"messages": [HumanMessage(content="Write a bubble sort algorithm for me.")]})
print(response)
```

With `ModelRouterMiddleware`, you can easily build a multi-model, multi-capability Agent that auto-selects the optimal model per task, enhancing both quality and efficiency.

::: tip Tool Permission Rules  
Tool access for each model in `model_list` is controlled by its `tools` field as follows:

- **Not specified**: Inherits all tools passed to `create_agent(tools=...)`.
- **Empty list `[]`**: All tools are explicitly disabled.
- **Non-empty list `[tool1, tool2, ...]`**: Acts as a _whitelist_—only these tools are allowed. All listed tools must already be registered in `create_agent(tools=...)`.

:::
