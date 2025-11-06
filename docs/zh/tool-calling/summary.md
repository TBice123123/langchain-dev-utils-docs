# 最佳实践指南

## 工具调用处理

对于一个 AIMessage，如果想要判断并提取里面的工具调用内容，分为以下几步：

- 1. 使用`has_tool_calling`判断是否有根据调用，如果没有结束，否则进入第二步
- 2. 如果有，使用`parse_tool_calling`提取工具调用名称和参数
- 3. 如果工具调用的列表仅有一条内容，可以在`parse_tool_calling`中设置`first_tool_call_only=True`。

## 人在回路审核

两个核心装饰器：

- `human_in_the_loop` 用于同步函数。
- `human_in_the_loop_async` 用于异步函数。

**注意**：装饰器的顺序必须是`@human_in_the_loop`在`@tool`之前。或者直接使用`human_in_the_loop`装饰器（会自动将函数转化为 tool，异步函数同样）。

### 自定义审核逻辑

如果需要添加自定义人在回路流程。你有两种做法。

1. 使用`human_in_the_loop`装饰器（或者`human_in_the_loop_async`）
2. 直接使用 langgraph 提供的`interrupt`函数。

对于第一种，一般是用于多个函数需要人在回路支持，且流程相同，此时可以定义一个 handler，然后依次为多个函数添加装饰器。

对于第二种，一般是用于单个函数需要人在回路支持，则最简单的方式就是直接使用`interrupt`而无需使用装饰器。
