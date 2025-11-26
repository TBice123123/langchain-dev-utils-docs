# Middleware

> [!NOTE]
>
> **Feature Overview**: Provides utilities for convenient Agent development.
>
> **Prerequisites**: Understanding of LangChain's [middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

## Overview

Middleware is components specifically built for `langchain` pre-built Agents. The official library provides some built-in middleware. This library, based on actual needs and usage scenarios, offers additional middleware. These can be broadly categorized into further encapsulations of official middleware and custom middleware from this library.

## Encapsulation of Official Middleware

Further encapsulation of official middleware, similar to this library's `create_agent` function, supports specifying models supported by `load_chat_model` through strings (requires prior registration).
Specifically, there are four middleware components:

- SummarizationMiddleware
- LLMToolSelectorMiddleware
- ModelFallbackMiddleware
- LLMToolEmulator

### SummarizationMiddleware

The core function is to compress conversation content, with functionality identical to the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only allows specifying models through string parameters.

Usage example:

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
    system_prompt="You are an intelligent AI assistant that can solve user problems",
)
# big_text is a text containing a lot of content, omitted here
big_messages = [
    HumanMessage(content="Hello, who are you"),
    AIMessage(content="I'm your AI assistant"),
    HumanMessage(content="Write a beautiful long text"),
    AIMessage(content=f"Sure, I'll write a beautiful long text, the content is: {big_text}"),
    HumanMessage(content="Why did you write this long text?"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

### LLMToolSelectorMiddleware

The core function is to let the LLM select tools when dealing with a large number of tools, with functionality identical to the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector). However, it also only allows specifying models through strings.

Usage example:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolSelectorMiddleware,
)

@tool
def get_current_time() -> str:
    """Get current time"""
    return "14:00"

@tool
def get_current_weather() -> str:
    """Get current weather"""
    return "Today's weather is sunny"

@tool
def search() -> str:
    """Search"""
    return "Search results"

@tool
def run_python() -> str:
    """Run Python code"""
    return "Running Python code"


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

Middleware for falling back to a backup model when calling a model fails. Functionality is identical to the official [ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback). However, it also only allows specifying models through strings.

Usage example:

```python
from langchain_dev_utils.agents.middleware import (
    ModelFallbackMiddleware,
)

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

Middleware for using large models to simulate tool calls. Functionality is identical to the official [LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator). However, it also only allows specifying models through strings.

Usage example:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolEmulator,
)

agent = create_agent(
    model="vllm:qwen3-4b",
    tools=[get_current_time],
    middleware=[
        LLMToolEmulator(
            model="vllm:qwen3-4b"
        )
    ],
)

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]}),
print(response)
```

## Custom Middleware from This Library

### PlanMiddleware

Middleware for task planning, used for structured decomposition and process management before executing complex tasks.

::: tip 📝
Task planning is an efficient context engineering management strategy. Before executing a task, the large model first breaks down the overall task into multiple ordered subtasks, forming a task planning list (called a plan in this library). Then it executes each subtask in order and dynamically updates the task status after completing each step until all subtasks are completed.
:::

This middleware has similar functionality to the [Plan middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning) provided by LangChain official, but there are differences in tool design. The official middleware only provides the `write_todo` tool, targeting a todo list structure; while this library provides three specialized tools: `write_plan`, `finish_sub_plan`, and `read_plan`, specifically for writing, modifying, and querying planning lists.

Whether it's `todo` or `plan`, their essence is the same, so the key difference between this middleware and the official one lies in the tools provided. The official addition and modification are completed through one tool, while this library provides three tools, where `write_plan` can be used to write or update plan content, `finish_sub_plan` is used to update the status after completing a subtask, and `read_plan` is used to query plan content.

Specifically, these are the three functions:

- `create_write_plan_tool`: Function to create a tool for writing plans
- `create_finish_sub_plan_tool`: Function to create a tool for completing subtasks
- `create_read_plan_tool`: Function to create a tool for querying plans

The parameters received by these three functions are as follows:

<Params
name="description"
type="string"
description="Tool description, if not provided, the default tool description is used."
:required="false"
:default="null"
/>
<Params
name="message_key"
type="string"
description="Key for updating messages, if not provided, the default messages is used (read_plan tool has no this parameter)."
:required="false"
:default="null"
/>

Usage example is as follows:

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

Note that to use these three tools, you must ensure that the state Schema contains the plan key, otherwise an error will occur. For this, you can use the `PlanState` provided by this library to inherit the state Schema.

However, the above usage method is not recommended in this library. The best practice should be using PlanMiddleware.
The parameters of PlanMiddleware are described as follows:

<Params
name="system_prompt"
type="string"
description="Optional string type, system prompt."
:required="false"
:default="null"
/>
<Params 
name="write_plan_tool_description"
type="string"
description="Optional string type, description of the write plan tool."
:required="false"
:default="null"
/>
<Params 
name="finish_sub_plan_tool_description"
type="string"
description="Optional string type, description of the finish sub plan tool."
:required="false"
:default="null"
/>
<Params 
name="read_plan_tool_description"
type="string"
description="Optional string type, description of the read plan tool."
:required="false"
:default="null"
/>
<Params 
name="use_read_plan_tool"
type="bool"
description="Optional boolean type, whether to use the read plan tool."
:required="false"
:default="true"
/>
<Params 
name="message_key"
type="string"
description="Key for updating messages, if not provided, the default messages is used."
:required="false"
:default="null"
/>

```python
from langchain_dev_utils.agents.middleware import PlanMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        PlanMiddleware(
            use_read_plan_tool=True, #If you don't want to use the read plan tool, you can set this parameter to False
        )
    ],
)

response = agent.invoke(
    {"messages": [HumanMessage(content="I want to visit New York for a few days, help me plan my itinerary")]}
)
print(response)
```

`PlanMiddleware` requires the use of both `write_plan` and `finish_sub_plan` tools, while the `read_plan` tool is enabled by default; if not needed, the `use_read_plan_tool` parameter can be set to `False`.

<BestPractice>
In most cases, it is recommended to directly use PlanMiddleware to implement task decomposition and execution, rather than manually calling the three underlying tools (write_plan, finish_sub_plan, read_plan). The middleware has automatically handled prompt construction and agent state management, significantly reducing usage complexity.
</BestPractice>

### ModelRouterMiddleware

`ModelRouterMiddleware` is a middleware for **dynamically routing to the most suitable model based on input content**. It analyzes user requests through a "router model" and selects the most appropriate model from a predefined list of models to handle the current task.

Its parameters are as follows:

<Params
name="router_model"
type="BaseChatModel | string"
description="Model for executing routing decisions. Can pass a string (will be automatically loaded via load_chat_model), e.g., vllm:qwen3-4b; or directly pass an instantiated BaseChatModel object."
:required="true"
:default="null"
/>
<Params
name="model_list"
type="list[dict]"
description="A list of model configurations, each element is a dictionary, must contain model_name (str), model_description (str), and optional tools (list[BaseTool]), model_kwargs (dict), model_system_prompt (str)."
:required="true"
:default="null"
/>
<Params
name="router_prompt"
type="string"
description="Custom prompt for the routing model. If None (default), the built-in default prompt template is used."
:required="false"
:default="null"
/>

**Usage Example**

First define the model list:

```python
model_list = [
    {
        "model_name": "vllm:qwen3-8b",
        "model_description": "Suitable for general tasks, such as conversation, text generation, etc.",
        "model_kwargs": {
            "temperature": 0.7,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": False}}
        },
        "model_system_prompt": "You are an assistant, good at handling general tasks, such as conversation, text generation, etc.",
    },
    {
        "model_name": "openrouter:qwen/qwen3-vl-32b-instruct",
        "model_description": "Suitable for vision tasks",
        "tools": [],  # If this model doesn't need any tools, set this field to an empty list []
    },
    {
        "model_name": "openrouter:qwen/qwen3-coder-plus",
        "model_description": "Suitable for code generation tasks",
        "tools": [run_python_code],  # Only allow using run_python_code tool
    },
]
```

Then enable the middleware when creating the agent:

```python
from langchain_dev_utils.agents.middleware import ModelRouterMiddleware
from langchain_core.messages import HumanMessage

agent = create_agent(
    model="vllm:qwen3-4b",  # This model is just a placeholder, actually dynamically replaced by middleware
    tools=[run_python_code, get_current_time],
    middleware=[
        ModelRouterMiddleware(
            router_model="vllm:qwen3-4b",
            model_list=model_list,
        )
    ],
)

# The routing middleware will automatically select the most suitable model based on input content
response = agent.invoke({"messages": [HumanMessage(content="Help me write a bubble sort code")]})
print(response)
```

Through `ModelRouterMiddleware`, you can easily build a multi-model, multi-capability Agent that automatically selects the optimal model based on task type, improving response quality and efficiency.

::: info Tool Permission Configuration  
The tool permissions for each model in `model_list` are determined by its `tools` field configuration, which follows these rules:

- **When undefined**: The model inherits all tools loaded by the `tools` parameter of `create_agent`.
- **When defined as an empty list []**: The model is explicitly disabled from all tools.
- **When defined as a non-empty list [tool1, tool2, ...]**: This list acts as a "tool whitelist", strictly limiting the model to only call tools within the list. All tools specified here must have been preloaded into the `tools` parameter of `create_agent`.

:::