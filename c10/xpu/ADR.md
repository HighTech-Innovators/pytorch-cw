# `c10/xpu`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`c10/xpu` is the Intel GPU and SYCL-specific extension of the `c10` runtime model. It adds XPU device discovery, stream management, device-property queries, and a caching allocator while preserving the same `Device`, `Stream`, and allocator abstractions used by the rest of PyTorch.

## Key Files

| File | Purpose |
|---|---|
| `c10/xpu/XPUFunctions.h` | declares device-count, current-device, device-context, and property-query helpers |
| `c10/xpu/XPUStream.h` | defines `XPUStream` and documents the pooled SYCL queue model |
| `c10/xpu/XPUCachingAllocator.h` | declares the XPU caching allocator API, statistics, and pool controls |
| `c10/xpu/XPUDeviceProp.h` | defines the enumerated SYCL and Intel GPU device properties exposed to callers |

## Public Interface

Important symbols include `c10::xpu::device_count`, `device_count_ensure_non_zero`, `current_device`, `set_device`, `get_raw_device`, `get_device_properties`, `c10::xpu::XPUStream`, and the `c10::xpu::XPUCachingAllocator` namespace functions such as `raw_alloc`, `raw_delete`, `recordStream`, `snapshot`, `createOrIncrefPool`, and `releasePool`. `c10::xpu::MemPool` also provides an owning handle around allocator pool identifiers used for graph and user-created pools.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10/core](c10/core/ADR.md) | depends-on | XPU wrappers build on generic device, stream, allocator, and statistics primitives |
| [c10/macros](c10/macros/ADR.md) | depends-on | export macros define the shared native ABI for XPU symbols |
| [c10](c10/ADR.md) | extended-by | this directory is the XPU-specific specialization of the base runtime layer |

## Runtime Behaviour

`XPUFunctions.h` exposes device discovery, current-device tracking, raw SYCL device access, and property queries, with `check_device_index` enforcing that callers stay within the detected device range. `XPUStream.h` documents two lazily created stream pools per device, one normal-priority and one high-priority, each with 32 queues assigned round-robin when callers request pooled streams. `XPUCachingAllocator.h` exposes a process-wide allocator pointer plus APIs for raw allocation, stream recording, memory-fraction tuning, history recording, allocator snapshots, and pool-scoped allocation.

## Performance Profile

The stream-pool design avoids creating a fresh SYCL queue for each logical stream request, which keeps stream acquisition cheap and predictable. The tradeoff is explicit in `XPUStream.h`: once more than 32 queues are requested from a pool, logical streams alias physical queues and cannot run concurrently. The caching allocator similarly trades retained memory for lower allocation churn, and its snapshot and trace hooks show that the subsystem is tuned for both reuse and diagnosability.

## Design Rationale

PyTorch mirrors the CUDA runtime model in `c10/xpu` so higher layers can reason about accelerators through shared abstractions instead of one-off device APIs. Covering the directory separately is warranted because it is more than a leaf container: it establishes the SYCL-specific stream, allocator, and device-management architecture that the rest of the XPU stack builds on.
