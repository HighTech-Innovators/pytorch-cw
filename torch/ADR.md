# `torch`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch` is the main Python package namespace for PyTorch. It bootstraps the compiled extension, exposes the top-level tensor and utility API, and provides the parent namespace for dozens of specialized subsystems such as autograd, nn, fx, dynamo, inductor, distributed, and device-specific packages.

## Key Files

| File | Purpose |
|---|---|
| `torch/__init__.py` | bootstraps the package, imports internal helpers, and defines the top-level public API surface |
| `torch/_compile.py` | lazy compile-related helpers that avoid eager `torch._dynamo` imports |
| `torch/serialization.py` | top-level `save` and `load` support plus serialization policy helpers |

## Public Interface

`torch/__init__.py` exports the user-facing namespace through a large `__all__` that includes `Tensor`, storage types, random helpers, device configuration, `compile`, `save`, `load`, and many math and control-flow entrypoints. `torch/_compile.py` exposes lazy wrappers such as `_disable_dynamo`, and `torch/serialization.py` provides `save`, `load`, package registration hooks, and storage-location policy helpers used throughout the ecosystem.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/_C](torch/_C/ADR.md) | depends-on | the compiled extension provides the core native object model and runtime hooks |
| [torch/autograd](torch/autograd/ADR.md) | depends-on | top-level gradient APIs are re-exported and integrated from this child package |
| [torch/cuda](torch/cuda/ADR.md) | depends-on | device-specific runtime services are exposed under the top-level namespace |
| [torch/_dynamo](torch/_dynamo/ADR.md) | depends-on | compile APIs lazily integrate with Dynamo from the parent namespace |

## Runtime Behaviour

`torch/__init__.py` imports core utility modules, defines `_running_with_deploy()`, and then assembles the large top-level symbol table that users interact with after `import torch`. `torch/_compile.py` delays importing `torch._dynamo` until a wrapped function is first invoked, and then caches the wrapped callable on `__dynamo_disable` to avoid repeating the setup work. `torch/serialization.py` owns thread-local serialization state and the top-level `save` and `load` policy surface, which is why archive behavior appears as a core `torch` responsibility rather than a separate helper package.

## Performance Profile

The parent package is broad, so import-time work is an important concern. The source reflects that by keeping compile integration lazy and by delegating heavy runtime behavior to the native `torch._C` extension instead of reimplementing it in Python. The cached disable wrapper in `torch/_compile.py` avoids repeated setup overhead on hot call paths, and the serialization module centralizes policy so callers do not each rebuild the same save or load machinery.

## Design Rationale

PyTorch needs a single, stable namespace that users can import without understanding the underlying split between native runtime, compiler stack, autograd, and device packages. Covering `torch` itself is justified because the parent package is not a leaf container: it defines the bootstrap, namespace assembly, and top-level integration policy for the rest of the covered subdirectories.
