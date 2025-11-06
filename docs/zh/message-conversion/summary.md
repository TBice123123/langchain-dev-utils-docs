# 最佳实践指南

## 消息处理

### 合并思维链

- **什么时候用**：当模型的回答里包含了“思考过程”，你想把它和最终答案合并到一起。
- **怎么用**：
  - **普通调用 (`invoke`)**：用 `convert_reasoning_content_for_ai_message`。
  - **流式调用 (`stream`)**：用 `convert_reasoning_content_for_chunk_iterator`。如果是异步则是使用`aconvert_reasoning_content_for_chunk_iterator`。

### 合并流式输出

- **什么时候用**：使用 `stream` 时，想把收到的零碎回复拼成一条完整消息。
- **怎么用**：用 `merge_ai_message_chunk`。

## 格式化列表

- **什么时候用**：想把多个消息、文档或字符串，合并成一段连续的文本。
- **怎么用**：用 `format_sequence`。
  - 想加序号，就设 `with_num=True`。
  - 想换分隔符，就设 `separator="你想要的符号"`。

## 功能使用建议

- **高频通用工具**：`format_sequence` 是你最先应该掌握的函数。它用途广泛，无论是构建提示词还是聚合内容，都会频繁使用。
- **低频专用工具**：思维链合并和流式输出合并功能，是为特定场景（如处理带推理的模型、聚合流式响应）准备的。当你遇到这些具体需求时，再来查阅和使用它们即可。
