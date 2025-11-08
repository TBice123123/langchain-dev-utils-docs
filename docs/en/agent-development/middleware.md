# Middleware

> [!NOTE]
>
> **Feature Overview**: Provides utility tools to facilitate Agent development.
>
> **Prerequisites**: Understand LangChain's [Middleware](https://docs.langchain.com/oss/python/langchain/middleware).
>
> **Estimated Reading Time**: 10 minutes

Middleware components are specifically built for `langchain` pre-built Agents. The official library provides some built-in middleware. Based on practical scenarios and the usage context of this library, we provide additional middleware.
They can be broadly categorized into further encapsulations of official middleware and custom middleware defined by this library.

## Encapsulated Official Middleware

These are further encapsulations of official middleware, similar to this library's `create_agent` function, supporting model specification via strings that are compatible with `load_chat_model` (requires prior registration).
Specifically, there are four middleware types:

- SummarizationMiddleware
- LLMToolSelectorMiddleware
- ModelFallbackMiddleware
- LLMToolEmulator

### SummarizationMiddleware

The core function is to compress conversation content, with functionality completely consistent with the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only allows string parameters to specify the model.

Usage Example:

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
    HumanMessage(content="Hello, who are you?"),
    AIMessage(content="I am your AI assistant"),
    HumanMessage(content="Write a beautiful long text"),
    AIMessage(content=f"Okay, I will write a beautiful long text, the content is: {big_text}"),
    HumanMessage(content="Why did you write this long text?"),
]
response = agent.invoke({"messages": big_messages})
print(response)
```

### LLMToolSelectorMiddleware

The core function is to allow the LLM to select tools itself when dealing with a large number of tools, with functionality completely consistent with the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector). However, it also only allows string specification for the model.

Usage Example:

```python
from langchain_dev_utils.agents.middleware import (
    LLMToolSelectorMiddleware,
)

@tool
def get_current_weather() -> str:
    """Get the current weather"""
    return "The weather is sunny today"


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

Middleware for falling back to an alternative model when model invocation fails. Functionality is completely consistent with the official [ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback). However, it also only allows string specification for the model.

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

response = agent.invoke({"messages": [HumanMessage(content="Hello.")]}),
print(response)
```

### LLMToolEmulator

Middleware for using large language models to simulate tool calls. Functionality is completely consistent with the official [LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator). However, it also only allows string specification for the model.

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

## Custom Middleware in This Library

### PlanMiddleware

Task planning middleware for structured decomposition and process management before executing complex tasks.

::: tip 📝
Task planning is an efficient context engineering management strategy. Before executing a task, the large language model first breaks down the overall task into multiple ordered subtasks, forming a task planning list (referred to as a plan in this library). It then executes each subtask in sequence, dynamically updating the task status after completing each step until all subtasks are completed.
:::

This middleware is similar in function to the official LangChain [Plan middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning), but differs in tool design. The official middleware only provides the `write_todo` tool, which is oriented towards a todo list structure; whereas this library provides three dedicated tools: `write_plan`, `finish_sub_plan`, and `read_plan`, specifically used for writing, modifying, and querying the planning list (plan list).

Whether it's `todo` or `plan`, their essence is the same. Therefore, the key difference between this middleware and the official one lies in the tools provided. The official one adds and modifies through a single tool, while this library provides three tools: `write_plan` can be used to write a plan or update plan content, `finish_sub_plan` is used to update the status after completing a subtask, and `read_plan` is used to query the plan content.

Specifically, they are represented by the following three functions:

- `create_write_plan_tool`: Function to create a tool for writing plans
- `create_finish_sub_plan_tool`: Function to create a tool for completing subtasks
- `create_read_plan_tool`: Function to create a tool for querying plans

The parameters these three functions receive are as follows:

<Params
name="description"
type="string"
description="Tool description. If not provided, the default tool description is used."
:required="false"
:default="null"
/>
<Params
name="message_key"
type="string"
description="Key used to update messages. If not provided, the default messages are used (read_plan tool does not have this parameter)."
:required="false"
:default="null"
/>

Usage example:

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

Note that to use these three tools, you must ensure that the state Schema contains the `plan` key, otherwise an error will occur. For this, you can use the `PlanState` provided by this library to inherit the state Schema.

However, the usage above is not recommended in this library. The best practice should be to use PlanMiddleware.
The parameters of PlanMiddleware are explained as follows:

<Params
name="system_prompt"
type="string"
description="Optional string type, system prompt."
:required="false"
:default="null"
/>
<Params
name="tools"
type="list[BaseTool]"
description="Optional BaseTool list type, tool list. If specified, they will be added to tools. Must be tools created via create_write_plan_tool, create_finish_sub_plan_tool, and create_read_plan_tool."
:required="false"
:default="null"
/>

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
    {"messages": [HumanMessage(content="I'm going to New York for a few days, help me plan the itinerary")]}
)
print(response)
```

**Note:**

1. Both parameters of `PlanMiddleware` are optional. If no parameters are passed, the system will default to using `_DEFAULT_PLAN_SYSTEM_PROMPT` as the system prompt and automatically load the toolset created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool`.

2. For the `tools` parameter, only tools created using `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool` are supported. Among them, `create_read_plan_tool` is an optional tool; when only the first two are passed, this middleware can still function normally but will not have the ability to read plans.

### ModelRouterMiddleware

`ModelRouterMiddleware` is a middleware used for **dynamically routing to the most suitable model based on input content**. It uses a "router model" to analyze user requests and select the most appropriate model from a predefined model list to process the current task.

Its parameters are as follows:

<Params
name="router_model"
type="BaseChatModel | string"
description="The model used to make routing decisions. Can be a string (will be automatically loaded via load_chat_model), e.g., vllm:qwen3-4b; or directly pass an instantiated BaseChatModel object."
:required="true"
:default="null"
/>
<Params
name="model_list"
type="list[dict]"
description="A list of model configurations, each element is a dictionary that must contain model_name (str), model_description (str), and optionally tools (list[BaseTool]), model_kwargs (dict), model_system_prompt (str)."
:required="true"
:default="null"
/>
<Params
name="router_prompt"
type="string"
description="Custom prompt for the router model. If None (default), the built-in default prompt template is used."
:required="false"
:default="null"
/>

**Usage Example**

First, define the model list:

```python
model_list = [
    {
        "model_name": "vllm:qwen3-8b",
        "model_description": "Suitable for general tasks, such as dialogue, text generation, etc.",
        "model_kwargs": {
            "temperature": 0.7,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": False}}
        },
        "model_system_prompt": "You are an assistant skilled in handling general tasks, such as dialogue, text generation, etc.",
    },
    {
        "model_name": "openrouter:qwen/qwen3-vl-32b-instruct",
        "model_description": "Suitable for visual tasks",
        "tools": [],  # If this model doesn't need any tools, set this field to an empty list []
    },
    {
        "model_name": "openrouter:qwen/qwen3-coder-plus",
        "model_description": "Suitable for code generation tasks",
        "tools": [run_python_code],  # Only allows the use of run_python_code tool
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

With `ModelRouterMiddleware`, you can easily build a multi-model, multi-capability Agent that automatically selects the optimal model based on task type, improving response quality and efficiency.

::: tip Note
In `model_list`, the `tools` field in each dictionary is used to control the range of tools it can use:

- If explicitly passing `[]`, it means the model does not use any tools
- If passing `[tool1, tool2,...]`, it means the model can only use the specified tools
- If the `tools` field is not passed, it means the model can use all registered tools

In short: When the `tools` parameter is provided, the model can only use the tools in that list; if the list is empty, the model has no tools available; when this parameter is not provided, the model has access to all tools by default.
:::
