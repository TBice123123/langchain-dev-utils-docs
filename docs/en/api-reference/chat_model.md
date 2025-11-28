# ChatModel Module API Reference

## register_model_provider

Registers a provider for chat models.

```python
def register_model_provider(
    provider_name: str,
    chat_model: ChatModelType,
    base_url: Optional[str] = None,
    provider_profile: Optional[dict[str, dict[str, Any]]] = None,
    provider_config: Optional[ProviderConfig] = None,
) -> None:
```

**Parameters:**

- `provider_name` (`str`, required): Custom name for the provider.
- `chat_model` (`ChatModelType`, required): Either a `ChatModel` class or a supported provider identifier string.
- `base_url` (`Optional[str]`): Base URL of the provider (optional).
- `provider_profile` (`Optional[dict[str, dict[str, Any]]]`): Optional dictionary specifying model profiles supported by the provider, in the format `{model_name: model_profile}`.
- `provider_config` (`Optional[ProviderConfig]`): Optional configuration for the provider.

**Examples:**

```python
register_model_provider("fakechat", FakeChatModel)
register_model_provider("vllm", "openai-compatible", base_url="http://localhost:8000/v1")
```

---

## batch_register_model_provider

Registers multiple model providers in bulk.

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider],
) -> None:
```

**Parameters:**

- `providers` (`list[ChatModelProvider]`, required): A list of provider configurations.

**Example:**

```python
batch_register_model_provider([
    {"provider_name": "fakechat", "chat_model": FakeChatModel},
    {"provider_name": "vllm", "chat_model": "openai-compatible", "base_url": "http://localhost:8000/v1"},
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

- `model` (`str`, required): Model name, either as `model_name` or `provider_name:model_name`.
- `model_provider` (`Optional[str]`): Name of the model provider (optional).
- `**kwargs` (`Any`): Additional keyword arguments passed to the model constructor.

**Returns:**  
An instance of `BaseChatModel`.

**Example:**

```python
model = load_chat_model("vllm:qwen3-4b")
```

---

## ChatModelType

Type alias for the `chat_model` parameter when registering a model provider.

```python
ChatModelType = Union[type[BaseChatModel], Literal["openai-compatible"]]
```

---

## ProviderConfig

Configuration options for a model provider.

```python
class ProviderConfig(TypedDict):
    supported_tool_choice: NotRequired[ToolChoiceType]
    keep_reasoning_content: NotRequired[bool]
    support_json_mode: NotRequired[bool]
```

**Fields:**

- `supported_tool_choice` (`NotRequired[ToolChoiceType]`): Optional list indicating which `tool_choice` values the provider supports.
- `keep_reasoning_content` (`NotRequired[bool]`): Optional flag indicating whether reasoning content should be retained in subsequent messages.
- `support_json_mode` (`NotRequired[bool]`): Optional flag indicating whether structured output in JSON mode is supported.

---

## ChatModelProvider

Typed dictionary representing a chat model provider configuration.

```python
class ChatModelProvider(TypedDict):
    provider_name: str
    chat_model: ChatModelType
    base_url: NotRequired[str]
    provider_profile: NotRequired[dict[str, dict[str, Any]]]
    provider_config: NotRequired[ProviderConfig]
```

**Fields:**

- `provider_name` (`str`, required): Name of the provider.
- `chat_model` (`ChatModelType`, required): Either a subclass of `BaseChatModel` or a string identifier (currently only `"openai-compatible"` is supported).
- `base_url` (`NotRequired[str]`): Optional base URL for the provider.
- `provider_profile` (`NotRequired[dict[str, dict[str, Any]]]`): Optional dictionary mapping model names to their profiles.
- `provider_config` (`NotRequired[ProviderConfig]`): Optional provider-specific configuration.

---

## ToolChoiceType

Type definition for supported `tool_choice` parameter values.

```python
ToolChoiceType = list[Literal["auto", "none", "required", "specific"]]
```