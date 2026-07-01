# `torch/export`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch.export` is PyTorch's stable AOT capture contract for downstream compilers and exporters. `src/torch/export/__init__.py` defines `export()` around normalized Tensor computation, `src/torch/export/dynamic_shapes.py` defines the symbolic dimension model, and `src/torch/export/exported_program.py` holds the reusable graph container and decomposition overrides that make exported graphs executable and serializable.

## Key Files


| File | Purpose |
|---|---|
| `src/torch/export/__init__.py` | public API and soundness contract |
| `src/torch/export/dynamic_shapes.py` | `Dim`, bounds, and shape-spec utilities |
| `src/torch/export/exported_program.py` | `ExportedProgram`, module-call metadata, and decomposition overrides |
| `src/torch/export/graph_signature.py` | graph input/output metadata types |
| `src/torch/export/_trace.py` | capture implementation behind the public API |

## Public Interface

The namespace exports `export`, `draft_export`, `ExportedProgram`, `Dim`, `dims`, `save`, `load`, `unflatten`, `register_dataclass`, and graph-signature types from `src/torch/export/__init__.py`. The API accepts an `nn.Module` plus example inputs and optional dynamic shape specifications, then returns an `ExportedProgram` that can be serialized or fed into adjacent systems such as ONNX export or compiler backends.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/_dynamo](torch/_dynamo/ADR.md) | depends-on | graph capture through `eval_frame.py` |
| [torch/fx](torch/fx/ADR.md) | depends-on | FX `Graph` produced by capture |
| [torch/_decomp](torch/_decomp/ADR.md) | depends-on | decomposition tables |
| [torch/_C](torch/_C/ADR.md) | depends-on | dispatch keys and operator metadata |

## Runtime Behaviour

`src/torch/export/__init__.py` explicitly rejects non-`nn.Module` inputs and `torch.jit.ScriptModule`, then delegates to `src/torch/export/_trace.py` to perform capture. The exported graph records normalized functional ATen ops, strips most Python control flow, and validates shape assumptions using `Dim` or newer `ShapesSpec` inputs defined in `src/torch/export/dynamic_shapes.py`. `src/torch/export/exported_program.py` then patches CompositeImplicitAutograd decompositions for selected ops so the exported program keeps a stable and executable operator set.

## Performance Profile

Export is intentionally expensive up front because it runs tracing, fake-tensor analysis, decomposition, metadata collection, and shape-constraint reasoning before it returns an artifact. That upfront cost buys a reusable graph that avoids repeated Python interpretation in downstream compilation or export stages, which is the Chapter 09 tradeoff between first-call work and steady-state reuse. Runtime-assert insertion and guard strategy also matter here, because they shift cost between capture-time specialization and execution-time validation.

## Design Rationale

The design follows Chapters 04 and 09 closely: emit a schema-aware graph in terms of stable ATen ops, then let later stages lower or serialize that graph without revisiting arbitrary Python. Separating symbolic dimensions, graph signatures, and executable program state keeps the exported artifact precise enough for compilers and external formats without forcing users to learn internal FX details.
