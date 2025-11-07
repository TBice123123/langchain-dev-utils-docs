# Middleware

> [!NOTE]
>
> **Feature Overview**: Provides utilities for convenient Agent development.
>
> **Prerequisites**: Understanding of langchain's [middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

Middleware is a component specifically built for `langchain` pre-built Agents. The official documentation provides some built-in middleware. This library, based on actual needs and use cases, offers additional middleware. These can be roughly categorized as further encapsulations of official middleware and custom middleware from this library.

## Encapsulation of Official Middleware

Further encapsulation of official middleware provides more convenient usage. There are four specific middleware:

- SummarizationMiddleware
- LLMToolSelectorMiddleware
- ModelFallbackMiddleware
- LLMToolEmulator

### SummarizationMiddleware

Its core function is to compress conversation content, with functionality completely consistent with the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only allows string parameters to specify the model (similar to `create_agent` in this library, where the model selection range is wider but requires registration).

Usage example:

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
    system_prompt="You are an intelligent AI assistant that can solve user problems",
)
# big_text is a text containing a large amount of content, omitted here
big_messages = [
    HumanMessage(content="Hello, who are you"),
    AIMessage(content="I am your AI assistant"),
    HumanMessage(content="Write a beautiful long text"),
    AIMessage(content=f"Okay, I will write a beautiful long text, the content is: {big_text}"),
    HumanMessage(content="Why did you write this long text?"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

### LLMToolSelectorMiddleware

Its core function is to allow the LLM to select tools when dealing with a large number of tools, with functionality completely consistent with the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector). However, it also only allows string parameters to specify the model (similar to `create_agent` in this library, where the model selection range is wider but requires registration).

Usage example:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolSelectorMiddleware,
)

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

Middleware used to fall back to a backup model when the model call fails. Functionality is completely consistent with the official [ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback). However, it also only allows string parameters to specify the model (similar to `create_agent` in this library, where the model selection range is wider but requires registration).

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

response = agent.invoke({"messages": [HumanMessage(content="Hello.")]}),
print(response)
```

### LLMToolEmulator

Middleware for using large models to simulate tool calls. Functionality is completely consistent with the official [LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator). However, it also only allows string parameters to specify the model (similar to `create_agent` in this library, where the model selection range is wider but requires registration).

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
Task planning is an efficient context engineering management strategy. Before executing a task, the large model first breaks down the overall task into multiple ordered subtasks, forming a task planning list (called a plan in this library). Then it executes each subtask in order, and dynamically updates the task status after completing each step, until all subtasks are executed.
:::

This middleware has similar functionality to the [Plan middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning) provided by LangChain official, but there are differences in tool design. The official middleware only provides the `write_todo` tool, which is oriented towards a todo list structure; while this library provides three dedicated tools: `write_plan`, `finish_sub_plan`, and `read_plan`, specifically used for writing, modifying, and querying plan lists.

Whether it's `todo` or `plan`, their essence is the same, so the key difference between this middleware and the official one lies in the tools provided. The official addition and modification are completed through one tool, while this library provides three tools, where `write_plan` can be used to write or update plan content, `finish_sub_plan` is used to update the status after completing a subtask, and `read_plan` is used to query plan content.

Specifically, there are the following three functions:

- `create_write_plan_tool`: Function to create a tool for writing plans
- `create_finish_sub_plan_tool`: Function to create a tool for completing subtasks
- `create_read_plan_tool`: Function to create a tool for querying plans

The parameters received by these three functions are as follows:

<Params :params="[
{
name: 'description',
type: 'str',
description: 'Tool description. If not passed, the default tool description will be used.',
required: false,
},
{
name: 'message_key',
type: 'str',
description: 'Key for updating messages. If not passed, the default messages will be used (read_plan tool does not have this parameter).',
required: false,
},
]"/>

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

It should be noted that to use these three tools, you must ensure that the state Schema contains the plan key, otherwise an error will be reported. For this, you can use the `PlanState` provided by this library to inherit the state Schema.

However, the above usage method is not recommended in this library. The best practice should be to use PlanMiddleware.
The parameter description of PlanMiddleware is as follows:

<Params :params="[
{
name: 'system_prompt',
type: 'str',
description: 'Optional string type, system prompt, functionally the same as the official TodoListMiddleware.',
required: false,
},
{
name: 'tools',
type: 'list[BaseTool]',
description: 'Optional BaseTool list type, tool list. If specified, it will be added to tools. Must be tools created by create_write_plan_tool, create_finish_sub_plan_tool, and create_read_plan_tool.',
required: false,
},
]"/>

```python
from langchain_dev_utils.agents.middleware import (
    create_write_plan_tool,
    create_finish_sub_plan_tool,
    create_read_plan_tool,
    PlanMiddleware,
)


agent = create_agent(
    model="vllm:qwen3-4b",
    middleware=[
        PlanMiddleware(
            tools=[create_write_plan_tool(), create_finish_sub_plan_tool(), create_read_plan_tool()],
        )
    ],
)


response = agent.invoke(
    {"messages": [HumanMessage(content="I want to travel to New York for a few days, help me plan the itinerary")]}
)
print(response)
```

**Note:**

1. Both parameters of `PlanMiddleware` are optional. If no parameters are passed, the system will use `_DEFAULT_PLAN_SYSTEM_PROMPT` as the system prompt by default and automatically load the tool set created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool`.

2. For the `tools` parameter, only tools created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool` are supported. Among them, `create_read_plan_tool` is an optional tool. When only the first two are passed, this middleware can still run normally, but it will not have the function of reading the plan.

### ModelRouterMiddleware

`ModelRouterMiddleware` is a middleware used to **dynamically route to the most suitable model based on input content**. It analyzes user requests through a "router model" and selects the most suitable model from a predefined list of models to handle the current task.

Its parameters are as follows:

<Params :params="[
{
name: 'router_model',
type: 'str | BaseChatModel',
description: 'Model used to execute routing decisions. You can pass a string (which will be automatically loaded through load_chat_model), such as vllm:qwen3-4b; or directly pass an instantiated ChatModel object.',
required: true,
},
{
name: 'model_list',
type: 'list[dict]',
description: 'A list of model configurations, each element is a dictionary, needs to contain model_name (str), model_description (str), and optional tools (list[BaseTool]), model_kwargs (dict), model_system_prompt (str).',
required: true,
},
{
name: 'router_prompt',
type: 'str',
description: 'Custom prompt for the routing model. If None (default), the built-in default prompt template will be used.',
required: false,
},
]"/>

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
    model="vllm:qwen3-4b",  # This model is only a placeholder, actually dynamically replaced by middleware
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

::: tip Note  
In `model_list`, the `tools` field in each dictionary is used to control the scope of tools it can use:

- If explicitly passing `[]`, it means this model does not use any tools
- If passing `[tool1, tool2,...]`, it means this model can only use the specified tools
- If not passing the `tools` field, it means this model can use all registered tools

In short: when the `tools` parameter is provided, the model can only use the tools in that list; if the list is empty, the model has no tools available; when this parameter is not provided, the model has access to all tools by default.
:::
