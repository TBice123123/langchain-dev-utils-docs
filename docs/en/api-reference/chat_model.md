# ChatModel Module API Reference

## register_model_provider

Registers a provider for chat models.

```python
def register_model_provider(
    provider_name: str,
    chat_model: ChatModelType,
    base_url: Optional[str] = None,
    provider_config: Optional[ProviderConfig] = None,
) -> None:
```

**Parameters:**

- `provider_name`: string, required, custom provider name
- `chat_model`: ChatModel class or supported provider string type, required
- `base_url`: optional string, provider's BaseURL
- `provider_config`: optional ProviderConfig type, model provider configuration

**Examples:**

```python
register_model_provider("fakechat", FakeChatModel)
register_model_provider("vllm", "openai-compatible", base_url="http://localhost:8000/v1")
```

## batch_register_model_provider

Batch registers model providers.

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider],
) -> None:
```

**Parameters:**

- `providers`: ChatModelProvider list type, required, list of provider configurations

**Examples:**

```python
batch_register_model_provider([
    {"provider_name": "fakechat", "chat_model": FakeChatModel},
    {"provider_name": "vllm", "chat_model": "openai-compatible", "base_url": "http://localhost:8000/v1"},
])
```

## load_chat_model

Loads a chat model from a registered provider.

```python
def load_chat_model(
    model: str,
    *,
    model_provider: Optional[str] = None,
    **kwargs: Any,
) -> BaseChatModel:
```

**Parameters:**

- `model`: string, required, model name in format `model_name` or `provider_name:model_name`
- `model_provider`: optional string, model provider name
- `**kwargs`: any type, optional, additional model parameters

**Returns:** BaseChatModel type, loaded chat model instance

**Examples:**

```python
model = load_chat_model("vllm:qwen3-4b")
```

## ChatModelType

Supported types for the `chat_model` parameter when registering a model provider.

```python
ChatModelType = Union[type[BaseChatModel], Literal["openai-compatible"]]
```

## ProviderConfig

Configuration for model providers.

```python
class ProviderConfig(TypedDict):
    supported_tool_choice: NotRequired[ToolChoiceType]
    keep_reasoning_content: NotRequired[bool]
    support_json_mode: NotRequired[bool]
```

**Field Descriptions:**

- `supported_tool_choice`: optional list type, represents the `tool_choice` parameters supported by the model provider
- `keep_reasoning_content`: optional boolean, whether to retain reasoning content (`reasoning_content`) in subsequent messages
- `support_json_mode`: optional boolean, whether to support the `json_mode` structured output method

## ChatModelProvider

Chat model provider configuration type.

```python
class ChatModelProvider(TypedDict):
    provider_name: str
    chat_model: ChatModelType
    base_url: NotRequired[str]
    provider_config: NotRequired[ProviderConfig]
```

**Field Descriptions:**

- `provider_name`: string, required, provider name
- `chat_model`: BaseChatModel type or string type, required, supports passing chat model class or string (currently only supports `"openai-compatible"`)
- `base_url`: optional string, base URL
- `provider_config`: optional ProviderConfig type, represents model provider configuration

## ToolChoiceType

Supported types for the `tool_choice` parameter.

```python
ToolChoiceType = list[Literal["auto", "none", "required", "specific"]]
```
