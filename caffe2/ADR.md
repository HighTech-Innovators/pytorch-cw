# `caffe2`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`caffe2` is the legacy backend subtree that PyTorch still carries for compatibility and selected active functionality. Its most architecturally active responsibilities in this checkout are model and checkpoint serialization, legacy core configuration types, and a bank of low-level performance kernels.

## Key Files

| File | Purpose |
|---|---|
| `caffe2/CMakeLists.txt` | integrates Caffe2 with code generation, Vulkan options, threading policy, and the ATen build |
| `caffe2/serialize/inline_container.h` | defines the zip-based `PyTorchStreamReader` and `PyTorchStreamWriter` archive contract |
| `caffe2/core/common.h` | exposes shared build options and the common macro environment for legacy Caffe2 code |
| `caffe2/perfkernels/common.h` | representative low-level header for the retained perf-kernel subtree |

## Public Interface

The most important public surface is `PyTorchStreamReader` and `PyTorchStreamWriter` from `caffe2/serialize`, which still back PyTorch archive I/O. `caffe2/core/common.h` also exposes `caffe2::GetBuildOptions()`, and the parent build file sets the `ATEN_THREADING` policy that the mixed Caffe2 plus ATen native build uses. The rest of the subtree is mostly compatibility-oriented, with legacy core and perfkernel code preserved under the Caffe2 namespace.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [caffe2/serialize](caffe2/serialize/ADR.md) | depends-on | the still-active archive format and reader/writer logic lives there |
| [c10/core](c10/core/ADR.md) | depends-on | allocator, backend, and macro primitives support serialization and core utilities |
| [torch](torch/ADR.md) | used-by | `torch.save` and `torch.load` ultimately rely on the inline container machinery |

## Runtime Behaviour

`caffe2/CMakeLists.txt` pulls in code-generation helpers, conditionally enables Vulkan codegen, selects `ATEN_THREADING` as either `OMP` or `NATIVE`, and adds the `aten` subtree as part of the native build. `caffe2/serialize/inline_container.h` defines a constrained zip layout with version records, tensor payloads, and optional code files, while `caffe2/core/common.h` exposes build options and the shared macro environment used by legacy components. The parent directory therefore still acts as the compatibility shell that ties legacy namespaces, serialization, and retained performance kernels into the main build.

## Performance Profile

The archive format in `caffe2/serialize` is tuned for fast tensor loading: files are written uncompressed, aligned to 64-byte boundaries, and stored in ZIP64 form so readers can support mmap-friendly access patterns. `caffe2/perfkernels` retains SIMD-oriented kernels, which shows that this subtree still carries performance-sensitive native code even if much of the broader Caffe2 framework is no longer the main execution model. The top-level threading selection in `caffe2/CMakeLists.txt` also directly influences the native parallel backend used by the mixed build.

## Design Rationale

PyTorch keeps `caffe2` as a covered architectural boundary because it is not just dead baggage: serialization and some native kernels remain active, while legacy core surfaces are still compiled for compatibility. Documenting the parent directory separately explains why the namespace still exists even though many detailed execution paths now live in ATen and `torch`.
