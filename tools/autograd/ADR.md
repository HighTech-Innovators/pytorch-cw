# `tools/autograd`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`tools/autograd` is the build-time generator for PyTorch's autograd wrapper code. `src/tools/autograd/gen_autograd.py` orchestrates parsing native operator metadata and derivative formulas, while `src/tools/autograd/load_derivatives.py` turns `derivatives.yaml` into structured differentiability information that later emitters consume.

## Key Files


| File | Purpose |
|---|---|
| `src/tools/autograd/README.md` | build integration rule for the directory |
| `src/tools/autograd/gen_autograd.py` | main orchestration script |
| `src/tools/autograd/load_derivatives.py` | derivative parsing and caching |
| `src/tools/autograd/derivatives.yaml` | declarative gradient formulas |
| `src/tools/autograd/gen_autograd_functions.py` | backward-node emission |

## Public Interface

The public interface here is internal and build-oriented. `gen_autograd.py` exposes `gen_autograd()` and `gen_autograd_python()` for build scripts, and `load_derivatives.py` exposes `load_derivatives()` for any codegen stage that needs normalized differentiability information keyed by operator schema.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [aten/src/ATen/native](aten/src/ATen/native/ADR.md) | depends-on | `native_functions.yaml` and `tags.yaml` schemas |
| [torchgen](torchgen/ADR.md) | depends-on | typed schema parsing helpers |
| [torch/csrc/autograd](torch/csrc/autograd/ADR.md) | feeds | generated `Variable`/`engine` bindings consumed there |

## Runtime Behaviour

This directory runs during build, not during training or inference. `src/tools/autograd/gen_autograd.py` loads derivative metadata, filters native functions through the selective builder, matches differentiability information to those functions, and then emits `VariableType`, inplace/view wrappers, trace types, autograd nodes, Python bindings, variable factories, and view helpers. `src/tools/autograd/load_derivatives.py` also synthesizes derivative entries for generated `view_copy` operators so maintainers do not have to duplicate formulas manually in YAML.

## Performance Profile

The cost of this directory is paid primarily in build time. Parsing large YAML files and generating many C++ and Python outputs is expensive enough that `load_derivatives.py` caches results and `gen_autograd.py` uses selective-build filtering to avoid unnecessary training-only output. The runtime payoff is significant: generated autograd wrappers keep the gradient surface consistent across hundreds of operators without adding manual-maintenance drift.

## Design Rationale

Chapter 06 makes clear that autograd is deeply intertwined with dispatch, so PyTorch cannot afford a partially generated or inconsistently maintained backward surface. This directory turns gradient formulas into code using the same source-of-truth philosophy that Chapter 04 described for operator schemas, which keeps operator growth manageable.
