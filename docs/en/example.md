# Usage Example

> This article demonstrates a **complete example of multiple agents discussing a specific topic** to showcase how to effectively use the `langchain-dev-utils` library within a `LangChain` and `LangGraph` project. This example deeply integrates all core modules of the library, helping you comprehensively master the practical usage of its five main modules.

## Project Setup

### Project Initialization

This project uses `uv` as the project management tool. First, you need to install `uv`.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

For Windows systems, use:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

After installation, create a new project using `uv`:

```bash
uv init langchain-dev-utils-example
```

Enter the project directory:

```bash
cd langchain-dev-utils-example
```

### Installing Dependencies

Before proceeding, ensure Python is installed on your system. If not, you can use `uv` to [install Python](https://docs.astral.sh/uv/guides/install-python/). Once Python is available, install the required dependencies using `uv`:

```bash
uv add langchain langgraph langchain-dev-utils
```

Additionally, install `langgraph-cli` for debugging:

```bash
uv add langgraph-cli[inmem] --group dev
```

### Project Directory Structure

Next, create a `src` directory in your project, and add an `__init__.py` file inside it. All subsequent code will reside within the `src` directory.

Your project structure should look like this:

```
src/
├── __init__.py
├── graph.py
├── node.py
├── prompt.py
├── state.py
├── tools.py
├── talker_agents/
│   ├── __init__.py
│   ├── graph.py
│   └── state.py
└── write_note_agent/
    ├── __init__.py
    ├── graph.py
    └── state.py
```

### Registering Model Providers

The first step is to register model providers using the `register_model_provider` function from `langchain-dev-utils`. Since we need to use multiple model providers, we’ll use the more convenient `batch_register_model_provider` function.

As described in the [Model Management](./model-management.md) documentation, it’s recommended to place provider registration in the project’s `__init__.py` file to ensure registration completes upon project startup.

In this example, we use four top-tier open-source models: `deepseek-v3.1`, `qwen3-235b-a22b-instruct-2507`, `kimi-k2-0955`, and `glm-4.5`.

- For `deepseek` and `qwen` models, there are official LangChain integrations (`langchain-deepseek`, `langchain-qwq`).
- For `kimi` and `glm`, no suitable LangChain integrations exist, so we use `langchain-openai` with custom `base_url`s.

Thus, the providers and registration methods are as follows:

- **Deepseek**: Install `langchain-deepseek`. No explicit registration needed—it’s natively supported by `init_chat_model`.
- **Qwen**: Install `langchain-qwq`, then register the provider by passing the actual `ChatModel` class.
- **Kimi**: Install `langchain-openai`, then register with `chat_model="openai"` and a `base_url`.
- **GLM**: Install `langchain-openai`, then register similarly with `chat_model="openai"` and a `base_url`.

Add the following code to `src/__init__.py`:

```python
from langchain_dev_utils import batch_register_model_provider
from langchain_qwq import ChatQwen


batch_register_model_provider(
    [
        {"provider": "dashscope", "chat_model": ChatQwen},
        {
            "provider": "zai",
            "chat_model": "openai",
            "base_url": "https://open.bigmodel.cn/api/paas/v4/",
        },
        {
            "provider": "moonshot",
            "chat_model": "openai",
            "base_url": "https://api.moonshot.cn/v1",
        },
    ]
)
```

You can verify registration success with:

```python
from langchain_dev_utils import load_chat_model

model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
print(model.invoke("hello"))
```

If this runs without error, registration is successful.

### Implementing the Main Agent

Now, let’s implement the main agent.

#### Writing Tools

The main agent has three tools:

- `ls`: Lists existing notes.
- `query_note`: Retrieves the content of a specific note.
- `transfor_to_talk`: Routes user requests to sub-agents for discussion.

For `ls` and `query_note`, use the utility functions `create_ls_tool` and `create_query_note_tool` from the [Context Engineering](./context-engineering.md) module:

```python
from langchain_dev_utils import (
    create_ls_tool,
    create_query_note_tool,
)


ls = create_ls_tool(
    name="ls",
    description="""Lists all saved note names.

    Returns:
    list[str]: A list of note filenames
    """,
)

query_note = create_query_note_tool(
    name="query_note",
    description="""Queries a note.

    Parameters:
    file_name: Note name

    Returns:
    str: Content of the queried note
    """,
)
```

For `transfor_to_talk`, implement it manually:

```python
@tool
async def transfor_to_talk(
    topic: Annotated[
        str,
        "The current discussion topic",
    ],
):
    """Routes the topic to sub-agents for discussion."""

    return "transfor success!"
```

> **Note**: All the above code resides in `src/tools.py`.

#### Defining State

The main agent’s state schema is as follows (`src/state.py`):

```python
from typing import Annotated

from langchain_core.messages import AnyMessage
from langchain_dev_utils import NoteStateMixin
from langgraph.graph import MessagesState, add_messages


class State(MessagesState, NoteStateMixin):
    talker_list: list[str]
    talk_messages: Annotated[list[AnyMessage], add_messages]


class StateIn(MessagesState):
    talker_list: list[str]


class StateOut(MessagesState, NoteStateMixin):
    pass
```

State keys:

- `messages`: Stores the main agent’s conversation history (from `MessagesState`).
- `note`: Stores notes (from `NoteStateMixin`).
- `talker_list`: List of agents participating in the discussion.
- `talk_messages`: Stores the discussion results from sub-agents.

We also define `StateIn` (input schema) and `StateOut` (output schema) for user-facing interfaces.

#### Implementing Nodes

Node implementation (`src/node.py`):

```python
from typing import Literal, cast
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.types import Command
from src.state import State
from src.tools import transfor_to_talk, ls, query_note
from langchain_dev_utils import (
    has_tool_calling,
    load_chat_model,
    parse_tool_calling,
)
from src.prompt import MODERATOR_PROMPT


async def moderator(
    state: State,
) -> Command[Literal["__end__", "talk_and_write", "moderator_tools"]]:
    model = load_chat_model("deepseek:deepseek-chat")
    bind_model = model.bind_tools([transfor_to_talk, ls, query_note])

    response = await bind_model.ainvoke(
        [
            SystemMessage(content=MODERATOR_PROMPT),
            *state["messages"],
        ]
    )

    if has_tool_calling(cast(AIMessage, response)):
        tool_call_name, _ = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )

        if tool_call_name == "transfor_to_talk":
            return Command(
                goto="talk_and_write",
                update={
                    "messages": [response],
                },
            )

        return Command(goto="moderator_tools", update={"messages": [response]})
    return Command(goto="__end__", update={"messages": [response]})


moderator_tools = ToolNode([ls, query_note])
```

We use `has_tool_calling` to check for tool calls and `parse_tool_calling` to extract tool names and arguments. If the tool is `transfor_to_talk`, we route to the discussion subgraph.

#### Writing Prompts

Main agent prompt (`src/prompt.py`):

```python
MODERATOR_PROMPT = """Your role is to extract the discussion topic from the user's query and invoke the `transfor_to_talk` tool to delegate the topic to sub-agents for discussion.
Once the sub-agents return their discussion results, use the `query_note` tool to retrieve the note content."""
```

### Discussion Agents

#### Writing Tools

Each discussion agent has a `tavily_search` tool for internet searches.

First, install `langchain-tavily`:

```bash
uv add langchain-tavily
```

Basic tool implementation:

```python
@tool
async def tavily_search(query: Annotated[str, "Search query"]):
    """Internet search tool for up-to-date information. Note: To control context length and cost, call this tool only once per task."""
    tavily_search = TavilySearch(max_results=5)
    result = await tavily_search.ainvoke({"query": query})
    return result
```

> **Note**: Ensure the `TAVILY_API_KEY` environment variable is set.

To allow human-in-the-loop review (from [Tool Enhancement](./tool-enhancement.md)), wrap the tool with `human_in_the_loop_async` and a custom handler:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt


async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I want to call tool {params['tool_call_name']} with args {params['tool_call_args']}. Confirm?"
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "User rejected tool call"
    else:
        raise ValueError(f"Unsupported response type: {response['type']}")


@human_in_the_loop_async(handler=custom_handler)
async def tavily_search(query: Annotated[str, "Search query"]):
    """Internet search tool... (same docstring as above)"""
    tavily_search = TavilySearch(max_results=5)
    result = await tavily_search.ainvoke({"query": query})
    return result
```

> **Note**: This code is also in `src/tools.py`.

#### Defining State

Discussion agent state (`src/talker_agents/state.py`):

```python
from typing import Annotated

from langchain_core.messages import AnyMessage
from langgraph.graph import MessagesState, add_messages


class TalkState(MessagesState):
    topic: Annotated[str, lambda x, y: y]
    talk_messages: Annotated[list[AnyMessage], add_messages]
    temp_messages: Annotated[list[AnyMessage], add_messages]
    talker_list: list[str]
```

State keys:

- `topic`: Discussion topic.
- `talk_messages`: Final discussion results.
- `temp_messages`: Temporary discussion messages.
- `talker_list`: List of participating agents.
- `messages`: Main agent messages (inherited).

#### Building the Graph

Each discussion agent graph (`src/talker_agents/graph.py`):

```python
def build_talker_with_name(talker_name: str):
    async def talk(state: TalkState) -> Command[Literal["__end__", "talk_tools"]]:
        model = load_chat_model(talk_name_map[talker_name])
        bind_model = model.bind_tools([tavily_search])
        response = await bind_model.ainvoke(
            [
                SystemMessage(content=TALK_PROMPT.format(topic=state["topic"])),
                *state["temp_messages"],
            ]
        )
        if has_tool_calling(cast(AIMessage, response)):
            return Command(
                goto="talk_tools",
                update={"temp_messages": [response]},
            )
        return Command(
            goto="__end__",
            update={
                "talk_messages": [
                    AIMessage(content=f"{talker_name}: {response.content}\n")
                ],
            },
        )

    talk_tools = ToolNode([tavily_search], messages_key="temp_messages")
    graph = StateGraph(TalkState)
    graph.add_node("talk", talk)
    graph.add_node("talk_tools", talk_tools)

    graph.add_edge("__start__", "talk")
    graph.add_edge("talk_tools", "talk")
    return graph.compile(name=talker_name)
```

This agent discusses the topic, uses tools in a temporary context (`temp_messages`), and saves the final result to `talk_messages`.

We have four such agents (Qwen, DeepSeek, Kimi, GLM), running in parallel. Users can specify participants via `talker_list`.

Now, compose them into a parallel pipeline:

```python
def branch_talker(state: TalkState):
    message = state["messages"][-1]
    if has_tool_calling(message=cast(AIMessage, message)):
        _, args = parse_tool_calling(
            cast(AIMessage, message), first_tool_call_only=True
        )
        return [
            Send(
                node=talk_name,
                arg={"topic": cast(dict[str, Any], args).get("topic", "")},
            )
            for talk_name in state["talker_list"]
        ]
    return [Send(node="__end__", arg={})]


talkers = parallel_pipeline(
    [
        build_talker_with_name("qwen"),
        build_talker_with_name("deepseek"),
        build_talker_with_name("kimi"),
        build_talker_with_name("glm"),
    ],
    state_schema=TalkState,
    branches_fn=branch_talker,
    graph_name="talk",
)
```

We use `parallel_pipeline` from `langchain-dev-utils` and a custom `branch_talker` function to dynamically route to selected agents.

#### Writing Prompts

Discussion agent prompt:

```python
TALK_PROMPT = """
Your task is to discuss the given topic. You may use the `tavily_search` tool for internet research.
Topic: {topic}
"""
```

### Note-Writing Agent

#### Defining State

(`src/write_note_agent/state.py`):

```python
from typing import Annotated
from langchain_core.messages import AnyMessage
from langgraph.graph import MessagesState, add_messages
from langchain_dev_utils import NoteStateMixin


class WriteState(MessagesState, NoteStateMixin):
    temp_write_note_messages: Annotated[list[AnyMessage], add_messages]
    talk_messages: Annotated[list[AnyMessage], add_messages]
```

State keys:

- `temp_write_note_messages`: Temporary messages during note writing.
- `talk_messages`: Final discussion results.
- `messages`: Main agent messages.
- `note`: Stored notes.

#### Building the Graph

(`src/write_note_agent/graph.py`):

```python
from langgraph.graph import StateGraph
from langgraph.prebuilt.tool_node import ToolNode
from src.write_note_agent.state import WriteState
from langchain_dev_utils import load_chat_model, message_format
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_dev_utils import has_tool_calling, parse_tool_calling
from typing import Any, cast
from src.tools import write_note
from src.prompt import WRITE_NOTE_PROMPT


async def write_note_node(state: WriteState):
    model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
    bind_model = model.bind_tools([write_note])
    response = await bind_model.ainvoke(
        [
            SystemMessage(
                content=WRITE_NOTE_PROMPT.format(
                    messages=message_format(state["talk_messages"])
                )
            )
        ]
    )
    if has_tool_calling(cast(AIMessage, response)):
        _, args = parse_tool_calling(
            cast(AIMessage, response), first_tool_call_only=True
        )
        note_name = cast(dict[str, Any], args).get("file_name")
        return {
            "messages": [
                ToolMessage(
                    content=f"Discussion complete. Note saved as {note_name}!",
                    tool_call_id=cast(AIMessage, state["messages"][-1]).tool_calls[0]["id"],
                )
            ],
            "temp_write_note_messages": [response],
        }


write_note_tools = ToolNode([write_note], messages_key="temp_write_note_messages")

graph = StateGraph(WriteState)
graph.add_node("write_note", write_note_node)
graph.add_node("write_note_tools", write_note_tools)

graph.add_edge("__start__", "write_note")
graph.add_edge("write_note", "write_note_tools")

write_note_agent = graph.compile(name="write_note_agent")
```

This agent summarizes discussion results and writes a note using the `message_format` utility to convert messages into a readable string.

#### Writing Tools

The `write_note` tool uses `create_write_note_tool`:

```python
write_note = create_write_note_tool(
    name="write_note",
    description="""Writes content to a note.

    Parameters:
    content: str, note content
    """,
    message_key="temp_write_note_messages",
)
```

> **Note**: In `src/tools.py`.

#### Writing Prompts

Note-writing prompt:

```python
WRITE_NOTE_PROMPT = """
Your task is to summarize the discussion results from multiple agents and write a note.

Discussion results:
{messages}
"""
```

### Final Graph Composition

Main graph (`src/graph.py`):

```python
from src.node import moderator, moderator_tools
from langgraph.graph import StateGraph
from src.state import State, StateIn, StateOut
from langchain_dev_utils import sequential_pipeline
from src.talker_agents.graph import talkers
from src.write_note_agent.graph import write_note_agent


graph = StateGraph(State, input_schema=StateIn, output_schema=StateOut)
graph.add_node("moderator", moderator)
graph.add_node("moderator_tools", moderator_tools)
graph.add_node(
    "talk_and_write",
    sequential_pipeline([talkers, write_note_agent], state_schema=State),
)

graph.add_edge("__start__", "moderator")
graph.add_edge("moderator_tools", "moderator")
graph.add_edge("talk_and_write", "moderator")

graph = graph.compile()
```

We use `sequential_pipeline` to chain the discussion (`talkers`) and note-writing (`write_note_agent`) agents.

Finally, create `langgraph.json` in the project root:

```json
{
  "dependencies": ".",
  "graphs": {
    "graph": "./src/graph.py:graph"
  }
}
```

Start the LangGraph server, and you should see a graph like this:

![Final Graph](/img/graph.png)
