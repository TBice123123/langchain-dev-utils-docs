# Usage Example

> This article demonstrates how to efficiently use the `langchain-dev-utils` library in a `langchain` and `langgraph` project through a complete example of **multi-agent discussions around a specific topic**. This example deeply integrates all core modules of the library, helping you comprehensively master the practical usage of the five major modules.

## Project Setup

### Project Initialization

This project uses `uv` as the project management tool. First, you need to download `uv`.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

For Windows systems, you can use:

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

After installation, use `uv` to create the project.

```bash
uv init langchain-dev-utils-example
```

Enter the project directory:

```bash
cd langchain-dev-utils-example
```

### Installing Dependencies

Before this, you need to ensure that `python` is installed on your computer. If not, you can use `uv` to [install python](https://docs.astral.sh/uv/guides/install-python/).
After ensuring your computer has `python`, use `uv` to install the dependencies.

```bash
uv add langchain langgraph langchain-dev-utils
```

In addition to the above dependencies, you also need to install `langgraph-cli` for debugging.

```bash
uv add langgraph-cli[inmem] --group dev
```

### Setting Up the Project Directory

Next, create a `src` directory in the project, and then create an `__init__.py` file in the `src` directory. All our code will be placed in the `src` directory.
Please ensure your project directory structure is as follows:

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

The first step we need to do is register the model providers. Use the `register_model_provider` function provided by `langchain-dev-utils`. However, since we need to use multiple different types of models this time and register multiple model providers, we need to use the more convenient `batch_register_model_provider` function. According to the introduction in [Model Management](./model-management.md), we usually recommend placing the model provider registration in the project's `__init__.py` file to ensure registration is completed after the project starts.

This time we use four leading open-source models: `deepseek-v3.1`, `qwen3-235b-a22b-instruct-2507`, `kimi-k2-0955`, and `glm-4.5`. For the `deepseek` and `qwen` models, there are corresponding `langchain` integrations (`langchain-deepseek`, `langchain-qwq`), while for the `kimi` and `glm` models, there are no suitable `langchain` integrations, so we choose to use `langchain-openai` for integration.
Therefore, the providers we need to register and the corresponding methods are as follows:

- deepseek model: Install `langchain-deepseek`. No need to register a model provider because it is a supported provider of `init_chat_model` and can be called directly without registration.
- qwen model: Install `langchain-qwq`, then register the provider. Here, `chat_model` needs to be passed the specific ChatModel class.
- kimi model: Install `langchain-openai`, then register the provider. Here, `chat_model` needs to be passed the string value `openai` and `base_url` must also be provided.
- glm model: Install `langchain-openai`, then register the provider. Here, `chat_model` needs to be passed the string value `openai` and `base_url` must also be provided.

Of course, you can also choose other models, the method is the same as above.
We need to register the model providers in the `src/__init__.py` file. The code is as follows:

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

You can test whether the registration was successful. The test code can be referenced as follows:

```python
from langchain_dev_utils import load_chat_model

model = load_chat_model("dashscope:qwen3-235b-a22b-instruct-2507")
print(model.invoke("hello"))
```

If the program runs successfully, it means the model provider registration was successful.

### Writing the Main Agent

Next, let's complete the writing of the main agent.

#### Writing the Tools

For the main agent, it has the following three tools.

- ls: Used to list existing notes.
- query_note: Used to query the specific content of a note.
- transfor_to_talk: An agent used for routing, transferring the user's request to multiple agents for discussion based on the user's needs.

For the `ls` and `query_note` tools, we use the two tool functions `create_ls_tool` and `create_query_note_tool` provided in [Context Engineering](./context-engineering.md). The specific usage is as follows:

```python
from langchain_dev_utils import (
    create_ls_tool,
    create_query_note_tool,
)


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

For the `transfor_to_talk` tool, we need to write it ourselves. The specific implementation can be referenced as follows:

```python
@tool
async def transfor_to_talk(
    topic: Annotated[
        str,
        "The topic theme of the current discussion",
    ],
):
    """Used to transfer the topic to sub-agents for discussion"""

    return "transfor success!"
```

**Note: The above code is located in `src/tools.py`**

#### Writing the State

The state Schema for this main agent is as follows:

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

**Note: The above code is located in `src/state.py`**
Our definition of the main agent state keys is as follows:

- `messages`: Used to store the conversation messages of the main agent.
- `note`: Used to store notes.
- `talker_list`: Used to store the agents participating in the discussion.
- `talk_messages`: Used to store the discussion results of the participating agents.

Note that the `message` key is implemented by inheriting `MessagesState`, and the `note` key is implemented by inheriting `NoteStateMixin`. By inheriting these two state classes, you can very simply implement these two state keys without having to write them yourself (the main hassle is writing the reducer).

In addition to the graph state State, we also define `StateIn` and `StateOut`, where `StateIn` is used to represent the input state and `StateOut` is used to represent the output state. Both are for the user.

#### Writing the Node

The node code is as follows (`src/node.py`):

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

Note that the `has_tool_calling` and `parse_tool_calling` functions from [Message Processing](./message-processing.md) are used here.

`has_tool_calling` is used to determine if a message contains a tool call, and `parse_tool_calling` is used to parse the tool call. For parsing tool calls, by default, a list of tuples (name, args) is returned. If `first_tool_call_only=True` is passed, only the first tool call's (name, args) tuple is returned.
For the parsed tool call, if its name is `transfor_to_talk`, it is forwarded to the sub-agents for discussion.

#### Writing the Prompt

The prompt for the main agent is as follows:

```python
MODERATOR_PROMPT = """Your role is to extract the topic theme from the user's question and call the `transfor_to_talk` tool to transfer the topic to sub-agents for discussion.
After the sub-agents' discussion returns, use the `query_note` tool to query the note content."""
```

### Discussion Agents

#### Writing the Tools

For the sub-agents participating in the discussion, they need to have a `tavily_search` tool for searching internet content.

First, install `langchain-tavily`:

```bash
uv add langchain-tavily
```

Its tool implementation is as follows:

```python
@tool
async def tavily_search(query: Annotated[str, "The content to search for"]):
    """Internet search tool, used to obtain the latest online information and data. Note: To control context length and reduce calling costs, this tool can only be called once during each task execution."""
    tavily_search = TavilySearch(
        max_results=5,
    )
    result = await tavily_search.ainvoke({"query": query})
    return result
```

**Note: Make sure you set the `TAVILY_API_KEY` environment variable, otherwise an error will occur.**

Also, for this `tavily_search` tool, some users may not want to call it too many times because it can lead to long contexts affecting the model's response speed. Therefore, we can add human review to this tool, which is an important function in [Tool Enhancement](./tool-enhancement.md).

Since this function is asynchronous, we need to use the `human_in_the_loop_async` decorator. At the same time, we want to achieve a high degree of customization, so we need to pass a `handler`.

Therefore, its implementation is as follows:

```python
from typing import Any
from langchain_dev_utils import human_in_the_loop_async, InterruptParams
from langgraph.types import interrupt


async def custom_handler(params: InterruptParams) -> Any:
    response = interrupt(
        f"I want to call the tool {params['tool_call_name']} with parameters {params['tool_call_args']}. Please confirm whether to call it."
    )
    if response["type"] == "accept":
        return await params["tool"].ainvoke(params["tool_call_args"], params["config"])
    elif response["type"] == "reject":
        return "User rejected calling the tool."
    else:
        raise ValueError(f"Unsupported response type: {response['type']}")

@human_in_the_loop_async(handler=custom_handler)
async def tavily_search(query: Annotated[str, "The content to search for"]):
    """Internet search tool, used to obtain the latest online information and data. Note: To control context length and reduce calling costs, this tool can only be called once during each task execution."""
    tavily_search = TavilySearch(
        max_results=5,
    )
    result = await tavily_search.ainvoke({"query": query})
    return result
```

**Note: This code is also located in `src/tools.py`**

#### Writing the State

For the state of the sub-agent, we write it as follows (located in `src/talker_agents/state.py`):

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

For the sub-agent state, it contains the following state keys.

- topic: The topic of the discussion.
- talk_messages: Used to store the final results of each sub-agent's discussion.
- temp_messages: Used to store temporary discussion messages.
- talker_list: Used to store the participants in the discussion.
- messages: Used to store the messages of the main agent.

#### Writing the Graph

The graph implementation for the sub-agent is as follows (located in `src/talker_agents/graph.py`):

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
                update={
                    "temp_messages": [response],
                },
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

This is a very simple agent implementation. First, it receives the topic of this discussion, then discusses based on this topic. During the discussion, it may call tools, and all results will be in the temporary context window provided by `temp_messages`. After the discussion is completed, the final result is saved to `talk_messages` (indicating which agent's discussion result it is).

For the discussion agents, there are four this time, and they are in a parallel relationship. In addition, we also want users to be able to specify the participants of this discussion. Therefore, we add a `talker_list` state to store the discussion participants.

Next is to combine these agents to build a new graph.
The code is as follows (located in `src/talker_agents/graph.py`):

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
                arg={
                    "topic": cast(dict[str, Any], args).get("topic", ""),
                },
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

Here, `parallel_pipeline` from `langchain-dev-utils` is used to build a parallel agent pipeline. At the same time, to allow users to specify which agents can discuss, we need to pass `branches_fn`. In this article, it is `branch_talker`.
The implementation of this function is also very simple. First, it gets the `topic` from `messages`, and then generates `Send` objects based on the `talker_list` in the `state`. The `node` is the agent name to forward to, and the `arg` is the `topic` to pass.

This completes the construction of the discussion agents.

#### Writing the Prompt

The prompt for the discussion agent is as follows:

```python

TALK_PROMPT = """
Your task is to discuss based on the user's topic. You can use the `tavily_search` tool for internet searches.
The user's topic is {topic}
"""
```

### Note-taking Agent

#### Writing the State

Located in `src/write_note_agent/state.py`

```python
from typing import Annotated
from langchain_core.messages import AnyMessage
from langgraph.graph import MessagesState, add_messages
from langchain_dev_utils import NoteStateMixin


class WriteState(MessagesState, NoteStateMixin):
    temp_write_note_messages: Annotated[list[AnyMessage], add_messages]
    talk_messages: Annotated[list[AnyMessage], add_messages]
```

It contains the following state keys.

- temp_write_note_messages: Used to store temporary note-writing messages.
- talk_messages: Used to store the final results of the discussion.
- messages: Used to store the main agent's messages.
- note: Used to store notes.

#### Writing the Graph

Located in `src/write_note_agent/graph.py`

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


async def write_note_node(
    state: WriteState,
):
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
                    content=f"Discussion completed. The note has been written to {note_name}!!",
                    tool_call_id=cast(AIMessage, state["messages"][-1]).tool_calls[0][
                        "id"
                    ],
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

The implementation of the writing agent is also very simple. It analyzes the final results of each discussion sub-agent and then writes a summary note.
Here, the `message_format` function from [Message Processing](./message-processing.md) is also used to format several Messages into a string.

#### Writing the Tools

The tool for the writing agent is `write_note`, which is also created using `create_write_note_tool` from [Context Engineering](./context-engineering.md).
The code implementation is as follows:

```python

write_note = create_write_note_tool(
    name="write_note",
    description="""Tool used to write a note.

    Parameters:
    content: str, The content of the note

    """,
    message_key="temp_write_note_messages",
)
```

**Note: Located in `src/tools.py`**

#### Writing the Prompt

The prompt for the writing agent is as follows:

```python
WRITE_NOTE_PROMPT = """
Your task is to summarize the content discussed by multiple agents and write it into a note.


The respective discussion results of the multiple agents are:
{messages}
"""
```

### Final Graph Construction

Reference code is as follows:

```python
from src.node import (
    moderator,
    moderator_tools,
)
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

Since `talkers` and `write_note_agent` are sequential, `sequential_pipeline` from [State Graph Orchestration](./graph-orchestration.md) is used here.

Finally, create a new `langgraph.json` in the project root directory and write the following:

```json
{
  "dependencies": ".",
  "graphs": {
    "graph": "./src/graph.py:graph"
  }
}
```

Then start the `langgraph server`. Eventually, you should see a graph structure as shown in the figure below.
![Final Graph](/img/graph.png)
