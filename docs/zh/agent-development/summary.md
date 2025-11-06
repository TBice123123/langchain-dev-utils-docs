# 最佳实践指南

## 中间件使用建议

### 优先使用官方中间件

对于 LangChain 官方已提供的中间件（如 `SummarizationMiddleware`, `LLMToolSelectorMiddleware` 等），**请优先使用官方版本**。因为官方版本支持传入`chat_model`实例，允许更复杂的配置。

**仅在以下场景中，考虑使用本库的封装**：

- 你希望**通过字符串动态指定模型**，避免在代码中硬编码模型实例，以获得更高的灵活性。

### 根据功能差异和个人偏好选择

对于本库单独实现的中间件，请根据具体需求和偏好进行选择：

- **任务规划**：

  - 官方 `PlanMiddleware`：提供 `write_todo` 工具，面向待办清单（todo list）结构。
  - 本库 `PlanMiddleware`：提供 `write_plan`, `finish_sub_plan`, `read_plan` 三个工具，提供更细粒度的计划管理。
  - **选择**：两者本质目标相同，但工具设计不同，可根据你的任务规划习惯和偏好选择。

- **模型路由**：

  - 本库 `ModelRouterMiddleware`：独有的功能，用于根据输入内容动态选择最合适的模型。
  - **选择**：当需要此功能时，直接使用本库的 `ModelRouterMiddleware`。

## Agent 函数最佳实践

### 优先使用 官方`create_agent` 创建 Agent

官方函数支持传入`chat_model`实例，允许更复杂的配置。

### `wrap_agent_as_tool` 使用建议

**灵活使用钩子函数增强可控能力**

钩子函数允许你在 Agent 被调用前后执行自定义逻辑，实现输入增强、结果提取等高级功能。

- **`pre_input_hooks`**：在调用 Agent 前处理输入。
- **`post_output_hooks`**：在 Agent 返回后处理输出。

**如果追求完全可控，请自己实现本函数功能**

如果需要完全实现可控逻辑，请自行实现本函数功能。

例如

```python
from langchain.tools import tool
from langchain.messages import HumanMessage

@tool(
    "subagent1_name",
    description="subagent1_description"
)
def call_subagent(query: str):
    # 自定义逻辑
    result = subagent1.invoke({"messages":[HumanMessage(content=query)]})
    # 自定义逻辑
    return result
```
