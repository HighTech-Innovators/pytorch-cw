# `c10/util`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`c10/util` provides the small, reusable runtime utilities that make the rest of PyTorch's C++ stack practical to implement. This includes intrusive reference counting, inline-friendly containers and array views, and the base exception and warning types used across the repository.

## Key Files

| File | Purpose |
|---|---|
| `c10/util/intrusive_ptr.h` | defines `intrusive_ptr_target`, `intrusive_ptr`, and weak intrusive ownership |
| `c10/util/SmallVector.h` | defines inline-storage vectors adapted from LLVM |
| `c10/util/ArrayRef.h` | defines non-owning array views with PyTorch-specific checks |
| `c10/util/Exception.h` | defines `c10::Error`, `Warning`, and warning handler utilities |

## Public Interface

Important symbols include `c10::intrusive_ptr_target`, `c10::intrusive_ptr`, `c10::weak_intrusive_ptr`, `c10::SmallVectorBase`, `c10::SmallVector`, `c10::ArrayRef`, `c10::Error`, `c10::Warning`, `c10::warn`, `c10::WarningUtils::set_warning_handler`, and `c10::WarningUtils::WarningHandlerGuard`. `ArrayRef` exposes `front()`, `back()`, `slice()`, and `at()`, while `intrusive_ptr_target` exposes the lifetime hooks that `intrusive_ptr` uses.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10/core](c10/core/ADR.md) | used-by | tensor/storage objects inherit `intrusive_ptr_target` and use `ArrayRef`/`Error` |
| [aten/src/ATen](aten/src/ATen/ADR.md) | used-by | `TensorIterator` and profiler callbacks use `SmallVector` and array-view helpers |
| [torch/csrc](torch/csrc/ADR.md) | used-by | Python bindings convert `c10::Error` and rely on shared ownership utilities |

## Runtime Behaviour

`intrusive_ptr_target` in `c10/util/intrusive_ptr.h` stores strong and weak counts in a single atomic `combined_refcount_`, and the helper functions use relaxed increments plus acquire-release decrements so object destruction observes prior writes. The same file also contains the PyObject-preservation path for tensor and storage wrappers, toggled by the `kHasPyObject` bit. `ArrayRef` in `c10/util/ArrayRef.h` is explicitly non-owning and passes around just pointer-plus-length, while `SmallVector` in `c10/util/SmallVector.h` starts with embedded storage and only calls `grow_pod` or `mallocForGrow` when inline capacity is exceeded. `c10::Error` in `c10/util/Exception.h` accumulates context with `add_context()` and materializes `what()` lazily.

## Performance Profile

The intrusive pointer code is tuned for hot ownership changes: `atomic_combined_refcount_increment` uses `memory_order_relaxed`, and the file comments explain that only decrements need acquire-release semantics. `SmallVector` avoids heap allocation for short sequences, which matters in dispatcher, autograd, and profiling code that frequently builds tiny temporary lists. `ArrayRef` is trivially copyable and meant to be passed by value, so call sites avoid vector allocations when only a borrowed range is needed. The main cost center in `Exception.h` is formatting and context growth, and the file explicitly notes that `Error::add_context()` is O(n) in the number of stacked messages.

## Design Rationale

PyTorch keeps these facilities in `c10/util` so core runtime code can depend on stable, header-first utilities instead of platform libraries or STL patterns that add more allocation or ownership overhead. `SmallVector` and `ArrayRef` are adapted from LLVM because PyTorch needs the same "many tiny ranges, few large ones" behavior, but the local forks replace LLVM-style diagnostics with `TORCH_CHECK` and exported symbols. Intrusive ownership is preferred for tensors and storage because it keeps refcounts in the object itself and integrates with Python wrapper preservation.
