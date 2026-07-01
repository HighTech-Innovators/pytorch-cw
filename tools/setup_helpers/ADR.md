# ADR: tools/setup_helpers build orchestration helpers

- Status: Draft
- Date: 2026-07-01
- Scope: `src/tools/setup_helpers`
- Decision: Keep Python build orchestration logic in reusable helpers that select tools, manage cache invalidation, and generate native build inputs for `pip install -e .` flows.
- Primary entrypoints: `CMake`, environment flag helpers, code-generation helpers, version-header generation
- Evidence: `src/tools/setup_helpers/cmake.py`, `src/tools/setup_helpers/env.py`, `src/tools/setup_helpers/generate_code.py`, `src/tools/setup_helpers/gen_version_header.py`
- Caveats: The build policy in this repository requires these helpers to be reached through editable pip install rather than ad hoc setup commands.

## Role

`tools/setup_helpers` is the Python support layer for building PyTorch from source. `src/tools/setup_helpers/cmake.py` owns generator selection and cache management, `src/tools/setup_helpers/env.py` centralizes interpreted build flags and platform facts, and the other helper modules generate build-time artifacts such as version headers or codegen inputs.

## Key Files

- [`src/tools/setup_helpers/cmake.py`](src/tools/setup_helpers/cmake.py) - CMake discovery, cache handling, and generation.
- [`src/tools/setup_helpers/env.py`](src/tools/setup_helpers/env.py) - environment-derived build settings.
- [`src/tools/setup_helpers/generate_code.py`](src/tools/setup_helpers/generate_code.py) - code-generation orchestration helpers.
- [`src/tools/setup_helpers/gen_version_header.py`](src/tools/setup_helpers/gen_version_header.py) - generated version-header support.
- [`src/tools/setup_helpers/cmake_utils.py`](src/tools/setup_helpers/cmake_utils.py) - cache parsing and CMake value helpers.

## Public Interface

The directory exposes helper classes and functions for build scripts rather than end-user runtime code. The most important surface is the `CMake` class in `src/tools/setup_helpers/cmake.py`, which provides version discovery, argument assembly, cache inspection, and project generation semantics that higher-level build entrypoints call.

## Dependencies

`cmake.py` depends directly on [`src/tools/setup_helpers/env.py`](src/tools/setup_helpers/env.py) for `BUILD_DIR`, platform flags, and negative-env parsing. The directory also works with [`src/torchgen`](src/torchgen) and [`src/tools/autograd`](src/tools/autograd) because native build generation must schedule those codegen steps before C++ compilation. At the project level it is coupled to [`src/setup.py`](src/setup.py) and CMake definitions under [`src/CMakeLists.txt`](src/CMakeLists.txt).

## Runtime Behaviour

During a source build, `src/tools/setup_helpers/cmake.py` chooses `cmake` or `cmake3` based on version, prefers Ninja unless the environment disables it, and prints the exact command it runs. The same file also detects stale build caches, such as a missing `CMAKE_MAKE_PROGRAM` or a changed Python interpreter, and clears or prunes cache entries before regenerating the project. That behavior keeps the build logic robust even when the surrounding Python environment changes between invocations.

## Performance Profile

This directory strongly influences build iteration speed. Preferring Ninja, skipping unnecessary reruns when `CMakeCache.txt` and `build.ninja` are still valid, and pruning only Python-related cache entries after interpreter changes all reduce rebuild latency. The helpers do not affect model runtime directly, but they materially affect how quickly maintainers can regenerate code and native binaries.

## Design Rationale

Chapter 01 describes PyTorch as a code-generation-plus-CMake build, and this directory is the Python half of that orchestration. Centralizing tool selection, cache invalidation, and artifact generation avoids scattering fragile build policy across ad hoc scripts and keeps the editable pip build path maintainable.
