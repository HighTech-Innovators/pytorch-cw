# `aten/src/ATen/core`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`aten/src/ATen/core` owns dynamic operator dispatch, schema registration, and boxed/unboxed calling conventions. It is the coordination layer that takes operator schemas, dispatch keys, and registered kernels and turns them into concrete runtime calls.

## Key Files

| File | Purpose |
|---|---|
| `aten/src/ATen/core/dispatch/Dispatcher.h` | defines the dispatcher singleton, operator lookup, invocation, and registration APIs |
| `aten/src/ATen/core/dispatch/OperatorEntry.h` | stores per-operator schemas, kernel lists, and computed dispatch tables |
| `aten/src/ATen/core/boxing/KernelFunction.h` | defines the boxed/unboxed kernel wrapper used in dispatch tables |

## Public Interface

Important symbols include `c10::Dispatcher`, `Dispatcher::singleton`, `findSchema`, `findSchemaOrThrow`, `call`, `redispatch`, `callBoxed`, `registerDef`, `registerImpl`, `c10::impl::OperatorEntry`, `OperatorEntry::lookup`, `OperatorEntry::registerKernel`, `OperatorEntry::hasKernelForDispatchKey`, `c10::KernelFunction`, `KernelFunction::call`, `KernelFunction::callBoxed`, `KernelFunction::makeFromBoxedFunction`, `KernelFunction::makeFromUnboxedFunction`, and `KernelFunction::makeFallthrough`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10/core](c10/core/ADR.md) | depends-on | `DispatchKeySet` and other runtime key primitives drive dispatch selection |
| [aten/src/ATen/native](aten/src/ATen/native/ADR.md) | fed-by | native kernels register implementations here |
| [torch/csrc](torch/csrc/ADR.md) | used-by | Python bindings and compiled module bootstrap look up operators through the dispatcher |

## Runtime Behaviour

`Dispatcher::singleton()` in `Dispatcher.h` returns a process-wide dispatcher, and operators are addressed either by schema lookup (`findSchema`, `findSchemaOrThrow`) or by a looser `findOp` path that tolerates missing schemas. `Dispatcher::call` and `redispatch` use a `DispatchKeySet` to select the kernel, while `callBoxed` and `redispatchBoxed` route through an `IValue` stack for boxed invocation. `OperatorEntry` in `OperatorEntry.h` owns the canonical per-operator state: it keeps the schema, stores registered kernels by dispatch key, updates fallback state, and serves `lookup()` results from `dispatchTable_`. `KernelFunction` in `KernelFunction.h` bridges boxed and unboxed implementations so a kernel can be registered in one form and called in the other when needed.

## Performance Profile

`OperatorEntry.h` explicitly separates the compact `dispatchTable_` array from the larger kernel-registration lists because dispatch table lookups are hot and should stay cache-friendly, while registration churn is relatively rare. `OperatorEntry::lookup()` first tests the unboxed fast path with `isValidUnboxed()` so common ATen calls do not have to touch the boxed kernel representation. `KernelFunction::makeFromUnboxedFunction` is templated specifically so the compiler can inline the target into generated unboxing wrappers, reducing boxing overhead in steady-state operator execution. Registration is more expensive, but the RAII handles in `Dispatcher.h` confine that cost to library load/unload and schema/impl changes.

## Design Rationale

This layer separates operator schema ownership from kernel invocation so PyTorch can register multiple implementations, fallbacks, and alias keys without complicating call sites. `KernelFunction` exists because PyTorch has to support both efficient C++ calling conventions and generic boxed calls from JIT, Python, and instrumentation code. The dispatcher is a singleton because registrations are global process state, but per-operator data stays in `OperatorEntry` so lookup remains local after the initial operator-name resolution.
