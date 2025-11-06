# Best Practice Guide

## Tool Call Handling

For an `AIMessage`, to determine and extract tool call content, follow these steps:

1.  Use `has_tool_calling` to check if there is a tool call. If not, end the process; otherwise, proceed to step 2.
2.  If a tool call exists, use `parse_tool_calling` to extract the tool call name and arguments.
3.  If the tool call list contains only one item, you can set `first_tool_call_only=True` in `parse_tool_calling`.

## Human-in-the-Loop Review

Two core decorators:

- `human_in_the_loop` for synchronous functions.
- `human_in_the_loop_async` for asynchronous functions.

**Note**: The decorator order must be `@human_in_the_loop` before `@tool`. Alternatively, you can directly use the `human_in_the_loop` decorator (which will automatically convert the function to a tool; the same applies to async functions).

### Custom Review Logic

If you need to add a custom human-in-the-loop process, you have two options:

1.  Use the `human_in_the_loop` decorator (or `human_in_the_loop_async`).
2.  Use the `interrupt` function provided directly by LangGraph.

The first approach is generally used when multiple functions require human-in-the-loop support with the same process. In this case, you can define a handler and then apply the decorator to multiple functions.

The second approach is generally used when a single function requires human-in-the-loop support. The simplest way is to use `interrupt` directly without needing a decorator.
