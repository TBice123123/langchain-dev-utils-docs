# Middleware

> [!NOTE]
>
> **Function Overview**: Provides practical tools for convenient Agent development.
>
> **Prerequisites**: Understanding of LangChain's [middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 12 minutes

## Overview

Middleware is a component specifically built for LangChain's pre-built Agents. The official documentation provides some built-in middleware. This library offers additional middleware based on practical needs and usage scenarios within this library.
These can be roughly divided into further encapsulations of official middleware and custom middleware developed for this library.

## Encapsulation of Official Middleware

Further encapsulation of official middleware, similar to this library's `create_agent` function, supports specifying models through strings that are supported by `load_chat_model` (requires registration).
Specifically, there are the following four middleware components:

- SummarizationMiddleware
- LLMToolSelectorMiddleware
- ModelFallbackMiddleware
- LLMToolEmulator

### SummarizationMiddleware

The core function is to compress conversation content, aligned with the official **SummarizationMiddleware** functionality. However, it only allows specifying models through string parameters.

Usage Example:

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
    AIMessage(content="I am your AI assistant"),
    HumanMessage(content="Write a beautiful long text"),
    AIMessage(content=f"Sure, I'll write a beautiful long text, the content is: {big_text}"),
    HumanMessage(content="Why did you write this long text?"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

### LLMToolSelectorMiddleware

The core function is to let the LLM select tools when there are many tools available, aligned with the official **LLMToolSelectorMiddleware** functionality. However, it also only allows specifying models through string parameters.

Usage Example:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolSelectorMiddleware,
)

@tool
def get_current_time() -> str:
    """Get the current time"""
    return "14:00"

@tool
def get_current_weather() -> str:
    """Get the current weather"""
    return "Today is sunny"

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

Middleware for falling back to a backup model when calling the model fails. Aligned with the official **ModelFallbackMiddleware** functionality. However, it also only allows specifying models through string parameters.

Usage Example:

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

Middleware for using a large model to simulate tool calls. Aligned with the official **LLMToolEmulator** functionality. However, it also only allows specifying models through string parameters.

Usage Example:

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

## Custom Middleware of This Library

### PlanMiddleware

Middleware for task planning, used for structured decomposition and process management before executing complex tasks.

::: tip 📝
Task planning is an efficient context engineering management strategy. Before executing a task, the large model first breaks down the overall task into multiple ordered subtasks, forming a task planning list (called a plan in this library). Then, each subtask is executed in sequence, and the task status is dynamically updated after completing each step until all subtasks are finished.
:::

Parameters of `PlanMiddleware` are as follows:

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
description="Optional string type, description of the finish sub-plan tool."
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

**Usage Example**:

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

`PlanMiddleware` requires the use of two tools: `write_plan` and `finish_sub_plan`, while the `read_plan` tool is enabled by default; if not needed, the `use_read_plan_tool` parameter can be set to `False`.

This middleware is similar in functionality to LangChain's official **To-do list middleware**, but there are differences in tool design. The official middleware only provides a `write_todo` tool, targeting the todo list structure; while this library provides three specialized tools: `write_plan`, `finish_sub_plan`, and `read_plan`, specifically for writing, modifying, and querying plan lists.

Whether it's `todo` or `plan`, their essence is the same, so the key difference between this middleware and the official one lies in the tools provided. The official one completes addition and modification through one tool, while this library provides three tools, where `write_plan` can be used to write or update plan content, `finish_sub_plan` is used to update the status after completing a subtask, and `read_plan` is used to query plan content.

At the same time, this library also provides three functions to create the above three tools:

- `create_write_plan_tool`: Function to create a tool for writing plans
- `create_finish_sub_plan_tool`: Function to create a tool for completing subtasks
- `create_read_plan_tool`: Function to create a tool for querying plans

Parameters received by these three functions are as follows:

<Params
name="description"
type="string"
description="Tool description, if not passed, the default tool description will be used."
:required="false"
:default="null"
/>
<Params
name="message_key"
type="string"
description="Key for updating messages, if not passed, the default messages will be used (read_plan tool does not have this parameter)."
:required="false"
:default="null"
/>

**Usage Example**:

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

It should be noted that to use these three tools, you must ensure that the state Schema contains the plan key, otherwise an error will be reported. For this, you can use the `PlanState` provided by this library to inherit the state Schema.

<BestPractice>

I. When using <code>create_agent</code>:

It is recommended to directly use <code>PlanMiddleware</code> instead of manually passing the three tools <code>write_plan</code>, <code>finish_sub_plan</code>, and <code>read_plan</code>.

Reason: The middleware has automatically handled prompt construction and agent state management, which can significantly reduce usage complexity.

Note: Since the model output of <code>create_agent</code> is fixed to update to the <code>messages</code> key, <code>PlanMiddleware</code> does not have a <code>message_key</code> parameter.

II. When using <code>langgraph</code>:

It is recommended to directly use these three tools (<code>write_plan</code>, <code>finish_sub_plan</code>, <code>read_plan</code>).

Reason: This approach can better integrate with the custom nodes and state management of <code>langgraph</code>.
</BestPractice>

### ModelRouterMiddleware

`ModelRouterMiddleware` is a middleware for **dynamically routing to the most suitable model based on input content**. It analyzes user requests through a "routing model" and selects the most suitable model from a predefined list of models to handle the current task.

Its parameters are as follows:

<Params
name="router_model"
type="BaseChatModel | string"
description="Model used to execute routing decisions. Can pass a string (will be automatically loaded via load_chat_model), such as vllm:qwen3-4b; or directly pass an instantiated BaseChatModel object."
:required="true"
:default="null"
/>
<Params
name="model_list"
type="list[dict]"
description="A list of model configurations, each element is a dictionary, needs to include model_name (str), model_description (str), and optional tools (list[BaseTool]), model_kwargs (dict), model_system_prompt (str)."
:required="true"
:default="null"
/>
<Params
name="router_prompt"
type="string"
description="Custom prompt for the routing model. If None (default), the built-in default prompt template will be used."
:required="false"
:default="null"
/>

**Usage Example**

First define the model list:

```python
model_list = [
    {
        "model_name": "vllm:qwen3-8b",
        "model_description": "Suitable for ordinary tasks, such as dialogue, text generation, etc.",
        "model_kwargs": {
            "temperature": 0.7,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": False}}
        },
        "model_system_prompt": "You are an assistant, good at handling ordinary tasks, such as dialogue, text generation, etc.",
    },
    {
        "model_name": "openrouter:qwen/qwen3-vl-32b-instruct",
        "model_description": "Suitable for visual tasks",
        "tools": [],  # If this model does not need any tools, please set this field to an empty list []
    },
    {
        "model_name": "openrouter:qwen/qwen3-coder-plus",
        "model_description": "Suitable for code generation tasks",
        "tools": [run_python_code],  # Only allow the use of run_python_code tool
    },
]
```

Then enable the middleware when creating the agent:

```python
from langchain_dev_utils.agents.middleware import ModelRouterMiddleware
from langchain_core.messages import HumanMessage

agent = create_agent(
    model="vllm:qwen3-4b",  # This model is only a placeholder, actually dynamically replaced by the middleware
    tools=[run_python_code, get_current_time],
    middleware=[
        ModelRouterMiddleware(
            router_model="vllm:qwen3-4b",
            model_list=model_list,
        )
    ],
)

# The routing middleware will automatically select the most suitable model based on the input content
response = agent.invoke({"messages": [HumanMessage(content="Help me write a bubble sort code")]})
print(response)
```

Through `ModelRouterMiddleware`, you can easily build a multi-model, multi-capability Agent that automatically selects the optimal model based on task type, improving response quality and efficiency.

::: info Tool Permission Configuration  
The tool permissions for each model in `model_list` are determined by its `tools` field configuration, which follows these rules:

- **When undefined**: The model inherits all tools loaded by the `tools` parameter of `create_agent`.
- **Defined as an empty list []**: The model is explicitly disabled from all tools.
- **Defined as a non-empty list [tool1, tool2, ...]**: This list serves as a "tool whitelist", strictly limiting the model to only call tools within the list. All tools specified here must have been pre-loaded into the `tools` parameter of `create_agent`.

:::

### ToolCallRepairMiddleware

`ToolCallRepairMiddleware` is a middleware for **automatically repairing invalid tool calls (`invalid_tool_calls`) generated by large models**. Generally, invalid tool calls generated by large models are often due to their output of incorrect JSON format, causing LangChain to ultimately fail parsing. This middleware will check whether the `invalid_tool_calls` field exists in the model output after the model output. If so, it will attempt to use the `json-repair` tool to fix it.

**Note**: When using this middleware, you must install the standard version of the `langchain-dev-utils` library. For details, please refer to [Installation](../installation.md).

This middleware does not require any parameters to be passed during initialization and can be used directly.

**Usage Example**:

```python
from langchain_dev_utils.agents.middleware import ToolCallRepairMiddleware

agent = create_agent(
    model="vllm:qwen3-4b",
    tools=[run_python_code, get_current_time],
    middleware=[
        ToolCallRepairMiddleware()
    ],
)
```

::: warning Note
This middleware cannot guarantee 100% repair of all invalid tool calls; the actual effect depends on the repair capability of `json-repair`. Additionally, it only acts on invalid tool call content in the `invalid_tool_calls` field.
:::
