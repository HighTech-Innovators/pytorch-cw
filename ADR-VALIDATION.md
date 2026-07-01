# ADR Validation Report

Run: 2
Date: 2026-07-01

## Results

| Check | Status | Notes |
|---|---|---|
| 1. Scope map current | FAIL | `src/adr-scope.md` does not exist; 17 depth-1 directories unclassified |
| 2. Files match COVERED | FAIL | No `adr-scope.md`; 14 ADR.md files present, 0 COVERED entries — count mismatch |
| 3. Exclusion justifications | FAIL | Cannot evaluate; `adr-scope.md` does not exist |
| 4. ADR content non-stub | FAIL | 16 broken dependency links across 7 ADR files (all other sub-checks PASS) |
| 5. Book cross-reference | FAIL | 21 book-named architectural units have no ADR and no COVERED ancestor in scope map |

## Overall: FAIL

## Check 1 Detail

`./src/adr-scope.md` does not exist. This file is required before any other check can proceed. It must classify every non-hidden directory in the repository as `COVERED`, `EXCLUDED`, or leave depth-2+ directories implicitly covered by an ancestor entry.

A helper script `src/adr/_tools/check_scope.py` has been written for reuse once `adr-scope.md` is created. Run it from the outer repository root: `python3 src/adr/_tools/check_scope.py`.

`find ./src -type d -not -path '*/.*' | sort` produced 1249 directories. The following 17 depth-1 directories must appear explicitly in `adr-scope.md` (no implicit rule applies at depth 1):

| Directory | Required explicit entry |
|---|---|
| adr | Yes |
| android | Yes |
| aten | Yes |
| benchmarks | Yes |
| binaries | Yes |
| c10 | Yes |
| caffe2 | Yes |
| cmake | Yes |
| docs | Yes |
| functorch | Yes |
| mypy_plugins | Yes |
| scripts | Yes |
| test | Yes |
| third_party | Yes |
| tools | Yes |
| torch | Yes |
| torchgen | Yes |

## Check 2 Detail

Double-nesting check: `find ./src/src -name 'ADR.md'` returned no results. No ADRs at wrong nesting depth.

No `adr-scope.md` exists, so COVERED entries cannot be defined or compared against actual ADR.md files. 14 ADR.md files are present (0 COVERED entries in scope map → count mismatch):

```
src/caffe2/serialize/ADR.md
src/functorch/ADR.md
src/tools/autograd/ADR.md
src/tools/setup_helpers/ADR.md
src/torch/_C/ADR.md
src/torch/_decomp/ADR.md
src/torch/_prims/ADR.md
src/torch/_refs/ADR.md
src/torch/ao/ADR.md
src/torch/cuda/ADR.md
src/torch/export/ADR.md
src/torch/jit/ADR.md
src/torch/onnx/ADR.md
src/torchgen/ADR.md
```

All 14 files are at the correct `./src/<dir>/ADR.md` depth (no `./src/<dir>/sub/ADR.md` misplacement).

## Check 3 Detail

`adr-scope.md` does not exist, so no directories are classified as EXCLUDED. Cannot evaluate exclusion justifications. This check is blocked by Check 1.

## Check 4 Detail

This pass significantly improved ADR content. Sub-checks 4a–4d, 4f–4g now PASS for all 14 files. Sub-check 4e (broken dependency links) FAILs.

### 4a — Title heading format (ALL 14 PASS)

All 14 ADRs now begin with the correct `# \`<src-relative-dir>\`` format. Verified first lines:

| ADR file | First line |
|---|---|
| `src/caffe2/serialize/ADR.md` | `` # `caffe2/serialize` `` |
| `src/functorch/ADR.md` | `` # `functorch` `` |
| `src/tools/autograd/ADR.md` | `` # `tools/autograd` `` |
| `src/tools/setup_helpers/ADR.md` | `` # `tools/setup_helpers` `` |
| `src/torch/ao/ADR.md` | `` # `torch/ao` `` |
| `src/torch/_C/ADR.md` | `` # `torch/_C` `` |
| `src/torch/cuda/ADR.md` | `` # `torch/cuda` `` |
| `src/torch/_decomp/ADR.md` | `` # `torch/_decomp` `` |
| `src/torch/export/ADR.md` | `` # `torch/export` `` |
| `src/torchgen/ADR.md` | `` # `torchgen` `` |
| `src/torch/jit/ADR.md` | `` # `torch/jit` `` |
| `src/torch/onnx/ADR.md` | `` # `torch/onnx` `` |
| `src/torch/_prims/ADR.md` | `` # `torch/_prims` `` |
| `src/torch/_refs/ADR.md` | `` # `torch/_refs` `` |

### 4b — Section index bullet list (ALL 14 PASS)

All 14 ADRs now have the required 7-item bare bullet list immediately after the title heading (Role, Key Files, Public Interface, Dependencies, Runtime Behaviour, Performance Profile, Design Rationale). PASS.

### 4c — Key Files section format (ALL 14 PASS)

All 14 ADRs now have `## Key Files` as a markdown table (`| File | Purpose |` header + separator + at least 1 real file-path data row). `## Key Files` appears exactly once in each file. PASS.

### 4d — Dependencies section format (ALL 14 PASS)

All 14 ADRs now have `## Dependencies` as a markdown table (`| Component | Direction | Nature |` header) with at least 1 data row. PASS.

### 4e — Relative path violations (PASS)

`grep -rn '\.\.' ./src --include='ADR.md'` returned no matches. No `../` relative paths in any ADR dependency link. PASS.

### 4f — Broken dependency link targets (FAIL — 16 broken links in 7 files)

`grep -rn '](.*ADR\.md)' ./src --include='ADR.md'` found 46 dependency links across 14 ADR files. 16 link targets do not exist at `./src/<link-path>`:

| Source file | Line | Link target | Status |
|---|---|---|---|
| `src/caffe2/serialize/ADR.md` | 35 | `c10/core/ADR.md` | BROKEN — file not yet written |
| `src/torch/cuda/ADR.md` | 36 | `c10/cuda/ADR.md` | BROKEN — file not yet written |
| `src/torch/cuda/ADR.md` | 37 | `c10/core/ADR.md` | BROKEN — file not yet written |
| `src/torch/cuda/ADR.md` | 38 | `torch/csrc/profiler/ADR.md` | BROKEN — file not yet written |
| `src/torch/_C/ADR.md` | 35 | `torch/csrc/ADR.md` | BROKEN — file not yet written |
| `src/torch/export/ADR.md` | 35 | `torch/_dynamo/ADR.md` | BROKEN — file not yet written |
| `src/torch/export/ADR.md` | 36 | `torch/fx/ADR.md` | BROKEN — file not yet written |
| `src/torch/jit/ADR.md` | 36 | `torch/csrc/jit/ADR.md` | BROKEN — file not yet written |
| `src/torch/ao/ADR.md` | 35 | `torch/fx/ADR.md` | BROKEN — file not yet written |
| `src/torchgen/ADR.md` | 35 | `aten/src/ATen/native/ADR.md` | BROKEN — file not yet written |
| `src/torchgen/ADR.md` | 36 | `torch/csrc/ADR.md` | BROKEN — file not yet written |
| `src/torchgen/ADR.md` | 37 | `aten/src/ATen/ADR.md` | BROKEN — file not yet written |
| `src/functorch/ADR.md` | 34 | `torch/_functorch/ADR.md` | BROKEN — file not yet written |
| `src/functorch/ADR.md` | 36 | `torch/fx/ADR.md` | BROKEN — file not yet written |
| `src/tools/autograd/ADR.md` | 35 | `aten/src/ATen/native/ADR.md` | BROKEN — file not yet written |
| `src/tools/autograd/ADR.md` | 37 | `torch/csrc/autograd/ADR.md` | BROKEN — file not yet written |

All 16 broken targets correspond to ADR files that must be written for Check 5 (the missing core subsystems). Once those ADRs are written, all 16 links will resolve.

### 4g — Runtime Behaviour and Performance Profile (ALL 14 PASS)

Every ADR's `## Runtime Behaviour` and `## Performance Profile` sections contain ≥ 2 sentences grounded in function names, file paths, and source-verified behavior. PASS for all 14.

### 4h — Source references (ALL 14 PASS)

Every ADR references at least one actual file, function, or type from the repository. PASS for all 14.

## Check 5 Detail

The following subsystems are named as distinct architectural units in the book (chapter-map, architecture-map, component-map under `./book/_generated/`) but have no corresponding `ADR.md` and no COVERED ancestor in `adr-scope.md` (which does not exist):

| Subsystem (from book) | Directory | Book chapter(s) | ADR status |
|---|---|---|---|
| TensorImpl / StorageImpl / Allocator | `c10/core` | Ch.03, Ch.08 | NO ADR |
| intrusive_ptr / utilities | `c10/util` | Ch.03 | NO ADR |
| CUDA caching allocator | `c10/cuda` | Ch.08 | NO ADR |
| TensorIterator / RecordFunction | `aten/src/ATen` | Ch.04, Ch.10 | NO ADR |
| Dispatcher / OperatorEntry / DispatchKeySet | `aten/src/ATen/core` | Ch.05 | NO ADR |
| Operator kernels / native_functions.yaml | `aten/src/ATen/native` | Ch.04 | NO ADR |
| Python bootstrap / Module.cpp | `torch/csrc` | Ch.02 | NO ADR |
| Autograd engine / Node / Variable | `torch/csrc/autograd` | Ch.06 | NO ADR |
| Python autograd API | `torch/autograd` | Ch.06 | NO ADR |
| nn.Module / nn.Parameter | `torch/nn` | Ch.07 | NO ADR |
| Optimizer / SGD | `torch/optim` | Ch.07 | NO ADR |
| TorchDynamo (frame-eval) | `torch/_dynamo` | Ch.09 | NO ADR |
| FX IR (Graph/Node/GraphModule) | `torch/fx` | Ch.09 | NO ADR |
| TorchInductor | `torch/_inductor` | Ch.09 | NO ADR |
| AOTAutograd / functional transforms | `torch/_functorch` | Ch.09 | NO ADR |
| torch.distributed (DDP/FSDP/c10d) | `torch/distributed` | Ch.12 | NO ADR |
| Profiler facade | `torch/profiler` | Ch.10 | NO ADR |
| Kineto profiler bindings | `torch/csrc/profiler` | Ch.10 | NO ADR |
| TorchScript compiler (C++) | `torch/csrc/jit` | named | NO ADR |
| c10d / RPC backends | `torch/csrc/distributed` | backlog | NO ADR |
| C++ Dynamo frame-eval hook | `torch/csrc/dynamo` | Ch.09 | NO ADR |

Subsystems with ADR files present (will be COVERED once `adr-scope.md` is written):

| Subsystem (from book) | Directory | ADR file |
|---|---|---|
| Operator code generator | `torchgen` | `src/torchgen/ADR.md` |
| torch.export | `torch/export` | `src/torch/export/ADR.md` |
| ONNX export bridge | `torch/onnx` | `src/torch/onnx/ADR.md` |
| TorchScript Python facade | `torch/jit` | `src/torch/jit/ADR.md` |
| Quantization surface | `torch/ao` | `src/torch/ao/ADR.md` |
| Primitive operator basis | `torch/_prims` | `src/torch/_prims/ADR.md` |
| Reference implementations | `torch/_refs` | `src/torch/_refs/ADR.md` |
| Decomposition registry | `torch/_decomp` | `src/torch/_decomp/ADR.md` |
| Compiled extension contract | `torch/_C` | `src/torch/_C/ADR.md` |
| CUDA Python surface | `torch/cuda` | `src/torch/cuda/ADR.md` |
| Legacy functorch shim | `functorch` | `src/functorch/ADR.md` |
| Serialization (caffe2) | `caffe2/serialize` | `src/caffe2/serialize/ADR.md` |
| Autograd codegen | `tools/autograd` | `src/tools/autograd/ADR.md` |
| Build orchestration helpers | `tools/setup_helpers` | `src/tools/setup_helpers/ADR.md` |

## Required Actions

**Check 1 — Create `src/adr-scope.md`:**
- Create `./src/adr-scope.md` classifying every non-hidden depth-1 directory and every architectural subdirectory. All 17 depth-1 directories listed in Check 1 Detail must appear explicitly (including `adr`, which holds validation tooling). Mark build/config/test/vendor directories as EXCLUDED with an acceptable reason; mark architectural directories as COVERED with the corresponding ADR path.

**Check 2 — ADR placement (after scope map exists):**
- Once `adr-scope.md` is created with COVERED entries for the 14 existing ADR directories, Check 2 will pass for those entries. All 14 current ADRs are confirmed at correct `./src/<dir>/ADR.md` depth.

**Check 3 — Exclusion justifications (after scope map exists):**
- Ensure every EXCLUDED entry in `adr-scope.md` uses one of the seven acceptable reasons: `Auto-generated code`, `Build/config only`, `Vendored/third-party`, `Test data only`, `Test suite`, `Empty or stub`, `Leaf with no architectural boundary`.
- Verify that no EXCLUDED directory is named as a distinct architectural unit in any chapter file under `./book/`.

**Check 4 — Fix 16 broken dependency links (once missing ADRs are written):**
- Broken link in `src/caffe2/serialize/ADR.md` line 35: `c10/core/ADR.md` will resolve once `src/c10/core/ADR.md` is written
- Broken link in `src/torch/cuda/ADR.md` line 36: `c10/cuda/ADR.md` will resolve once `src/c10/cuda/ADR.md` is written
- Broken link in `src/torch/cuda/ADR.md` line 37: `c10/core/ADR.md` will resolve once `src/c10/core/ADR.md` is written
- Broken link in `src/torch/cuda/ADR.md` line 38: `torch/csrc/profiler/ADR.md` will resolve once `src/torch/csrc/profiler/ADR.md` is written
- Broken link in `src/torch/_C/ADR.md` line 35: `torch/csrc/ADR.md` will resolve once `src/torch/csrc/ADR.md` is written
- Broken link in `src/torch/export/ADR.md` line 35: `torch/_dynamo/ADR.md` will resolve once `src/torch/_dynamo/ADR.md` is written
- Broken link in `src/torch/export/ADR.md` line 36: `torch/fx/ADR.md` will resolve once `src/torch/fx/ADR.md` is written
- Broken link in `src/torch/jit/ADR.md` line 36: `torch/csrc/jit/ADR.md` will resolve once `src/torch/csrc/jit/ADR.md` is written
- Broken link in `src/torch/ao/ADR.md` line 35: `torch/fx/ADR.md` will resolve once `src/torch/fx/ADR.md` is written
- Broken link in `src/torchgen/ADR.md` line 35: `aten/src/ATen/native/ADR.md` will resolve once `src/aten/src/ATen/native/ADR.md` is written
- Broken link in `src/torchgen/ADR.md` line 36: `torch/csrc/ADR.md` will resolve once `src/torch/csrc/ADR.md` is written
- Broken link in `src/torchgen/ADR.md` line 37: `aten/src/ATen/ADR.md` will resolve once `src/aten/src/ATen/ADR.md` is written
- Broken link in `src/functorch/ADR.md` line 34: `torch/_functorch/ADR.md` will resolve once `src/torch/_functorch/ADR.md` is written
- Broken link in `src/functorch/ADR.md` line 36: `torch/fx/ADR.md` will resolve once `src/torch/fx/ADR.md` is written
- Broken link in `src/tools/autograd/ADR.md` line 35: `aten/src/ATen/native/ADR.md` will resolve once `src/aten/src/ATen/native/ADR.md` is written
- Broken link in `src/tools/autograd/ADR.md` line 37: `torch/csrc/autograd/ADR.md` will resolve once `src/torch/csrc/autograd/ADR.md` is written

**Check 5 — Write ADRs for all 21 book-named subsystems without coverage:**
- Write `src/c10/core/ADR.md` covering TensorImpl, StorageImpl, Allocator interface, CPUAllocator (Ch.03, Ch.08 — Runtime Critical, State Owner)
- Write `src/c10/util/ADR.md` covering intrusive_ptr, SmallVector, error utilities (Ch.03)
- Write `src/c10/cuda/ADR.md` covering CUDACachingAllocator, CUDA streams (Ch.08 — Performance Sensitive; CPU-only build: source-verified structure only)
- Write `src/aten/src/ATen/ADR.md` covering TensorIterator, RecordFunction, and the ATen public header surface (Ch.04, Ch.10 — Runtime Critical)
- Write `src/aten/src/ATen/core/ADR.md` covering Dispatcher, OperatorEntry, DispatchKeySet, boxing (Ch.05 — Runtime Critical, Coordination Heavy)
- Write `src/aten/src/ATen/native/ADR.md` covering operator kernel registration, native_functions.yaml, structured kernels (Ch.04 — Runtime Critical)
- Write `src/torch/csrc/ADR.md` covering Python bootstrap (Module.cpp, initModule, stub.c), Python/C++ bridge lifecycle (Ch.02 — Runtime Critical, Lifecycle Root)
- Write `src/torch/csrc/autograd/ADR.md` covering the autograd engine (GraphTask, ReadyQueue, Node, Variable, AccumulateGrad, engine.cpp) (Ch.06 — Runtime Critical, Concurrency Sensitive)
- Write `src/torch/autograd/ADR.md` covering the Python autograd API (backward, grad, grad_fn, Function) (Ch.06 — Runtime Critical)
- Write `src/torch/nn/ADR.md` covering nn.Module, nn.Parameter, functional, and module state lifecycle (Ch.07 — State Owner, Coordination Heavy)
- Write `src/torch/optim/ADR.md` covering Optimizer, SGD, param_groups, state dict, and optimizer step (Ch.07 — State Owner)
- Write `src/torch/_dynamo/ADR.md` covering TorchDynamo graph capture, eval_frame.py, guard mechanism, bytecode transformation (Ch.09 — Coordination Heavy)
- Write `src/torch/fx/ADR.md` covering FX IR (Graph, Node, GraphModule), symbolic tracing, and Interpreter (Ch.09 — Coordination Heavy)
- Write `src/torch/_inductor/ADR.md` covering TorchInductor backend, compile_fx.py, lowering and codegen pipeline (Ch.09 — Performance Sensitive)
- Write `src/torch/_functorch/ADR.md` covering AOTAutograd, functional transforms (vmap, grad, jvp), and functorch-to-torch migration (Ch.09)
- Write `src/torch/distributed/ADR.md` covering DDP, FSDP, collectives, and torchrun entrypoint (Ch.12 — Coordination Heavy)
- Write `src/torch/profiler/ADR.md` covering the profiler facade, kineto integration, and EmissionsTracker hooks (Ch.10 — Operationally Sensitive)
- Write `src/torch/csrc/profiler/ADR.md` covering Kineto C++ bindings and profiler event recording (Ch.10)
- Write `src/torch/csrc/jit/ADR.md` covering the TorchScript compiler, IR, passes, and execution (named — legacy)
- Write `src/torch/csrc/distributed/ADR.md` covering c10d/rpc C++ backends (backlog)
- Write `src/torch/csrc/dynamo/ADR.md` covering the C++ frame-eval hook for TorchDynamo (Ch.09)
- Update `adr-scope.md` to include all newly created ADR directories as COVERED entries.
