# `torchgen`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torchgen` is the code-generation engine behind PyTorch's operator surface. `src/torchgen/gen.py` parses `native_functions.yaml` and emits generated code, while `src/torchgen/model.py` defines the immutable data model that turns raw YAML strings into structured `NativeFunction`, `FunctionSchema`, `DispatchKey`, and `BackendIndex` objects.

## Key Files


| File | Purpose |
|---|---|
| `src/torchgen/gen.py` | main generator entrypoint and YAML parsing pipeline |
| `src/torchgen/model.py` | typed schema and dispatch data model |
| `src/torchgen/gen_backend_stubs.py` | backend stub generation |
| `src/torchgen/dest/register_dispatch_key.py` | per-dispatch-key emission logic |
| `src/torchgen/api/autograd.py` | autograd-facing codegen model utilities |

## Public Interface

The directory is an internal tool rather than an end-user package, but it exposes programmatic entrypoints such as `parse_native_yaml` and model classes that other build scripts import directly. `src/torchgen/gen.py` also acts as the hub for specialized generators like functionalization, AOTI shim emission, and vmap plumbing, so its effective interface is the orchestration API used by build helpers.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [aten/src/ATen/native](aten/src/ATen/native/ADR.md) | depends-on | `native_functions.yaml` and `tags.yaml` |
| [torch/csrc](torch/csrc/ADR.md) | feeds | generated Python/C++ bindings |
| [aten/src/ATen](aten/src/ATen/ADR.md) | feeds | generated ATen operator code |
| [tools/autograd](tools/autograd/ADR.md) | used-by | autograd codegen caller |

## Runtime Behaviour

`src/torchgen/gen.py` does not run in the hot runtime path, but it decisively shapes that runtime by parsing YAML, constructing `BackendIndex` maps, and selecting emitters based on dispatch keys and structured-kernel metadata. `src/torchgen/model.py` makes the parsing step semantic rather than stringly typed, which means later emitters can reason about schemas, variants, and backends without reparsing text. The generator also caches parsed YAML globally, reducing repeated work in multi-stage codegen flows.

## Performance Profile

This directory primarily affects build performance. Parsing large YAML registries, constructing typed models, and writing many generated files adds noticeable latency to a clean build, which is why `src/torchgen/gen.py` uses caches and structured helper modules instead of reparsing everything in each downstream script. The payoff is runtime performance and consistency: generated bindings keep function signatures, registrations, and dispatch glue in sync across thousands of operators.

## Design Rationale

Chapter 04's central claim is that PyTorch cannot scale its operator surface by hand, and `torchgen` is the concrete mechanism that makes that claim true. A typed model plus centralized emitters reduce drift, make aliasing and dispatch metadata explicit, and let new subsystems such as functionalization or export reuse the same operator source of truth.
