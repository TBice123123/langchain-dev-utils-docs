# Best Practice Guide

## Middleware Usage Recommendations

### Prioritize Official Middleware

For middleware already provided by LangChain (such as `SummarizationMiddleware`, `LLMToolSelectorMiddleware`, etc.), **please prioritize the official versions**. This is because the official versions support passing a `chat_model` instance, allowing for more complex configurations.

**Only consider using the wrappers from this library in the following scenarios**:

- You wish to **dynamically specify models via strings** to avoid hardcoding model instances in your code, thereby achieving greater flexibility.

### Choose Based on Functional Differences and Personal Preference

For middleware implemented exclusively by this library, please make your choice based on specific requirements and preferences:

- **Task Planning**:

  - Official `PlanMiddleware`: Provides a `write_todo` tool, oriented towards a todo list structure.
  - This library's `PlanMiddleware`: Provides three tools—`write_plan`, `finish_sub_plan`, and `read_plan`—offering more granular plan management.
  - **Choice**: Both share the same fundamental goal but have different tool designs. You can choose based on your task planning habits and preferences.

- **Model Routing**:

  - This library's `ModelRouterMiddleware`: A unique feature for dynamically selecting the most appropriate model based on the input content.
  - **Choice**: When this functionality is needed, directly use the `ModelRouterMiddleware` from this library.

## Agent Function Best Practices

### Prioritize Using the Official `create_agent` to Create Agents

The official function supports passing a `chat_model` instance, allowing for more complex configurations.

### `wrap_agent_as_tool` Usage Recommendations

**Flexibly Use Hook Functions to Enhance Controllability**

Hook functions allow you to execute custom logic before and after an Agent is called, enabling advanced features such as input enhancement and result extraction.

- **`pre_input_hooks`**: Process the input before the Agent is called.
- **`post_output_hooks`**: Process the output after the Agent returns.

**For Full Control, Implement the Functionality Yourself**

If you need to implement completely custom logic, please implement this functionality yourself.

For example:

```python
from langchain.tools import tool
from langchain.messages import HumanMessage

@tool(
    "subagent1_name",
    description="subagent1_description"
)
def call_subagent(query: str):
    # Custom logic
    result = subagent1.invoke({"messages":[HumanMessage(content=query)]})
    # Custom logic
    return result
```
