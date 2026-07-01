# `torch/profiler`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/profiler` is the Python facade for PyTorch profiling, scheduling, trace export, and memory timeline analysis. It configures activity capture, orchestrates Kineto-backed runs, and exposes convenience helpers for TensorBoard and execution-trace integration.

## Key Files

| File | Purpose |
|---|---|
| `torch/profiler/profiler.py` | defines `_KinetoProfile`, `profile`, `schedule`, and TensorBoard/export helpers |
| `torch/profiler/_memory_profiler.py` | defines `MemoryProfile` and `MemoryProfileTimeline` |
| `torch/profiler/_cupti/observers/profiler.py` | contains CUPTI-side observer support for GPU activity capture |

## Public Interface

Important symbols include `supported_activities`, `ProfilerAction`, `schedule`, `tensorboard_trace_handler`, `profile`, `ExecutionTraceObserver`, `MemoryProfile`, and `MemoryProfileTimeline`. `_KinetoProfile` is the internal base that `profile` extends for the public context-manager/decorator API.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/csrc/profiler](torch/csrc/profiler/ADR.md) | depends-on | Python profiler APIs delegate trace capture and bindings to native code |
| [aten/src/ATen](aten/src/ATen/ADR.md) | depends-on | profiling hooks rely on record-function scopes emitted by ATen |
| [torch/autograd](torch/autograd/ADR.md) | interacts-with | profiler activities and legacy profiling flow through autograd support |

## Runtime Behaviour

`supported_activities()` in `profiler.py` asks the autograd profiler backend which activity groups are available, and `_KinetoProfile.__init__` parses the requested `ProfilerActivity` set plus optional per-activity filters before choosing the device family to trace. The same class stores flags such as `record_shapes`, `profile_memory`, `with_stack`, and `with_modules`, which directly control how much metadata native tracing should collect. `schedule(...)` and `tensorboard_trace_handler(...)` in `profiler.py` shape when traces are started, stopped, and exported, while `ExecutionTraceObserver` provides a separate hook path for execution-trace capture. `MemoryProfile` and `MemoryProfileTimeline` in `_memory_profiler.py` reconstruct allocation history from profiler events rather than from ad hoc logging.

## Performance Profile

The file-level notes in `profiler.py` are explicit that `record_shapes`, `profile_memory`, and `with_stack` add overhead, and that shape tracking can hold extra tensor references that block some optimizations or force extra copies. GPU tracing is especially sensitive: CUDA activity capture relies on CUPTI or a legacy fallback, and the more activity types or trace windows selected, the more event-buffer and post-processing work the profiler must do. Memory-timeline reconstruction also costs extra time and storage because events have to be retained long enough to rebuild allocation/deallocation sequences. The upside is that the scheduling API lets callers confine that cost to warmup and active windows instead of always-on profiling.

## Design Rationale

The public profiler stays in Python because users need flexible scheduling, export callbacks, and convenient context-manager syntax. The implementation still centers around Kineto and native event capture, but `torch/profiler` adds the orchestration layer that native code alone would not provide. Separating memory profiling and execution-trace helpers from the core `profile` context keeps specialized features available without making every profiling call site pay for them.
