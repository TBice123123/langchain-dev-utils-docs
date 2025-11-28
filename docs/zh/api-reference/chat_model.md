# ChatModel 模块的 API 参考

## register_model_provider

注册聊天模型的提供者。

```python
def register_model_provider(
    provider_name: str,
    chat_model: ChatModelType,
    base_url: Optional[str] = None,
    provider_profile: Optional[dict[str, dict[str, Any]]] = None,
    provider_config: Optional[ProviderConfig] = None,
)->None:
```

**参数说明：**

- `provider_name`：字符串类型，必填，自定义提供商名称
- `chat_model`：ChatModel 类或支持的提供者字符串类型，必填
- `base_url`：可选字符串类型，提供商的 BaseURL
- `provider_profile`：可选字典类型，提供商所支持的模型的profile，格式为 `{model_name: model_profile}`。
- `provider_config`：可选 ProviderConfig 类型，提供商配置。

**示例：**

```python
register_model_provider("fakechat",FakeChatModel)
register_model_provider("vllm", "openai-compatible", base_url="http://localhost:8000/v1")
```

## batch_register_model_provider

批量注册模型提供者。

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider],
) -> None:
```

**参数说明：**

- `providers`：ChatModelProvider 列表类型，必填，提供者配置列表

**示例：**

```python
batch_register_model_provider([
    {"provider_name": "fakechat", "chat_model": FakeChatModel},
    {"provider_name": "vllm", "chat_model": "openai-compatible", "base_url": "http://localhost:8000/v1"},
])
```

## load_chat_model

从已注册的提供者加载聊天模型。

```python
def load_chat_model(
    model: str,
    *,
    model_provider: Optional[str] = None,
    **kwargs: Any,
) -> BaseChatModel:
```

**参数说明：**

- `model`：字符串类型，必填，模型名称，格式为 `model_name` 或 `provider_name:model_name`
- `model_provider`：可选字符串类型，模型提供者名称
- `**kwargs`：任意类型，可选，额外的模型参数

**返回值：** BaseChatModel 类型，加载的聊天模型实例

**示例：**

```python
model = load_chat_model("vllm:qwen3-4b")
```

## ChatModelType

注册模型提供商时`chat_model`参数支持的类型。

```python
ChatModelType = Union[type[BaseChatModel], Literal["openai-compatible"]]
```

## ProviderConfig

模型提供商的相关配置。

```python
class ProviderConfig(TypedDict):
    supported_tool_choice: NotRequired[ToolChoiceType]
    keep_reasoning_content: NotRequired[bool]
    support_json_mode: NotRequired[bool]
```

**字段说明：**

- `supported_tool_choice`：非必需列表类型,代表模型提供商支持的`tool_choice`参数
- `keep_reasoning_content`：非必需布尔类型,是否在后续的 messages 中保留推理内容(`reasoning_content`)。
- `support_json_mode`：非必需布尔类型,是否支持`json_mode`的结构化输出方式。

## ChatModelProvider

聊天模型提供者配置类型。

```python
class ChatModelProvider(TypedDict):
    provider_name: str
    chat_model: ChatModelType
    base_url: NotRequired[str]
    provider_profile: NotRequired[dict[str, dict[str, Any]]]
    provider_config: NotRequired[ProviderConfig]
```

**字段说明：**

- `provider_name`：字符串类型，必填，提供者名称
- `chat_model`：BaseChatModel 类型或字符串类型，必填，支持传入对话模型类或字符串（目前只支持`openai-compatible`）。
- `base_url`：非必需字符串类型，基础 URL
- `provider_profile`：非必需字典类型，提供商所支持的模型的profile，格式为 `{model_name: model_profile}`。
- `provider_config`：非必需 ProviderConfig 类型，代表模型提供商配置。

## ToolChoiceType

`tool_choice`参数支持的类型。

```python
ToolChoiceType = list[Literal["auto", "none", "required", "specific"]]
```
