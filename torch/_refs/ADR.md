# `torch/_refs`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch._refs` is the Python reference layer that expresses existing PyTorch operations in a form that is easier to inspect, decompose, and reuse. `src/torch/_refs/__init__.py` exports a large set of elementwise, reduction, view, and linalg-style operators built on top of `torch._prims` and the wrappers in `torch._prims_common`.

## Key Files


| File | Purpose |
|---|---|
| `src/torch/_refs/__init__.py` | core reference operator definitions |
| `src/torch/_refs/_conversions.py` | conversion-oriented helpers |
| `src/torch/_refs/fft.py` | FFT reference implementations |
| `src/torch/_refs/nn/__init__.py` | neural-network-facing reference helpers |
| `src/torch/_refs/linalg/__init__.py` | linear algebra references |

## Public Interface

The directory exports reference forms of many familiar operators, including `add`, `mul`, `sum`, `softmax`, `log_softmax`, `var`, `copy_to`, and many more from `src/torch/_refs/__init__.py`. Although the namespace is internal by convention, other PyTorch subsystems rely on it as an executable specification of operator semantics, type promotion, and out-parameter behavior.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/_prims](torch/_prims/ADR.md) | depends-on | primitive operator building blocks |
| `torch/_prims_common` | depends-on | dtype and wrapper logic |
| [torch/_decomp](torch/_decomp/ADR.md) | used-by | decomposition consumer |
| [torch/export](torch/export/ADR.md) | used-by | export consumer |

## Runtime Behaviour

`src/torch/_refs/__init__.py` wraps many operations with utilities such as `elementwise_type_promotion_wrapper`, `out_wrapper`, and resize/copy helpers so reference behavior matches eager semantics closely enough to substitute into transforms. The module uses `torch._prims` operations as its substrate, which means reference execution follows the same dispatcher-visible operator graph that compilers and fake-tensor analysis can later inspect. Specialized submodules like `src/torch/_refs/fft.py` and `src/torch/_refs/nn/__init__.py` let the directory grow by domain without turning the core file into a single monolith.

## Performance Profile

Reference implementations are typically slower than native ATen kernels because they trade fused C++ or CUDA loops for compositional Python and primitive calls. That trade is deliberate: the directory improves performance indirectly by giving compilers and decomposition passes a trustworthy semantic model that they can lower and fuse later. In other words, `_refs` is usually a staging layer for optimization, not the final optimized path itself.

## Design Rationale

The directory operationalizes the Chapter 01 observation that `_refs`, `_decomp`, and `_prims` exist to keep eager and compiled numerics aligned. By expressing behavior in readable Python over a smaller primitive basis, PyTorch gains a portable reference model that is easier to review, transform, and compare than the full backend-specific kernel matrix.
