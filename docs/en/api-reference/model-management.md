# Model Management

## register_model_provider

Register a provider for chat models.

```python

def register_model_provider(
    provider_name: str,
    chat_model: ChatModelType,
    base_url: Optional[str] = None,
)-> None:
```

**Parameters:**

- `provider_name`: string, required, custom provider name
- `chat_model`: ChatModel class or supported provider string type, required
- `base_url`: optional string, BaseURL for the provider

**Example:**

```python
register_model_provider("fakechat",FakeChatModel)
register_model_provider("vllm", "openai-compatible", base_url="http://localhost:8000/v1")
```

---

## batch_register_model_provider

Batch register model providers.

```python
def batch_register_model_provider(
    providers: list[ChatModelProvider]
) -> None
```

**Parameters:**

- `providers`: list of ChatModelProvider, required, list of provider configurations

**Example:**

```python
batch_register_model_provider([
    {"provider": "fakechat", "chat_model": FakeChatModel},
    {"provider": "vllm", "chat_model": "openai-compatible", "base_url": "http://localhost:8000/v1"},
])
```

---

## load_chat_model

Load a chat model from a registered provider.

```python
def load_chat_model(
    model: str,
    *,
    model_provider: Optional[str] = None,
    **kwargs: Any,
) -> BaseChatModel:
```

**Parameters:**

- `model`: string, required, model name, formatted as `model_name` or `provider_name:model_name`
- `model_provider`: optional string, model provider name
- `**kwargs`: any type, optional, additional model parameters

**Returns:** BaseChatModel type, the loaded chat model instance

**Example:**

```python
model = load_chat_model("vllm:qwen3-4b")
```

---

## register_embeddings_provider

Register a provider for embedding models.

```python
def register_embeddings_provider(
    provider_name: str,
    embeddings_model: EmbeddingsType,
    base_url: Optional[str] = None,
)-> None:
```

**Parameters:**

- `provider_name`: string, required, custom provider name
- `embeddings_model`: embedding model class or supported provider string type, required
- `base_url`: optional string, BaseURL for the provider

**Example:**

```python
register_embeddings_provider("fakeembeddings", FakeEmbeddings)
register_embeddings_provider("vllm", "openai-compatible", base_url="http://localhost:8000/v1")
```

---

## batch_register_embeddings_provider

Batch register embedding model providers.

```python
def batch_register_embeddings_provider(
    providers: list[EmbeddingProvider]
)-> None:
```

**Parameters:**

- `providers`: list of EmbeddingProvider, required, list of provider configurations

**Example:**

```python
batch_register_embeddings_provider([
    {"provider": "fakeembeddings", "embeddings_model": FakeEmbeddings},
    {"provider": "vllm", "embeddings_model": "openai-compatible", "base_url": "http://localhost:8000/v1"},
])
```

---

## load_embeddings

Load an embedding model from a registered provider.

```python
def load_embeddings(
    model: str,
    *,
    provider: Optional[str] = None,
    **kwargs: Any,
) -> Embeddings:
```

**Parameters:**

- `model`: string, required, model name, formatted as `model_name` or `provider_name:model_name`
- `provider`: optional string, model provider name
- `**kwargs`: any type, optional, additional model parameters

**Returns:** Embeddings type, the loaded embedding model instance

**Example:**

```python
embeddings = load_embeddings("vllm:qwen3-embedding-4b")
```

---

## ChatModelType

The supported types for the `chat_model` parameter when registering a model provider.

```python
ChatModelType = Union[type[BaseChatModel], Literal["openai-compatible"]]
```

---

## EmbeddingsType

The supported types for the `embeddings_model` parameter when registering an embedding provider.

```python
EmbeddingsType = Union[type[Embeddings], Literal["openai-compatible"]]
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

**Fields:**

- `provider`: string, required, provider name
- `chat_model`: BaseChatModel type or string type, required, chat model class or string
- `base_url`: NotRequired string, base URL

---

## EmbeddingProvider

Embedding model provider configuration type.

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: EmbeddingsType
    base_url: NotRequired[str]
```

**Fields:**

- `provider`: string, required, provider name
- `embeddings_model`: Embeddings type or string type, required, embedding model class or string
- `base_url`: NotRequired string, base URL
