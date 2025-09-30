# Usage Example

> This article provides a complete example of **multiple agents discussing a specific topic**, demonstrating how to efficiently use the `langchain-dev-utils` library in a `langchain` and `langgraph` project. This example deeply integrates all the core modules of the library, helping you fully master the practical usage of the five core modules.

## Project Setup

### Project Initialization

This project uses `uv` as the project management tool. First, install `uv`.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

For Windows systems, use:

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

After installation, use `uv` to create the project:

```bash
uv init langchain-dev-utils-example
```

Enter the project directory:

```bash
cd langchain-dev-utils-example
```

### Installing Dependencies

Ensure `python` is installed. If not, you can use `uv` to [install Python](https://docs.astral.sh/uv/guides/install-python/).

Install project dependencies:

```bash
uv add langchain langgraph langchain-dev-utils
```

Install `langgraph-cli` for debugging:

```bash
uv add langgraph-cli[inmem] --group dev
```

### Setting Up the Project Directory

Create a `src` directory in the project; all code will be placed here. Ensure the project directory structure is as follows:

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

First, register the model providers. As suggested in [Model Management](./model-management.md), registration is typically completed in the project's `__init__.py` file to ensure initialization when the project starts.

This example uses four open-source models:

- `deepseek`: Integrated via `langchain-deepseek` (it's an officially supported model provider by `init_chat_model`, no need to register again)
- `qwen`: Integrated via `langchain-qwq` (requires registration, pass ChatQwen to chat_model)
- `kimi` and `glm`: Integrated via `langchain-openai` (requires registration, but there are no suitable integration libraries. However, both providers support OpenAI-style APIs, so `langchain-openai` needs to be used for access, pass `openai` to chat_model)

Register the model providers in `src/__init__.py`:

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

You can test if the registration was successful with the following code:

```python
from langchain_dev_utils import load_chat_model

model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
print(model.invoke("hello"))
```

If this runs successfully, the model provider registration was successful.

## Main Agent Writing

### Tools Writing

The main agent includes three tools:

- `ls`: Lists existing notes
- `query_note`: Queries the specific content of a note
- `transfor_to_talk`: A routing agent that transfers the user's request to multiple agents for discussion based on the user's needs

Use the tool functions provided by [Context Engineering](./context-engineering.md) to create the first two tools:

```python
from langchain_dev_utils import create_ls_tool, create_query_note_tool

ls = create_ls_tool(
    name="ls",
    description="""Used to list the names of all saved notes.

    Returns:
    list[str]: A list containing all note filenames
    """,
)

query_note = create_query_note_tool(
    name="query_note",
    description="""Used to query a note.

    Parameters:
    file_name: The name of the note

    Returns:
    str, The content of the queried note
    """,
)
```

The `transfor_to_talk` tool is implemented as follows:

```python
from langchain.tools import tool
from typing import Annotated

@tool
async def transfor_to_talk(
    topic: Annotated[str, "The topic theme for the current discussion"],
):
    """Used to transfer the topic to sub-agents for discussion"""
    return "transfor success!"
```

**Code Location: `src/tools.py`**

### State Writing

Main agent state schema:

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

**Code Location: `src/state.py`**

State key definitions:

- `messages`: Stores the main agent's conversation messages (inherits from `MessagesState`)
- `note`: Stores notes (inherits from `NoteStateMixin`)
- `talker_list`: Stores the agents participating in the discussion
- `talk_messages`: Stores the discussion results

### Node Writing

```python
from typing import Literal, cast
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.types import Command
from src.state import State
from src.tools import transfor_to_talk, ls, query_note
from langchain_dev_utils import has_tool_calling, load_chat_model, parse_tool_calling
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
                update={"messages": [response]},
            )

        return Command(goto="moderator_tools", update={"messages": [response]})
    return Command(goto="__end__", update={"messages": [response]})

moderator_tools = ToolNode([ls, query_note])
```

**Code Location: `src/node.py`**

Using `has_tool_calling` and `parse_tool_calling` functions from [Message Processing](./message-processing.md):

- `has_tool_calling`: Determines if a message contains a tool call
- `parse_tool_calling`: Parses the tool call, returning a list of `(name, args)` tuples

### Prompt Writing

Main agent prompt:

```python
MODERATOR_PROMPT = """Your role is to extract the topic theme from the user's question and call the `transfor_to_talk` tool to transfer the topic to sub-agents for discussion.
After the sub-agents' discussion returns, use the `query_note` tool to query the note content."""
```

## Discussion Agents

### Tools Writing

The discussion agent requires the `tavily_search` tool for internet searches.

Install the dependency:

```bash
uv add langchain-tavily
```

Basic tool implementation:

```python
from langchain_community.tools.tavily_search import TavilySearch

@tool
async def tavily_search(query: Annotated[str, "The content to search for"]):
    """Internet search tool, used to obtain the latest online information and data. Note: To control context length and reduce calling costs, this tool can only be called once per task execution."""
    tavily_search = TavilySearch(max_results=5)
    result = await tavily_search.ainvoke({"query": query})
    return result
```

To control the calling frequency, use [Tool Enhancement](./tool-enhancement.md) to add human review:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt

async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I want to call the tool {params['tool_call_name']} with parameters {params['tool_call_args']}, please confirm whether to call it"
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "User rejected calling this tool"
    else:
        raise ValueError(f"Unsupported response type: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
async def tavily_search(query: Annotated[str, "The content to search for"]):
    """Internet search tool, used to obtain the latest online information and data. Note: To control context length and reduce calling costs, this tool can only be called once per task execution."""
    tavily_search = TavilySearch(max_results=5)
    result = await tavily_search.ainvoke({"query": query})
    return result
```

**Code Location: `src/tools.py`**

**Note: The `TAVILY_API_KEY` environment variable must be set**

### State Writing

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

**Code Location: `src/talker_agents/state.py`**

State key definitions:

- `topic`: Discussion topic
- `talk_messages`: Stores the final discussion results of each sub-agent
- `temp_messages`: Stores temporary discussion messages
- `talker_list`: Stores discussion participants
- `messages`: Stores main agent messages

### Graph Writing

Single discussion agent implementation:

```python
from langgraph.graph import StateGraph
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.types import Command
from typing import Literal, cast
from langchain_core.messages import AIMessage, SystemMessage
from langchain_dev_utils import load_chat_model, has_tool_calling
from src.tools import tavily_search
from src.prompt import TALK_PROMPT

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

The agent receives the discussion topic, discusses within the `temp_messages` temporary context, and saves the final result to `talk_messages`.

Combining multiple agents in parallel:

```python
from langchain_dev_utils import parallel_pipeline
from langgraph.types import Send
from typing import Any, cast

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

talk_name_map = {
    "qwen": "dashscope:qwen3-235b-a22b-instruct-2507",
    "deepseek": "deepseek:deepseek-chat",
    "kimi": "moonshot:moonshot-v1-8k",
    "glm": "zai:glm-4-plus"
}

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

**Code Location: `src/talker_agents/graph.py`**

Use `parallel_pipeline` to build a parallel agent pipeline, using `branches_fn` to allow users to specify which agents participate in the discussion.

### Prompt Writing

Discussion agent prompt:

```python
TALK_PROMPT = """
Your task is to discuss based on the user's topic. You can use the `tavily_search` tool for internet searches.
The user's topic is {topic}
"""
```

## Note-Taking Agent

### State Writing

```python
from typing import Annotated
from langchain_core.messages import AnyMessage
from langgraph.graph import MessagesState, add_messages
from langchain_dev_utils import NoteStateMixin

class WriteState(MessagesState, NoteStateMixin):
    temp_write_note_messages: Annotated[list[AnyMessage], add_messages]
    talk_messages: Annotated[list[AnyMessage], add_messages]
```

**Code Location: `src/write_note_agent/state.py`**

State key definitions:

- `temp_write_note_messages`: Stores temporary note-writing messages
- `talk_messages`: Stores final discussion results
- `messages`: Stores main agent messages
- `note`: Stores notes

### Graph Writing

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
                    content=f"Discussion completed, notes have been written to {note_name}!!",
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

**Code Location: `src/write_note_agent/graph.py`**

The writing agent analyzes the various discussion results and writes a summary note, using the `message_format` function to format multiple Messages into a string.

### Tools Writing

Use [Context Engineering](./context-engineering.md) to create the note-writing tool:

```python
from langchain_dev_utils import create_write_note_tool

write_note = create_write_note_tool(
    name="write_note",
    description="""Tool used to write notes.

    Parameters:
    content: str, The note content
    """,
    message_key="temp_write_note_messages",
)
```

**Code Location: `src/tools.py`**

### Prompt Writing

Writing agent prompt:

```python
WRITE_NOTE_PROMPT = """
Your task is to summarize the content discussed by multiple agents and write it into a note.

The respective discussion results of the multiple agents are:
{messages}
"""
```

## Final Graph Construction

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

**Code Location: `src/graph.py`**

Use `sequential_pipeline` to connect `talkers` and `write_note_agent` in sequence.

Create `langgraph.json` in the project root directory:

```json
{
  "dependencies": ".",
  "graphs": {
    "graph": "./src/graph.py:graph"
  }
}
```

Run `LangGraph Studio`:

```bash
langgraph dev
```

The final graph structure is as follows:

![Final Graph](/img/graph.png)
