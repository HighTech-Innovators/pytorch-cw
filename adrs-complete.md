# ADR Coverage Complete

Gate passed: 2026-07-01
Validator: work/2-validate-adrs.md

## Coverage Table

| Directory | Status | ADR path | Exclusion reason |
|---|---|---|---|
| ./adr | EXCLUDED | — | Build/config only |
| ./android | EXCLUDED | — | Build/config only |
| ./aten | COVERED | ./aten/ADR.md | |
| ./aten/src | COVERED | ./aten/src/ADR.md | |
| ./aten/src/ATen | COVERED | ./aten/src/ATen/ADR.md | |
| ./aten/src/ATen/core | COVERED | ./aten/src/ATen/core/ADR.md | |
| ./aten/src/ATen/native | COVERED | ./aten/src/ATen/native/ADR.md | |
| ./benchmarks | EXCLUDED | — | Test suite |
| ./binaries | EXCLUDED | — | Test suite |
| ./c10 | COVERED | ./c10/ADR.md | |
| ./c10/core | COVERED | ./c10/core/ADR.md | |
| ./c10/cuda | COVERED | ./c10/cuda/ADR.md | |
| ./c10/macros | COVERED | ./c10/macros/ADR.md | |
| ./c10/util | COVERED | ./c10/util/ADR.md | |
| ./c10/xpu | COVERED | ./c10/xpu/ADR.md | |
| ./caffe2 | COVERED | ./caffe2/ADR.md | |
| ./caffe2/serialize | COVERED | ./caffe2/serialize/ADR.md | |
| ./cmake | EXCLUDED | — | Build/config only |
| ./docs | EXCLUDED | — | Leaf with no architectural boundary |
| ./functorch | COVERED | ./functorch/ADR.md | |
| ./mypy_plugins | EXCLUDED | — | Build/config only |
| ./scripts | EXCLUDED | — | Build/config only |
| ./test | EXCLUDED | — | Test suite |
| ./third_party | EXCLUDED | — | Vendored/third-party |
| ./tools | COVERED | ./tools/ADR.md | |
| ./tools/autograd | COVERED | ./tools/autograd/ADR.md | |
| ./tools/setup_helpers | COVERED | ./tools/setup_helpers/ADR.md | |
| ./torch | COVERED | ./torch/ADR.md | |
| ./torch/_C | COVERED | ./torch/_C/ADR.md | |
| ./torch/_decomp | COVERED | ./torch/_decomp/ADR.md | |
| ./torch/_dynamo | COVERED | ./torch/_dynamo/ADR.md | |
| ./torch/_functorch | COVERED | ./torch/_functorch/ADR.md | |
| ./torch/_inductor | COVERED | ./torch/_inductor/ADR.md | |
| ./torch/_prims | COVERED | ./torch/_prims/ADR.md | |
| ./torch/_refs | COVERED | ./torch/_refs/ADR.md | |
| ./torch/_subclasses | COVERED | ./torch/_subclasses/ADR.md | |
| ./torch/ao | COVERED | ./torch/ao/ADR.md | |
| ./torch/autograd | COVERED | ./torch/autograd/ADR.md | |
| ./torch/csrc | COVERED | ./torch/csrc/ADR.md | |
| ./torch/csrc/autograd | COVERED | ./torch/csrc/autograd/ADR.md | |
| ./torch/csrc/distributed | COVERED | ./torch/csrc/distributed/ADR.md | |
| ./torch/csrc/dynamo | COVERED | ./torch/csrc/dynamo/ADR.md | |
| ./torch/csrc/jit | COVERED | ./torch/csrc/jit/ADR.md | |
| ./torch/csrc/profiler | COVERED | ./torch/csrc/profiler/ADR.md | |
| ./torch/cuda | COVERED | ./torch/cuda/ADR.md | |
| ./torch/distributed | COVERED | ./torch/distributed/ADR.md | |
| ./torch/export | COVERED | ./torch/export/ADR.md | |
| ./torch/fx | COVERED | ./torch/fx/ADR.md | |
| ./torch/jit | COVERED | ./torch/jit/ADR.md | |
| ./torch/nn | COVERED | ./torch/nn/ADR.md | |
| ./torch/onnx | COVERED | ./torch/onnx/ADR.md | |
| ./torch/optim | COVERED | ./torch/optim/ADR.md | |
| ./torch/profiler | COVERED | ./torch/profiler/ADR.md | |
| ./torchgen | COVERED | ./torchgen/ADR.md | |

## Book Subsystem Cross-reference

| Subsystem (from book) | Directory | Status |
|---|---|---|
| TensorImpl / StorageImpl | ./c10/core | COVERED |
| intrusive_ptr | ./c10/util | COVERED |
| native_functions.yaml + torchgen | ./aten/src/ATen/native, ./torchgen | COVERED |
| TensorIterator | ./aten/src/ATen | COVERED |
| Dispatcher / OperatorEntry | ./aten/src/ATen/core | COVERED |
| DispatchKeySet | ./c10/core | COVERED |
| Autograd engine | ./torch/csrc/autograd | COVERED |
| nn.Module / nn.Parameter | ./torch/nn | COVERED |
| Optimizer / SGD | ./torch/optim | COVERED |
| Allocator interface | ./c10/core | COVERED |
| CUDACachingAllocator | ./c10/cuda | COVERED |
| Python bootstrap / Module.cpp | ./torch/csrc | COVERED |
| torchrun / distributed.run | ./torch/distributed | COVERED |
| RecordFunction / Kineto profiler | ./aten/src/ATen, ./torch/profiler | COVERED |
| TorchDynamo | ./torch/_dynamo | COVERED |
| FX IR | ./torch/fx | COVERED |
| TorchInductor | ./torch/_inductor | COVERED |
| torch.distributed (DDP/FSDP/c10d) | ./torch/distributed, ./torch/csrc/distributed | COVERED |
| TorchScript / JIT | ./torch/csrc/jit, ./torch/jit | COVERED |
| torch.export | ./torch/export | COVERED |
| torch.ao (quantization/sparsity) | ./torch/ao | COVERED |
| torch._functorch / AOTAutograd | ./torch/_functorch | COVERED |
| torch._subclasses / FakeTensor | ./torch/_subclasses | COVERED |
| torch._prims / _refs / _decomp | ./torch/_prims, ./torch/_refs, ./torch/_decomp | COVERED |
| torch/_C type stubs | ./torch/_C | COVERED |
| torch/csrc/inductor (AOTI runtime) | ./torch/csrc (COVERED ancestor) | COVERED (implicit) |
| caffe2/serialize | ./caffe2/serialize | COVERED |
| tools/autograd (derivatives.yaml) | ./tools/autograd | COVERED |
| tools/setup_helpers | ./tools/setup_helpers | COVERED |
| functorch (legacy shim) | ./functorch | COVERED |
| c10/xpu (Intel GPU) | ./c10/xpu | COVERED |
| c10/macros | ./c10/macros | COVERED |

## Known Partial Coverage

None.
