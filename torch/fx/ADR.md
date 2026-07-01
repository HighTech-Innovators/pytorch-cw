# `torch/fx`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch/fx` provides PyTorch's Python-level graph IR, symbolic tracer, generated `GraphModule` wrapper, and interpreter utilities. It is the intermediate representation that many compiler and transformation subsystems consume after Python program capture.

## Key Files

| File | Purpose |
|---|---|
| `torch/fx/graph.py` | defines `Graph`, namespace management, and Python code generation support |
| `torch/fx/node.py` | defines `Node`, argument/target modeling, and side-effect tracking |
| `torch/fx/graph_module.py` | defines `GraphModule` and source-backed generated `forward` code |
| `torch/fx/_symbolic_trace.py` | defines `Tracer` and `symbolic_trace` |
| `torch/fx/interpreter.py` | defines `Interpreter` for node-by-node execution |

## Public Interface

Key symbols include `Graph`, `Node`, `GraphModule`, `Tracer`, `symbolic_trace`, `Interpreter`, `Transformer`, `map_arg`, and `has_side_effect`. `Graph` and `Node` are the IR data model, while `symbolic_trace` and `GraphModule` are the entrypoints most other PyTorch subsystems call.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [torch/nn](torch/nn/ADR.md) | depends-on | traced graphs are commonly built from `nn.Module` programs |
| [torch/_dynamo](torch/_dynamo/ADR.md) | used-by | Dynamo lowers Python frame capture to FX graphs |
| [torch/_inductor](torch/_inductor/ADR.md) | used-by | Inductor compiles FX `GraphModule` objects |
| [torch/export](torch/export/ADR.md) | used-by | export flows consume FX graphs and graph modules |

## Runtime Behaviour

`symbolic_trace` in `_symbolic_trace.py` drives a `Tracer` that records Python operations into a `Graph` of `Node` objects rather than executing them eagerly. `graph.py` manages unique naming, legal op kinds, and Python source generation through `PythonCode`, while `graph_module.py` materializes the traced graph by compiling generated source in `_exec_with_source` and installing the resulting `forward` function on a `GraphModule`. `Interpreter.run()` in `interpreter.py` executes nodes in program order, calling `run_node()` dispatch helpers and optionally `graph.process_inputs` / `graph.process_outputs` around the run. `node.py` also keeps an explicit set of side-effectful operations that dead-code elimination must preserve.

## Performance Profile

FX is primarily a transformation IR, so its biggest costs are trace-time Python overhead and graph-to-code materialization rather than steady-state tensor math. `Interpreter` reduces memory retention by tracking last uses and deleting values from `env` after the final consumer when `garbage_collect_values=True`. `GraphModule` sorts its generated import block for deterministic source, which helps downstream caching even though source regeneration itself is not free. `Node` side-effect tracking prevents incorrect elimination, but conservative effect marking can keep extra work alive in transformed graphs.

## Design Rationale

FX keeps the IR in pure Python so graph transformations are easy to write, inspect, and serialize alongside ordinary model code. Separating `Graph`, `Node`, `GraphModule`, and `Interpreter` lets users transform structure, regenerate Python, or interpret graphs without coupling those concerns. This flexibility is why FX became the common interchange format for Dynamo, export, quantization, and compiler backends.
