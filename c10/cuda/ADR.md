# `c10/cuda`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`c10/cuda` defines the CUDA-specific memory and stream abstractions that the higher-level CUDA stack uses. In this CPU-only checkout the code is not exercised, but the headers still document the allocator, stream-pool, graph-capture, and tracing structure that PyTorch expects at runtime.

## Key Files

| File | Purpose |
|---|---|
| `c10/cuda/CUDACachingAllocator.h` | declares the caching allocator namespace API, allocator interface, and graph-capture pool hooks |
| `c10/cuda/CUDAStream.h` | defines `CUDAStream` and the stream-pool API |

## Public Interface

Notable symbols include `c10::cuda::CUDACachingAllocator::CUDAAllocator`, `FreeMemoryCallback`, `CUDAAllocator::raw_alloc`, `CUDAAllocator::recordStream`, `CUDAAllocator::snapshot`, `CUDAAllocator::beginAllocateToPool`, `CUDAAllocator::markCaptureBegin`, `c10::cuda::CUDAStream`, `getStreamFromPool`, `getDefaultCUDAStream`, `getCurrentCUDAStream`, and `setCurrentCUDAStream`. `CUDAStream` also exposes `query()`, `synchronize()`, `is_capturing()`, `priority()`, and `stream()`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10/core](c10/core/ADR.md) | depends-on | allocator, device, and generic stream primitives |
| [torch/cuda](torch/cuda/ADR.md) | used-by | Python CUDA APIs delegate to allocator and stream services |
| [torch/csrc/profiler](torch/csrc/profiler/ADR.md) | used-by | profiler and trace observers consume allocator and stream metadata |

## Runtime Behaviour

`c10/cuda/CUDACachingAllocator.h` exposes allocator operations through the `c10::cuda::CUDACachingAllocator` namespace rather than a single concrete class, and the `CUDAAllocator` interface includes steady-state allocation methods plus graph-capture APIs such as `beginAllocateToPool`, `endAllocateToPool`, `markCaptureBegin`, and `releasePool`. The same header also exposes `recordHistory`, `attachOutOfMemoryObserver`, and `attachAllocatorTraceTracker`, which shows that allocation history and diagnostics are designed into the allocator interface rather than bolted on later. `CUDAStream.h` wraps a generic `c10::Stream` in `CUDAStream`, checks device type on construction, and provides the pool entrypoints `getStreamFromPool`, `getDefaultCUDAStream`, and `getCurrentCUDAStream`. The comments in `CUDAStream.h` specify three lazily created pools per device and round-robin reuse for the pooled streams.

## Performance Profile

The caching allocator exists to reduce repeated `cudaMalloc` and `cudaFree` churn, and the API surface in `CUDACachingAllocator.h` shows additional tuning around stream association, expandable segments, pool snapshots, and graph-capture reuse. `CUDAStream.h` explicitly documents that stream acquisition is designed to be effectively free because streams come from pools rather than being created and destroyed on demand. That same pooling strategy has a trade-off: the low-priority and high-priority pools each reuse a fixed set of streams, so requesting more pooled streams than slots can alias supposedly distinct logical streams and reduce concurrency.

## Design Rationale

The allocator API is split into a namespace plus abstract `CUDAAllocator` so PyTorch can hide backend-specific implementation details while still letting callers reason about capture pools, IPC handles, and observer hooks. `CUDAStream` is a thin typed wrapper over `c10::Stream` instead of a separate ownership model, which keeps the generic stream machinery reusable while still giving CUDA call sites strong device-type checks and `cudaStream_t` conversion. The headers also keep graph-capture and tracing hooks close to allocation primitives because CUDA memory lifetime and stream lifetime are tightly coupled.
