# `torch/autograd`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/autograd` is the Python-facing automatic differentiation API. It wraps the native engine with functions like `backward` and `grad`, and defines the `Function` protocol for Python-authored custom differentiation logic.

## Key Files

| File | Purpose |
|---|---|
| `torch/autograd/__init__.py` | exports `backward`, `grad`, anomaly helpers, and grad-mode utilities |
| `torch/autograd/function.py` | defines `FunctionCtx`, `FunctionMeta`, `Function`, and custom autograd conventions |
| `torch/autograd/graph.py` | exposes graph-level helpers such as `_engine_run_backward` and saved-tensor hooks |

## Public Interface

Primary symbols include `backward`, `grad`, `Function`, `NestedIOFunction`, `Function.apply`, `FunctionCtx.save_for_backward`, `FunctionCtx.save_for_forward`, `FunctionCtx.mark_dirty`, `FunctionCtx.mark_non_differentiable`, `detect_anomaly`, and `set_multithreading_enabled`. `__all__` in `torch/autograd/__init__.py` also re-exports `gradcheck`, `gradgradcheck`, `no_grad`, `enable_grad`, and `inference_mode`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/csrc/autograd](torch/csrc/autograd/ADR.md) | depends-on | backward execution and gradient nodes come from the native engine |
| [torch/nn](torch/nn/ADR.md) | used-by | modules and parameters rely on `backward`/`grad` conventions |
| [torch/_functorch](torch/_functorch/ADR.md) | used-by | transform APIs compose with `Function` and backward calls |

## Runtime Behaviour

`backward` and `grad` in `torch/autograd/__init__.py` normalize user inputs and route gradient tensors through `_make_grads`, which validates shape and dtype compatibility and materializes implicit ones for scalar outputs when allowed. The same file handles both plain `Tensor` outputs and `graph.GradientEdge` objects, which is why it consults saved output metadata before shape checks. In `function.py`, `FunctionCtx.save_for_backward` and `save_for_forward` record tensors for later `backward` and `jvp` use, while `mark_dirty` and `mark_non_differentiable` tell the engine how to validate aliasing and gradient requirements. `FunctionMeta` and `Function.apply` define the class-based protocol that Python custom ops plug into.

## Performance Profile

`_make_grads` avoids going through generic operator shape checks when symbolic sizes are involved and instead uses shape metadata plus `sym_eq`, which reduces overhead and preserves support for unbacked symbolic integers. `save_for_backward` exists partly for performance hygiene: it lets the engine apply saved-tensor hooks and avoid leaking intermediary tensors by storing them in a standard place rather than arbitrary Python attributes. The main costs at this layer are Python dispatch, tuple/list normalization, and custom-function bookkeeping, so hot training loops often spend more time in the C++ engine than in these wrappers. Still, poorly designed custom `Function` subclasses can add extra copies or inhibit double-backward support if they save large intermediates unnecessarily.

## Design Rationale

PyTorch keeps the high-level API in Python because users need an ergonomic place to call `backward`, request gradients, and author custom differentiation logic. The `Function` protocol is explicit rather than magic: saved tensors, dirty outputs, and non-differentiable outputs all have named APIs so correctness checks can remain centralized. The split from `torch/csrc/autograd` lets Python stay user-facing while the native engine remains performance-oriented and backend-agnostic.
