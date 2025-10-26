# ChatModel Module API Reference

## register_model_provider

Registers a chat model provider.

```python
def register_model_provider(
    provider_name: str,
    chat_model: ChatModelType,
    base_url: Optional[str] = None,
    tool_choice: Optional[ToolChoiceType] = None,
) -> None:
```

**Parameters:**

- `provider_name`: string, required, custom provider name
- `chat_model`: ChatModel class or supported provider string type, required
- `base_url`: optional string, provider's BaseURL
- `tool_choice`: optional list type, represents the `tool_choice` parameters supported by the model provider

**Examples:**

```python
register_model_provider("fakechat", FakeChatModel)
register_model_provider("vllm", "openai-compatible", base_url="http://localhost:8000/v1")
```

## batch_register_model_provider

Batch registers model providers.

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider]
) -> None
```

**Parameters:**

- `providers`: list of ChatModelProvider type, required, list of provider configurations

**Example:**

```python
batch_register_model_provider([
    {"provider": "fakechat", "chat_model": FakeChatModel},
    {"provider": "vllm", "chat_model": "openai-compatible", "base_url": "http://localhost:8000/v1"},
])
```

## load_chat_model

Loads a chat model from registered providers.

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

**Return Value:** BaseChatModel type, loaded chat model instance

**Example:**

```python
model = load_chat_model("vllm:qwen3-4b")
```

## ChatModelType

Supported types for the `chat_model` parameter when registering a model provider.

```python
ChatModelType = Union[type[BaseChatModel], Literal["openai-compatible"]]
```

## ChatModelProvider

Chat model provider configuration type.

```python
class ChatModelProvider(TypedDict):
    provider: str
    chat_model: ChatModelType
    base_url: NotRequired[str]
    tool_choice: NotRequired[ToolChoiceType]
```

**Field Descriptions:**

- `provider`: string, required, provider name
- `chat_model`: BaseChatModel type or string type, required, chat model class or string
- `base_url`: not required string, base URL
- `tool_choice`: not required list type, represents the `tool_choice` parameters supported by the model provider

## ToolChoiceType

Supported types for the `tool_choice` parameter.

```python
ToolChoiceType = list[Literal["auto", "none", "any", "required", "specific"]]
```
