# `torch/csrc/distributed`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/csrc/distributed` contains the C++ bindings and backend implementations for c10d collectives, RPC agents, and DTensor placement objects. It is the native substrate that `torch.distributed` re-exports to Python.

## Key Files

| File | Purpose |
|---|---|
| `torch/csrc/distributed/c10d/init.cpp` | binds c10d stores, process groups, reducer types, and communication helpers |
| `torch/csrc/distributed/rpc/init.cpp` | binds RPC backend options, agents, RRefs, and TensorPipe RPC support |
| `torch/csrc/distributed/python_placement.cpp` | binds DTensor `Placement`, `Shard`, `Replicate`, and `Partial` types |

## Public Interface

Important symbols include `initPlacementBindings`, `Placement`, `Shard`, `StridedShard`, `Replicate`, `Partial`, `ProcessGroup`, `PrefixStore`, `TCPStore`, `FileStore`, `Reducer`, `RpcAgent`, `WorkerInfo`, `PyRRef`, and `TensorPipeAgent`. The c10d bindings also expose initialization helpers such as `init_nogil()` and Python-store trampolines such as `PythonStore`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/distributed](torch/distributed/ADR.md) | used-by | Python distributed APIs re-export process groups, stores, RPC agents, and placement types |
| [c10/core](c10/core/ADR.md) | depends-on | intrusive pointers and device/storage primitives underpin native distributed objects |
| [torch/csrc](torch/csrc/ADR.md) | used-by | root extension bootstrap installs these submodules and bindings |

## Runtime Behaviour

`c10d/init.cpp` builds the `_distributed_c10d` binding layer, registering stores, process groups, reducer-related types, and communication helpers through `pybind11`; the file also installs special handling such as `IntrusivePtrNoGilDestructor` and the `init_nogil()` factory to release the GIL around expensive native operations. `rpc/init.cpp` constructs the `_distributed_rpc` submodule and binds `RpcBackendOptions`, `WorkerInfo`, `RpcAgent`, `PyRRef`, and `TensorPipeAgent`, with many methods marked `py::call_guard<py::gil_scoped_release>()` to avoid blocking Python threads during network work. `python_placement.cpp` defines `initPlacementBindings`, creates the `_distributed` submodule, and binds the DTensor layout classes `Placement`, `Shard`, `Replicate`, and `Partial`, including pickle behavior and simple type predicates like `is_shard` and `is_partial`.

## Performance Profile

Distributed backends are sensitive to GIL behavior, and `c10d/init.cpp` makes that explicit by releasing the GIL both during construction and during intrusive-pointer destruction for some backend objects. RPC bindings do the same for methods such as `join`, `sync`, `shutdown`, and `toHere`, which avoids needless Python-side serialization of blocking work. Placement objects are lightweight by comparison, but they are still designed to be opaque-base-backed value types so layout checks stay cheap in Python. The main performance costs here are native communication and synchronization, so the binding layer focuses on staying out of the way.

## Design Rationale

This directory keeps communication backends in C++ because process groups, stores, and RPC transports need tight integration with networking libraries, threading, and low-level tensor movement. Separate init files for c10d, RPC, and placement keep each surface understandable while still feeding a single `torch.distributed` namespace. The consistent pybind approach also lets Python stay ergonomic without reimplementing backend logic in Python.
