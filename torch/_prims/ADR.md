# ADR: torch/_prims primitive operator basis

- Status: Draft
- Date: 2026-07-01
- Scope: `src/torch/_prims`
- Decision: Maintain a small, explicit primitive operator namespace that other reference and compiler layers can target instead of reasoning over the full ATen surface directly.
- Primary entrypoints: primitive library registration, elementwise/view/reduction prims, RNG prims, debug prims
- Evidence: `src/torch/_prims/__init__.py`, `src/torch/_prims/executor.py`, `src/torch/_prims/rng_prims.py`, `src/torch/_prims/debug_prims.py`
- Caveats: The directory is marked experimental and intentionally exposes prototype operators rather than a stable user API.

## Role

`torch._prims` defines a lower-level operator basis for PyTorch's compiler- and reference-oriented subsystems. `src/torch/_prims/__init__.py` creates multiple `torch.library.Library` registries for the `prims` namespace and enumerates a broad but still curated set of primitive operations that can express tensor creation, elementwise math, views, reductions, FFT, RNG, and token effects.

## Key Files

- [`src/torch/_prims/__init__.py`](src/torch/_prims/__init__.py) - primitive namespace definition and registration.
- [`src/torch/_prims/executor.py`](src/torch/_prims/executor.py) - execution helpers for primitive graphs.
- [`src/torch/_prims/rng_prims.py`](src/torch/_prims/rng_prims.py) - randomness-related primitive registration.
- [`src/torch/_prims/debug_prims.py`](src/torch/_prims/debug_prims.py) - debug-only primitive registration.

## Public Interface

This namespace mostly serves internal users rather than end-user code. The exported surface in `src/torch/_prims/__init__.py` includes primitive operators such as `add`, `mul`, `sum`, `reshape`, `broadcast_in_dim`, `empty_strided`, and `fft_c2c`, plus metadata helpers like `RETURN_TYPE` and `TensorMeta` that surrounding decomposition and reference layers use.

## Dependencies

`torch._prims` depends heavily on [`src/torch/_prims_common`](src/torch/_prims_common) for dtype, shape, and wrapper utilities. It uses the operator registration system in [`src/torch/library.py`](src/torch/library.py) and dispatch-key concepts surfaced through [`src/torch/_C/__init__.pyi.in`](src/torch/_C/__init__.pyi.in). It also feeds directly into [`src/torch/_refs/__init__.py`](src/torch/_refs/__init__.py) and [`src/torch/_decomp/__init__.py`](src/torch/_decomp/__init__.py).

## Runtime Behaviour

At import time, `src/torch/_prims/__init__.py` creates `DEF`, `CompositeExplicitAutograd`, `BackendSelect`, `Autograd`, and `Meta` libraries for the `prims` namespace, so primitive operators participate in the normal dispatcher instead of bypassing it. The same file registers debug and RNG primitive groups and defines metadata helpers that let fake tensor and meta execution reason about shapes and dtypes without running real kernels. That behavior makes primitives usable both in eager Python fallback code and in compiler-oriented symbolic paths.

## Performance Profile

Primitive layers are usually not the fastest execution path for end users, because they add decomposition and Python-level indirection compared with direct native kernels. Their performance value is indirect: they shrink the semantic surface that compilers, export, and references must understand, which improves fusion opportunities and reduces graph-rewrite complexity downstream. Meta and fake execution support also makes shape-only analysis cheaper than running full eager kernels.

## Design Rationale

The directory exists for the same reason Chapter 04 introduced `native_functions.yaml` and Chapter 09 introduced compiler lowering: a smaller basis is easier to transform soundly. By registering primitives through normal dispatcher mechanisms instead of inventing a side channel, PyTorch lets autograd, fake tensor mode, and backend selection interact with them using familiar infrastructure.
