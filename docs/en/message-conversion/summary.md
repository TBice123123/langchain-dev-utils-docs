# Best Practices Guide

## Message Processing

### Merge Reasoning Content

- **When to use**: When the model's response includes a "reasoning process" that you want to merge with the final answer.
- **How to use**:
  - **Synchronous call (`invoke`)**: Use `convert_reasoning_content_for_ai_message`.
  - **Streaming call (`stream`)**: Use `convert_reasoning_content_for_chunk_iterator`. For asynchronous calls, use `aconvert_reasoning_content_for_chunk_iterator`.

### Merge Streaming Output

- **When to use**: When using `stream` and you want to combine the received partial responses (chunks) into a single, complete message.
- **How to use**: Use `merge_ai_message_chunk`.

## Formatting List Content

- **When to use**: When you want to combine multiple messages, documents, or strings into a single, continuous text string.
- **How to use**: Use `format_sequence`.
  - To add numbering, set `with_num=True`.
  - To change the separator, set `separator="your_desired_symbol"`.

## Usage Recommendations

- **High-frequency, general-purpose tool**: `format_sequence` is the primary function you should master. It's versatile and will be used frequently for tasks like building prompts or aggregating content.
- **Low-frequency, specialized tools**: The functions for merging reasoning content and streaming output are designed for specific scenarios (e.g., handling models with reasoning capabilities, aggregating streaming responses). You can refer to and use them when you encounter these specific needs.
