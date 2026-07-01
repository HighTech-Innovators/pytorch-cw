# `torch/nn`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/nn` defines the stateful module abstraction used to build models and the parameter objects that participate in optimization. It also hosts the functional operator surface that mirrors many module computations without owning module state.

## Key Files

| File | Purpose |
|---|---|
| `torch/nn/modules/module.py` | defines `Module`, registration APIs, hooks, and state-dict traversal |
| `torch/nn/parameter.py` | defines `Parameter`, `Buffer`, and uninitialized parameter/buffer variants |
| `torch/nn/functional.py` | houses stateless functional building blocks used by modules |

## Public Interface

Important symbols include `Module`, `register_buffer`, `register_parameter`, `parameters`, `named_parameters`, `state_dict`, `load_state_dict`, `Parameter`, `Buffer`, `UninitializedParameter`, and `is_lazy`. Global hook registration helpers such as `register_module_forward_hook` and `register_module_backward_hook` are also part of the public surface.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/autograd](torch/autograd/ADR.md) | depends-on | parameters and outputs participate in gradient tracking |
| [torch/optim](torch/optim/ADR.md) | used-by | optimizers consume module parameters and serialized state |
| [torch/fx](torch/fx/ADR.md) | used-by | symbolic tracing commonly starts from `nn.Module` graphs |

## Runtime Behaviour

`Module` in `torch/nn/modules/module.py` owns the registries for parameters, buffers, child modules, and hooks, and methods such as `register_buffer` and `register_parameter` populate those registries with explicit names. `state_dict` and `load_state_dict` recursively walk module structure, which is why the same file also defines `parameters()` and `named_parameters()` for consistent traversal semantics. In `parameter.py`, `Parameter` is a `torch.Tensor` subclass with a metaclass override so instances assigned to a `Module` are treated as learnable state instead of ordinary attributes. `UninitializedParameter.materialize` provides the lazy-module path that fills in storage only after shape/device/dtype become known.

## Performance Profile

Module execution itself is mostly the cost of user `forward` methods, but `module.py` makes it clear that hooks add observable per-call overhead because every forward/backward hook registry is checked around invocation. State serialization can also be expensive for large models because `state_dict` walks the full module tree and may preserve tensor objects or clone metadata depending on caller options. `Parameter` keeps the "is this a learnable parameter?" distinction cheap by using a tensor subclass and a small `_is_param` flag path for custom tensors, avoiding repeated side registries at call time. Lazy parameters defer allocation costs, but the first materialization call pays for tensor creation and class mutation.

## Design Rationale

PyTorch distinguishes `Parameter` from a plain `Tensor` so model code can cache temporary tensors on a module without accidentally turning them into optimizer state. `Module` keeps registration, traversal, and serialization in one base class so optimizers, tracers, checkpointing, and distributed wrappers all see a consistent model topology. The coexistence of module and functional APIs reflects the design goal of supporting both stateful model authoring and stateless transformations.
