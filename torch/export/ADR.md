# ADR: torch/export AOT graph contract

- Status: Draft
- Date: 2026-07-01
- Scope: `src/torch/export`
- Decision: Use `torch.export` as the Ahead-of-Time graph capture API that emits normalized functional ATen graphs plus explicit shape constraints.
- Primary entrypoints: `export`, `draft_export`, `ExportedProgram`, `Dim`, `dims`, `save`, `load`, `unflatten`
- Evidence: `src/torch/export/__init__.py`, `src/torch/export/dynamic_shapes.py`, `src/torch/export/exported_program.py`, `src/torch/export/graph_signature.py`
- Caveats: Export rejects `torch.jit.ScriptModule` directly, so legacy scripted graphs must go through separate conversion paths.

## Role

`torch.export` is PyTorch's stable AOT capture contract for downstream compilers and exporters. `src/torch/export/__init__.py` defines `export()` around normalized Tensor computation, `src/torch/export/dynamic_shapes.py` defines the symbolic dimension model, and `src/torch/export/exported_program.py` holds the reusable graph container and decomposition overrides that make exported graphs executable and serializable.

## Key Files

- [`src/torch/export/__init__.py`](src/torch/export/__init__.py) - public API and soundness contract.
- [`src/torch/export/dynamic_shapes.py`](src/torch/export/dynamic_shapes.py) - `Dim`, bounds, and shape-spec utilities.
- [`src/torch/export/exported_program.py`](src/torch/export/exported_program.py) - `ExportedProgram`, module-call metadata, and decomposition overrides.
- [`src/torch/export/graph_signature.py`](src/torch/export/graph_signature.py) - graph input/output metadata types.
- [`src/torch/export/_trace.py`](src/torch/export/_trace.py) - capture implementation behind the public API.

## Public Interface

The namespace exports `export`, `draft_export`, `ExportedProgram`, `Dim`, `dims`, `save`, `load`, `unflatten`, `register_dataclass`, and graph-signature types from `src/torch/export/__init__.py`. The API accepts an `nn.Module` plus example inputs and optional dynamic shape specifications, then returns an `ExportedProgram` that can be serialized or fed into adjacent systems such as ONNX export or compiler backends.

## Dependencies

`torch.export` depends on the compile-stack building blocks in [`src/torch/_dynamo/eval_frame.py`](src/torch/_dynamo/eval_frame.py), [`src/torch/fx/graph.py`](src/torch/fx/graph.py), and [`src/torch/_guards.py`](src/torch/_guards.py). It also consumes decomposition infrastructure from [`src/torch/_decomp/__init__.py`](src/torch/_decomp/__init__.py) and custom decomposition tables from [`src/torch/export/decomp_utils.py`](src/torch/export/decomp_utils.py). At the runtime boundary it relies on dispatch keys and operator metadata surfaced through [`src/torch/_C/__init__.pyi.in`](src/torch/_C/__init__.pyi.in).

## Runtime Behaviour

`src/torch/export/__init__.py` explicitly rejects non-`nn.Module` inputs and `torch.jit.ScriptModule`, then delegates to `src/torch/export/_trace.py` to perform capture. The exported graph records normalized functional ATen ops, strips most Python control flow, and validates shape assumptions using `Dim` or newer `ShapesSpec` inputs defined in `src/torch/export/dynamic_shapes.py`. `src/torch/export/exported_program.py` then patches CompositeImplicitAutograd decompositions for selected ops so the exported program keeps a stable and executable operator set.

## Performance Profile

Export is intentionally expensive up front because it runs tracing, fake-tensor analysis, decomposition, metadata collection, and shape-constraint reasoning before it returns an artifact. That upfront cost buys a reusable graph that avoids repeated Python interpretation in downstream compilation or export stages, which is the Chapter 09 tradeoff between first-call work and steady-state reuse. Runtime-assert insertion and guard strategy also matter here, because they shift cost between capture-time specialization and execution-time validation.

## Design Rationale

The design follows Chapters 04 and 09 closely: emit a schema-aware graph in terms of stable ATen ops, then let later stages lower or serialize that graph without revisiting arbitrary Python. Separating symbolic dimensions, graph signatures, and executable program state keeps the exported artifact precise enough for compilers and external formats without forcing users to learn internal FX details.
