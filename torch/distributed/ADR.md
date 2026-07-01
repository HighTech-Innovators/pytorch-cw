# `torch/distributed`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/distributed` is the Python-facing package for process-group setup, collectives, distributed training wrappers, and launcher tooling. It re-exports C++ c10d/RPC backends while also providing Python orchestration such as `torchrun`, DDP, and FSDP entrypoints.

## Key Files

| File | Purpose |
|---|---|
| `torch/distributed/__init__.py` | package bootstrap, availability checks, and public re-exports |
| `torch/distributed/distributed_c10d.py` | process-group and collective APIs built on `_distributed_c10d` bindings |
| `torch/distributed/run.py` | implementation of the `torchrun` launcher module |
| `torch/nn/parallel/distributed.py` | defines `DistributedDataParallel` |
| `torch/distributed/fsdp/fully_sharded_data_parallel.py` | defines `FullyShardedDataParallel` |

## Public Interface

Primary symbols include `init_process_group`, `destroy_process_group`, `new_group`, `all_reduce`, `all_gather`, `barrier`, `get_rank`, `get_world_size`, `torch.distributed.breakpoint`, `torchrun`, `DistributedDataParallel`, and `FullyShardedDataParallel`. The package also re-exports C++ types such as `ProcessGroup`, `Store`, `PrefixStore`, `TCPStore`, `ReduceOp`, and `Work`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/csrc/distributed](torch/csrc/distributed/ADR.md) | depends-on | core c10d, RPC, and DTensor placement backends come from C++ bindings |
| [torch/optim](torch/optim/ADR.md) | interacts-with | DDP and FSDP coordinate gradient synchronization around optimizer steps |
| [torch/profiler](torch/profiler/ADR.md) | interacts-with | collective and training execution can be profiled through the profiler facade |

## Runtime Behaviour

`torch/distributed/__init__.py` first checks `is_available()` and then calls `torch._C._c10d_init()` before exposing the rest of the package, so the Python API is gated on native backend initialization. It then re-exports the bulk of `distributed_c10d.py`, where functions such as `init_process_group` and `all_reduce` drive `ProcessGroup`, `Store`, and collective options objects from `_distributed_c10d`. The same package also exposes debugging helpers like `torch.distributed.breakpoint`, which temporarily adjusts dispatch state and then calls `barrier()` so non-debug ranks wait correctly. `run.py` implements `torchrun` as `python -m torch.distributed.run`, parses node/worker topology, and documents the `LOCAL_RANK`, `RANK`, and rendezvous environment contract expected by launched workers.

## Performance Profile

Collectives are synchronization points, so APIs like `all_reduce` and `barrier` are inherently sensitive to network latency, topology, and backend choice. DDP and FSDP exist to move that cost to better places: DDP overlaps reduction work with backward execution through its reducer, while FSDP trades more communication and resharding for lower per-rank parameter memory. The launcher layer in `run.py` is not hot during training, but its process-per-device model determines whether the runtime can fully exploit available GPUs, CPUs, or other accelerators. Even the package bootstrap has performance implications because availability checks avoid importing large distributed machinery on builds where `_c10d` is absent.

## Design Rationale

`torch/distributed` is a thin Python umbrella over multiple native subsystems because users need one namespace for collectives, launch, RPC, and sharding even though the implementations live in different backend libraries. Keeping `distributed_c10d.py` as the main public API layer preserves Python ergonomics and documentation while the performance-critical communication paths stay in C++. The split also makes it possible to expose launcher and debugging utilities that are not part of the native backend itself.
