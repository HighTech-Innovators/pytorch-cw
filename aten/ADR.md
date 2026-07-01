# `aten`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`aten` is the top-level container for the ATen native tensor library, its legacy TH and THC support code, and the CMake machinery that assembles backend-specific builds. It is the architectural umbrella above `aten/src/ATen`, with build-time coordination for CPU, CUDA, HIP, MPS, Vulkan, and XPU source groups.

## Key Files

| File | Purpose |
|---|---|
| `aten/CMakeLists.txt` | declares ATen source groups, include roots, and install subdirectories for backend builds |
| `aten/src/README.md` | documents the low-level library lineage and manual reference-counting rules that still shape the subtree |
| `aten/tools/run_tests.sh` | helper script for ATen-focused test execution |
| `aten/tools/test_install.sh` | helper script for validating installation outputs |

## Public Interface

The directory exposes internal build and layout contracts rather than a user-facing Python API. Important surface area includes the `ATEN_INSTALL_BIN_SUBDIR`, `ATEN_INSTALL_LIB_SUBDIR`, and `ATEN_INSTALL_INCLUDE_SUBDIR` cache variables in `aten/CMakeLists.txt`, the backend source groups such as `ATen_CPU_SRCS`, `ATen_CUDA_SRCS`, and `ATen_XPU_SRCS`, and the two main child roots `aten/src` and `aten/tools`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [aten/src](aten/src/ADR.md) | depends-on | source root for the ATen library and legacy compatibility headers |
| [aten/src/ATen](aten/src/ATen/ADR.md) | depends-on | concrete operator, dispatcher, and tensor-library implementation lives there |
| [tools/autograd](tools/autograd/ADR.md) | interacts-with | build-time code generation consumes ATen operator metadata and emitted headers |

## Runtime Behaviour

`aten/CMakeLists.txt` returns immediately when `INTERN_BUILD_ATEN_OPS` is disabled, and otherwise fills backend-specific source lists and include paths for CPU, CUDA, HIP, MPS, Vulkan, and XPU builds. The same file adds both `aten/src` and generated build directories to the include path so generated headers and handwritten sources are compiled as one library surface. `aten/src/README.md` also makes clear that this subtree still carries the original Torch low-level lineage and manual ownership rules for storage and tensor views.

## Performance Profile

This directory affects performance mostly through build configuration rather than by executing runtime logic directly. `aten/CMakeLists.txt` selects the parallel backend (`OMP` or `NATIVE`) and partitions backend-specific source files up front, which determines which optimized kernels and include paths are compiled into the resulting libraries. Keeping those backend lists separate also limits unnecessary rebuilds and keeps architecture-specific code isolated.

## Design Rationale

PyTorch keeps ATen's top-level build logic and legacy low-level context in one directory so all backend variants share the same assembly point. The actual operator and dispatcher architecture is delegated to covered descendants such as `aten/src/ATen`, while this parent ADR captures the container and build-boundary role that the book names explicitly.
