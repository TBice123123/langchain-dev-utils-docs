# Example Usage

The following example demonstrates how to use `langchain-dev-utils` within `LangChain` and `LangGraph`. We will build a simple travel planning assistant.

Through this example, you will not only learn some core utility functions of `langchain-dev-utils`, but also understand how to effectively manage context in an intelligent agent. Let’s begin!

### Project Setup

This project uses `uv` for dependency management. Execute the following command:

```bash
uv init travel-planner-assistant
```

After creation, navigate into the project directory and install dependencies:

```bash
cd travel-planner-assistant
```

Install the required packages: `langchain`, `langgraph`, and `langchain-dev-utils`.

```bash
uv add langchain langgraph langchain-dev-utils
```

Next, create the directory structure (along with the corresponding files). The final structure will be:

```
travel-planner-assistant/
└── src/
    └── agent/
        ├── __init__.py
        ├── prompts/
        │   ├── __init__.py
        │   └── prompt.py
        ├── sub_agent/
        │   ├── __init__.py
        │   ├── graph.py
        │   └── node.py
        ├── utils/
        │   ├── __init__.py
        │   └── context.py
        ├── write_agent/
        │   ├── __init__.py
        │   ├── graph.py
        │   └── node.py
        ├── graph.py
        ├── node.py
        ├── state.py
        └── tools.py
```

Broadly speaking, this project includes three agents: the main agent, the sub-agent, and the writer agent. The main agent controls the overall workflow; the sub-agent handles each subdivided task; and the writer agent consists of two parallel nodes—one for writing notes and another for summarizing completed task results. We will implement each component step by step.

### Registering Model Providers

The core of any agent is the large language model (LLM). First, we must resolve model access. For this project, any LLM with sufficient tool-calling and reasoning capabilities is acceptable.

In this example, we use four top-tier open-source models: `Qwen`, `Kimi`, `GLM`, and `DeepSeek`. Of course, you may choose other models according to your preference.

To invoke these models, you must first install their corresponding integration libraries. Install `langchain-deepseek` and `langchain-qwq` for DeepSeek and Qwen respectively. For Kimi and GLM, you can use `langchain-openai` since they are fully compatible with the OpenAI API format. Since these libraries depend on `langchain-openai`, you do not need to install it separately.

Assuming you have installed them, you could instantiate chat models directly—but this becomes cumbersome, especially since our project has multiple agents, each potentially using different models. Using traditional methods would require repetitive `from ... import ...` statements, and switching models—even between different library types—would necessitate modifying imports across the codebase.

To solve this, `LangChain` provides `init_chat_model`, which initializes a chat model from a model name string without requiring explicit imports. However, `init_chat_model` only supports a limited set of models. While DeepSeek is supported, the others are not.

Here, we use `langchain-dev-utils`, which provides two utility functions: `register_model_provider` and `load_chat_model`. First, you must register model providers; only then can you use `load_chat_model` similarly to `init_chat_model`.

> **Important Note**: Since model provider registration uses a global dictionary, it must be completed immediately upon project startup—not during later invocations—to avoid thread-safety issues during concurrent writes.
>
> Dictionary writes are not thread-safe; reads are.

We register model providers in `src/__init__.py` to guarantee execution at startup.

Add the following code:

```python
from langchain_dev_utils import batch_register_model_provider
from langchain_qwq import ChatQwen
from langchain_siliconflow import ChatSiliconFlow


batch_register_model_provider(
    [
        {
            "provider": "dashscope",
            "chat_model": ChatQwen,
        },
        {
            "provider": "siliconflow",
            "chat_model": ChatSiliconFlow,
        },
        {
            "provider": "zai",
            "chat_model": "openai",
            "base_url": "https://open.bigmodel.cn/api/paas/v4",
        },
        {
            "provider": "moonshot",
            "chat_model": "openai",
            "base_url": "https://api.moonshot.cn/v1",
        },
    ]
)
```

**Explanation of the above code**:

1. Instead of using `register_model_provider`, we use `batch_register_model_provider`, which internally calls `register_model_provider` multiple times. This allows batch registration of multiple providers with a single function call. Note that the parameter is a list of dictionaries, each containing keys: `provider`, `chat_model`, and `base_url`.
2. The `chat_model` field accepts two types of values: a class (e.g., `ChatQwen`) or a string (e.g., `"openai"`). For `ChatQwen`, we pass the actual class since `langchain-qwq` provides it. For Kimi and GLM, which lack dedicated libraries but are OpenAI-compatible, we pass `"openai"`, meaning `langchain_openai.ChatOpenAI` will be used. In this case, you must explicitly provide `base_url` or set the corresponding `APIBASE` environment variable. (Note: Passing a string means using `langchain`’s `init_chat_model` internally.)

### Main Agent

The main agent's core responsibility is to analyze user requirements, decompose tasks, and delegate each subtask to the sub-agent.

First, implement the tools. The main agent needs the following functions: `write_plan`, `update_plan`, `write_note`, `ls`, `query_note` for context management, and `transfor_task_to_subagent` to delegate tasks to the sub-agent.

Create `src/agent/tools.py` and add:

```python
from typing import Annotated

from langchain_core.tools import tool
from langchain_tavily.tavily_search import TavilySearch

from langchain_dev_utils import (
    create_write_note_tool,
    create_write_plan_tool,
    create_update_plan_tool,
    create_ls_tool,
    create_query_note_tool,
)


write_plan = create_write_plan_tool(
    name="write_plan",
    description="""Tool to write the initial plan. Use only once, at the very beginning. For updates, use update_plan.
Parameters:
plan: list[str], a list of plan items, each being a string content.
""",
)

update_plan = create_update_plan_tool(
    name="update_plan",
    description="""Tool to update plan progress. Can be called multiple times.
Parameters:
update_plans: list[Todo] - List of plans to update. Each element is a dict with:
    - content: str, exact match to existing plan content
    - status: str, must be "in_progress" or "done"

Usage Guidelines:
1. Only include plans whose status needs updating; do not resend all plans.
2. Each call must include at least one "done" and one "in_progress" plan:
   - Mark completed tasks as "done"
   - Mark next task as "in_progress"
3. The "content" field must exactly match existing plan content.

Example:
Current plan list:
[
    {"content":"Plan 1", "status":"done"},
    {"content":"Plan 2", "status":"in_progress"},
    {"content":"Plan 3", "status":"pending"}
]
After completing Plan 1 and starting Plan 2, send:
[
    {"content":"Plan 1", "status":"done"},
    {"content":"Plan 2", "status":"in_progress"}
]
""",
)

ls = create_ls_tool(
    name="ls",
    description="""List all saved note filenames.

Returns:
list[str]: List of all note filenames.
""",
)

query_note = create_query_note_tool(
    name="query_note",
    description="""Query the content of a specific note.

Parameters:
file_name: str, name of the note file

Returns:
str: Content of the queried note.
""",
)

write_note = create_write_note_tool(
    name="write_note",
    description="""Tool to write a note.

Parameters:
content: str, content of the note.
""",
    message_key="write_note_messages",
)


@tool
async def transfor_task_to_subagent(
    content: Annotated[
        str,
        "The task content to delegate, must exactly match a 'content' field in the todo list. Can be slightly rewritten on retry if sub-agent failed.",
    ],
):
    """Delegate a task to the sub-agent.

    Parameters:
    content: str, the exact task content from the todo list. If the sub-agent failed previously, you may slightly rephrase this content for retry.

    Example:
    If current todo list is:
    [
        {"content":"Task 1", "status":"done"},
        {"content":"Task 2", "status":"in_progress"},
        {"content":"Task 3", "status":"pending"}
    ]
    Then the correct input is "Task 2".
    """

    return "transfor success!"
```

Except `transfor_task_to_subagent`, all tools are created using utility functions from `langchain-dev-utils`.

For example, `create_write_note_tool` accepts three optional parameters: `name`, `description`, and `message_key`. `name` and `description` define the tool’s metadata. `message_key` determines which key in the state the resulting `ToolMessage` should be appended to.

Next, define the agent state. In `LangGraph`, the state defines the graph’s core data structure.

Since `create_write_plan_tool`, `create_update_plan_tool`, `create_ls_tool`, `create_query_note_tool`, and `create_write_note_tool` rely on `note` and `plan` fields, we must define them. While `TypedDict` could be used, it’s verbose. `langchain-dev-utils` provides two mixins: `PlanStateMixin` and `NoteStateMixin`. Inheriting them automatically adds these fields and handles complex reducer logic.

Create `src/agent/state.py`:

```python
from typing import Annotated

from langchain_core.messages import AnyMessage
from langgraph.graph.message import MessagesState, add_messages
from langchain_dev_utils import PlanStateMixin, NoteStateMixin


class StateInput(MessagesState):
    pass


class State(MessagesState, PlanStateMixin, NoteStateMixin, total=False):
    task_messages: Annotated[list[AnyMessage], add_messages]
    now_task_message_index: int
    write_note_messages: Annotated[list[AnyMessage], add_messages]
```

Now implement the node logic in `src/agent/node.py`:

```python
from typing import Literal, cast

from langchain_core.messages import AIMessage, SystemMessage
from langchain_dev_utils import has_tool_calling, load_chat_model, parse_tool_calling
from langgraph.prebuilt import ToolNode
from langgraph.runtime import get_runtime
from langgraph.types import Command

from src.agent.state import State
from src.agent.tools import (
    ls,
    query_note,
    transfor_task_to_subagent,
    update_plan,
    write_plan,
)
from src.agent.utils.context import Context


async def call_model(state: State) -> Command[Literal["tools", "subagent", "__end__"]]:
    run_time = get_runtime(Context)
    model = load_chat_model(
        model=run_time.context.todo_model,
    )

    tools = [
        write_plan,
        update_plan,
        transfor_task_to_subagent,
        ls,
        query_note,
    ]
    bind_model = model.bind_tools(tools, parallel_tool_calls=False)
    messages = state["messages"]

    response = await bind_model.ainvoke(
        [SystemMessage(content=run_time.context.todo_prompt), *messages]
    )

    if has_tool_calling(cast(AIMessage, response)):
        name, _ = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )
        if name == "transfor_task_to_subagent":
            return Command(
                goto="subagent",
                update={
                    "messages": [response],
                    "now_task_message_index": len(
                        state["task_messages"] if "task_messages" in state else []
                    ),
                },
            )

        return Command(goto="tools", update={"messages": [response]})

    return Command(goto="__end__", update={"messages": [response]})


tool_node = ToolNode([write_plan, update_plan, ls, query_note])
```

Key points:

```python
run_time = get_runtime(Context)
model = load_chat_model(
    model=run_time.context.todo_model,
)
```

Here, `load_chat_model` dynamically loads the model using the context defined in `src/agent/utils/context.py`:

```python
from dataclasses import dataclass
from typing import Annotated

from src.agent.prompts.prompt import (
    SUBAGENT_PROMPT,
    SUMMARY_PROMPT,
    TODO_MODEL_PROMPT,
    WRITE_PROMPT,
)


@dataclass
class Context:
    todo_model: Annotated[str, "Model for task planning and delegation"] = (
        "moonshot:kimi-k2-0905-preview"
    )
    sub_model: Annotated[str, "Model for executing individual tasks"] = "deepseek:deepseek-chat"
    write_model: Annotated[str, "Model for writing notes"] = (
        "dashscope:qwen3-next-80b-a3b-instruct"
    )
    summary_model: Annotated[str, "Model for summarizing results"] = "zai:glm-4.5-air"
    todo_prompt: Annotated[str, "Prompt for the main agent"] = TODO_MODEL_PROMPT
    sub_prompt: Annotated[str, "Prompt for the sub-agent"] = SUBAGENT_PROMPT
    write_prompt: Annotated[str, "Prompt for the note-writer"] = WRITE_PROMPT
    summary_prompt: Annotated[str, "Prompt for the summary agent"] = SUMMARY_PROMPT
```

This also reveals which models each agent uses. The context also holds prompts.

Additionally:

```python
if has_tool_calling(cast(AIMessage, response)):
        name, _ = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )
        if name == "transfor_task_to_subagent":
            return Command(
                goto="subagent",
                update={
                    "messages": [response],
                    "now_task_message_index": len(
                        state["task_messages"] if "task_messages" in state else []
                    ),
                },
            )
```

This uses `has_tool_calling` and `parse_tool_calling` from `langchain-dev-utils` to detect and parse tool calls. While you could manually check `response.tool_calls`, these utilities simplify the logic. If the tool called is `transfor_task_to_subagent`, we route to the sub-agent.

Main agent prompt:

```markdown
You are an intelligent task assistant designed to help users complete tasks efficiently.

Follow these steps strictly:

1. **Task Decomposition**: Break down the user's request into concrete subtasks and use write_plan to create the full task list.
2. **Task Execution**: Execute each subtask in order:
   - Always call write_plan first to initialize the task list.
   - After completing each task, immediately call update_plan to update its status.
3. **Result Summary**: Once all tasks are done, provide a complete summary report.

Important Reminders:

- Must call write_plan first to initialize the task list.
- Always update plan status after completing each task.
- Ensure task accuracy and completeness.
- You only delegate tasks to the sub-agent—you must NOT execute tasks yourself. All execution is handled by the sub-agent, whose results are saved to files. Only call update_plan after receiving confirmation.
- To query task results: Use ls to list files, or query_note to retrieve note content. Use query_note only when necessary based on task nature.
```

### Sub-Agent

The sub-agent uses `tavily_search` for web searches. Implement it in `src/agent/tools.py`:

```python
async def tavily_search(query: Annotated[str, "Search query"]):
    """Internet search tool to fetch up-to-date information. Note: Each task may call this tool only once to control context length and cost."""
    tavily_search = TavilySearch(
        max_results=5,
    )
    result = await tavily_search.ainvoke({"query": query})
    return result
```

Now implement the sub-agent logic in `src/agent/sub_agent/node.py`:

```python
from typing import Literal, cast

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_dev_utils import (
    has_tool_calling,
    load_chat_model,
    message_format,
    parse_tool_calling,
)
from langgraph.prebuilt import ToolNode
from langgraph.runtime import get_runtime
from langgraph.types import Command

from src.agent.state import State
from src.agent.tools import tavily_search, query_note
from src.agent.utils.context import Context


async def subagent_call_model(state: State) -> Command[Literal["sub_tools", "__end__"]]:
    run_time = get_runtime(Context)
    last_ai_message = cast(AIMessage, state["messages"][-1])

    _, args = parse_tool_calling(last_ai_message, first_tool_call_only=True)
    task_name = cast(dict, args).get("content", "")

    model = load_chat_model(model=run_time.context.sub_model).bind_tools(
        [tavily_search, query_note]
    )

    task_messages = state["task_messages"] if "task_messages" in state else []

    now_task_message_index = (
        state["now_task_message_index"] if "now_task_message_index" in state else 0
    )

    messages = task_messages[now_task_message_index:]

    notes = state["note"] if "note" in state else {}

    user_requirement = state["messages"][0].content

    response = await model.ainvoke(
        [
            SystemMessage(
                content=run_time.context.sub_prompt.format(
                    task_name=task_name,
                    history_files=message_format(list(notes.keys()))
                    if notes
                    else "No notes available",
                    user_requirement=user_requirement,
                )
            ),
            HumanMessage(content=f"My task is: {task_name}, please help me complete it."),
            *messages,
        ]
    )

    if has_tool_calling(cast(AIMessage, response)):
        return Command(
            goto="sub_tools",
            update={"task_messages": [response]},
        )

    return Command(
        goto="__end__",
        update={
            "task_messages": [response],
        },
    )


sub_tools = ToolNode(
    [tavily_search, query_note], messages_key="task_messages"
)
```

We use an independent message window (`task_messages` + `now_task_message_index`) to isolate context. To help the sub-agent reference prior work, we later record notes in the writer agent. We inject available note names into the prompt using `message_format`, which concatenates a list of strings, messages, or documents into a formatted string:

For example, passing `["Note1", "Note2", "Note3"]` returns:

```python
"""
- Note1
- Note2
- Note3
"""
```

Now implement `src/agent/sub_agent/graph.py`:

```python
from langgraph.graph.state import StateGraph

from src.agent.state import State
from src.agent.sub_agent.node import sub_tools, subagent_call_model


def build_sub_agent():
    subgraph = StateGraph(State)
    subgraph.add_node("subagent_call_model", subagent_call_model)
    subgraph.add_node("sub_tools", sub_tools)
    subgraph.add_edge("__start__", "subagent_call_model")
    subgraph.add_edge("sub_tools", "subagent_call_model")

    return subgraph.compile()
```

Sub-agent prompt:

```markdown
You are a professional AI task executor specialized in efficiently completing assigned subtasks.

## Task Context

User's overall requirement: {user_requirement}
**Current subtask**: {task_name}

## Execution Guidelines

### 1. Precise Understanding

- Carefully analyze the core goal and specific requirements.
- Identify key constraints and success criteria.
- Understand the subtask’s role within the overall requirement.
- Focus solely on the current subtask; use the overall requirement only as background.

### 2. Intelligent Planning

- Evaluate available tools and resources to select the optimal execution path.
- Consider task complexity and dependencies.
- Formulate clear execution steps.

### 3. Efficient Execution

- Deliver accurate, actionable solutions.
- Ensure output meets quality standards.
- Prioritize core functionality; avoid over-engineering.

### 4. Concise Communication

- Directly respond to task requirements; avoid redundancy.
- Use structured output.
- Highlight key information.

## Historical Information

Available historical task records:
{history_files}

**Critical Notes**:

- If the task requires prior results, use **query_note** to retrieve them first.
- If no relevant history exists or the task is independent, begin execution immediately.
- Leverage history to avoid duplication and improve efficiency.
- Tool Constraint: **tavily_search** may be called only once per task. Plan your search strategy carefully to obtain comprehensive results—this is crucial!

Begin execution now. Deliver a high-quality solution per the above guidelines.
```

### Writer Agent

Implement `src/agent/write_agent/node.py` and `src/agent/write_agent/graph.py`.

`node.py`:

```python
from typing import cast

from langchain_core.messages import AIMessage, ToolMessage
from langchain_dev_utils import load_chat_model
from langgraph.prebuilt import ToolNode
from langgraph.runtime import get_runtime

from src.agent.state import State
from src.agent.tools import write_note
from src.agent.utils.context import Context


async def write(state: State):
    run_time = get_runtime(Context)
    task_messages = state["task_messages"] if "task_messages" in state else []

    write_model = load_chat_model(
        model=run_time.context.write_model,
    ).bind_tools([write_note], tool_choice="write_note")

    task_content = task_messages[-1].content

    response = cast(
        AIMessage,
        await write_model.ainvoke(
            run_time.context.write_prompt.format(task_result=task_content)
        ),
    )

    return {
        "write_note_messages": [response],
    }


async def summary(state: State):
    run_time = get_runtime(Context)
    task_messages = state["task_messages"] if "task_messages" in state else []
    summary_model = load_chat_model(model=run_time.context.summary_model)

    task_content = task_messages[-1].content
    response = cast(
        AIMessage,
        await summary_model.ainvoke(
            run_time.context.summary_prompt.format(task_result=task_content)
        ),
    )
    tool_call_id = cast(AIMessage, state["messages"][-1]).tool_calls[0]["id"]
    return {
        "messages": [
            ToolMessage(
                content=f"Task completed! Summary: {response.content}",
                tool_call_id=tool_call_id,
            ),
        ],
    }


write_tool = ToolNode([write_note], messages_key="write_note_messages")
```

`graph.py`:

```python
from langgraph.graph.state import StateGraph

from src.agent.state import State
from src.agent.write_agent.node import summary, write, write_tool


def build_write_agent():
    subgraph = StateGraph(State)
    subgraph.add_node("write", write)
    subgraph.add_node("write_tool", write_tool)
    subgraph.add_node("summary", summary)
    subgraph.add_edge("__start__", "write")
    subgraph.add_edge("__start__", "summary")
    subgraph.add_edge("write", "write_tool")
    subgraph.add_edge("summary", "write_tool")
    subgraph.add_edge("write_tool", "__end__")

    return subgraph.compile()
```

Writer agent prompt (for note-writing):

```markdown
Based on the following task result, use the write_note function to save it as a note.
{task_result}

Ensure the content is in Markdown format. Summarize and rephrase the result for clarity and coherence.
Use a concise, clear filename without file extension (e.g., .md).
```

Summary agent prompt:

```markdown
Summarize the following task result concisely.
{task_result}

Keep the summary brief, clear, and free of redundancy. Avoid repetition or irrelevant details.
```

### Final Integration

Now complete `src/agent/graph.py`:

```python
from dotenv import load_dotenv
from langgraph.graph.state import StateGraph

from src.agent.node import call_model, tool_node
from src.agent.state import State, StateInput
from src.agent.sub_agent.graph import build_sub_agent
from src.agent.utils.context import Context
from src.agent.write_agent.graph import build_write_agent

load_dotenv(dotenv_path=".env", override=True)


def build_graph_with_langgraph_studio():
    graph = StateGraph(State, input_schema=StateInput, context_schema=Context)
    graph.add_node("call_model", call_model)
    graph.add_node("tools", tool_node)
    graph.add_node("subagent", build_sub_agent())
    graph.add_node("write_note", build_write_agent())

    graph.add_edge("__start__", "call_model")
    graph.add_edge("tools", "call_model")
    graph.add_edge("subagent", "write_note")
    graph.add_edge("write_note", "call_model")

    return graph.compile()
```

Create `langgraph.json` in the project root:

```json
{
  "dependencies": ["."],
  "graphs": {
    "todo-agent": "./src/agent/graph.py:build_graph_with_langgraph_studio"
  }
}
```

Create `.env` and set environment variables (e.g., API keys).

Finally, install `langgraph-cli` for testing:

```bash
uv add langgraph-cli[inmem]
```

Run with:

```bash
langgraph dev
```

You will see the following graph structure in LangGraph Studio:
![graph](/img/graph.png)
