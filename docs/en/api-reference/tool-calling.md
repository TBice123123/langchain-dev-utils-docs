# Tool Calling

## has_tool_calling

Check if a message contains tool calls.

```python
def has_tool_calling(
    message: AIMessage
) -> bool
```

**Parameters:**

- `message`: AIMessage type, required, the message to check

**Returns:** Boolean type, returns True if the message contains tool calls, otherwise False

**Example:**

```python
if has_tool_calling(response):
    # Handle tool calls
    pass
```

---

## parse_tool_calling

Parse tool call parameters from a message.

```python
def parse_tool_calling(
    message: AIMessage,
    first_tool_call_only: bool = False
) -> Union[Tuple[str, Dict[str, Any]], List[Tuple[str, Dict[str, Any]]]]
```

**Parameters:**

- `message`: AIMessage type, required, the message to parse
- `first_tool_call_only`: Boolean type, optional, whether to return only the first tool call, default False

**Returns:** A tuple of tool call name and parameters, or a list of tuples of tool call names and parameters

**Example:**

```python
# Get all tool calls
tool_calls = parse_tool_calling(response)

# Get only the first tool call
name, args = parse_tool_calling(response, first_tool_call_only=True)
```

## human_in_the_loop

A decorator to add "human-in-the-loop" manual review capability to **synchronous tool functions**.

```python
def human_in_the_loop(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func`: Optional callable type, the synchronous function to be decorated (decorator syntax sugar)
- `handler`: Optional HumanInterruptHandler type, custom interrupt handler function

**Returns:** BaseTool type, the decorated tool instance

**Example:**

```python
@human_in_the_loop
def get_current_time():
    """Get current time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
```

---

## human_in_the_loop_async

A decorator to add "human-in-the-loop" manual review capability to **asynchronous tool functions**.

```python
def human_in_the_loop_async(
    func: Optional[Callable] = None,
    *,
    handler: Optional[HumanInterruptHandler] = None
) -> Union[Callable[[Callable], BaseTool], BaseTool]
```

**Parameters:**

- `func`: Optional callable type, the asynchronous function to be decorated (decorator syntax sugar)
- `handler`: Optional HumanInterruptHandler type, custom interrupt handler function

**Returns:** BaseTool type, the decorated asynchronous tool instance

**Example:**

```python
@human_in_the_loop_async
async def get_current_time():
    """Get current time"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
```

---

## InterruptParams

Parameter type passed to the interrupt handler function.

```python
class InterruptParams(TypedDict):
    tool_call_name: str
    tool_call_args: Dict[str, Any]
    tool: BaseTool
```

**Fields:**

- `tool_call_name`: String type, tool call name
- `tool_call_args`: Dictionary type mapping strings to any values, tool call arguments
- `tool`: BaseTool type, tool instance

---

## HumanInterruptHandler

Type alias for interrupt handler functions.

```python
HumanInterruptHandler = Callable[[InterruptParams], Any]
```
