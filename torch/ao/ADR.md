# ADR: torch/ao quantization and optimization surface

- Status: Draft
- Date: 2026-07-01
- Scope: `src/torch/ao`
- Decision: Consolidate quantization-oriented observers, fake-quant modules, and graph-rewrite frontends under `torch.ao`, while supporting eager, FX, and TorchScript workflows.
- Primary entrypoints: `prepare`, `convert`, `quantize`, `fuse_modules`, `prepare_jit`, `convert_jit`, `fuse_fx`, `prepare_fx`
- Evidence: `src/torch/ao/quantization/__init__.py`, `src/torch/ao/quantization/quantize_fx.py`, `src/torch/ao/quantization/quantize_jit.py`, `src/torch/ao/quantization/qconfig.py`
- Caveats: Some JIT conversion flows explicitly move models to CPU because quantized operator coverage is backend-limited.

## Role

`torch.ao` is the namespace where PyTorch groups post-training quantization, quantization-aware training, and related graph rewrites. `src/torch/ao/quantization/__init__.py` publishes a broad surface of observers, fake-quant modules, qconfig helpers, eager APIs, FX APIs, and TorchScript APIs so callers can use one conceptual stack across multiple execution frontends.

## Key Files

- [`src/torch/ao/quantization/__init__.py`](src/torch/ao/quantization/__init__.py) - public API assembly for quantization.
- [`src/torch/ao/quantization/quantize_fx.py`](src/torch/ao/quantization/quantize_fx.py) - FX graph-mode tracing, fusion, and prepare/convert flow.
- [`src/torch/ao/quantization/quantize_jit.py`](src/torch/ao/quantization/quantize_jit.py) - TorchScript quantization passes.
- [`src/torch/ao/quantization/qconfig.py`](src/torch/ao/quantization/qconfig.py) - observer and fake-quant configuration model.
- [`src/torch/ao/quantization/fake_quantize.py`](src/torch/ao/quantization/fake_quantize.py) - fake-quant modules for training-time simulation.

## Public Interface

The namespace exposes `QConfig`, `QConfigMapping`, observer classes, fake-quant classes, eager helpers such as `prepare` and `convert`, FX helpers such as `fuse_fx` and `prepare_fx`, and TorchScript helpers such as `prepare_jit` and `convert_jit`. That mix makes `torch.ao` less like a single algorithm and more like a family of frontends that all share qconfig-driven quantization metadata.

## Dependencies

FX quantization depends on [`src/torch/fx`](src/torch/fx) graph capture and graph modules, which `src/torch/ao/quantization/quantize_fx.py` uses directly. TorchScript quantization depends on [`src/torch/jit`](src/torch/jit) and compiled JIT passes surfaced through [`src/torch/_C/__init__.pyi.in`](src/torch/_C/__init__.pyi.in). The namespace also leans on quantized module definitions under [`src/torch/ao/nn`](src/torch/ao/nn) and backend-specific configurations under [`src/torch/ao/quantization/backend_config`](src/torch/ao/quantization/backend_config).

## Runtime Behaviour

`src/torch/ao/quantization/quantize_fx.py` traces modules into `GraphModule`, swaps `FloatFunctional` helpers where needed, fuses supported patterns, and then inserts observers according to the provided `QConfigMapping`. `src/torch/ao/quantization/quantize_jit.py` takes a different path: it requires `torch.jit.ScriptModule`, scripts observer instances, runs `_jit_pass_insert_observers`, then finalizes quant/dequant insertion through native JIT passes. The JIT conversion path also forces models to CPU unless all parameters live on XPU, which makes backend limitations explicit instead of implicit.

## Performance Profile

Observer insertion, fake-quant simulation, and calibration all add overhead during preparation or training, so this directory intentionally pays extra work before deployment. The payoff comes from fusion and quantized operator replacement, which reduce memory bandwidth and arithmetic cost in inference-heavy workloads. The FX path also benefits from graph-level rewriting, while the JIT path can fold conv-bn patterns before inserting quantization points.

## Design Rationale

This directory mirrors the repository's multi-front-end reality from Chapters 04, 06, and 09. Quantization has to attach to eager modules, FX graphs, and scripted graphs, so PyTorch centralizes the shared observer and qconfig semantics in one namespace while letting each frontend use the rewriting tools that fit its IR.
