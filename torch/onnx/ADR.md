# `torch/onnx`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch.onnx` owns PyTorch's model-to-ONNX translation surface. `src/torch/onnx/__init__.py` makes the modern exporter the default by routing `export()` through `torch.export.ExportedProgram` when `dynamo=True`, while still carrying TorchScript-era utilities and symbolic registries for backward compatibility.

## Key Files


| File | Purpose |
|---|---|
| `src/torch/onnx/__init__.py` | public API, exporter selection, and user documentation |
| `src/torch/onnx/utils.py` | legacy TorchScript exporter helpers |
| `src/torch/onnx/verification.py` | exported-model verification entrypoints |
| `src/torch/onnx/symbolic_helper.py` | shared symbolic translation helpers |
| `src/torch/onnx/symbolic_opset*.py` | opset-specific symbolic lowerings |

## Public Interface

The namespace exposes `export()`, `ONNXProgram`, `OnnxExporterError`, `InputObserver`, and `is_in_onnx_export()` from `src/torch/onnx/__init__.py`. The `export()` signature accepts eager modules, `torch.export.ExportedProgram`, `torch.jit.ScriptModule`, and `torch.jit.ScriptFunction`, which shows that `torch.onnx` remains the handoff point between eager, export, and older JIT-based serialization paths.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/_C](torch/_C/ADR.md) | depends-on | `_onnx.pyi` enums (`TrainingMode`, `OperatorExportTypes`) |
| [torch/export](torch/export/ADR.md) | depends-on | preferred graph source |
| [torch/jit](torch/jit/ADR.md) | depends-on | legacy trace graph source |
| `torch/onnx/_internal` | contains | symbolic translation internals |

## Runtime Behaviour

When `dynamo=True`, `src/torch/onnx/__init__.py` documents a three-step acquisition strategy: reuse an existing `ExportedProgram`, try `torch.export.export` with `strict=False`, then retry with `strict=True`. The same file also keeps legacy options like `dynamic_axes` and TorchScript-specific enums alive, so the runtime can serve older export call sites while pushing new users toward dynamic-shape export and `ONNXProgram`-based serialization. `src/torch/onnx/verification.py` exposes `verify_onnx_program()` as a separate path instead of baking verification into the core graph object.

## Performance Profile

The exporter is front-loaded work: it traces, normalizes, translates, and optionally verifies before returning an `ONNXProgram`, so most cost happens at export time rather than inference time. `src/torch/onnx/__init__.py` exposes `optimize`, `profile`, `report`, and `external_data` switches because graph optimization, debug artifact generation, and large-weight handling have materially different runtime and memory costs during export. The opset-specific symbolic modules also imply maintenance and translation overhead that the export-based pipeline is trying to reduce over time.

## Design Rationale

This directory embodies the transition described in Chapter 09. PyTorch keeps ONNX as an interoperability surface, but it increasingly wants the input IR to look like `torch.export` output instead of ad hoc traced graphs, because normalized functional ATen graphs are easier to verify and translate consistently than legacy TorchScript traces.
