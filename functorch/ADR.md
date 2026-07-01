# `functorch`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`functorch` is the compatibility and discovery layer for composable function transforms such as `vmap`, `grad`, and `jvp`. `src/functorch/__init__.py` re-exports those APIs from `torch._functorch`, while `src/functorch/experimental/control_flow.py` exposes experimental `cond` and `map` entrypoints that let transform-aware control flow escape the historical confines of pure tensor expressions.

## Key Files


| File | Purpose |
|---|---|
| `src/functorch/__init__.py` | top-level transform exports |
| `src/functorch/experimental/control_flow.py` | experimental control-flow wrappers |
| `src/functorch/README.md` | transform goals and use cases |
| `src/torch/_C/_functorch.pyi` | native dynamic-layer hooks used by transform implementations |

## Public Interface

The top-level package exposes `vmap`, `grad`, `grad_and_value`, `jacrev`, `jacfwd`, `hessian`, `vjp`, `jvp`, `functionalize`, `make_functional`, `make_functional_with_buffers`, and `make_fx`. The experimental subpackage adds `cond` and `map`, which indicates that `functorch` is no longer only about differentiation and batching but also about making higher-order control flow compatible with transform stacks.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/_functorch](torch/_functorch/ADR.md) | depends-on | actual transform implementations re-exported here |
| [torch/_C](torch/_C/ADR.md) | depends-on | compiled transform hooks (`_functorch.pyi`) |
| [torch/fx](torch/fx/ADR.md) | depends-on | `make_fx` symbolic tracing |
| [torch/export](torch/export/ADR.md) | intersects | transform-plus-export tracing overlap |

## Runtime Behaviour

`src/functorch/__init__.py` does very little computation itself; it mostly binds stable names onto already-implemented transform primitives. The runtime meaning of that thinness is important: transform nesting, wrapped tensor checks, and dynamic layer stack management happen in native or lower-level Python code, as shown by the functions and interpreter types declared in `src/torch/_C/_functorch.pyi`. `src/functorch/experimental/control_flow.py` also shows that control-flow support is routed through higher-order operator implementations rather than bespoke package-local interpreters.

## Performance Profile

The README in `src/functorch/README.md` explicitly frames the package around good eager-mode performance and around tracing transforms ahead of time for compilation. In practice, transform composition adds wrapper and dispatch overhead in eager mode, but it can unlock batching or differentiation strategies that are far faster than manual Python loops. The `make_fx` and control-flow hooks matter because they let the Chapter 09 compiler stack optimize transformed programs instead of treating them as opaque Python.

## Design Rationale

This package exists to preserve a coherent user-facing namespace while the implementation continues to merge into core PyTorch. That split matches Chapter 09's direction: transforms should compose naturally with compilation, export, and functionalization, but users still need a discoverable surface for batching and differentiation patterns.
