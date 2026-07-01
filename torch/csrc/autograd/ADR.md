# `torch/csrc/autograd`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/csrc/autograd` implements PyTorch's core reverse-mode autodiff engine and the native tensor gradient graph model. It owns `Node`, `GraphTask`, `ReadyQueue`, gradient-edge construction, and the Python bindings that expose tensor/autograd behavior through `torch._C`.

## Key Files

| File | Purpose |
|---|---|
| `torch/csrc/autograd/engine.h` | declares `Engine`, `ReadyQueue`, `NodeTask`, and the public execution API |
| `torch/csrc/autograd/graph_task.h` | defines `GraphTask` state such as dependencies, captured vars, and completion futures |
| `torch/csrc/autograd/function.h` | defines gradient-edge helpers such as `create_gradient_edge` and `collect_next_edges` |
| `torch/csrc/autograd/node.h` | defines `Node`, `next_edges`, input metadata, and sequence numbers |
| `torch/csrc/autograd/python_variable.cpp` | initializes the Python tensor/variable bindings |
| `torch/csrc/autograd/python_function.cpp` | initializes Python custom-function bindings |
| `torch/csrc/autograd/python_engine.cpp` | initializes the Python-visible engine stub |

## Public Interface

Key symbols include `Engine::get_default_engine`, `Engine::execute`, `Engine::execute_with_graph_task`, `Engine::evaluate_function`, `ReadyQueue::push`, `ReadyQueue::pop`, `GraphTask::init_to_execute`, `torch::autograd::Node`, `Node::next_edges`, `Node::add_input_metadata`, `Node::sequence_nr`, `create_gradient_edge`, `collect_next_edges`, `THPVariable_initModule`, `THPFunction_initModule`, and `THPEngine_initModule`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10/core](c10/core/ADR.md) | depends-on | tensors, intrusive pointers, and dispatch metadata underpin gradient edges |
| [torch/autograd](torch/autograd/ADR.md) | used-by | Python `backward`, `grad`, and `Function` APIs call into this engine |
| [torch/nn](torch/nn/ADR.md) | used-by | parameters and module gradients flow through `Node` and `Engine` |
| [torch/csrc](torch/csrc/ADR.md) | used-by | root module bootstrap installs the Python bindings from this directory |

## Runtime Behaviour

`Engine::execute` in `engine.cpp` builds a `GraphTask`, calls `compute_dependencies`, and then invokes `graph_task->init_to_execute(...)` before work starts. `thread_main` repeatedly pops `NodeTask` instances from `ReadyQueue`, and `evaluate_function` executes one node, updates `GraphTask::captured_vars_`, and decrements `dependencies_` so newly ready successors can be queued. `GraphTask` in `graph_task.h` tracks `outstanding_tasks_`, `dependencies_`, `captured_vars_`, and `future_result_`, so the engine can both block for ordinary backward calls and complete asynchronous graph-task futures. On graph construction, `create_gradient_edge` in `function.h` calls `Node::add_input_metadata(variable)` and then installs the edge on the variable.

## Performance Profile

`ReadyQueue` orders work by reentrant depth and `Node::sequence_nr()`, which helps the engine avoid unbounded recursion and preserve useful execution ordering for profiling and correctness-sensitive cases. `GraphTask` stores dependency counts and `not_ready_` buffers so gradient accumulation happens incrementally instead of requiring a separate whole-graph materialization pass. There are still synchronization costs: `engine.cpp` explicitly locks around `captured_vars_`, `dependencies_`, and queue state, and cross-device execution pays additional queue handoff and worker-thread coordination overhead. The design tries to keep the hot path pointer-based by using intrusive nodes, input buffers, and futures instead of repeatedly rebuilding Python objects.

## Design Rationale

The directory separates graph structure (`Node`, gradient edges) from execution state (`GraphTask`, `ReadyQueue`, `Engine`) so graph construction remains lightweight while backward scheduling can remain highly concurrent. Sequence numbers and stored input metadata exist because autograd must support anomaly detection, profiling, and shape-sensitive validation as part of runtime execution. Python bindings are kept beside the engine because the bridge has to expose native graph concepts like grad functions and engine stubs without reimplementing them in Python.
