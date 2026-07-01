# `torch/csrc/dynamo`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/csrc/dynamo` implements the performance-critical C++ runtime for TorchDynamo's frame-evaluation, cache lookup, and guard execution. It sits beneath the Python `torch._dynamo` package and decides whether an incoming Python frame can reuse previously compiled code.

## Key Files

| File | Purpose |
|---|---|
| `torch/csrc/dynamo/eval_frame_cpp.cpp` | custom frame-eval runtime, cache lookup, debugger hooks, and callback invocation |
| `torch/csrc/dynamo/guards.cpp` | C++ guard tree, tensor checks, and fast-path guard evaluation logic |
| `torch/csrc/dynamo/init.cpp` | initializes the `torch._C._dynamo` extension module and pybind helpers |

## Public Interface

Key symbols include `dynamo__custom_eval_frame`, `set_bytecode_debugger_callback`, `get_bytecode_debugger_callback`, `register_breakpoint_code`, `NullStackValue`, `TensorCheck`, `TensorCheck::check`, `GuardManager`, `RootGuardManager`, `DictGuardManager`, `_strip_function_call`, `_is_valid_var_name`, and the `torch._C._dynamo` module created in `init.cpp`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/_dynamo](torch/_dynamo/ADR.md) | used-by | Python Dynamo code calls into this extension for frame-eval and guard execution |
| [c10/core](c10/core/ADR.md) | depends-on | tensor metadata and dispatch-key state feed guard checks |
| [torch/csrc](torch/csrc/ADR.md) | used-by | the compiled extension is loaded alongside the main Python bridge |

## Runtime Behaviour

`dynamo__custom_eval_frame` in `eval_frame_cpp.cpp` obtains `ExtraState` for the current code object, builds a `FrameLocalsMapping` when needed, extracts a `CacheEntry`, and then decides whether a cached compiled code object can run or whether the Python callback must be invoked to compile a new one. The same file also stores bytecode-debugger callbacks, tracks breakpoint code objects, and preserves global state such as Python's `random` module state across callback execution. In `guards.cpp`, `TensorCheck` captures the expected dispatch-key set, dtype, device index, grad requirement, sizes, and strides for a tensor and verifies them in `check(...)`. That file also defines the guard tree classes `GuardManager`, `RootGuardManager`, and `DictGuardManager`, all centered on `check_nopybind(...)` methods that avoid pybind overhead during hot guard evaluation.

## Performance Profile

This directory is optimized for the steady-state cache-hit path. `FrameLocalsMapping` avoids materializing a full Python locals dict, and `eval_frame_cpp.cpp` keeps `CacheEntry*` and `ExtraState*` as native pointers during lookup so repeated frames do not bounce through Python abstractions. `guards.cpp` is similarly tuned: tensor checks compare raw dispatch-key representations and small metadata vectors, and the guard-manager hierarchy is built around fail-fast `check_nopybind` methods instead of Python callbacks. The cost trade-off is complexity in guard bookkeeping, dict/tag watchers, and debugger integration, but those features are still cheaper than retracing Python frames on every call.

## Design Rationale

TorchDynamo splits runtime reuse logic into C++ because frame evaluation and guard checks happen for every candidate Python frame and cannot afford Python-level overhead on cache hits. The Python layer still owns policy and graph building, but C++ owns fast locals access, cache storage, and metadata comparisons. Keeping init, eval-frame, and guard code in one directory also makes the boundary with `torch/_dynamo` explicit: Python decides what to compile, while `torch/csrc/dynamo` decides when compiled code is still valid.
