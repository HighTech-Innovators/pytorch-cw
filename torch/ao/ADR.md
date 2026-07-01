# `torch/ao`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`torch.ao` is the namespace where PyTorch groups post-training quantization, quantization-aware training, and related graph rewrites. `src/torch/ao/quantization/__init__.py` publishes a broad surface of observers, fake-quant modules, qconfig helpers, eager APIs, FX APIs, and TorchScript APIs so callers can use one conceptual stack across multiple execution frontends.

## Key Files


| File | Purpose |
|---|---|
| `src/torch/ao/quantization/__init__.py` | public API assembly for quantization |
| `src/torch/ao/quantization/quantize_fx.py` | FX graph-mode tracing, fusion, and prepare/convert flow |
| `src/torch/ao/quantization/quantize_jit.py` | TorchScript quantization passes |
| `src/torch/ao/quantization/qconfig.py` | observer and fake-quant configuration model |
| `src/torch/ao/quantization/fake_quantize.py` | fake-quant modules for training-time simulation |

## Public Interface

The namespace exposes `QConfig`, `QConfigMapping`, observer classes, fake-quant classes, eager helpers such as `prepare` and `convert`, FX helpers such as `fuse_fx` and `prepare_fx`, and TorchScript helpers such as `prepare_jit` and `convert_jit`. That mix makes `torch.ao` less like a single algorithm and more like a family of frontends that all share qconfig-driven quantization metadata.

## Dependencies


| Component | Direction | Nature |
|---|---|---|
| [torch/fx](torch/fx/ADR.md) | depends-on | FX graph capture used by `quantize_fx.py` |
| [torch/jit](torch/jit/ADR.md) | depends-on | TorchScript quantization passes |
| [torch/_C](torch/_C/ADR.md) | depends-on | compiled JIT quantization passes |
| `torch/ao/nn` / `torch/ao/quantization/backend_config` | contains | quantized modules and backend configs |

## Runtime Behaviour

`src/torch/ao/quantization/quantize_fx.py` traces modules into `GraphModule`, swaps `FloatFunctional` helpers where needed, fuses supported patterns, and then inserts observers according to the provided `QConfigMapping`. `src/torch/ao/quantization/quantize_jit.py` takes a different path: it requires `torch.jit.ScriptModule`, scripts observer instances, runs `_jit_pass_insert_observers`, then finalizes quant/dequant insertion through native JIT passes. The JIT conversion path also forces models to CPU unless all parameters live on XPU, which makes backend limitations explicit instead of implicit.

## Performance Profile

Observer insertion, fake-quant simulation, and calibration all add overhead during preparation or training, so this directory intentionally pays extra work before deployment. The payoff comes from fusion and quantized operator replacement, which reduce memory bandwidth and arithmetic cost in inference-heavy workloads. The FX path also benefits from graph-level rewriting, while the JIT path can fold conv-bn patterns before inserting quantization points.

## Design Rationale

This directory mirrors the repository's multi-front-end reality from Chapters 04, 06, and 09. Quantization has to attach to eager modules, FX graphs, and scripted graphs, so PyTorch centralizes the shared observer and qconfig semantics in one namespace while letting each frontend use the rewriting tools that fit its IR.
