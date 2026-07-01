# `torch/_C`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/_C` is the Python-visible boundary of PyTorch's compiled runtime. `src/torch/_C/__init__.pyi.in` declares core objects such as `device`, `Stream`, `Event`, `Size`, and `dtype`, and it aggregates extension submodules such as `_onnx`, `_functorch`, `_export`, `_dynamo`, and `_distributed` into one import surface.

## Key Files


| File | Purpose |
|---|---|
| `src/torch/_C/__init__.pyi.in` | primary type stub and submodule aggregator |
| `src/torch/_C/_onnx.pyi` | ONNX enums and producer metadata |
| `src/torch/_C/_functorch.pyi` | dynamic-layer and transform hooks |
| `src/torch/_C/_profiler.pyi` | profiler-facing extension surface |
| `src/torch/_C/build.bzl` | build metadata for the extension package |

## Public Interface

The core stub exposes the canonical Python types for devices, streams, events, dtypes, storages, and many extension-backed functions. Focused stub files such as `_onnx.pyi` and `_functorch.pyi` then define smaller namespaces for optional subsystems, which keeps type signatures discoverable without flattening every compiled symbol into one file.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/csrc](torch/csrc/ADR.md) | depends-on | compiled definitions (`Module.cpp`, `Device.cpp`, `Stream.cpp`) |
| [torch/cuda](torch/cuda/ADR.md) | used-by | Python package consuming the extension contract |
| [torch/jit](torch/jit/ADR.md) | used-by | Python package consuming compiled JIT types |
| [torchgen](torchgen/ADR.md) | depends-on | codegen output conventions for the stub |

## Runtime Behaviour

At runtime, `import torch` eventually loads the compiled `torch._C` extension and then layers Python modules on top of the symbols described in `src/torch/_C/__init__.pyi.in`. The stub shows that core execution objects such as `Stream` and `Event` are not Python shims but direct extension types with methods like `synchronize()`, `wait_stream()`, and `elapsed_time()`. Submodule stubs like `src/torch/_C/_functorch.pyi` also reveal that advanced systems such as dynamic transform stacks are managed in native code and only orchestrated from Python.

## Performance Profile

Because `torch._C` is the native boundary, it is on the hot path for dispatch, autograd, streams, and many compiler hooks discussed across Chapters 04, 06, 08, 09, and 10. Keeping these objects as extension types avoids Python reimplementation overhead and gives adjacent Python packages a thin wrapper surface. The flip side is that this contract is broad and performance-sensitive, so mismatches between stubs and implementation would affect many subsystems at once.

## Design Rationale

PyTorch needs one stable extension anchor that every higher-level package can import without circularly rebuilding native concepts in Python. The split between a master stub and subsystem-specific stub files keeps the contract legible while still reflecting the repository's native-first architecture from Chapter 01.
