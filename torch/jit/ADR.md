# ADR: torch/jit TorchScript facade

- Status: Draft
- Date: 2026-07-01
- Scope: `src/torch/jit`
- Decision: Preserve `torch.jit` as a Python facade over compiled TorchScript and tracing machinery while signaling that `torch.compile` is the preferred future path.
- Primary entrypoints: `script`, `trace`, `trace_module`, `save`, `load`, `freeze`, `optimize_for_inference`
- Evidence: `src/torch/jit/__init__.py`, `src/torch/jit/_script.py`, `src/torch/jit/_trace.py`, `src/torch/jit/_serialization.py`, `src/torch/jit/_freeze.py`
- Caveats: Some helper paths still mention CUDA timing, but the current repository constraints validate them from source only.

## Role

`torch.jit` is the public Python entrypoint for TorchScript scripting, tracing, serialization, and graph freezing. `src/torch/jit/__init__.py` assembles that public API from lower-level helpers, while `src/torch/jit/_script.py` and `src/torch/jit/_trace.py` bridge Python callables and modules to C++ `torch._C` JIT objects such as `ScriptFunction`, `ScriptModule`, and traced graphs.

## Key Files

- [`src/torch/jit/__init__.py`](src/torch/jit/__init__.py) - namespace assembly and public exports.
- [`src/torch/jit/_script.py`](src/torch/jit/_script.py) - scripting frontend, `ScriptFunction`, and `ScriptModule` integration.
- [`src/torch/jit/_trace.py`](src/torch/jit/_trace.py) - tracing frontend, input cloning, and graph capture.
- [`src/torch/jit/_serialization.py`](src/torch/jit/_serialization.py) - save/load wrappers.
- [`src/torch/jit/_freeze.py`](src/torch/jit/_freeze.py) - module freezing and inference-oriented cleanup.

## Public Interface

The namespace exports `script`, `trace`, `trace_module`, `save`, `load`, `freeze`, and `optimize_for_inference` from `src/torch/jit/__init__.py`. It also exposes compiler-facing helpers like `annotate`, `interface`, `fork`, `wait`, `ScriptFunction`, and `ScriptModule`, but the module-level docs in `src/torch/jit/__init__.py` now explicitly mark TorchScript APIs as deprecated in favor of `torch.compile`.

## Dependencies

`torch.jit` depends on the compiled JIT types surfaced through [`src/torch/_C/__init__.pyi.in`](src/torch/_C/__init__.pyi.in) and implemented under [`src/torch/csrc/jit`](src/torch/csrc/jit). The scripting frontend also uses [`src/torch/jit/frontend.py`](src/torch/jit/frontend.py) and recursive module wrapping from [`src/torch/jit/_recursive.py`](src/torch/jit/_recursive.py). The tracing path intersects ONNX export through `ONNXTracedModule` in [`src/torch/jit/_trace.py`](src/torch/jit/_trace.py), which is one reason the JIT stack still matters to adjacent export code.

## Runtime Behaviour

`src/torch/jit/_script.py` binds Python-visible classes to compiled `torch._C` types and wires helper methods like `graph_for` onto them, so most real compilation and IR ownership lives in native code. `src/torch/jit/_trace.py` flattens inputs, deduplicates module state, and calls `torch._C._create_graph_by_tracing`, which means tracing records observed execution rather than full Python semantics. `src/torch/jit/__init__.py` also carries deprecation text at the public surface, so the runtime advertises support without presenting the stack as the preferred long-term compiler entry.

## Performance Profile

`src/torch/jit/_script.py` notes that scripting has meaningful startup cost because compiler builtins initialize lazily, so it is not a zero-cost wrapper for library code. `src/torch/jit/_trace.py` adds cloning and state-deduplication work around graph capture, and its optional `_time` helper only performs CUDA event timing when CUDA is available. In exchange, `freeze` and `optimize_for_inference` let callers reduce dispatch and attribute lookup overhead in steady-state deployment flows.

## Design Rationale

This layout reflects Chapters 01 and 09: the Python package keeps a stable ergonomic surface, while the compiled JIT owns the IR, serialization format, and graph rewrites. Keeping scripting, tracing, serialization, and freeze logic in separate files lets PyTorch maintain legacy TorchScript consumers without conflating them with the newer `torch.export` and `torch.compile` stacks.
