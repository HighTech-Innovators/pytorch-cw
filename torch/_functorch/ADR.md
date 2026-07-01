# `torch/_functorch`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/_functorch` implements function transforms such as `vmap`, `grad`, and functionalization, and it houses AOTAutograd's graph-capture pipeline. It is the implementation layer behind `torch.func` and the compiled-training plumbing shared with Dynamo and Inductor.

## Key Files

| File | Purpose |
|---|---|
| `torch/_functorch/aot_autograd.py` | defines `aot_function`, `aot_module`, and AOTAutograd compile orchestration |
| `torch/_functorch/apis.py` | defines user-facing transform wrappers such as `vmap` |
| `torch/_functorch/eager_transforms.py` | implements eager `grad`, `grad_and_value`, and `functionalize` transform logic |

## Public Interface

Key symbols include `aot_function`, `aot_module`, `aot_module_simplified`, `aot_stage1_graph_capture`, `aot_stage2_compile`, `vmap`, `grad_impl`, `grad_and_value_impl`, and `functionalize`. `apis.py` also exposes `vmap_impl` plumbing through the `vmap` wrapper that `torch.func` re-exports.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/autograd](torch/autograd/ADR.md) | depends-on | transform implementations call into autograd primitives |
| [torch/fx](torch/fx/ADR.md) | depends-on | AOTAutograd captures and compiles FX graphs |
| [torch/_dynamo](torch/_dynamo/ADR.md) | interacts-with | compiled training paths combine frame capture with AOT graphs |
| [functorch](functorch/ADR.md) | surfaced-by | the compatibility shim points to this implementation layer |

## Runtime Behaviour

`aot_autograd.py` wires the multi-stage AOT pipeline together: `aot_function` and `aot_module` eventually call `aot_stage1_graph_capture(...)` and `aot_stage2_compile(...)` to build compiled forward/backward functions. The long comments in that file document how input mutations are removed from the compiled graph and instead returned as updated inputs that an epilogue copies back into user tensors. In `eager_transforms.py`, `grad_impl` delegates to `grad_and_value_impl`, which wraps tensors at a transform nesting level, calls the user function under `torch.enable_grad()`, and then invokes `_autograd_grad(..., create_graph=True)` to compute gradients. `functionalize` wraps tensors into functional tensors, synchronizes pending updates with `torch._sync`, and unwraps views or mutations on the way out.

## Performance Profile

AOTAutograd spends real time on graph capture, metadata analysis, and cache decisions, but it can remove substantial runtime overhead by compiling both forward and backward graphs once and replaying a lightweight epilogue for mutations. The mutation notes in `aot_autograd.py` show that preserving semantics can require extra outputs and copy-back work, which is a cost trade-off for compiler friendliness. `vmap` in `apis.py` is efficient when operations support batched dispatch, but nested transforms and chunked execution still add Python-level wrapping and unwrapping overhead. `functionalize` similarly pays bookkeeping cost up front so downstream compilers can see pure, mutation-free graphs.

## Design Rationale

PyTorch keeps transforms in a dedicated implementation package because batching, functionalization, and AOT differentiation are cross-cutting program rewrites rather than ordinary operators. The split between `apis.py`, eager transform internals, and AOT compile logic lets user-facing wrappers stay small while complex tracing and mutation handling remain isolated. The migration toward `torch.func` is reflected directly in `apis.py`, but the implementation still preserves the older functorch layering for compatibility and compiler integration.
