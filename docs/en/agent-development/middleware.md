# Middleware

> [!NOTE]
>
> **Overview**: Provides utility tools to facilitate Agent development.
>
> **Prerequisites**: Familiarity with LangChain's [middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

Middleware components are specifically designed for LangChain’s prebuilt Agents. The official LangChain library provides several built-in middleware implementations. This library extends that foundation by offering additional middleware tailored to our specific use cases and requirements.

These can be broadly categorized into:
- Enhanced wrappers around official middleware
- Custom middleware developed specifically for this library

## Wrapped Official Middleware

We provide enhanced wrappers for certain official middleware components, similar in spirit to our `create_agent` function. These wrappers support specifying models via strings compatible with `load_chat_model` (model registration is required).

The following four middleware classes are included:

- `SummarizationMiddleware`
- `LLMToolSelectorMiddleware`
- `ModelFallbackMiddleware`
- `LLMToolEmulator`

### SummarizationMiddleware

This middleware compresses conversation history, providing identical functionality to the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization), but only accepts model names as strings.

**Usage Example**:

```python
from langchain_core.messages import AIMessage
from langchain_dev_utils.agents.middleware import SummarizationMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        SummarizationMiddleware(
            model="vllm:qwen3-4b",
            trigger=("tokens", 50),
            keep=("messages", 1),
        )
    ],
    system_prompt="You are an intelligent AI assistant capable of solving user problems.",
)
# big_text is a placeholder for a large block of content
big_messages = [
    HumanMessage(content="Hello, who are you?"),
    AIMessage(content="I'm your AI assistant."),
    HumanMessage(content="Write a beautiful long passage."),
    AIMessage(content=f"Sure, here's a beautiful long passage: {big_text}"),
    HumanMessage(content="Why did you write such a long passage?"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

### LLMToolSelectorMiddleware

When many tools are available, this middleware uses an LLM to select the most relevant subset—functionally equivalent to the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector), but only accepts string-based model identifiers.

**Usage Example**:

```python
from langchain_dev_utils.agents.middleware import LLMToolSelectorMiddleware

@tool
def get_current_time() -> str:
    """Get the current time"""
    return "14:00"

@tool
def get_current_weather() -> str:
    """Get the current weather"""
    return "Sunny today"

@tool
def search() -> str:
    """Perform a search"""
    return "Search results"

@tool
def run_python() -> str:
    """Execute Python code"""
    return "Python code executed"

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

This middleware enables fallback to alternative models if the primary model fails—functionally identical to the official [ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback), but only supports string-based model specification.

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

This middleware uses an LLM to simulate tool execution—functionally equivalent to the official [LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator), but only accepts model names as strings.

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

A middleware for structured task decomposition and execution management in complex workflows.

::: tip 📝  
Task planning is an effective context engineering strategy. Before executing a complex task, the LLM first decomposes it into an ordered list of subtasks (referred to as a *plan* in this library). It then executes these subtasks sequentially, dynamically updating their status after each step until completion.
:::

This middleware serves a similar purpose to LangChain’s official [Planning middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning), but differs in its tool design. The official version provides only a `write_todo` tool for managing a simple todo list, whereas this library offers three specialized tools for managing a *plan list*:  
- `write_plan`: Create or update the plan  
- `finish_sub_plan`: Mark a subtask as completed  
- `read_plan`: Query the current plan  

These correspond to the following factory functions:

- `create_write_plan_tool`: Creates a tool for writing/updating plans  
- `create_finish_sub_plan_tool`: Creates a tool for marking subtasks as finished  
- `create_read_plan_tool`: Creates a tool for reading the current plan  

All three functions accept the following parameters:

<Params
name="description"
type="string"
description="Optional tool description. If not provided, a default description is used."
:required="false"
:default="null"
/>
<Params
name="message_key"
type="string"
description="Key used to update the messages field. Defaults to 'messages' if not specified. (Not applicable to read_plan.)"
:required="false"
:default="null"
/>

**Basic Usage Example**:

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

> ⚠️ **Note**: To use these tools, your state schema **must** include a `plan` key. We recommend using the provided `PlanState` as your base schema.

However, manually assembling these tools is **not recommended**. Instead, use `PlanMiddleware`, which handles everything automatically.

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
description="Optional custom description for the write_plan tool."
:required="false"
:default="null"
/>
<Params 
name="finish_sub_plan_tool_description"
type="string"
description="Optional custom description for the finish_sub_plan tool."
:required="false"
:default="null"
/>
<Params 
name="read_plan_tool_description"
type="string"
description="Optional custom description for the read_plan tool."
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
<Params 
name="message_key"
type="string"
description="Key for updating messages. Defaults to 'messages' if not specified."
:required="false"
:default="null"
/>

**Recommended Usage**:

```python
from langchain_dev_utils.agents.middleware import PlanMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        PlanMiddleware(
            use_read_plan_tool=True,  # Set to False if you don't need read_plan
        )
    ],
)

response = agent.invoke(
    {"messages": [HumanMessage(content="I'm going to New York for a few days—help me plan my itinerary.")]}
)
print(response)
```

`PlanMiddleware` always requires `write_plan` and `finish_sub_plan`. The `read_plan` tool is enabled by default but can be disabled via `use_read_plan_tool=False`.

<BestPractice>
In most cases, directly use `PlanMiddleware` instead of manually managing the three underlying tools. The middleware automatically handles prompt engineering and state management, significantly reducing complexity.
</BestPractice>

### ModelRouterMiddleware

`ModelRouterMiddleware` dynamically selects the most suitable model for a given input by using a dedicated “router model” to analyze the request and choose from a predefined list of candidate models.

**Parameters**:

<Params
name="router_model"
type="BaseChatModel | string"
description="The model used to make routing decisions. Can be a string (e.g., 'vllm:qwen3-4b', loaded via load_chat_model) or an instantiated BaseChatModel object."
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
        "model_description": "Suitable for general tasks like conversation and text generation",
        "model_kwargs": {
            "temperature": 0.7,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": False}}
        },
        "model_system_prompt": "You are an assistant skilled at handling general tasks such as dialogue and text generation.",
    },
    {
        "model_name": "openrouter:qwen/qwen3-vl-32b-instruct",
        "model_description": "Specialized for vision-related tasks",
        "tools": [],  # Explicitly disable all tools
    },
    {
        "model_name": "openrouter:qwen/qwen3-coder-plus",
        "model_description": "Optimized for code generation",
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

# The middleware automatically routes to the best model based on input
response = agent.invoke({"messages": [HumanMessage(content="Write a bubble sort algorithm for me.")]})
print(response)
```

With `ModelRouterMiddleware`, you can easily build a multi-model, multi-capability agent that automatically selects the optimal model for each task, improving both quality and efficiency.

::: info Tool Permission Rules  
Tool access for each model in `model_list` is controlled by its `tools` field, following these rules:

- **If undefined**: The model inherits all tools passed to `create_agent(tools=...)`.
- **If set to empty list `[]`**: All tools are explicitly disabled for this model.
- **If set to a non-empty list `[tool1, tool2, ...]`**: Acts as a whitelist—only the listed tools can be used. All listed tools must already be registered in `create_agent(tools=...)`.

:::