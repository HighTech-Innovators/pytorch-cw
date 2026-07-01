# ADR: torch/onnx export bridge

- Status: Draft
- Date: 2026-07-01
- Scope: `src/torch/onnx`
- Decision: Keep `torch.onnx` as a compatibility bridge that defaults to the modern `torch.export`-based exporter while retaining TorchScript-oriented utilities and symbolic registries.
- Primary entrypoints: `export`, `ONNXProgram`, `is_in_onnx_export`, verification helpers, symbolic opset modules
- Evidence: `src/torch/onnx/__init__.py`, `src/torch/onnx/utils.py`, `src/torch/onnx/verification.py`, `src/torch/onnx/symbolic_helper.py`
- Caveats: Verification support depends on external runtimes outside this tree, so this ADR only grounds the PyTorch-side orchestration.

## Role

`torch.onnx` owns PyTorch's model-to-ONNX translation surface. `src/torch/onnx/__init__.py` makes the modern exporter the default by routing `export()` through `torch.export.ExportedProgram` when `dynamo=True`, while still carrying TorchScript-era utilities and symbolic registries for backward compatibility.

## Key Files

- [`src/torch/onnx/__init__.py`](src/torch/onnx/__init__.py) - public API, exporter selection, and user documentation.
- [`src/torch/onnx/utils.py`](src/torch/onnx/utils.py) - legacy TorchScript exporter helpers.
- [`src/torch/onnx/verification.py`](src/torch/onnx/verification.py) - exported-model verification entrypoints.
- [`src/torch/onnx/symbolic_helper.py`](src/torch/onnx/symbolic_helper.py) - shared symbolic translation helpers.
- [`src/torch/onnx/symbolic_opset*.py`](src/torch/onnx) - opset-specific symbolic lowerings.

## Public Interface

The namespace exposes `export()`, `ONNXProgram`, `OnnxExporterError`, `InputObserver`, and `is_in_onnx_export()` from `src/torch/onnx/__init__.py`. The `export()` signature accepts eager modules, `torch.export.ExportedProgram`, `torch.jit.ScriptModule`, and `torch.jit.ScriptFunction`, which shows that `torch.onnx` remains the handoff point between eager, export, and older JIT-based serialization paths.

## Dependencies

The module depends on the compiled ONNX contract in [`src/torch/_C/_onnx.pyi`](src/torch/_C/_onnx.pyi) for enums such as `TrainingMode` and `OperatorExportTypes`. Its preferred graph source is [`src/torch/export/__init__.py`](src/torch/export/__init__.py), while its legacy graph source stays in [`src/torch/jit`](src/torch/jit). The symbolic translation layer also depends on internal exporter code under [`src/torch/onnx/_internal`](src/torch/onnx/_internal).

## Runtime Behaviour

When `dynamo=True`, `src/torch/onnx/__init__.py` documents a three-step acquisition strategy: reuse an existing `ExportedProgram`, try `torch.export.export(..., strict=False)`, then retry with `strict=True`. The same file also keeps legacy options like `dynamic_axes` and TorchScript-specific enums alive, so the runtime can serve older export call sites while pushing new users toward dynamic-shape export and `ONNXProgram`-based serialization. `src/torch/onnx/verification.py` exposes `verify_onnx_program()` as a separate path instead of baking verification into the core graph object.

## Performance Profile

The exporter is front-loaded work: it traces, normalizes, translates, and optionally verifies before returning an `ONNXProgram`, so most cost happens at export time rather than inference time. `src/torch/onnx/__init__.py` exposes `optimize`, `profile`, `report`, and `external_data` switches because graph optimization, debug artifact generation, and large-weight handling have materially different runtime and memory costs during export. The opset-specific symbolic modules also imply maintenance and translation overhead that the export-based pipeline is trying to reduce over time.

## Design Rationale

This directory embodies the transition described in Chapter 09. PyTorch keeps ONNX as an interoperability surface, but it increasingly wants the input IR to look like `torch.export` output instead of ad hoc traced graphs, because normalized functional ATen graphs are easier to verify and translate consistently than legacy TorchScript traces.
