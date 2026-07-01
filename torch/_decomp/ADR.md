# `torch/_decomp`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch._decomp` is the central Python registry for lowering complex operators into simpler ones. `src/torch/_decomp/__init__.py` defines separate global tables for post-autograd, pre-autograd, and meta decompositions, while `src/torch/_decomp/decompositions.py` supplies a large body of actual lowering rules for ATen operators.

## Key Files


| File | Purpose |
|---|---|
| `src/torch/_decomp/__init__.py` | registry tables and registration decorators |
| `src/torch/_decomp/decompositions.py` | main ATen decomposition definitions |
| `src/torch/_decomp/decompositions_for_jvp.py` | JVP-oriented rules |
| `src/torch/_decomp/decompositions_for_rng.py` | RNG-oriented rules |

## Public Interface

The directory exposes `register_decomposition`, `get_decompositions`, `decomposition_table`, `pre_autograd_decomposition_table`, and `meta_table` from `src/torch/_decomp/__init__.py`. Those entrypoints are intentionally programmatic rather than end-user-facing because callers are usually export, compile, or backend-lowering code that wants a decomposition map keyed by operator overload.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/_C](torch/_C/ADR.md) | depends-on | dispatcher/operator metadata and `torch._ops` |
| [torch/_prims](torch/_prims/ADR.md) | depends-on | primitive building blocks for decomposition bodies |
| [torch/_refs](torch/_refs/ADR.md) | depends-on | reference implementations |
| [torch/export](torch/export/ADR.md) | used-by | export decomposition consumer |

## Runtime Behaviour

`src/torch/_decomp/__init__.py` registers decompositions by overload, packet, or higher-order operator, and it rejects duplicate registrations in a single registry. The same file also rewrites functions with custom out parameters so decomposition signatures still match dispatcher expectations, and it only records overloads that actually have kernels according to `_dispatch_has_kernel()`. `src/torch/_decomp/decompositions.py` then uses the decorator to define math-level replacements such as `tanh_backward`, `sigmoid_backward`, and `fill` variants.

## Performance Profile

Decompositions add work during tracing, export, or backend preparation because they expand or rewrite graphs before execution. That extra normalization often removes far more backend complexity than it adds, which improves downstream compiler coverage and reduces the number of kernels that need bespoke handling. Meta decompositions are especially performance-relevant for analysis flows because they let shape-only execution avoid real compute.

## Design Rationale

This registry is one of the glue layers behind Chapter 09's compile stack. PyTorch needs a consistent place to say "treat this op as these simpler ops" so export, fake tensor execution, AOTAutograd, and backend lowering all converge on the same semantics instead of inventing incompatible local rewrite sets.
