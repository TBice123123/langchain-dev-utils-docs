# Embeddings Module API Reference

## register_embeddings_provider

Registers a provider for embedding models.

```python
def register_embeddings_provider(
    provider_name: str,
    embeddings_model: EmbeddingsType,
    base_url: Optional[str] = None,
) -> None:
```

**Parameters:**

- `provider_name`: String, required. Custom provider name.
- `embeddings_model`: Embedding model class or supported provider string type, required.
- `base_url`: Optional string. Provider's BaseURL.

**Example:**

```python
register_embeddings_provider("fakeembeddings", FakeEmbeddings)
register_embeddings_provider("vllm", "openai-compatible", base_url="http://localhost:8000/v1")
```

---

## batch_register_embeddings_provider

Bulk registers embedding model providers.

```python
def batch_register_embeddings_provider(
    providers: list[EmbeddingProvider]
) -> None:
```

**Parameters:**

- `providers`: List of EmbeddingProvider type, required. List of provider configurations.

**Example:**

```python
batch_register_embeddings_provider([
    {"provider": "fakeembeddings", "embeddings_model": FakeEmbeddings},
    {"provider": "vllm", "embeddings_model": "openai-compatible", "base_url": "http://localhost:8000/v1"},
])
```

---

## load_embeddings

Loads an embedding model from registered providers.

```python
def load_embeddings(
    model: str,
    *,
    provider: Optional[str] = None,
    **kwargs: Any,
) -> Embeddings:
```

**Parameters:**

- `model`: String, required. Model name in the format `model_name` or `provider_name:model_name`.
- `provider`: Optional string. Model provider name.
- `**kwargs`: Any type, optional. Additional model parameters.

**Return Value:** Embeddings type, the loaded embedding model instance.

**Example:**

```python
embeddings = load_embeddings("vllm:qwen3-embedding-4b")
```

---

## EmbeddingsType

Supported types for the `embeddings_model` parameter when registering an embedding provider.

```python
EmbeddingsType = Union[type[Embeddings], Literal["openai-compatible"]]
```

---

## EmbeddingProvider

Embedding model provider configuration type.

```python
class EmbeddingProvider(TypedDict):
    provider: str
    embeddings_model: EmbeddingsType
    base_url: NotRequired[str]
```

**Field Descriptions:**

- `provider`: String, required. Provider name.
- `embeddings_model`: Embeddings type or string type, required. Embedding model class or string.
- `base_url`: Not required string type. Base URL.
