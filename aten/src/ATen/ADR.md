# `aten/src/ATen`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`aten/src/ATen` is the public C++ tensor/operator layer for ATen and the home of shared runtime helpers that operator kernels reuse. `TensorIterator` standardizes elementwise iteration and broadcasting, while `record_function.h` defines the callback surface used by profiling and tracing.

## Key Files

| File | Purpose |
|---|---|
| `aten/src/ATen/TensorIterator.h` | defines `TensorIterator`, `TensorIteratorConfig`, operand metadata, and inner-loop iteration contracts |
| `aten/src/ATen/record_function.h` | defines `RecordScope`, `RecordFunctionCallback`, and record-function observer contracts |
| `aten/src/ATen/Functions.h` | generated public ATen function declarations consumed by native kernels and bindings |
| `aten/src/ATen/NativeFunctions.h` | generated declarations for native operator entrypoints |

## Public Interface

Key symbols include `at::TensorIterator`, `at::TensorIteratorConfig`, `at::OperandInfo`, `at::internal::GRAIN_SIZE`, `at::RecordScope`, `at::RecordFunctionCallback`, `at::ObserverContext`, and `at::kParamCommsCallName`. `TensorIteratorConfig` exposes methods such as `add_output`, `add_input`, and `build`, while `RecordFunctionCallback` exposes `needsInputs`, `needsOutputs`, `needsIds`, `samplingProb`, and `scopes`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10/core](c10/core/ADR.md) | depends-on | tensor metadata, devices, and dispatch keys |
| [aten/src/ATen/core](aten/src/ATen/core/ADR.md) | depends-on | operator handles and boxed values used by profiling callbacks |
| [aten/src/ATen/native](aten/src/ATen/native/ADR.md) | used-by | native kernels build iteration loops and public operator entrypoints from this layer |
| [torch/csrc/profiler](torch/csrc/profiler/ADR.md) | used-by | profiler callbacks hook through `RecordFunction` |

## Runtime Behaviour

`TensorIterator.h` requires outputs to be registered before inputs, and `TensorIteratorConfig::build()` then consolidates broadcasting, dtype promotion, resize decisions, and per-operand stride metadata into a single iterator. `OperandInfo` caches `current_dtype`, `target_dtype`, device, and broadcasted byte strides so inner loops do not have to rediscover that state for every element. `record_function.h` defines both thread-local and global `RecordFunctionCallback` registration, and the comments explain that callbacks can request inputs, outputs, IDs, and sampling decisions before a scope is entered. Because `RecordScope` includes `FUNCTION`, `BACKWARD_FUNCTION`, `TORCHSCRIPT_FUNCTION`, and `USER_SCOPE`, the same callback surface is reused across eager ops, autograd nodes, and user annotations.

## Performance Profile

`TensorIterator` is explicitly tuned for hot elementwise code: `GRAIN_SIZE` in `TensorIterator.h` sets a floor for parallel work splitting, and `OperandInfo` caches dtype/device information because some tensor queries are expensive. Broadcasting, dimension reordering, and output allocation are centralized in `build()` so kernels can run tight 1-D inner loops instead of repeatedly checking shape rules. `record_function.h` also makes callback overhead explicit: `needsInputs`, `needsOutputs`, and `samplingProb` exist so observers can opt out of costly input/output materialization, and the implementation uses `SmallVector`-backed handle/context lists with a soft callback limit.

## Design Rationale

ATen keeps iterator logic in a shared helper because writing separate broadcasting, promotion, and parallelization code in every native kernel would be both error-prone and slower. The public headers separate iteration/profiling contracts from dispatcher internals and concrete kernels so generated APIs, profiling, and backends can all depend on one stable layer. The `record_function` API is intentionally generic because the same event surface has to work for profilers, execution tracers, and lightweight user scopes.
