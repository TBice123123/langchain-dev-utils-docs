# API 参考文档

本节提供了 LangChain Dev Utils 中所有函数和类的完整文档。

## 模型管理

### `register_model_provider`

注册一个聊天模型的模型提供者。

**函数签名：**

```python
def register_model_provider(
    provider_name: str,
    chat_model: Union[Type[BaseChatModel], str],
    base_url: Optional[str] = None
) -> None
```

**参数：**

- `provider_name` (str)：自定义提供者名称
- `chat_model` (Union[Type[BaseChatModel], str])：ChatModel 类或支持的提供者字符串
- `base_url` (Optional[str])：提供者的基准 URL

**示例：**

```python
register_model_provider("dashscope", ChatQwen)
register_model_provider("openrouter", "openai", base_url="https://openrouter.ai/api/v1  ")
```

### `load_chat_model`

从已注册的提供者加载聊天模型。

**函数签名：**

```python
def load_chat_model(
    model: str,
    model_provider: Optional[str] = None,
    **kwargs
) -> BaseChatModel
```

**参数：**

- `model` (str)：模型名称，格式为 `model_name` 或 `provider_name:model_name`
- `model_provider` (Optional[str])：模型提供者名称
- `**kwargs`：额外的模型参数

**返回值：**

- `BaseChatModel`：加载的聊天模型实例

**示例：**

```python
model = load_chat_model("dashscope:qwen-flash")
model = load_chat_model("gpt-4", model_provider="openai", temperature=0.7)
```

### `register_embeddings_provider`

注册一个用于嵌入模型的提供者。

**函数签名：**

```python
def register_embeddings_provider(
    provider_name: str,
    embeddings_model: Union[Type[Embeddings], str],
    base_url: Optional[str] = None
) -> None
```

**参数：**

- `provider_name` (str)：自定义提供者名称
- `embeddings_model` (Union[Type[Embeddings], str])：嵌入模型类或支持的提供者字符串
- `base_url` (Optional[str])：提供者的基准 URL

**示例：**

```python
register_embeddings_provider("dashscope", "openai", base_url="https://dashscope.aliyuncs.com/compatible-mode/v1  ")
```

### `load_embeddings`

从已注册的提供者加载嵌入模型。

**函数签名：**

```python
def load_embeddings(
    model: str,
    provider: Optional[str] = None,
    **kwargs
) -> Embeddings
```

**参数：**

- `model` (str)：模型名称，格式为 `model_name` 或 `provider_name:model_name`
- `provider` (Optional[str])：模型提供者名称
- `**kwargs`：额外的模型参数

**返回值：**

- `Embeddings`：加载的嵌入模型实例

**示例：**

```python
embeddings = load_embeddings("dashscope:text-embedding-v4")
embeddings = load_embeddings("text-embedding-3-small", provider="openai")
```

## 消息处理

### `convert_reasoning_content_for_ai_message`

将 AIMessage 中的推理内容合并到内容字段中。

**函数签名：**

```python
def convert_reasoning_content_for_ai_message(
    model_response: AIMessage,
    think_tag: Tuple[str, str] = ("<think>", "</think>")
) -> AIMessage
```

**参数：**

- `model_response` (AIMessage)：AI 消息响应
- `think_tag` (Tuple[str, str])：推理内容的开始和结束标签，默认是<think></think>

**返回值：**

- `AIMessage`：合并了推理内容的消息

**示例：**

```python
response = convert_reasoning_content_for_ai_message(
    response, think_tag=("<start>", "<end>")
)
```

### `convert_reasoning_content_for_chunk_iterator`

为流式消息块合并推理内容。

**函数签名：**

```python
def convert_reasoning_content_for_chunk_iterator(
    model_response: Iterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> Iterator[BaseMessageChunk]
```

**参数：**

- `model_response` (Iterator[BaseMessageChunk])：消息块的迭代器
- `think_tag` (Tuple[str, str])：推理内容的开始和结束标签,默认是<think></think>

**返回值：**

- `Iterator[BaseMessageChunk]`：处理后的块迭代器

**示例：**

```python
for chunk in convert_reasoning_content_for_chunk_iterator(
    model.stream("Hello"), think_tag=("<think>", "</think>")
):
    print(chunk.content, end="", flush=True)
```

### `aconvert_reasoning_content_for_chunk_iterator`

用于流式处理的异步版本推理内容转换。

**函数签名：**

```python
async def aconvert_reasoning_content_for_chunk_iterator(
    model_response: AsyncIterator[BaseMessageChunk],
    think_tag: Tuple[str, str] = ("<think>", "</think>"),
) -> AsyncIterator[BaseMessageChunk]:
```

**参数：**

- `model_response` (AsyncIterator[BaseMessageChunk])：消息块的异步迭代器
- `think_tag` (Tuple[str, str])：推理内容的开始和结束标签,默认是<think></think>

**返回值：**

- `AsyncIterator[BaseMessageChunk]`：处理后的异步块迭代器

**示例：**

```python
async for chunk in aconvert_reasoning_content_for_chunk_iterator(
    model.astream("Hello"), think_tag=("<!--THINK-->", "<!--/THINK-->")
):
    print(chunk.content, end="", flush=True)
```

### `merge_ai_message_chunk`

将多个 AI 消息块合并为单个消息。

**函数签名：**

```python
def merge_ai_message_chunk(chunks: Sequence[AIMessageChunk]) -> AIMessage
```

**参数：**

- `chunks` (Sequence[AIMessageChunk])：待合并的消息块列表

**返回值：**

- `AIMessage`：合并后的消息

**示例：**

```python
chunks = list(model.stream("Hello"))
merged = merge_ai_message_chunk(chunks)
```

### `has_tool_calling`

检查消息是否包含工具调用。

**函数签名：**

```python
def has_tool_calling(message: AIMessage) -> bool
```

**参数：**

- `message` (AIMessage)：待检查的消息

**返回值：**

- `bool`：如果消息包含工具调用则返回 True

**示例：**

```python
if has_tool_calling(response):
    # 处理工具调用
    pass
```

### `parse_tool_calling`

从消息中解析工具调用参数。

**函数签名：**

```python
def parse_tool_calling(
    message: AIMessage,
    first_tool_call_only: bool = False
) -> Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]
```

**参数：**

- `message` (AIMessage)：待解析的消息
- `first_tool_call_only` (bool)：是否仅返回第一个工具调用

**返回值：**

- `Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]`：工具调用名称和参数

**示例：**

```python
name, args = parse_tool_calling(response, first_tool_call_only=True)
```

### `message_format`

将消息、文档或字符串列表格式化为单个字符串。

**函数签名：**

```python
def message_format(
    inputs: List[Union[BaseMessage, Document, str]],
    separator: str = "-",
    with_num: bool = False
) -> str
```

**参数：**

- `inputs` (List[Union[BaseMessage, Document, str]])：待格式化的项目列表
- `separator` (str)：分隔符字符串
- `with_num` (bool)：是否添加数字前缀

**返回值：**

- `str`：格式化后的字符串

**示例：**

```python
formatted = message_format(messages, separator="\n", with_num=True)
```

## 工具增强

## `human_in_the_loop`

为**同步工具函数**添加“人在回路”人工审核能力的装饰器。在工具执行前触发中断，等待人工确认、编辑或响应。

**函数签名：**

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**参数：**

- `func` (Optional[Callable])  
  待装饰的函数。**请勿手动传入 —— 仅用于装饰器语法糖。**

- `handler` (Optional[HumanInterruptHandler])  
  自定义中断处理函数。类型为：
  ```python
  HumanInterruptHandler = Callable[[InterrruptParams], Any]
  ```
  若未提供，则使用默认 `default_handler`（支持 `accept` / `edit` / `response`）。

**返回值：**

- `BaseTool`：装饰后的工具实例

## `human_in_the_loop_async`

为**异步工具函数**添加“人在回路”人工审核能力的装饰器。支持 `await` 调用。

**函数签名：**

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**参数：**

- `func` (Optional[Callable])  
  待装饰的异步函数。**请勿手动传入。**

- `handler` (Optional[HumanInterruptHandler])  
  自定义中断处理函数。类型为：
  ```python
  HumanInterruptHandler = Callable[[InterrruptParams], Any]
  ```
  若未提供，则使用默认 `default_handler_async`（支持 `accept` / `edit` / `response`）。

**注意**：虽然 handler 必须为异步函数。

**返回值：**

同 `human_in_the_loop`，返回异步兼容的 `BaseTool` 实例。

## 类型定义

### `InterrruptParams`

传递给 `handler` 函数的参数类型，包含工具调用上下文：

```python
from typing import Any, Dict, TypedDict
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool

class InterrruptParams(TypedDict):
    tool_call_name: str           # 工具名称（字符串）
    tool_call_args: Dict[str, Any] # 工具调用参数（字典）
    tool: BaseTool                # 工具对象，用于后续 invoke/ainvoke
    config: RunnableConfig        # LangChain 运行时配置
```

### `HumanInterruptHandler`

中断处理器函数的类型别名：

```python
from typing import Callable, Any

HumanInterruptHandler = Callable[[InterrruptParams], Any]
```

## 下一步

- [入门指南](./getting-started.md) - 返回概览
- [安装指南](./installation.md) - 安装说明
