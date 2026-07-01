# `c10/core`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`c10/core` owns the low-level tensor object model and allocator contracts that higher layers build on. `TensorImpl`, `StorageImpl`, `DataPtr`, `DispatchKeySet`, and the CPU allocator APIs define how tensor metadata, storage ownership, and dispatch identity are represented in C++.

## Key Files

| File | Purpose |
|---|---|
| `c10/core/TensorImpl.h` | defines `TensorImpl`, tensor metadata accessors, and `DispatchKeySet` ownership on tensors |
| `c10/core/StorageImpl.h` | defines `StorageImpl` and mutable storage/data pointer semantics |
| `c10/core/Allocator.h` | defines `DataPtr` and the abstract `Allocator` interface |
| `c10/core/DispatchKeySet.h` | defines the packed dispatch-key bitset used at runtime |
| `c10/core/CPUAllocator.h` | declares `GetCPUAllocator`, `SetCPUAllocator`, and default CPU allocator access |
| `c10/core/CPUAllocator.cpp` | implements `DefaultCPUAllocator`, mobile guard-byte allocation, and profiled CPU allocation hooks |

## Public Interface

Key symbols include `c10::TensorImpl`, `c10::StorageImpl`, `c10::DataPtr`, `at::Allocator::allocate`, `at::Allocator::clone`, `at::Allocator::raw_allocate`, `c10::DispatchKeySet`, `c10::GetCPUAllocator`, `c10::SetCPUAllocator`, and `c10::GetDefaultCPUAllocator`. `TensorImpl` exposes metadata accessors such as `key_set()`, `sizes()`, `numel()`, and `storage_offset()`, while `StorageImpl` exposes `data_ptr()`, `mutable_data_ptr()`, and `set_data_ptr()`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10/util](c10/util/ADR.md) | depends-on | intrusive ownership, array views, and exception helpers |
| [aten/src/ATen/core](aten/src/ATen/core/ADR.md) | used-by | dispatcher reads tensor dispatch metadata from `DispatchKeySet` |
| [c10/cuda](c10/cuda/ADR.md) | extended-by | device-specific allocator and stream code builds on allocator/device primitives |

## Runtime Behaviour

`TensorImpl` constructors in `c10/core/TensorImpl.h` bind a `Storage`, a `DispatchKeySet`, and a `caffe2::TypeMeta` into the object that ATen and autograd pass around, and fast-path accessors such as `sizes()`, `numel()`, and `storage_offset()` read directly from in-object fields unless a custom symbolic policy is active. `StorageImpl` in `c10/core/StorageImpl.h` mediates mutable access through `mutable_data_ptr()` and `mutable_data()`, where it can throw, warn, or call `maybe_materialize()` before returning a raw pointer. `DefaultCPUAllocator::allocate` in `c10/core/CPUAllocator.cpp` delegates to `c10::alloc_cpu`, reports allocation events through `profiledCPUMemoryReporter()`, and wraps the result in a `DataPtr` with a deleter that calls `free_cpu`.

## Performance Profile

`DispatchKeySet` is a packed 64-bit representation in `c10/core/DispatchKeySet.h`, and the comments there make clear it exists so the dispatcher can union per-tensor keysets and compute a highest-priority runtime slot without heap traffic. `TensorImpl` caches `numel_`, sizes, strides, and `storage_offset_` in the object so common metadata queries stay pointer-local in hot paths. On CPU allocation, `DefaultMobileCPUAllocator` in `c10/core/CPUAllocator.cpp` adds pre/post guard bytes to tolerate vectorized overreads from QNNPACK and XNNPACK, trading some extra memory and copy complexity for safer fast kernels.

## Design Rationale

The code keeps storage ownership in `StorageImpl` and view/shape/type metadata in `TensorImpl`, which lets tensor metadata change independently from the underlying buffer while preserving a single storage identity. `Allocator` is abstract and `DataPtr` carries both device and deleter state, so backends can plug in custom allocation strategies without changing tensor call sites. `DispatchKeySet` packs backend and functionality bits rather than storing a flat enum because the dispatcher needs compact per-tensor state but still has to model cross products of backend and functionality.
