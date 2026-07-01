# ADR: functorch transform compatibility layer

- Status: Draft
- Date: 2026-07-01
- Scope: `src/functorch`
- Decision: Preserve `functorch` as a lightweight compatibility namespace that re-exports transform APIs now implemented under `torch._functorch` and related core systems.
- Primary entrypoints: `vmap`, `grad`, `grad_and_value`, `jacrev`, `jacfwd`, `hessian`, `make_functional`, `make_fx`, experimental `cond` and `map`
- Evidence: `src/functorch/__init__.py`, `src/functorch/experimental/control_flow.py`, `src/functorch/README.md`, `src/torch/_C/_functorch.pyi`
- Caveats: The top-level package is intentionally thin, so many substantive mechanics live outside this directory.

## Role

`functorch` is the compatibility and discovery layer for composable function transforms such as `vmap`, `grad`, and `jvp`. `src/functorch/__init__.py` re-exports those APIs from `torch._functorch`, while `src/functorch/experimental/control_flow.py` exposes experimental `cond` and `map` entrypoints that let transform-aware control flow escape the historical confines of pure tensor expressions.

## Key Files

- [`src/functorch/__init__.py`](src/functorch/__init__.py) - top-level transform exports.
- [`src/functorch/experimental/control_flow.py`](src/functorch/experimental/control_flow.py) - experimental control-flow wrappers.
- [`src/functorch/README.md`](src/functorch/README.md) - transform goals and use cases.
- [`src/torch/_C/_functorch.pyi`](src/torch/_C/_functorch.pyi) - native dynamic-layer hooks used by transform implementations.

## Public Interface

The top-level package exposes `vmap`, `grad`, `grad_and_value`, `jacrev`, `jacfwd`, `hessian`, `vjp`, `jvp`, `functionalize`, `make_functional`, `make_functional_with_buffers`, and `make_fx`. The experimental subpackage adds `cond` and `map`, which indicates that `functorch` is no longer only about differentiation and batching but also about making higher-order control flow compatible with transform stacks.

## Dependencies

The namespace depends on implementations in [`src/torch/_functorch`](src/torch/_functorch) and on compiled transform hooks surfaced through [`src/torch/_C/_functorch.pyi`](src/torch/_C/_functorch.pyi). It also intersects with [`src/torch/export`](src/torch/export) and [`src/torch/fx`](src/torch/fx) through `make_fx` and transform tracing, and with Chapter 06 autograd machinery through gradient-oriented transforms.

## Runtime Behaviour

`src/functorch/__init__.py` does very little computation itself; it mostly binds stable names onto already-implemented transform primitives. The runtime meaning of that thinness is important: transform nesting, wrapped tensor checks, and dynamic layer stack management happen in native or lower-level Python code, as shown by the functions and interpreter types declared in `src/torch/_C/_functorch.pyi`. `src/functorch/experimental/control_flow.py` also shows that control-flow support is routed through higher-order operator implementations rather than bespoke package-local interpreters.

## Performance Profile

The README in `src/functorch/README.md` explicitly frames the package around good eager-mode performance and around tracing transforms ahead of time for compilation. In practice, transform composition adds wrapper and dispatch overhead in eager mode, but it can unlock batching or differentiation strategies that are far faster than manual Python loops. The `make_fx` and control-flow hooks matter because they let the Chapter 09 compiler stack optimize transformed programs instead of treating them as opaque Python.

## Design Rationale

This package exists to preserve a coherent user-facing namespace while the implementation continues to merge into core PyTorch. That split matches Chapter 09's direction: transforms should compose naturally with compilation, export, and functionalization, but users still need a discoverable surface for batching and differentiation patterns.
