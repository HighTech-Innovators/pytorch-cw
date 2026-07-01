# ADR: torch/cuda runtime surface

- Status: Draft
- Date: 2026-07-01
- Scope: `src/torch/cuda`
- Decision: Keep `torch.cuda` as a Python policy layer that lazily exposes allocator, stream, RNG, graph, and profiler features from compiled CUDA bindings.
- Primary entrypoints: `is_available`, `_lazy_init`, `Stream`, `Event`, `CUDAGraph`, `memory_stats`, `empty_cache`, `manual_seed_all`
- Evidence: `src/torch/cuda/__init__.py`, `src/torch/cuda/memory.py`, `src/torch/cuda/graphs.py`, `src/torch/cuda/random.py`, `src/torch/cuda/profiler.py`
- Caveats: This repository is analyzed under CPU-only constraints, so CUDA-specific behavior is source-verified rather than runtime-verified.

## Role

`torch.cuda` is the public Python namespace for CUDA runtime services. `src/torch/cuda/__init__.py` keeps import-time behavior lazy, re-exports `Stream`, `Event`, and graph helpers, and gates availability through `_is_compiled()` and `is_available()` before it exposes device features. `src/torch/cuda/memory.py` and `src/torch/cuda/graphs.py` add higher-level policies around the compiled allocator and graph bindings rather than reimplementing those subsystems in Python.

## Key Files

- [`src/torch/cuda/__init__.py`](src/torch/cuda/__init__.py) - lazy initialization, availability checks, and namespace assembly.
- [`src/torch/cuda/memory.py`](src/torch/cuda/memory.py) - caching allocator controls, memory statistics, and pool helpers.
- [`src/torch/cuda/graphs.py`](src/torch/cuda/graphs.py) - CUDA graph capture, replay, and graph-pool integration.
- [`src/torch/cuda/random.py`](src/torch/cuda/random.py) - device RNG seeding and generator coordination.
- [`src/torch/cuda/profiler.py`](src/torch/cuda/profiler.py) - profiler start/stop wrappers over CUDA runtime bindings.

## Public Interface

The package exposes device discovery and initialization through `is_available()` and the lazy-init path in `src/torch/cuda/__init__.py`. It exposes execution control through `Stream`, `Event`, and graph helpers from `src/torch/cuda/graphs.py`, allocator inspection and control through `memory_stats()` and `empty_cache()` in `src/torch/cuda/memory.py`, and reproducibility helpers such as `manual_seed_all()` and `seed_all()` from `src/torch/cuda/random.py`.

## Dependencies

`torch.cuda` depends on the compiled extension contract defined by [`src/torch/_C/__init__.pyi.in`](src/torch/_C/__init__.pyi.in), especially the `Stream`, `Event`, and generator types. Its allocator-facing helpers wrap the native caching allocator described by [`src/c10/cuda/CUDACachingAllocator.cpp`](src/c10/cuda/CUDACachingAllocator.cpp) and the device abstractions in [`src/c10/core/Allocator.h`](src/c10/core/Allocator.h). Its observability path also leans on [`src/aten/src/ATen/record_function.h`](src/aten/src/ATen/record_function.h) and CUDA profiler hooks under [`src/torch/csrc/profiler`](src/torch/csrc/profiler).

## Runtime Behaviour

`src/torch/cuda/__init__.py` allows `import torch.cuda` to succeed even when CUDA is absent, then raises only when callers cross into APIs that require `_cuda_getDeviceCount` or `_lazy_init()`. `src/torch/cuda/memory.py` routes raw allocations and frees through `_cuda_cudaCachingAllocator_raw_alloc` and `_cuda_cudaCachingAllocator_raw_delete`, while `src/torch/cuda/graphs.py` wraps `_CUDAGraph` and only enables binding-backed graph editing when `cuda.bindings` is importable. Because this repository is validated with CPU-only build constraints, the control flow is grounded in source and not in live GPU execution.

## Performance Profile

This directory sits directly on top of the caching allocator and CUDA graph replay path, so it affects two Chapter 08 costs: allocation churn and launch overhead. `src/torch/cuda/memory.py` exposes cache controls that trade retained memory for faster reuse, while `src/torch/cuda/graphs.py` documents that `CUDAGraph.instantiate()` can move first-replay latency out of the steady-state path. The package also adds small Python-side checks around streams, pools, and seeds, but those checks are deliberately thin compared with the underlying native runtime.

## Design Rationale

The split matches the repository architecture in Chapters 01, 08, and 10: Python owns ergonomics, while compiled code owns device state, allocator policy, and profiling hooks. Keeping the namespace lazy in `src/torch/cuda/__init__.py` avoids forcing CUDA initialization onto CPU-only or mixed environments, and keeping graphs and memory as thin wrappers lets the compiler and runtime evolve underneath without changing the user-facing module layout.
