# ADR: tools/autograd gradient code generation

- Status: Draft
- Date: 2026-07-01
- Scope: `src/tools/autograd`
- Decision: Generate autograd bindings and backward nodes from declarative derivative metadata instead of hand-maintaining the full operator gradient surface.
- Primary entrypoints: `gen_autograd`, `gen_autograd_python`, `load_derivatives`, `derivatives.yaml`
- Evidence: `src/tools/autograd/README.md`, `src/tools/autograd/gen_autograd.py`, `src/tools/autograd/load_derivatives.py`, `src/tools/autograd/derivatives.yaml`
- Caveats: Any new file in this directory must be wired into build dependencies, as stated by `src/tools/autograd/README.md`.

## Role

`tools/autograd` is the build-time generator for PyTorch's autograd wrapper code. `src/tools/autograd/gen_autograd.py` orchestrates parsing native operator metadata and derivative formulas, while `src/tools/autograd/load_derivatives.py` turns `derivatives.yaml` into structured differentiability information that later emitters consume.

## Key Files

- [`src/tools/autograd/README.md`](src/tools/autograd/README.md) - build integration rule for the directory.
- [`src/tools/autograd/gen_autograd.py`](src/tools/autograd/gen_autograd.py) - main orchestration script.
- [`src/tools/autograd/load_derivatives.py`](src/tools/autograd/load_derivatives.py) - derivative parsing and caching.
- [`src/tools/autograd/derivatives.yaml`](src/tools/autograd/derivatives.yaml) - declarative gradient formulas.
- [`src/tools/autograd/gen_autograd_functions.py`](src/tools/autograd/gen_autograd_functions.py) - backward-node emission.

## Public Interface

The public interface here is internal and build-oriented. `gen_autograd.py` exposes `gen_autograd()` and `gen_autograd_python()` for build scripts, and `load_derivatives.py` exposes `load_derivatives()` for any codegen stage that needs normalized differentiability information keyed by operator schema.

## Dependencies

The directory depends on operator schemas from [`src/aten/src/ATen/native/native_functions.yaml`](src/aten/src/ATen/native/native_functions.yaml) and tags from [`src/aten/src/ATen/native/tags.yaml`](src/aten/src/ATen/native/tags.yaml). It consumes typed parsing and schema helpers from [`src/torchgen/gen.py`](src/torchgen/gen.py), and its generated outputs are consumed by runtime sources such as [`src/torch/csrc/autograd/engine.cpp`](src/torch/csrc/autograd/engine.cpp) and [`src/torch/csrc/autograd/variable.h`](src/torch/csrc/autograd/variable.h).

## Runtime Behaviour

This directory runs during build, not during training or inference. `src/tools/autograd/gen_autograd.py` loads derivative metadata, filters native functions through the selective builder, matches differentiability information to those functions, and then emits `VariableType`, inplace/view wrappers, trace types, autograd nodes, Python bindings, variable factories, and view helpers. `src/tools/autograd/load_derivatives.py` also synthesizes derivative entries for generated `view_copy` operators so maintainers do not have to duplicate formulas manually in YAML.

## Performance Profile

The cost of this directory is paid primarily in build time. Parsing large YAML files and generating many C++ and Python outputs is expensive enough that `load_derivatives.py` caches results and `gen_autograd.py` uses selective-build filtering to avoid unnecessary training-only output. The runtime payoff is significant: generated autograd wrappers keep the gradient surface consistent across hundreds of operators without adding manual-maintenance drift.

## Design Rationale

Chapter 06 makes clear that autograd is deeply intertwined with dispatch, so PyTorch cannot afford a partially generated or inconsistently maintained backward surface. This directory turns gradient formulas into code using the same source-of-truth philosophy that Chapter 04 described for operator schemas, which keeps operator growth manageable.
