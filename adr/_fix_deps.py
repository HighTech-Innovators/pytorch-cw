import re
H="| Component | Direction | Nature |\n|---|---|---|\n"
def t(rows): return H+"\n".join(f"| {a} | {b} | {c} |" for a,b,c in rows)

deps={
"caffe2/serialize/ADR.md":[
 ("[c10/core](c10/core/ADR.md)","depends-on","record allocation via `Allocator.h`/`CPUAllocator.h`"),
 ("`caffe2/serialize/versions.h`","depends-on","supported file-format version bounds"),
 ("`miniz` (bundled)","depends-on","zip archive read/write codec"),
 ("[torch/jit](torch/jit/ADR.md)","used-by","module and package deserialization consumer"),
],
"functorch/ADR.md":[
 ("[torch/_functorch](torch/_functorch/ADR.md)","depends-on","actual transform implementations re-exported here"),
 ("[torch/_C](torch/_C/ADR.md)","depends-on","compiled transform hooks (`_functorch.pyi`)"),
 ("[torch/fx](torch/fx/ADR.md)","depends-on","`make_fx` symbolic tracing"),
 ("[torch/export](torch/export/ADR.md)","intersects","transform-plus-export tracing overlap"),
],
"tools/autograd/ADR.md":[
 ("[aten/src/ATen/native](aten/src/ATen/native/ADR.md)","depends-on","`native_functions.yaml` and `tags.yaml` schemas"),
 ("[torchgen](torchgen/ADR.md)","depends-on","typed schema parsing helpers"),
 ("[torch/csrc/autograd](torch/csrc/autograd/ADR.md)","feeds","generated `Variable`/`engine` bindings consumed there"),
],
"tools/setup_helpers/ADR.md":[
 ("`tools/setup_helpers/env.py`","depends-on","`BUILD_DIR`, platform flags, negative-env parsing"),
 ("[torchgen](torchgen/ADR.md)","coordinates","schedules operator codegen before C++ compilation"),
 ("[tools/autograd](tools/autograd/ADR.md)","coordinates","schedules autograd codegen step"),
 ("`setup.py` / `CMakeLists.txt`","depends-on","project-level build definitions"),
],
"torch/ao/ADR.md":[
 ("[torch/fx](torch/fx/ADR.md)","depends-on","FX graph capture used by `quantize_fx.py`"),
 ("[torch/jit](torch/jit/ADR.md)","depends-on","TorchScript quantization passes"),
 ("[torch/_C](torch/_C/ADR.md)","depends-on","compiled JIT quantization passes"),
 ("`torch/ao/nn` / `torch/ao/quantization/backend_config`","contains","quantized modules and backend configs"),
],
"torch/_C/ADR.md":[
 ("[torch/csrc](torch/csrc/ADR.md)","depends-on","compiled definitions (`Module.cpp`, `Device.cpp`, `Stream.cpp`)"),
 ("[torch/cuda](torch/cuda/ADR.md)","used-by","Python package consuming the extension contract"),
 ("[torch/jit](torch/jit/ADR.md)","used-by","Python package consuming compiled JIT types"),
 ("[torchgen](torchgen/ADR.md)","depends-on","codegen output conventions for the stub"),
],
"torch/cuda/ADR.md":[
 ("[torch/_C](torch/_C/ADR.md)","depends-on","`Stream`, `Event`, generator types"),
 ("[c10/cuda](c10/cuda/ADR.md)","depends-on","native caching allocator wrapper"),
 ("[c10/core](c10/core/ADR.md)","depends-on","device and allocator abstractions"),
 ("[torch/csrc/profiler](torch/csrc/profiler/ADR.md)","depends-on","CUDA profiler hooks"),
],
"torch/_decomp/ADR.md":[
 ("[torch/_C](torch/_C/ADR.md)","depends-on","dispatcher/operator metadata and `torch._ops`"),
 ("[torch/_prims](torch/_prims/ADR.md)","depends-on","primitive building blocks for decomposition bodies"),
 ("[torch/_refs](torch/_refs/ADR.md)","depends-on","reference implementations"),
 ("[torch/export](torch/export/ADR.md)","used-by","export decomposition consumer"),
],
"torch/export/ADR.md":[
 ("[torch/_dynamo](torch/_dynamo/ADR.md)","depends-on","graph capture through `eval_frame.py`"),
 ("[torch/fx](torch/fx/ADR.md)","depends-on","FX `Graph` produced by capture"),
 ("[torch/_decomp](torch/_decomp/ADR.md)","depends-on","decomposition tables"),
 ("[torch/_C](torch/_C/ADR.md)","depends-on","dispatch keys and operator metadata"),
],
"torchgen/ADR.md":[
 ("[aten/src/ATen/native](aten/src/ATen/native/ADR.md)","depends-on","`native_functions.yaml` and `tags.yaml`"),
 ("[torch/csrc](torch/csrc/ADR.md)","feeds","generated Python/C++ bindings"),
 ("[aten/src/ATen](aten/src/ATen/ADR.md)","feeds","generated ATen operator code"),
 ("[tools/autograd](tools/autograd/ADR.md)","used-by","autograd codegen caller"),
],
"torch/jit/ADR.md":[
 ("[torch/_C](torch/_C/ADR.md)","depends-on","compiled JIT types"),
 ("[torch/csrc/jit](torch/csrc/jit/ADR.md)","depends-on","C++ TorchScript compiler implementation"),
 ("[torch/onnx](torch/onnx/ADR.md)","used-by","tracing path used by ONNX export"),
],
"torch/onnx/ADR.md":[
 ("[torch/_C](torch/_C/ADR.md)","depends-on","`_onnx.pyi` enums (`TrainingMode`, `OperatorExportTypes`)"),
 ("[torch/export](torch/export/ADR.md)","depends-on","preferred graph source"),
 ("[torch/jit](torch/jit/ADR.md)","depends-on","legacy trace graph source"),
 ("`torch/onnx/_internal`","contains","symbolic translation internals"),
],
"torch/_prims/ADR.md":[
 ("`torch/_prims_common`","depends-on","dtype, shape, and wrapper utilities"),
 ("[torch/_C](torch/_C/ADR.md)","depends-on","dispatch-key concepts and library registration"),
 ("[torch/_refs](torch/_refs/ADR.md)","feeds","reference implementations built on prims"),
 ("[torch/_decomp](torch/_decomp/ADR.md)","feeds","decomposition registry"),
],
"torch/_refs/ADR.md":[
 ("[torch/_prims](torch/_prims/ADR.md)","depends-on","primitive operator building blocks"),
 ("`torch/_prims_common`","depends-on","dtype and wrapper logic"),
 ("[torch/_decomp](torch/_decomp/ADR.md)","used-by","decomposition consumer"),
 ("[torch/export](torch/export/ADR.md)","used-by","export consumer"),
],
}

for rel,rows in deps.items():
    txt=open(rel).read()
    m=re.search(r"^## Dependencies\s*$", txt, re.M)
    start=m.end()
    nh=re.search(r"^## ", txt[start:], re.M)
    end=start+nh.start() if nh else len(txt)
    new=txt[:start]+"\n\n"+t(rows)+"\n\n"+txt[end:]
    open(rel,"w").write(new)
    print("deps table:",rel)
