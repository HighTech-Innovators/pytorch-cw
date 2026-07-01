# `c10`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`c10` is PyTorch's lowest-level shared runtime library. It defines backend-agnostic primitives such as devices, streams, allocators, visibility macros, and core compilation settings, then hosts backend-specific extensions like CUDA and XPU beneath the same minimal-dependency boundary.

## Key Files

| File | Purpose |
|---|---|
| `c10/CMakeLists.txt` | defines the `c10` build target, source globs, visibility policy, and dependency constraints |
| `c10/core/Device.h` | defines the backend-agnostic `c10::Device` value type |
| `c10/core/Stream.h` | defines the backend-agnostic `c10::Stream` wrapper used by device-specific stream layers |
| `c10/macros/Export.h` | exposes the exported symbol macros used by `c10` and higher native libraries |

## Public Interface

Important public surface includes the `c10` native library target, `c10::Device`, `c10::Stream`, allocator and storage primitives from `c10/core`, and the export macros rooted in `c10/macros`. `c10/CMakeLists.txt` also exposes core build settings such as `C10_BUILD_SHARED_LIBS`, `C10_USE_GFLAGS`, `C10_USE_GLOG`, and `C10_USE_NUMA`, which are shared with the header-only macro layer and influence how the runtime is compiled.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10/core](c10/core/ADR.md) | depends-on | tensor metadata, storage, allocator, and dispatch primitives live there |
| [c10/util](c10/util/ADR.md) | depends-on | intrusive ownership, exception helpers, and utility types support the base runtime |
| [c10/cuda](c10/cuda/ADR.md) | extended-by | CUDA-specific allocator and stream services build on this core layer |
| [c10/xpu](c10/xpu/ADR.md) | extended-by | XPU-specific device, stream, and allocator services mirror the same runtime model |

## Runtime Behaviour

`c10/CMakeLists.txt` builds the `c10` library from `core`, `mobile`, `macros`, and `util` source groups, sets `C10_BUILD_MAIN_LIB` for symbol export control, and enables hidden visibility when the compiler supports it. The comments in that file explicitly warn maintainers to keep dependencies minimal because any new `c10` dependency propagates transitively through the entire native stack. At runtime, headers such as `c10/core/Device.h` and `c10/core/Stream.h` provide compact value types that higher layers wrap for backend-specific behavior without changing the generic representation.

## Performance Profile

The low-level focus of `c10` is directly performance-driven: a minimal dependency set reduces link surface, binary size, and transitive overhead for every native consumer. Core types like `Device` and `Stream` are small value wrappers, which keeps hot-path metadata checks cheap while leaving heavyweight behavior to specialized descendants. The hidden-visibility and shared/static build controls in `c10/CMakeLists.txt` also help keep symbol exposure and linking costs under control.

## Design Rationale

PyTorch isolates these primitives in `c10` so ATen, torch bindings, and backend runtimes can all share one compact foundation instead of reimplementing devices, streams, or export policy. The directory is covered separately from `c10/core`, `c10/macros`, and backend descendants because the parent is the architectural boundary that enforces the "minimal shared runtime" rule.
