# ADR Validation Report

Run: 1
Date: 2026-07-01

## Results

| Check | Status | Notes |
|---|---|---|
| 1. Scope map current | FAIL | `src/adr-scope.md` does not exist |
| 2. Files match COVERED | FAIL | No `adr-scope.md`; 14 ADR.md files found with no scope to validate against |
| 3. Exclusion justifications | FAIL | No `adr-scope.md`; cannot verify any exclusion reasons |
| 4. ADR content non-stub | FAIL | All 14 ADR.md files fail title format, section index, Key Files format, and Dependencies format (see detail below) |
| 5. Book cross-reference | FAIL | 21 book-named architectural units have no ADR and no COVERED ancestor in scope map |

## Overall: FAIL

## Check 1 Detail

`./src/adr-scope.md` does not exist. This file is required before any other check can proceed. It must classify every non-hidden directory in the repository as `COVERED`, `EXCLUDED`, or leave depth-2+ directories implicitly covered by an ancestor entry.

A helper script `src/adr/_tools/check_scope.py` has been written for reuse once `adr-scope.md` is created. Run it from the outer repository root: `python3 src/adr/_tools/check_scope.py`.

Depth-1 directories in `src/` that must appear explicitly in `adr-scope.md` (no implicit rule applies at depth 1):

| Directory | Required explicit entry |
|---|---|
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

No `adr-scope.md` exists, so COVERED entries cannot be defined or compared against actual ADR.md files. Once `adr-scope.md` is created, the following 14 ADR.md files are present:

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

No double-nesting issues: `find ./src/src -name 'ADR.md'` returned no results.

## Check 3 Detail

No `adr-scope.md` exists, so there are no EXCLUDED entries to validate.

## Check 4 Detail

All 14 ADR.md files fail the following content checks:

### 4a — Title heading format (ALL 14 FAIL)

Every ADR must begin with `# \`<src-relative-dir>\``. All 14 files instead use a descriptive prose title (`# ADR: <description>`).

| ADR directory | Actual first line |
|---|---|
| `caffe2/serialize` | `# ADR: caffe2/serialize archive format and IO layer` |
| `functorch` | `# ADR: functorch transform compatibility layer` |
| `tools/autograd` | `# ADR: tools/autograd gradient code generation` |
| `tools/setup_helpers` | `# ADR: tools/setup_helpers build orchestration helpers` |
| `torch/ao` | `# ADR: torch/ao quantization and optimization surface` |
| `torch/_C` | `# ADR: torch/_C compiled extension contract` |
| `torch/cuda` | `# ADR: torch/cuda runtime surface` |
| `torch/_decomp` | `# ADR: torch/_decomp decomposition registry` |
| `torch/export` | `# ADR: torch/export AOT graph contract` |
| `torchgen` | `# ADR: torchgen operator code generation` |
| `torch/jit` | `# ADR: torch/jit TorchScript facade` |
| `torch/onnx` | `# ADR: torch/onnx export bridge` |
| `torch/_prims` | `# ADR: torch/_prims primitive operator basis` |
| `torch/_refs` | `# ADR: torch/_refs Python reference implementations` |

### 4b — Section index bullet list missing (ALL 14 FAIL)

Immediately after the title heading, each ADR must have a bare bullet list (no heading) linking to all 7 content sections: Role, Key Files, Public Interface, Dependencies, Runtime Behaviour, Performance Profile, Design Rationale. All 14 ADRs have a front-matter metadata block (Status, Date, Scope, Decision, etc.) instead of a section-link index. None have the required 7-item bullet list.

### 4c — Key Files section is bullet-list form (ALL 14 FAIL)

The `## Key Files` section must be a markdown table. All 14 ADRs render Key Files as a bullet list (lines beginning with `-`). Examples:

- `src/caffe2/serialize/ADR.md`: `- [\`src/caffe2/serialize/inline_container.h\`](...) - archive format contract...`
- `src/torch/ao/ADR.md`: `- [\`src/torch/ao/quantization/__init__.py\`](...) - public API assembly...`
- (pattern identical across all 14 files)

### 4d — Dependencies section is prose, not a table (ALL 14 FAIL)

The `## Dependencies` section must be a table with at least 1 row, or an explicit statement that there are no notable dependencies. All 14 ADRs have the Dependencies section as a prose paragraph of sentences. No dependency table or "no notable dependencies" statement is present in any ADR.

### 4e — No ADR cross-links found (INFORMATIONAL)

`grep -rn '](.*ADR\.md)' ./src --include='ADR.md'` returned no matches. No dependency links between ADR files are present in any ADR, meaning the Dependencies sections reference directories or file paths but never link to another `ADR.md`. This is not a FAIL under the explicit check rules, but it is inconsistent with the intent that ADRs form a cross-referenced architecture graph.

### 4f — Runtime Behaviour and Performance Profile (PASS for all 14)

Every ADR's `## Runtime Behaviour` section contains ≥ 2 sentences grounded in function names, file paths, and source-verified behavior. Every `## Performance Profile` section also contains ≥ 2 sentences addressing allocation, synchronization, data movement, or explicit statements about overhead tradeoffs. No FAIL on these sub-checks.

### 4g — Source references (PASS for all 14)

Every ADR references at least one actual file, function, or type from the repository (e.g., `src/caffe2/serialize/inline_container.h`, `PyTorchStreamReader`, `src/torch/ao/quantization/__init__.py`). No FAIL on this sub-check.

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

Subsystems with ADR files present (COVERED once `adr-scope.md` is written):

| Subsystem (from book) | Directory | ADR |
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
- Create `./src/adr-scope.md` classifying every non-hidden depth-1 directory and every architectural subdirectory. All 16 depth-1 directories listed in Check 1 Detail must appear explicitly. Mark build/config/test/vendor directories as EXCLUDED with an acceptable reason; mark architectural directories as COVERED with the corresponding ADR path.

**Check 2 — ADR placement (after scope map exists):**
- Once `adr-scope.md` is created with COVERED entries for the 14 existing ADR directories, Check 2 will pass for those entries provided the file paths are correct (all confirmed at `./src/<dir>/ADR.md`). No current ADRs are at the wrong nesting depth.

**Check 3 — Exclusion justifications (after scope map exists):**
- Ensure every EXCLUDED entry in `adr-scope.md` uses one of the seven acceptable reasons: `Auto-generated code`, `Build/config only`, `Vendored/third-party`, `Test data only`, `Test suite`, `Empty or stub`, `Leaf with no architectural boundary`.
- Verify that no EXCLUDED directory is named as a distinct architectural unit in any chapter file under `./book/`.

**Check 4 — Fix all 14 ADR.md files:**
- Fix title heading in all 14 ADRs: replace `# ADR: <description>` with `# \`<dir>\`` (backtick-delimited src-relative path). Examples:
  - `src/caffe2/serialize/ADR.md` line 1: replace with `# \`caffe2/serialize\``
  - `src/functorch/ADR.md` line 1: replace with `# \`functorch\``
  - `src/tools/autograd/ADR.md` line 1: replace with `# \`tools/autograd\``
  - `src/tools/setup_helpers/ADR.md` line 1: replace with `# \`tools/setup_helpers\``
  - `src/torch/ao/ADR.md` line 1: replace with `# \`torch/ao\``
  - `src/torch/_C/ADR.md` line 1: replace with `# \`torch/_C\``
  - `src/torch/cuda/ADR.md` line 1: replace with `# \`torch/cuda\``
  - `src/torch/_decomp/ADR.md` line 1: replace with `# \`torch/_decomp\``
  - `src/torch/export/ADR.md` line 1: replace with `# \`torch/export\``
  - `src/torchgen/ADR.md` line 1: replace with `# \`torchgen\``
  - `src/torch/jit/ADR.md` line 1: replace with `# \`torch/jit\``
  - `src/torch/onnx/ADR.md` line 1: replace with `# \`torch/onnx\``
  - `src/torch/_prims/ADR.md` line 1: replace with `# \`torch/_prims\``
  - `src/torch/_refs/ADR.md` line 1: replace with `# \`torch/_refs\``
- Add section index bullet list immediately after the title heading in all 14 ADRs. The list must contain exactly these 7 links (no heading before the list):
  ```
  - [Role](#role)
  - [Key Files](#key-files)
  - [Public Interface](#public-interface)
  - [Dependencies](#dependencies)
  - [Runtime Behaviour](#runtime-behaviour)
  - [Performance Profile](#performance-profile)
  - [Design Rationale](#design-rationale)
  ```
- Convert `## Key Files` sections from bullet lists to markdown tables in all 14 ADRs. The table must have at minimum a header row (`| File | Purpose |`), a separator, and at least 1 data row with a real file path.
- Convert `## Dependencies` sections from prose paragraphs to markdown tables in all 14 ADRs. Table format: `| Dependency | Relationship |`. If there are no notable dependencies, replace the prose with the explicit statement: `No notable dependencies.`

**Check 5 — Write ADRs for all book-named subsystems without coverage:**
- Write `src/c10/core/ADR.md` covering TensorImpl, StorageImpl, Allocator interface, CPUAllocator (Ch.03, Ch.08 — Runtime Critical, State Owner)
- Write `src/c10/util/ADR.md` covering intrusive_ptr, SmallVector, error utilities (Ch.03)
- Write `src/c10/cuda/ADR.md` covering CUDACachingAllocator, CUDA streams (Ch.08 — Performance Sensitive; source-verified only under CPU-only constraint)
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
