# `torch/_dynamo`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/_dynamo` is the Python control plane for `torch.compile`. It installs frame-evaluation hooks, builds and evaluates guards, manages graph capture boundaries, and connects traced Python frames to FX graphs and backend compilers.

## Key Files

| File | Purpose |
|---|---|
| `torch/_dynamo/eval_frame.py` | runtime entrypoint for frame-eval control, `torch.compile` wrapping, and export helpers |
| `torch/_dynamo/guards.py` | Python-side guard construction, provenance tracking, and guard-debug utilities |
| `torch/_dynamo/convert_frame.py` | compile-time frame conversion pipeline invoked from eval-frame hooks |

## Public Interface

Important symbols include `OptimizedModule`, `optimize`, `export`, `set_guard_error_hook`, `set_eval_frame`, `set_code_exec_strategy`, and the guard-related types imported in `guards.py` such as `Guard`, `GuardSource`, `RootGuardManager`, and `GuardManager`. The file-local `_set_stance` and `DynamoStance` logic in `eval_frame.py` also shape public compiler behavior exposed through `torch.compile` configuration.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/csrc/dynamo](torch/csrc/dynamo/ADR.md) | depends-on | C++ frame-eval and guard runtime execute the hot-path cache checks |
| [torch/fx](torch/fx/ADR.md) | depends-on | successful capture lowers Python frames into FX graphs |
| [torch/_inductor](torch/_inductor/ADR.md) | feeds | compiled graphs are commonly handed to Inductor backends |
| [torch/_functorch](torch/_functorch/ADR.md) | interacts-with | AOTAutograd and Dynamo cooperate during compiled training |

## Runtime Behaviour

`eval_frame.py` imports `set_eval_frame`, `set_guard_error_hook`, `reset_code`, and related functions from `torch._C._dynamo.eval_frame`, and its module docstring states that these functions run on the hot runtime path rather than compile-only code. `OptimizedModule` wraps modules for `torch.compile`, while `optimize(...)` and `export(...)` create the contexts that determine how frames will be intercepted and converted. `guards.py` builds the Python-side description of runtime assumptions, importing C++ guard accessors such as `GuardManager`, `RootGuardManager`, `DictGuardManager`, `install_symbolic_shape_guard`, and tensor property helpers from `torch._C._dynamo.guards`. The same file tracks `GuardSource`, local/global provenance, and recompilation diagnostics so guard failures can be explained and narrowed.

## Performance Profile

The top-level comment in `eval_frame.py` explicitly says these functions are hot and performance-critical because they modify the eval-frame handler at runtime, which is why compile-only work is pushed into `convert_frame.py`. Guard reuse is the main steady-state performance win: if the C++ guard managers accept a frame, Dynamo can skip retracing and hand control directly to cached compiled code. The main costs are guard generation, cache misses, and recompiles; `guards.py` carries dedicated loggers for `guards`, `recompiles`, and `verbose_guards` because over-specialization can easily dominate runtime. Features like stance changes, graph-break handling, and export support add flexibility, but each extra runtime decision point sits on the critical path until a stable cache entry exists.

## Design Rationale

Dynamo keeps policy and graph-capture orchestration in Python because tracing decisions depend on Python bytecode semantics, user-facing errors, and backend coordination. The hot cache and guard checks move to C++, but Python still owns the provenance model (`Source`, `GuardSource`) so recompiles remain explainable. The split between `eval_frame.py`, `guards.py`, and compile-only modules reflects the core design goal: make the steady-state path small while keeping tracing behavior debuggable and configurable.
