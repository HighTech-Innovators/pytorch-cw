# `torch/optim`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/optim` manages parameter-group bookkeeping, optimizer state serialization, and concrete update algorithms such as SGD. It is the layer that turns model parameters and gradients into in-place parameter updates across eager and compiled execution paths.

## Key Files

| File | Purpose |
|---|---|
| `torch/optim/optimizer.py` | defines the `Optimizer` base class, hooks, serialization, and param-group logic |
| `torch/optim/sgd.py` | implements `SGD`, its `step()` method, and the functional `sgd(...)` update helper |

## Public Interface

Core symbols include `Optimizer`, `Optimizer.state_dict`, `Optimizer.load_state_dict`, `Optimizer.zero_grad`, `Optimizer.add_param_group`, `register_optimizer_step_pre_hook`, `register_optimizer_step_post_hook`, `SGD`, `SGD.step`, and the functional helper `sgd`. The base class also exposes per-instance `param_groups`, `state`, and `defaults`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/nn](torch/nn/ADR.md) | depends-on | optimizers consume `Parameter` objects and module state |
| [torch/autograd](torch/autograd/ADR.md) | depends-on | updates read `.grad` tensors populated by backward |
| [torch/_dynamo](torch/_dynamo/ADR.md) | interacts-with | differentiable optimizer paths and graph breaks account for compilation |

## Runtime Behaviour

`Optimizer.__init__` in `optimizer.py` normalizes the input parameter iterable into `param_groups` and a `state` map keyed by tensors, while `add_param_group`, `state_dict`, and `load_state_dict` maintain that structure across dynamic model changes and checkpoint restore. `zero_grad` clears accumulated gradients according to the `set_to_none` policy. In `sgd.py`, `SGD._init_group` collects the parameters, gradients, and momentum buffers that will participate in one step, and `SGD.step()` then calls the functional `sgd(...)` helper with group hyperparameters such as `lr`, `momentum`, `weight_decay`, and `nesterov`. When momentum is enabled, the method writes updated `momentum_buffer` tensors back into `self.state[p]` after the functional update returns.

## Performance Profile

`optimizer.py` explicitly chooses between single-tensor, foreach, and fused implementations through `_default_to_fused_or_foreach`, which means update throughput depends heavily on device type, dtype, and whether the caller requested differentiable mode. The `_use_grad_for_differentiable` wrapper introduces deliberate `torch._dynamo.graph_break()` calls around differentiable optimizer steps so compiled training does not pay for hidden functionalization epilogues that would allocate extra tensors. `SGD.step()` batches parameters by group and reuses pre-collected lists, which reduces Python overhead compared with per-parameter dispatch, but state-dict serialization and large param-group scans are still linear in model size.

## Design Rationale

The base `Optimizer` centralizes state and param-group handling so algorithm implementations can focus on math instead of serialization and hook plumbing. Keeping algorithms like SGD as subclasses plus functional helpers allows both object-oriented training loops and lower-level distributed/compiler integrations to reuse the same update rules. The code is also explicit about when compilation-friendly fast paths are unavailable, which helps preserve correctness across eager, script, and compiled execution modes.
