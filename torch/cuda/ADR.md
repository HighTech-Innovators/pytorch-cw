# `torch/cuda`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch.cuda` is the public Python namespace for CUDA runtime services. `src/torch/cuda/__init__.py` keeps import-time behavior lazy, re-exports `Stream`, `Event`, and graph helpers, and gates availability through `_is_compiled()` and `is_available()` before it exposes device features. `src/torch/cuda/memory.py` and `src/torch/cuda/graphs.py` add higher-level policies around the compiled allocator and graph bindings rather than reimplementing those subsystems in Python.

## Key Files


| File | Purpose |
|---|---|
| `src/torch/cuda/__init__.py` | lazy initialization, availability checks, and namespace assembly |
| `src/torch/cuda/memory.py` | caching allocator controls, memory statistics, and pool helpers |
| `src/torch/cuda/graphs.py` | CUDA graph capture, replay, and graph-pool integration |
| `src/torch/cuda/random.py` | device RNG seeding and generator coordination |
| `src/torch/cuda/profiler.py` | profiler start/stop wrappers over CUDA runtime bindings |

## Public Interface

The package exposes device discovery and initialization through `is_available()` and the lazy-init path in `src/torch/cuda/__init__.py`. It exposes execution control through `Stream`, `Event`, and graph helpers from `src/torch/cuda/graphs.py`, allocator inspection and control through `memory_stats()` and `empty_cache()` in `src/torch/cuda/memory.py`, and reproducibility helpers such as `manual_seed_all()` and `seed_all()` from `src/torch/cuda/random.py`.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/_C](torch/_C/ADR.md) | depends-on | `Stream`, `Event`, generator types |
| [c10/cuda](c10/cuda/ADR.md) | depends-on | native caching allocator wrapper |
| [c10/core](c10/core/ADR.md) | depends-on | device and allocator abstractions |
| [torch/csrc/profiler](torch/csrc/profiler/ADR.md) | depends-on | CUDA profiler hooks |

## Runtime Behaviour

`src/torch/cuda/__init__.py` allows `import torch.cuda` to succeed even when CUDA is absent, then raises only when callers cross into APIs that require `_cuda_getDeviceCount` or `_lazy_init()`. `src/torch/cuda/memory.py` routes raw allocations and frees through `_cuda_cudaCachingAllocator_raw_alloc` and `_cuda_cudaCachingAllocator_raw_delete`, while `src/torch/cuda/graphs.py` wraps `_CUDAGraph` and only enables binding-backed graph editing when `cuda.bindings` is importable. Because this repository is validated with CPU-only build constraints, the control flow is grounded in source and not in live GPU execution.

## Performance Profile

This directory sits directly on top of the caching allocator and CUDA graph replay path, so it affects two Chapter 08 costs: allocation churn and launch overhead. `src/torch/cuda/memory.py` exposes cache controls that trade retained memory for faster reuse, while `src/torch/cuda/graphs.py` documents that `CUDAGraph.instantiate()` can move first-replay latency out of the steady-state path. The package also adds small Python-side checks around streams, pools, and seeds, but those checks are deliberately thin compared with the underlying native runtime.

## Design Rationale

The split matches the repository architecture in Chapters 01, 08, and 10: Python owns ergonomics, while compiled code owns device state, allocator policy, and profiling hooks. Keeping the namespace lazy in `src/torch/cuda/__init__.py` avoids forcing CUDA initialization onto CPU-only or mixed environments, and keeping graphs and memory as thin wrappers lets the compiler and runtime evolve underneath without changing the user-facing module layout.
