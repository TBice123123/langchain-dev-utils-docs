# Prebuilt Agent

The prebuilt intelligent agent module primarily provides a prebuilt Agent function that is functionally identical to the official one but expands the model selection options.

### Overview

The `create_react_agent` function in `langgraph` (migrated to `langchain` in v1 and renamed `create_agent`) can conveniently create a single agent. However, its `model` parameter only supports formats officially supported by `init_chat_model`. This module provides a function that is functionally identical to the official function but can use models loaded via `load_chat_model`.

### Core Function

- `create_agent`: Creates a single agent

### Parameters

- model: The model name, must be a string in the format `provider_name:model_name`. Supports formats supported by both `init_chat_model` and `load_chat_model`. For `load_chat_model`, the provider_name must be registered using `register_model_provider`.
- Other parameters are exactly the same as `langgraph`'s `create_react_agent`.

### Usage Example

```python
from langchain_dev_utils import register_model_provider
from langchain_dev_utils.prebuilt import create_agent
from langchain_core.tools import tool
import datetime

# Register a model provider
register_model_provider(
    provider_name="moonshot",
    chat_model="openai-compatible",
    base_url="https://api.moonshot.cn/v1",
)

@tool
def get_current_time() -> str:
    """Get the current timestamp"""
    return str(datetime.datetime.now().timestamp())

agent = create_agent(
    "moonshot:kimi-k2-0905-preview",
    tools=[get_current_time],
    name="time-agent"
)
# Usage is identical to langgraph's create_react_agent
response = agent.invoke({
    "messages": [{"role": "user", "content": "What time is it now?"}]
})
print(response)
```

## Next Steps

- [API Reference](./api-reference.md) — Complete API documentation.
- [Usage Examples](./example.md) — Practical code examples demonstrating real-world usage.
