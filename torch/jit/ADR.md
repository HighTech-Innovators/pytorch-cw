# `torch/jit`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch.jit` is the public Python entrypoint for TorchScript scripting, tracing, serialization, and graph freezing. `src/torch/jit/__init__.py` assembles that public API from lower-level helpers, while `src/torch/jit/_script.py` and `src/torch/jit/_trace.py` bridge Python callables and modules to C++ `torch._C` JIT objects such as `ScriptFunction`, `ScriptModule`, and traced graphs.

## Key Files


| File | Purpose |
|---|---|
| `src/torch/jit/__init__.py` | namespace assembly and public exports |
| `src/torch/jit/_script.py` | scripting frontend, `ScriptFunction`, and `ScriptModule` integration |
| `src/torch/jit/_trace.py` | tracing frontend, input cloning, and graph capture |
| `src/torch/jit/_serialization.py` | save/load wrappers |
| `src/torch/jit/_freeze.py` | module freezing and inference-oriented cleanup |

## Public Interface

The namespace exports `script`, `trace`, `trace_module`, `save`, `load`, `freeze`, and `optimize_for_inference` from `src/torch/jit/__init__.py`. It also exposes compiler-facing helpers like `annotate`, `interface`, `fork`, `wait`, `ScriptFunction`, and `ScriptModule`, but the module-level docs in `src/torch/jit/__init__.py` now explicitly mark TorchScript APIs as deprecated in favor of `torch.compile`.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/_C](torch/_C/ADR.md) | depends-on | compiled JIT types |
| [torch/csrc/jit](torch/csrc/jit/ADR.md) | depends-on | C++ TorchScript compiler implementation |
| [torch/onnx](torch/onnx/ADR.md) | used-by | tracing path used by ONNX export |

## Runtime Behaviour

`src/torch/jit/_script.py` binds Python-visible classes to compiled `torch._C` types and wires helper methods like `graph_for` onto them, so most real compilation and IR ownership lives in native code. `src/torch/jit/_trace.py` flattens inputs, deduplicates module state, and calls `torch._C._create_graph_by_tracing`, which means tracing records observed execution rather than full Python semantics. `src/torch/jit/__init__.py` also carries deprecation text at the public surface, so the runtime advertises support without presenting the stack as the preferred long-term compiler entry.

## Performance Profile

`src/torch/jit/_script.py` notes that scripting has meaningful startup cost because compiler builtins initialize lazily, so it is not a zero-cost wrapper for library code. `src/torch/jit/_trace.py` adds cloning and state-deduplication work around graph capture, and its optional `_time` helper only performs CUDA event timing when CUDA is available. In exchange, `freeze` and `optimize_for_inference` let callers reduce dispatch and attribute lookup overhead in steady-state deployment flows.

## Design Rationale

This layout reflects Chapters 01 and 09: the Python package keeps a stable ergonomic surface, while the compiled JIT owns the IR, serialization format, and graph rewrites. Keeping scripting, tracing, serialization, and freeze logic in separate files lets PyTorch maintain legacy TorchScript consumers without conflating them with the newer `torch.export` and `torch.compile` stacks.
