# Best Practice Guide

## Orchestration Function Selection

### Serial Orchestration

Serial orchestration should be used when tasks have a clear, non-reversible sequence. This pattern is suitable for workflows where each step depends on the output or result of the preceding one. For example, a process might first require an "Analyst Agent" to diagnose a problem, then a "Planner Agent" to create an action plan, and finally an "Executor Agent" to complete the task. This sequential execution process ensures logical rigor and step-by-step coherence and can be implemented using `sequential_pipeline`.

### Parallel Orchestration

Parallel orchestration should be used when multiple sub-tasks are independent of each other and can be processed simultaneously to reduce the total execution time. This approach can significantly improve system efficiency, especially for aggregation tasks that require collecting information or performing independent operations from multiple different sources. For instance, generating a morning briefing by simultaneously calling a weather service, a calendar service, and a news service. Since these tasks do not interfere with each other, parallel processing maximizes resource utilization and can be implemented using `parallel_pipeline`.

## Parallel Orchestration of Agents in Multi-Agent Systems

In more complex multi-agent systems, the power of parallel orchestration is further unleashed through `branches_fn`. It allows the system to dynamically and selectively execute tasks in parallel based on real-time state and context.

The core idea of this pattern is to introduce a "Coordinator Agent" (or "Router Agent"). This agent does not execute specific tasks directly. Instead, it is responsible for understanding user intent, breaking down complex requests into smaller, parallelizable sub-tasks, and then accurately distributing these sub-tasks to the most appropriate "Executor Agents."

**Common application scenarios include:**

- **Task Decomposition and Distribution**: The coordinator agent analyzes a user query, such as "Help me plan a weekend trip," and breaks it down into sub-tasks like "check weather," "search for hotels," and "recommend attractions," which are then simultaneously distributed to different specialized agents for processing.
- **Conditional Activation**: The system can dynamically decide which agents to participate based on the input content. For example, if a user's question contains financial keywords, a financial analysis agent is activated; if it contains technical terms, a technical support agent is activated, achieving intelligent, on-demand scheduling.
- **Redundancy and Verification**: For critical tasks, a request can be sent simultaneously to multiple agents with different strategies. A "Reviewer Agent" can then comprehensively compare their results to improve the accuracy and reliability of the final answer.

Through this flexible orchestration method, it is possible to build complex automation systems that are both efficient and intelligent, capable of gracefully handling multi-faceted, multi-layered complex requirements.
