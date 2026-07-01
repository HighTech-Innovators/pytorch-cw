# `aten/src`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`aten/src` is the source root under `aten` that gathers the modern `ATen` implementation together with legacy CUDA compatibility headers. It is the include and source boundary that the top-level ATen build adds to consumers, even though the main architectural weight sits in `aten/src/ATen`.

## Key Files

| File | Purpose |
|---|---|
| `aten/src/README.md` | documents the low-level tensor-library lineage and ownership rules that still apply in this source root |
| `aten/src/ATen/TensorIterator.h` | representative public ATen header for iterator-driven tensor kernels |
| `aten/src/THC/THCAtomics.cuh` | legacy CUDA helper header retained under the shared ATen source root |
| `aten/src/THC/THCDeviceUtils.cuh` | legacy CUDA device utility header included from the same root |

## Public Interface

The interface of this directory is primarily structural: `aten/src` is an include root that exposes the `ATen` C++ library headers and the remaining `THC` compatibility headers to native builds. Through that root, downstream code reaches public ATen headers such as `ATen/TensorIterator.h` while older CUDA-oriented code can still include `THC` utilities from the same source boundary.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [aten](aten/ADR.md) | used-by | the parent build adds this directory to ATen include paths and source discovery |
| [aten/src/ATen](aten/src/ATen/ADR.md) | depends-on | the core tensor and operator implementation lives in this child subtree |
| [c10/core](c10/core/ADR.md) | depends-on | public ATen headers rely on core device, storage, and dispatch primitives |

## Runtime Behaviour

`aten/CMakeLists.txt` adds `aten/src` and generated build outputs to the ATen include path so handwritten headers and generated declarations resolve through one root. `aten/src/README.md` explains that the subtree still inherits the original Torch model of shared storage plus manual ownership, which is why view-style tensor APIs and low-level helper code must respect explicit retain or free rules. The `THC` headers under this root keep older CUDA helper includes available without giving them a separate top-level build boundary.

## Performance Profile

Placing both the public `ATen` headers and thin legacy CUDA compatibility headers under one include root reduces include-path indirection for native builds. The actual runtime cost is dominated by descendants such as `aten/src/ATen`, but this source root still matters because it is where generated headers and low-level compatibility shims are resolved during compilation. Keeping `THC` here as a narrow compatibility layer avoids duplicating infrastructure while containing its impact to compile-time includes.

## Design Rationale

PyTorch uses `aten/src` as a stable source boundary so the build can treat ATen as one logical library even though its implementation spans generated code, handwritten C++ headers, and some retained legacy CUDA helpers. Covering this parent directory separately documents that container role without collapsing it into the more detailed `aten/src/ATen` ADR.
