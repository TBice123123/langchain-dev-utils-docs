# Pre-built Agent Functions

> [!NOTE]
>
> **Feature Overview**: Provides utility tools for convenient Agent development.
>
> **Prerequisites**: Understand LangChain's [Agents](https://docs.langchain.com/oss/python/langchain/agents).
>
> **Estimated Reading Time**: 3 minutes

The pre-built intelligent agent module primarily provides a function that is functionally identical to LangChain's `create_agent` function, but allows specifying more models via strings (registration required).

## Core Functions

- `create_agent`: Creates a single agent

**Function Parameters**:

- model: Model name, must be a string in the format `provider_name:model_name`. Supports formats compatible with both `init_chat_model` and `load_chat_model`. For `load_chat_model`, the provider_name must be registered using `register_model_provider`.
- Other parameters are identical to LangChain's `create_agent`.

## Usage Example

```python
from langchain_core.messages import HumanMessage
from langchain_dev_utils.chat_models import register_model_provider
from langchain_dev_utils.agents import create_agent
from langchain_core.tools import tool
import datetime

# Register model provider
register_model_provider(
    provider_name="vllm",
    chat_model="openai-compatible",
    base_url="http://localhost:8000/v1",
)


@tool
def get_current_time() -> str:
    """Get current timestamp"""
    return str(datetime.datetime.now().timestamp())


agent = create_agent("vllm:qwen3-4b", tools=[get_current_time])
# Usage is identical to LangChain's create_agent
response = agent.invoke({"messages": [HumanMessage(content="What time is it now?")]})
print(response)
```
