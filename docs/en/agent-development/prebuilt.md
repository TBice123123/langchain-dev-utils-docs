# Pre-built Agent Functions

> [!NOTE]
>
> **Feature Overview**: Provides utility tools to facilitate Agent development.
>
> **Prerequisites**: Familiarity with LangChain's [Agent](https://docs.langchain.com/oss/python/langchain/agents).
>
> **Estimated Reading Time**: 5 minutes

The pre-built agent module primarily offers functions that are functionally identical to LangChain's `create_agent` function but allow specifying more models via strings (registration required).

## Creating an Agent

Similar to LangChain's `create_agent` function, but supports specifying more models. Details are as follows:

- `create_agent`: Creates a single agent.

**Function Parameters**:

- **model**: The model name, which must be a string in the format `provider_name:model_name`. It also supports formats compatible with `init_chat_model` and `load_chat_model`. For `load_chat_model`, the `provider_name` must be registered using `register_model_provider`.
- Other parameters are identical to LangChain's `create_agent`.

**Usage Example**

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# Register a model provider
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)


@tool
def get_current_time() -> str:
    """Get the current timestamp."""
    return str(datetime.datetime.now().timestamp())


agent = create_agent("vllm:qwen3-4b", tools=[get_current_time])
# Usage is identical to LangChain's create_agent
response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

## Converting an Agent into a Tool

Core Function:

- `wrap_agent_as_tool`: Converts an Agent into a Tool.

**Function Parameters**:

- **agent**: The agent, which must be a `CompiledStateGraph` from LangChain.
- **tool_name**: The name of the tool (optional, must be a string).
- **tool_description**: The description of the tool (optional, must be a string).
- **agent_system_prompt**: The system prompt for the agent (optional, must be a string).

**Usage Example**

```python
import datetime
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_dev_utils.agents import wrap_agent_as_tool, create_agent


@tool
def get_current_time() -> str:
    """Get the current timestamp."""
    return str(datetime.datetime.now().timestamp())


# Define an agent for querying the time
time_agent = create_agent(
    "vllm:qwen3-4b", tools=[get_current_time], name="time_agent"
)
tool = wrap_agent_as_tool(
    time_agent, tool_name="call_time_agent", tool_description="Invoke the time agent"
)
print(tool)

# Use it as a tool
agent = create_agent("vllm:qwen3-4b", tools=[tool], name="agent")

response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```

**Note**: When an Agent (`CompiledStateGraph`) is used as the `agent` parameter in `wrap_agent_as_tool`, the Agent must have a `name` attribute defined.
