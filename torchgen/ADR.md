# ADR: torchgen operator code generation

- Status: Draft
- Date: 2026-07-01
- Scope: `src/torchgen`
- Decision: Keep operator binding, registration, and auxiliary boilerplate generation centralized in `torchgen`, driven by typed models parsed from YAML.
- Primary entrypoints: `parse_native_yaml`, `NativeFunction`, `BackendIndex`, `gen_backend_stubs`, destination emitters
- Evidence: `src/torchgen/gen.py`, `src/torchgen/model.py`, `src/torchgen/gen_backend_stubs.py`, `src/torchgen/dest/register_dispatch_key.py`
- Caveats: This directory runs at build/codegen time, so its performance impact shows up mostly as build latency rather than runtime latency.

## Role

`torchgen` is the code-generation engine behind PyTorch's operator surface. `src/torchgen/gen.py` parses `native_functions.yaml` and emits generated code, while `src/torchgen/model.py` defines the immutable data model that turns raw YAML strings into structured `NativeFunction`, `FunctionSchema`, `DispatchKey`, and `BackendIndex` objects.

## Key Files

- [`src/torchgen/gen.py`](src/torchgen/gen.py) - main generator entrypoint and YAML parsing pipeline.
- [`src/torchgen/model.py`](src/torchgen/model.py) - typed schema and dispatch data model.
- [`src/torchgen/gen_backend_stubs.py`](src/torchgen/gen_backend_stubs.py) - backend stub generation.
- [`src/torchgen/dest/register_dispatch_key.py`](src/torchgen/dest/register_dispatch_key.py) - per-dispatch-key emission logic.
- [`src/torchgen/api/autograd.py`](src/torchgen/api/autograd.py) - autograd-facing codegen model utilities.

## Public Interface

The directory is an internal tool rather than an end-user package, but it exposes programmatic entrypoints such as `parse_native_yaml` and model classes that other build scripts import directly. `src/torchgen/gen.py` also acts as the hub for specialized generators like functionalization, AOTI shim emission, and vmap plumbing, so its effective interface is the orchestration API used by build helpers.

## Dependencies

`torchgen` consumes operator declarations from [`src/aten/src/ATen/native/native_functions.yaml`](src/aten/src/ATen/native/native_functions.yaml) and tags from [`src/aten/src/ATen/native/tags.yaml`](src/aten/src/ATen/native/tags.yaml). It feeds generated code into runtime-facing directories such as [`src/torch/csrc`](src/torch/csrc) and [`src/aten/src/ATen`](src/aten/src/ATen). Build helpers under [`src/tools/autograd`](src/tools/autograd) and [`src/tools/setup_helpers`](src/tools/setup_helpers) also call into this directory.

## Runtime Behaviour

`src/torchgen/gen.py` does not run in the hot runtime path, but it decisively shapes that runtime by parsing YAML, constructing `BackendIndex` maps, and selecting emitters based on dispatch keys and structured-kernel metadata. `src/torchgen/model.py` makes the parsing step semantic rather than stringly typed, which means later emitters can reason about schemas, variants, and backends without reparsing text. The generator also caches parsed YAML globally, reducing repeated work in multi-stage codegen flows.

## Performance Profile

This directory primarily affects build performance. Parsing large YAML registries, constructing typed models, and writing many generated files adds noticeable latency to a clean build, which is why `src/torchgen/gen.py` uses caches and structured helper modules instead of reparsing everything in each downstream script. The payoff is runtime performance and consistency: generated bindings keep function signatures, registrations, and dispatch glue in sync across thousands of operators.

## Design Rationale

Chapter 04's central claim is that PyTorch cannot scale its operator surface by hand, and `torchgen` is the concrete mechanism that makes that claim true. A typed model plus centralized emitters reduce drift, make aliasing and dispatch metadata explicit, and let new subsystems such as functionalization or export reuse the same operator source of truth.
