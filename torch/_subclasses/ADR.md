# `torch/_subclasses`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/_subclasses` houses tensor subclass machinery used for compiler-facing interpretation rather than ordinary eager execution. Its main responsibilities are fake-tensor execution, metadata-only tensor conversion, functional tensor wrapping, and dispatch-mode plumbing for tracing and abstract interpretation.

## Key Files

| File | Purpose |
|---|---|
| `torch/_subclasses/__init__.py` | exports the primary fake-tensor and fake-mode entrypoints |
| `torch/_subclasses/fake_tensor.py` | defines `FakeTensor`, `FakeTensorMode`, and the main dispatch interception logic |
| `torch/_subclasses/meta_utils.py` | defines metadata conversion helpers such as `MetaConverter` |
| `torch/_subclasses/functional_tensor.py` | defines the Python functional tensor wrapper and decomposition checks |

## Public Interface

The public surface of this internal package includes `FakeTensor`, `FakeTensorMode`, `UnsupportedFakeTensorException`, `DynamicOutputShapeException`, and `CrossRefFakeMode` exported from `torch/_subclasses/__init__.py`. `fake_tensor.py` and `meta_utils.py` also expose `MetaConverter` and the fake-tensor dispatch stack that compiler subsystems use to run tensor programs against metadata instead of real storage.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/fx](torch/fx/ADR.md) | depends-on | fake-tensor tracing imports FX schema and immutable collection helpers |
| [torch/_dynamo](torch/_dynamo/ADR.md) | used-by | Dynamo relies on fake tensors and fake modes during symbolic tracing |
| [torch/_inductor](torch/_inductor/ADR.md) | used-by | compiler lowering consumes fake and meta execution results rather than eager tensors |

## Runtime Behaviour

`torch/_subclasses/__init__.py` re-exports fake-tensor entrypoints so callers can enable fake execution without importing implementation files directly. `fake_tensor.py` defines `FakeTensor` and `FakeTensorMode` on top of `TorchDispatchMode` and `TorchFunctionMode`, imports `MetaConverter`, and tracks memoized metadata so operators can execute in an abstract mode without allocating real tensor storage. `functional_tensor.py` layers functionalization-specific behavior on top of that stack and caches decomposition decisions to decide when operations can stay inside the functional wrapper path.

## Performance Profile

The core performance win of this directory is that fake tensors carry shape, dtype, and device metadata without allocating or touching real storage, which is essential for compiler tracing and abstract interpretation. `functional_tensor.py` uses an LRU cache for `_can_decompose_fast`, and `fake_tensor.py` keeps memoized metadata state to reduce repeated work during tracing. Even so, the package is intentionally optimized for compile-time analysis rather than eager execution throughput.

## Design Rationale

PyTorch isolates these tensor subclasses from the ordinary `torch.Tensor` runtime so compiler and analysis modes can evolve without distorting the eager API surface. The directory is a genuine architectural boundary because fake tensors, metadata conversion, and functionalization are shared compiler primitives used across Dynamo, FX-based transformations, and Inductor.
