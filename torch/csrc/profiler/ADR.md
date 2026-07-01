# `torch/csrc/profiler`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/csrc/profiler` implements native event collection, Kineto integration, and the Python bindings behind `torch.profiler`. It is the bridge between record-function events, tensor metadata capture, native activity buffers, and Python-visible trace objects.

## Key Files

| File | Purpose |
|---|---|
| `torch/csrc/profiler/collection.cpp` | encodes inputs/outputs, tensor metadata, and profiler results |
| `torch/csrc/profiler/kineto_shim.cpp` | adapts PyTorch profiler requests to Kineto/libkineto tracing APIs |
| `torch/csrc/profiler/python/init.cpp` | exposes profiler bindings, captured tracebacks, and `record_function_fast` |

## Public Interface

Key symbols include `InputOutputEncoder::push`, `InputOutputEncoder::getIValueGenerator`, `TraceWrapper::addCPUActivity`, `TraceWrapper::transferCpuTrace`, `ActivityTraceWrapper::save`, `kineto_ids`, `prepareTrace`, `THPCapturedTraceback`, `RecordFunctionFast_enter`, `RecordFunctionFast_exit`, `addExecutionTraceObserver`, `removeExecutionTraceObserver`, `enableExecutionTraceObserver`, and `disableExecutionTraceObserver`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [aten/src/ATen](aten/src/ATen/ADR.md) | depends-on | record-function callbacks and IValue stacks originate in ATen |
| [torch/profiler](torch/profiler/ADR.md) | used-by | Python profiler facade delegates native capture and export here |
| [torch/csrc](torch/csrc/ADR.md) | used-by | bindings are installed onto the root compiled module |

## Runtime Behaviour

`collection.cpp` turns runtime values into profiler payloads by tagging `IValue` inputs in `InputOutputEncoder::push(...)`, storing tensor sizes/strides instead of full tensor contents when possible, and reconstructing typed views through `getIValueGenerator(...)`. `kineto_shim.cpp` adapts requested activity groups to libkineto, initializes tracing state in `prepareTrace(...)`, and records CPU activities with `TraceWrapper::addCPUActivity(...)` before finally handing the trace to Kineto with `transferCpuTrace(...)`. `python/init.cpp` exposes these facilities to Python: it defines the `THPCapturedTraceback` type, installs a `pybind11` caster for `CapturedTraceback`, and implements the `record_function_fast` path that creates an `at::RecordFunction` guard directly from Python without going through the dispatcher.

## Performance Profile

This directory is optimized to reduce profiler self-noise. `collection.cpp` only stores shapes and lightweight metadata for tensors, explicitly skips oversized scalar lists, and warns when metadata streams are exhausted instead of forcing heavyweight copies. `record_function_fast` in `python/init.cpp` exists because ordinary Python `record_function` was measured as too slow for per-op use; the comment notes it bypasses dispatcher features for lower overhead. `kineto_shim.cpp` also filters activities by requested names so traces do not collect every possible event class by default. Even with these optimizations, profiler event capture still adds allocation, synchronization, and post-processing cost, especially when shapes, stacks, or GPU activities are enabled.

## Design Rationale

PyTorch isolates Kineto adaptation, event encoding, and Python binding glue here so the public profiler API can stay high-level while native capture remains backend-aware. Input/output encoding is kept separate from trace transport because different consumers need the same semantic event data even when trace backends differ. The specialized `record_function_fast` path reflects a pragmatic design choice: profiling infrastructure is allowed to expose a narrower fast path when the general dispatcher route is too expensive for fine-grained annotation.
