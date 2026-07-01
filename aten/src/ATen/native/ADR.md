# `aten/src/ATen/native`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`aten/src/ATen/native` is the source-of-truth directory for most ATen operator definitions and kernel implementations. It combines declarative operator metadata in `native_functions.yaml` with C++ meta/kernel code such as `BinaryOps.cpp` and generated ATen entrypoints.

## Key Files

| File | Purpose |
|---|---|
| `aten/src/ATen/native/native_functions.yaml` | declarative operator registry with schemas, variants, dispatch keys, and special codegen flags |
| `aten/src/ATen/native/BinaryOps.cpp` | representative native operator file showing structured meta functions and binary-op setup |
| `aten/src/ATen/native/README.md` | implementation guide for registering operators and dispatching native kernels |

## Public Interface

The directory exports operator schemas and kernel names such as `_backward`, `set_data`, `data`, `is_leaf`, `requires_grad_`, `retain_grad`, `_fw_primal`, `_make_dual`, `_unpack_dual`, and structured binary operators like `add`, `sub`, `mul`, and `div`. Inside `BinaryOps.cpp`, symbols such as `TORCH_META_FUNC2(add, Tensor)`, `TORCH_META_FUNC2(sub, Tensor)`, `build_borrowing_binary_op`, and `build_borrowing_binary_float_op` define the structured-kernel surface used by generated registrations.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [aten/src/ATen](aten/src/ATen/ADR.md) | depends-on | native kernels consume TensorIterator and public ATen headers |
| [aten/src/ATen/core](aten/src/ATen/core/ADR.md) | depends-on | registrations target dispatcher schemas and dispatch tables |
| [torchgen](torchgen/ADR.md) | used-by | code generation reads `native_functions.yaml` and emits bindings/registrations |
| [tools/autograd](tools/autograd/ADR.md) | used-by | autograd codegen consumes operator metadata from the YAML registry |

## Runtime Behaviour

`native_functions.yaml` drives the registration pipeline by declaring the operator schema string, `variants`, optional `dispatch` maps, and flags such as `manual_cpp_binding` and `autogen`. The first lines of the file already show native functions that bind directly to autograd-facing behavior, such as `_backward`, `set_data`, `retain_grad`, and forward-AD helpers. `BinaryOps.cpp` illustrates the structured-kernel flow: `TORCH_META_FUNC2(add, Tensor)` and similar functions build the output metadata with helpers like `build_borrowing_binary_op`, then generated dispatch glue routes the actual compute path to backend kernels. `README.md` explains that native functions become both ATen C++ APIs and Python-visible operations through code generation rather than manual duplicate registration.

## Performance Profile

The structured-kernel split keeps shape inference and output allocation in meta functions, which avoids duplicating setup work across CPU, CUDA, and other backends. `BinaryOps.cpp` uses `TensorIterator` setup helpers so broadcasting, dtype promotion, and contiguous-loop planning happen once per operator call instead of inside the inner kernel loop. The YAML registry also supports backend-specific dispatch and composite kernels, letting cheap composite implementations avoid unnecessary device-specific duplication while performance-critical ops can still land on specialized kernels. Per-operator headers in `BinaryOps.cpp` further reduce compile and include cost compared with a monolithic include surface.

## Design Rationale

PyTorch uses `native_functions.yaml` as the single source of truth because the operator surface is too large to maintain manually across C++, Python bindings, autograd, and backend registration. Keeping the YAML beside native C++ kernels makes the schema and implementation reviewable together. Structured kernels separate metadata computation from execution so new backends can reuse the same operator contract while implementing only the compute portion they need.
