# `torch/_inductor`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/_inductor` is the main FX-to-kernel backend used by `torch.compile`. It lowers FX graphs into an internal IR, applies fusion and scheduling decisions, and emits executable code for supported backends.

## Key Files

| File | Purpose |
|---|---|
| `torch/_inductor/compile_fx.py` | entrypoint from FX graphs to compiled output code |
| `torch/_inductor/lowering.py` | operator-to-IR lowering table and lowering helpers |
| `torch/_inductor/ir.py` | internal tensor/kernel IR used after lowering |
| `torch/_inductor/scheduler.py` | schedules and groups lowered IR for code generation |

## Public Interface

Important symbols include `compile_fx_inner`, `_compile_fx_inner`, `lowerings`, `user_lowerings`, `TensorBox`, `IRNode`, `Pointwise`, `Reduction`, and `OutputCode`. `compile_fx_inner` is the primary backend entrypoint for a `GraphModule` plus example inputs.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/fx](torch/fx/ADR.md) | depends-on | input program arrives as an FX `GraphModule` |
| [torch/_dynamo](torch/_dynamo/ADR.md) | used-by | Dynamo commonly selects Inductor as its backend |
| [torch/_functorch](torch/_functorch/ADR.md) | interacts-with | AOTAutograd can hand forward/backward graphs to Inductor |

## Runtime Behaviour

`compile_fx_inner` in `compile_fx.py` wraps compilation in config, debug, and timing contexts, then delegates to `_compile_fx_inner` after setting defaults such as `cudagraphs`, `static_input_idxs`, and `is_backward`. `_compile_fx_inner` clears cached compiled Triton kernels, handles no-op graphs specially, validates that the FX graph returns a tuple/list, and then proceeds with backend lowering and code emission. `lowering.py` maintains the lowering registry in the `lowerings` dict, imports the core IR types (`TensorBox`, `IRNode`, `Pointwise`, `Reduction`, `View`), and groups foreach lowering decisions by device and dynamic-shape status. The file-level imports show that Inductor lowering depends on decomposition tables, symbolic shape helpers, and virtualized ops state.

## Performance Profile

Compilation latency is a first-class concern here: `compile_fx.py` explicitly warms the autotune process pool, clears stale compiled-kernel futures per compile, and measures `compile_fx_inner` under `dynamo_timed`. The payoff is runtime performance from fusion and lowering: `lowering.py` rewrites many operator calls into pointwise/reduction IR that the scheduler and codegen can combine into fewer kernels. Inductor is also careful about special cases such as zero-op graphs and static inputs to avoid paying full backend cost when a compiled wrapper can simply reuse the FX `forward`. The trade-off is that aggressive lowering, decomposition, and autotuning can make cold-start compile cost substantial.

## Design Rationale

Inductor is separated from Dynamo because graph capture and kernel generation evolve at different speeds and have different performance constraints. A registry-based lowering layer keeps operator coverage extensible while still allowing specialized IR nodes for hot patterns like pointwise and reductions. The design assumes compile-time complexity is acceptable if it produces simpler, better-fused runtime kernels.
