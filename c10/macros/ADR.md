# `c10/macros`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`c10/macros` is the compatibility shim for PyTorch's native macro layer. It re-exports the newer `torch/headeronly/macros` implementation under long-lived `c10` include paths so core libraries and downstream extensions can keep using stable symbol-visibility, portability, and compiler-hint macros.

## Key Files

| File | Purpose |
|---|---|
| `c10/macros/Export.h` | shim include for the shared export and import macro definitions |
| `c10/macros/Macros.h` | shim include for the consolidated portability and utility macro set |
| `c10/macros/cmake_macros.h` | compatibility include for the generated build-macro header |

## Public Interface

This directory exposes macros rather than callable functions. The key interface includes `C10_API`, `C10_EXPORT`, `C10_IMPORT`, `TORCH_API`, build-configuration gates such as `C10_BUILD_SHARED_LIBS`, and portability helpers such as `C10_DISABLE_COPY_AND_ASSIGN`, `C10_NODISCARD`, `C10_UNUSED`, and the branch-prediction and alignment macros re-exported through `Macros.h`.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [c10](c10/ADR.md) | used-by | the core runtime and all native dependents include these macros for symbol policy |
| [torch](torch/ADR.md) | depends-on | the shim redirects to `torch/headeronly/macros`, which now owns the concrete definitions |

## Runtime Behaviour

`c10/macros/Export.h` and `c10/macros/Macros.h` are intentionally thin: each file simply includes the corresponding `torch/headeronly/macros` header so legacy include paths keep working. `c10/macros/cmake_macros.h` likewise exists for backwards compatibility and forwards callers to the generated header-only location. That means the runtime behavior is entirely compile-time configuration and symbol annotation, not executable logic.

## Performance Profile

These macros do not add direct runtime work, but they strongly affect generated code and linkage. Export and import annotations control symbol visibility, while compiler-hint macros influence inlining, branch prediction, and diagnostic behavior across the native stack. Keeping the shim thin avoids duplicating macro logic and prevents divergence between old `c10` includes and the newer header-only implementation.

## Design Rationale

PyTorch preserved `c10/macros` as a covered directory because a large amount of native code still includes these headers directly. Re-exporting the header-only implementation lets the project migrate macro ownership without breaking existing include paths or forcing every dependent subtree to change at once.
