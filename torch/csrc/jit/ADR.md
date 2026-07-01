# `torch/csrc/jit`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/csrc/jit` contains the C++ TorchScript compiler, IR, optimization passes, and execution runtime. It is the native implementation behind the deprecated-but-still-supported TorchScript stack and related legacy graph execution paths.

## Key Files

| File | Purpose |
|---|---|
| `torch/csrc/jit/ir/ir.h` | defines the TorchScript IR classes `Graph`, `Node`, `Value`, and `Block` |
| `torch/csrc/jit/runtime/graph_executor.cpp` | implements `GraphExecutor` setup, optimization passes, and execution-plan logic |
| `torch/csrc/jit/passes/pass_manager.h` | defines pass registration and pass manager utilities |

## Public Interface

Key symbols include `Graph`, `Node`, `Value`, `Use`, `GraphExecutor`, `EnableProfilingGuard`, `lastExecutedOptimizedGraph`, `debugSetAutodiffSubgraphInlining`, `debugSetFusionGroupInlining`, `registerPrePass`, `registerPostPass`, `clearPrePass`, `clearPostPass`, and `GraphPass`. The IR also exposes methods such as `Value::setType`, `Value::inferTypeFrom`, `Node::inputs`, and `Node::outputs` through `ir.h`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/jit](torch/jit/ADR.md) | used-by | Python TorchScript APIs delegate compilation and execution to this C++ layer |
| [aten/src/ATen/core](aten/src/ATen/core/ADR.md) | depends-on | JIT runtime eventually executes ATen operators through dispatcher/operator APIs |
| [torch/csrc](torch/csrc/ADR.md) | used-by | root extension bootstrap installs Python JIT bindings |

## Runtime Behaviour

`ir.h` defines `Graph` as the owner of all nodes in a function graph and documents that raw node/value pointers become invalid when the graph is destroyed. `graph_executor.cpp` configures execution behavior through flags and helpers such as `EnableProfilingGuard`, then runs a sequence of passes including `constant_propagation`, `dead_code_elimination`, `create_autodiff_subgraphs`, `graph_fuser`, and `tensorexpr_fuser` before producing execution plans. The same file tracks the last optimized graph in `last_executed_optimized_graph` for debugging. `pass_manager.h` provides a global registry of pre- and post-passes, so backends or extensions can inject additional IR rewrites around the standard optimization pipeline.

## Performance Profile

`GraphExecutor` exists to specialize and optimize graphs before execution, and `graph_executor.cpp` exposes debug controls for subgraph inlining and fusion because these choices materially affect runtime cost. The file also supports reuse of preprocessed graphs with `torch_jit_execution_plan_reuse_code_graph`, showing that memory footprint versus preprocessing time is a deliberate trade-off. Passes such as constant pooling, CSE, peephole, tuple lowering, and fusion are all about reducing interpreter overhead and increasing kernel granularity. The main fixed costs are IR construction and optimization, which is why TorchScript historically paid a compilation tax up front to reduce steady-state execution overhead.

## Design Rationale

The JIT stack is split into IR, passes, and runtime so individual optimization phases can be registered, reused, or disabled without changing the core graph data structures. C++ ownership of the IR keeps execution close to dispatcher/operator machinery and avoids repeated Python conversion. Although TorchScript is now legacy compared with `torch.compile`, this layered design still explains why many older export and optimization flows were able to plug into the same compiler substrate.
