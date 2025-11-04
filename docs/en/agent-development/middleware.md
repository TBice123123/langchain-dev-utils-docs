# Middleware

> [!NOTE]
>
> **Overview**: Provides utility tools for convenient Agent development.
>
> **Prerequisites**: Familiarity with [Middleware](https://docs.langchain.com/oss/python/langchain/middleware) in Langchain.
>
> **Estimated Reading Time**: 10 minutes

Middleware is a component specifically built for pre-constructed Agents in `langchain`. The official library provides some built-in middleware. This library, based on practical scenarios and usage contexts, offers additional middleware. These can be broadly categorized into further encapsulations of official middleware and custom middleware defined within this library.

## Encapsulation of official middleware

Further encapsulations of official middleware, providing more convenient usage methods.
Specifically, the following four middleware are available:

- SummarizationMiddleware
- LLMToolSelectorMiddleware
- ModelFallbackMiddleware
- LLMToolEmulator

### SummarizationMiddleware

The core function is to compress conversation content. Its functionality is completely consistent with the official [SummarizationMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#summarization). However, it only allows string parameters to specify the model (similar to `create_agent` in this library, where the model selection range is larger but requires registration).
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
    system_prompt="You are an intelligent AI assistant capable of solving user problems",
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

The core function is to allow the LLM to select tools itself when there are a large number of tools. Its functionality is completely consistent with the official [LLMToolSelectorMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-selector). However, it similarly only allows strings to specify the model (like `create_agent` in this library, the model selection range is larger but requires registration).
Usage example:

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

Middleware used to fall back to a backup model when the primary model call fails. Its functionality is completely consistent with the official [ModelFallbackMiddleware](https://docs.langchain.com/oss/python/langchain/middleware#model-fallback). However, it similarly only allows strings to specify the model (like `create_agent` in this library, the model selection range is larger but requires registration). Usage example:

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

Middleware used to simulate tool calls using a large language model. Its functionality is completely consistent with the official [LLMToolEmulator](https://docs.langchain.com/oss/python/langchain/middleware#llm-tool-emulator). However, it similarly only allows strings to specify the model (like `create_agent` in this library, the model selection range is larger but requires registration). Usage example:

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

## Custom Middleware In This Library

### PlanMiddleware

A task planning middleware used for structured decomposition and process management before executing complex tasks.

::: tip 📝
Task planning is an efficient context engineering management strategy. Before executing a task, the large language model first breaks down the overall task into multiple ordered subtasks, forming a task planning list (referred to as a plan in this library). It then executes each subtask in sequence and dynamically updates the task status after completing each step until all subtasks are finished.
:::

This middleware is similar in function and positioning to the official LangChain [Plan middleware](https://docs.langchain.com/oss/python/langchain/middleware#planning), but differs in tool design. The official middleware only provides the `write_todo` tool, which is oriented towards a todo list structure; whereas this library provides three dedicated tools: `write_plan`, `finish_sub_plan`, and `read_plan`, specifically used for writing, modifying, and querying the planning list (plan list).

Whether it's `todo` or `plan`, their essence is the same. Therefore, the key difference between this middleware and the official one lies in the provided tools. The official middleware uses one tool for addition and modification, while this library provides three tools: `write_plan` can be used to write a plan or update plan content, `finish_sub_plan` is used to update the status after completing a subtask, and `read_plan` is used to query the plan content.

Specifically, they are represented by the following three functions:

- `create_write_plan_tool`: A function to create a tool for writing plans.
- `create_finish_sub_plan_tool`: A function to create a tool for completing subtasks.
- `create_read_plan_tool`: A function to create a tool for querying plans.

The parameters these three functions receive are as follows:

- **description**: Tool description. If not provided, the default tool description is used.
- **message_key**: The key used to update messages. If not provided, the default messages are used (the `read_plan` tool does not have this parameter).

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

::: details write_plan

`write_plan` has two functions: 1. Writing the plan for the first time. 2. Updating the plan during execution if problems are found with the existing plan.

```python
@tool(description=description or _DEFAULT_WRITE_PLAN_TOOL_DESCRIPTION,)
def write_plan(plan: list[str], runtime: ToolRuntime):
    msg_key = message_key or "messages"
    return Command(
        update={
            "plan": [
                {
                    "content": content,
                    "status": "pending" if index > 0 else "in_progress",
                }
                for index, content in enumerate(plan)
            ],
            msg_key: [
                ToolMessage(
                    content=f"Plan successfully written, please first execute the {plan[0]} task (no need to change the status to in_process)",
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )

```

:::

::: details finish_sub_plan

`finish_sub_plan` is only used to update the status of the current subtask and set the next subtask.

```python
@tool(description=description or _DEFAULT_FINISH_SUB_PLAN_TOOL_DESCRIPTION,)
def finish_sub_plan(runtime: ToolRuntime,):
    msg_key = message_key or "messages"
    plan_list = runtime.state.get("plan", [])

    sub_finish_plan = ""
    sub_next_plan = ",all sub plan are done"
    for plan in plan_list:
        if plan["status"] == "in_progress":
            plan["status"] = "done"
            sub_finish_plan = f"finish sub plan:**{plan['content']}**"

    for plan in plan_list:
        if plan["status"] == "pending":
            plan["status"] = "in_progress"
            sub_next_plan = f",next plan:**{plan['content']}**"
            break

    return Command(
        update={
            "plan": plan_list,
            msg_key: [
                ToolMessage(
                    content=sub_finish_plan + sub_next_plan,
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )
```

:::

::: details read_plan

`read_plan` is only used to read the current plan.

```python
@tool(description=description or _DEFAULT_READ_PLAN_TOOL_DESCRIPTION)
def read_plan(runtime: ToolRuntime):
    plan_list = runtime.state.get("plan", [])
    return json.dumps(plan_list)
```

:::

However, the usage method described above is not recommended in this library. The best practice is to use `PlanMiddleware`.
The parameters for `PlanMiddleware` are explained as follows:

- **system_prompt**: Optional string type, system prompt. Functionally similar to the official TodoListMiddleware.
- **tools**: Optional list of BaseTool type, list of tools. If specified, they will be added to the tools. Must be tools created via `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool`.

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
    {"messages": [HumanMessage(content="I want to go to New York for a few days, help me plan the itinerary")]}
)
print(response)
```

**Notes:**

1. Both parameters of `PlanMiddleware` are optional. If no parameters are passed, the system will default to using `_DEFAULT_PLAN_SYSTEM_PROMPT` as the system prompt and automatically load the toolset created by `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool`.

2. For the `tools` parameter, only tools created using `create_write_plan_tool`, `create_finish_sub_plan_tool`, and `create_read_plan_tool` are supported. Among these, `create_read_plan_tool` is an optional tool. If only the first two are provided, this middleware can still function normally but will lack the ability to read the plan.

### ModelRouterMiddleware

`ModelRouterMiddleware` is a middleware designed to **dynamically route input to the most suitable model** based on the content of the request. It utilizes a "router model" to analyze the user's query and select the best-fitting model from a predefined list to handle the task.

**Parameters**

- **router_model** (Required)  
  The model used to make routing decisions. Accepts:

  - A string (which will be automatically loaded via **load_chat_model**), e.g., `"vllm:qwen3-4b"`;
  - Or a pre-instantiated **ChatModel** object.

- **model_list** (Required)  
  A list of model configurations. Each element is a dictionary containing the following required fields:

  - **model_name**: The model identifier (e.g., `"vllm:qwen3-8b"`), type: string.
  - **model_description**: A brief description of the model's capabilities, used by the router model for decision-making, type: string.

  Optional fields:

  - **tools**: The list of tools this model is allowed to use. **If not specified, the model defaults to using all tools registered in the agent.** Type: List of BaseTool.  
    ⚠️ Note: All tools listed in `tools` **must also be present in the `tools` parameter passed to `create_agent`**, otherwise an error will be raised.
  - **model_kwargs**: Additional parameters passed to this model (e.g., `temperature`, `top_p`, `extra_body`, etc.), type: dict.
  - **model_system_prompt**: The system prompt set for this model to guide its behavior, type: string.

- **router_prompt** (Optional)  
  A custom prompt for the router model, type: string. If **None** (default), a built-in default prompt template is used.

**Usage Example**

First, define the model list:

```python
model_list = [
    {
        "model_name": "vllm:qwen3-8b",
        "model_description": "Suitable for general tasks like dialogue, text generation, etc.",
        "model_kwargs": {
            "temperature": 0.7,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": False}}
        },
        "model_system_prompt": "You are an assistant skilled in handling general tasks like dialogue, text generation, etc.",
    },
    {
        "model_name": "openrouter:qwen/qwen3-vl-32b-instruct",
        "model_description": "Suitable for vision tasks",
        "tools": [],  # If this model requires no tools, set this field to an empty list []
    },
    {
        "model_name": "openrouter:qwen/qwen3-coder-plus",
        "model_description": "Suitable for code generation tasks",
        "tools": [run_python_code],  # Only allowed to use the run_python_code tool
    },
]
```

Then, enable the middleware when creating the agent:

```python
from langchain_dev_utils.agents.middleware import ModelRouterMiddleware
from langchain_core.messages import HumanMessage

agent = create_agent(
    model="vllm:qwen3-4b",  # This model acts only as a placeholder; it will be dynamically replaced by the middleware
    tools=[run_python_code, get_current_time],
    middleware=[
        ModelRouterMiddleware(
            router_model="vllm:qwen3-4b",
            model_list=model_list,
        )
    ],
)

# The routing middleware automatically selects the most suitable model based on the input content
response = agent.invoke({"messages": [HumanMessage(content="Help me write a bubble sort code")]})
print(response)
```

With `ModelRouterMiddleware`, you can easily build a multi-model, multi-capability Agent that automatically selects the optimal model based on the task type, improving response quality and efficiency.

::: tip Note  
In the `model_list`, the `tools` field in each dictionary controls the scope of tools available to that model:

- If `[]` is explicitly passed, the model uses no tools.
- If `[tool1, tool2, ...]` is passed, the model can only use the specified tools.
- If the `tools` field is not provided, the model can use all registered tools.

In short: When the `tools` parameter is provided, the model is restricted to using only the tools in that list; if the list is empty, the model has no tools available; if the parameter is omitted, the model defaults to having access to all tools.
:::
