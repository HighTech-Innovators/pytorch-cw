# `torch/csrc`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/csrc` is the root of PyTorch's hand-written C++ extension module for Python. It bootstraps `torch._C`, initializes core types and subsystems, and defines the long-lived bridge between Python objects and the native runtime.

## Key Files

| File | Purpose |
|---|---|
| `torch/csrc/Module.cpp` | defines `initModule`, `_initExtension`, and the main `torch._C` bootstrap sequence |
| `torch/csrc/stub.c` | provides the `PyInit__C` entrypoint that calls `initModule()` |
| `torch/csrc/autograd/python_variable.cpp` | binds Python tensor/variable objects that are initialized from the root module |

## Public Interface

Core symbols include `initModule`, `THPModule_initNames`, `THPModule_initExtension`, `PyInit__C`, and the Python-exposed `_initExtension` method registered in `Module.cpp`. The bootstrap also calls subsystem entrypoints such as `THPVariable_initModule`, `THPFunction_initModule`, `THPEngine_initModule`, `torch::cuda::initModule`, `torch::jit::initModule`, `torch::profiler::initModule`, and `torch::dynamo::initModule`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/_C](torch/_C/ADR.md) | feeds | implements the compiled `torch._C` extension contract |
| [torch/csrc/autograd](torch/csrc/autograd/ADR.md) | depends-on | bootstrap initializes Python tensor, function, and engine bindings |
| [torch/csrc/jit](torch/csrc/jit/ADR.md) | depends-on | TorchScript Python bindings attach during module initialization |
| [torch/csrc/profiler](torch/csrc/profiler/ADR.md) | depends-on | profiler bindings and trace helpers attach to the module |
| [torch/csrc/dynamo](torch/csrc/dynamo/ADR.md) | depends-on | Dynamo C++ bindings are exposed from the root compiled module |

## Runtime Behaviour

`torch/csrc/stub.c` is the CPython entrypoint: `PyInit__C` simply calls `initModule()`, which keeps the exported symbol tiny and pushes real setup into C++. In `Module.cpp`, `initModule()` creates the module with `PyModule_Create(&torchmodule)`, registers core Python-visible types, and then calls subsystem initializers such as `THPVariable_initModule`, `THPFunction_initModule`, `THPEngine_initModule`, and device-specific `initModule` functions for CUDA, MPS, XPU, CPU, and functionalization. The separate `_initExtension` path implemented by `THPModule_initExtension` finishes initialization that depends on the Python `torch` package being importable: it initializes layouts, memory formats, qschemes, dtypes, tensor bindings, `libshm`, `THPStorage_postInit`, and `THPAutograd_initFunctions()`.

## Performance Profile

The bootstrap is initialization-heavy but mostly one-time work, so steady-state runtime cost comes from the object models and functions it registers rather than from `initModule()` itself. `THPModule_initExtension` deliberately batches multiple registries and binding tables into one call so repeated Python-level setup does not happen on every import subpath. `Module.cpp` also wires optional subsystem initialization by build flag, which keeps unsupported device or distributed code paths out of the hot import path on smaller builds.

## Design Rationale

The split between `stub.c`, `initModule()`, and `_initExtension` keeps the CPython-facing entrypoint minimal while allowing a staged bootstrap that depends on both native state and Python package state. `torch/csrc` owns the top-level extension rather than scattering initialization across directories so there is a single place that sequences autograd, JIT, profiler, device, and compiler bindings. The design also preserves a clear boundary: Python imports `torch._C`, and `torch/csrc` decides which native subsystems become visible on that module.
