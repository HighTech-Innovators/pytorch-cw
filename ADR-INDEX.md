# ADR Index

44 Architecture Decision Records · generated 2026-07-01

Each `ADR.md` describes the role, key files, public interface, dependencies,
design rationale, constraints, and observability of one directory.

---

| # | Path | Role |
|---:|---|---|
| 1 | [aten/ADR.md](aten/ADR.md) | `aten` is the top-level container for the ATen native tensor library, its legacy TH and THC support code, and the CMake machinery that assembles backend-specific builds. |
| 2 | [aten/src/ADR.md](aten/src/ADR.md) | `aten/src` is the source root under `aten` that gathers the modern `ATen` implementation together with legacy CUDA compatibility headers. |
| 3 | [aten/src/ATen/ADR.md](aten/src/ATen/ADR.md) | `aten/src/ATen` is the public C++ tensor/operator layer for ATen and the home of shared runtime helpers that operator kernels reuse. |
| 4 | [aten/src/ATen/core/ADR.md](aten/src/ATen/core/ADR.md) | `aten/src/ATen/core` owns dynamic operator dispatch, schema registration, and boxed/unboxed calling conventions. |
| 5 | [aten/src/ATen/native/ADR.md](aten/src/ATen/native/ADR.md) | `aten/src/ATen/native` is the source-of-truth directory for most ATen operator definitions and kernel implementations. |
| 6 | [c10/ADR.md](c10/ADR.md) | `c10` is PyTorch's lowest-level shared runtime library. |
| 7 | [c10/core/ADR.md](c10/core/ADR.md) | `c10/core` owns the low-level tensor object model and allocator contracts that higher layers build on. |
| 8 | [c10/cuda/ADR.md](c10/cuda/ADR.md) | `c10/cuda` defines the CUDA-specific memory and stream abstractions that the higher-level CUDA stack uses. |
| 9 | [c10/macros/ADR.md](c10/macros/ADR.md) | `c10/macros` is the compatibility shim for PyTorch's native macro layer. |
| 10 | [c10/util/ADR.md](c10/util/ADR.md) | `c10/util` provides the small, reusable runtime utilities that make the rest of PyTorch's C++ stack practical to implement. |
| 11 | [c10/xpu/ADR.md](c10/xpu/ADR.md) | `c10/xpu` is the Intel GPU and SYCL-specific extension of the `c10` runtime model. |
| 12 | [caffe2/ADR.md](caffe2/ADR.md) | `caffe2` is the legacy backend subtree that PyTorch still carries for compatibility and selected active functionality. |
| 13 | [caffe2/serialize/ADR.md](caffe2/serialize/ADR.md) | `caffe2/serialize` owns the container-level read/write path for PyTorch archives such as saved modules and checkpoints. |
| 14 | [functorch/ADR.md](functorch/ADR.md) | `functorch` is the compatibility and discovery layer for composable function transforms such as `vmap`, `grad`, and `jvp`. |
| 15 | [tools/ADR.md](tools/ADR.md) | `tools` is the build-time and developer-utility namespace for PyTorch. |
| 16 | [tools/autograd/ADR.md](tools/autograd/ADR.md) | `tools/autograd` is the build-time generator for PyTorch's autograd wrapper code. |
| 17 | [tools/setup_helpers/ADR.md](tools/setup_helpers/ADR.md) | `tools/setup_helpers` is the Python support layer for building PyTorch from source. |
| 18 | [torch/_C/ADR.md](torch/_C/ADR.md) | `torch/_C` is the Python-visible boundary of PyTorch's compiled runtime. |
| 19 | [torch/_decomp/ADR.md](torch/_decomp/ADR.md) | `torch._decomp` is the central Python registry for lowering complex operators into simpler ones. |
| 20 | [torch/_dynamo/ADR.md](torch/_dynamo/ADR.md) | `torch/_dynamo` is the Python control plane for `torch.compile`. |
| 21 | [torch/_functorch/ADR.md](torch/_functorch/ADR.md) | `torch/_functorch` implements function transforms such as `vmap`, `grad`, and functionalization, and it houses AOTAutograd's graph-capture pipeline. |
| 22 | [torch/_inductor/ADR.md](torch/_inductor/ADR.md) | `torch/_inductor` is the main FX-to-kernel backend used by `torch.compile`. |
| 23 | [torch/_prims/ADR.md](torch/_prims/ADR.md) | `torch._prims` defines a lower-level operator basis for PyTorch's compiler- and reference-oriented subsystems. |
| 24 | [torch/_refs/ADR.md](torch/_refs/ADR.md) | `torch._refs` is the Python reference layer that expresses existing PyTorch operations in a form that is easier to inspect, decompose, and reuse. |
| 25 | [torch/_subclasses/ADR.md](torch/_subclasses/ADR.md) | `torch/_subclasses` houses tensor subclass machinery used for compiler-facing interpretation rather than ordinary eager execution. |
| 26 | [torch/ADR.md](torch/ADR.md) | `torch` is the main Python package namespace for PyTorch. |
| 27 | [torch/ao/ADR.md](torch/ao/ADR.md) | `torch.ao` is the namespace where PyTorch groups post-training quantization, quantization-aware training, and related graph rewrites. |
| 28 | [torch/autograd/ADR.md](torch/autograd/ADR.md) | `torch/autograd` is the Python-facing automatic differentiation API. |
| 29 | [torch/csrc/ADR.md](torch/csrc/ADR.md) | `torch/csrc` is the root of PyTorch's hand-written C++ extension module for Python. |
| 30 | [torch/csrc/autograd/ADR.md](torch/csrc/autograd/ADR.md) | `torch/csrc/autograd` implements PyTorch's core reverse-mode autodiff engine and the native tensor gradient graph model. |
| 31 | [torch/csrc/distributed/ADR.md](torch/csrc/distributed/ADR.md) | `torch/csrc/distributed` contains the C++ bindings and backend implementations for c10d collectives, RPC agents, and DTensor placement objects. |
| 32 | [torch/csrc/dynamo/ADR.md](torch/csrc/dynamo/ADR.md) | `torch/csrc/dynamo` implements the performance-critical C++ runtime for TorchDynamo's frame-evaluation, cache lookup, and guard execution. |
| 33 | [torch/csrc/jit/ADR.md](torch/csrc/jit/ADR.md) | `torch/csrc/jit` contains the C++ TorchScript compiler, IR, optimization passes, and execution runtime. |
| 34 | [torch/csrc/profiler/ADR.md](torch/csrc/profiler/ADR.md) | `torch/csrc/profiler` implements native event collection, Kineto integration, and the Python bindings behind `torch.profiler`. |
| 35 | [torch/cuda/ADR.md](torch/cuda/ADR.md) | `torch.cuda` is the public Python namespace for CUDA runtime services. |
| 36 | [torch/distributed/ADR.md](torch/distributed/ADR.md) | `torch/distributed` is the Python-facing package for process-group setup, collectives, distributed training wrappers, and launcher tooling. |
| 37 | [torch/export/ADR.md](torch/export/ADR.md) | `torch.export` is PyTorch's stable AOT capture contract for downstream compilers and exporters. |
| 38 | [torch/fx/ADR.md](torch/fx/ADR.md) | `torch/fx` provides PyTorch's Python-level graph IR, symbolic tracer, generated `GraphModule` wrapper, and interpreter utilities. |
| 39 | [torch/jit/ADR.md](torch/jit/ADR.md) | `torch.jit` is the public Python entrypoint for TorchScript scripting, tracing, serialization, and graph freezing. |
| 40 | [torch/nn/ADR.md](torch/nn/ADR.md) | `torch/nn` defines the stateful module abstraction used to build models and the parameter objects that participate in optimization. |
| 41 | [torch/onnx/ADR.md](torch/onnx/ADR.md) | `torch.onnx` owns PyTorch's model-to-ONNX translation surface. |
| 42 | [torch/optim/ADR.md](torch/optim/ADR.md) | `torch/optim` manages parameter-group bookkeeping, optimizer state serialization, and concrete update algorithms such as SGD. |
| 43 | [torch/profiler/ADR.md](torch/profiler/ADR.md) | `torch/profiler` is the Python facade for PyTorch profiling, scheduling, trace export, and memory timeline analysis. |
| 44 | [torchgen/ADR.md](torchgen/ADR.md) | `torchgen` is the code-generation engine behind PyTorch's operator surface. |
