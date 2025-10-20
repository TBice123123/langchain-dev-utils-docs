# ChatModel Module API Reference

## register_model_provider

Registers a provider for chat models.

```python
def register_model_provider(
    provider_name: str,
    chat_model: ChatModelType,
    base_url: Optional[str] = None,
) -> None:
```

**Parameters:**

- `provider_name`: String, required. Custom provider name.
- `chat_model`: ChatModel class or supported provider string type, required.
- `base_url`: Optional string. Provider's BaseURL.

**Example:**

```python
register_model_provider("fakechat", FakeChatModel)
register_model_provider("vllm", "openai-compatible", base_url="http://localhost:8000/v1")
```

---

## batch_register_model_provider

Bulk registers model providers.

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider]
) -> None
```

**Parameters:**

- `providers`: List of ChatModelProvider type, required. List of provider configurations.

**Example:**

```python
batch_register_model_provider([
    {"provider": "fakechat", "chat_model": FakeChatModel},
    {"provider": "vllm", "chat_model": "openai-compatible", "base_url": "http://localhost:8000/v1"},
])
```

---

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

- `model`: String, required. Model name in the format `model_name` or `provider_name:model_name`.
- `model_provider`: Optional string. Model provider name.
- `**kwargs`: Any type, optional. Additional model parameters.

**Return Value:** BaseChatModel type, the loaded chat model instance.

**Example:**

```python
model = load_chat_model("vllm:qwen3-4b")
```

---

## ChatModelType

Supported types for the `chat_model` parameter when registering a model provider.

```python
ChatModelType = Union[type[BaseChatModel], Literal["openai-compatible"]]
```

---

## ChatModelProvider

Chat model provider configuration type.

```python
class ChatModelProvider(TypedDict):
    provider: str
    chat_model: ChatModelType
    base_url: NotRequired[str]
```

**Field Descriptions:**

- `provider`: String, required. Provider name.
- `chat_model`: BaseChatModel type or string type, required. Chat model class or string.
- `base_url`: Not required string type. Base URL.
