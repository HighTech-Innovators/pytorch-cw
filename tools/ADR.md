# `tools`

- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)

## Role

`tools` is the build-time and developer-utility namespace for PyTorch. It hosts Python modules and scripts for code generation, build orchestration, version-file generation, analysis tooling, packaging helpers, and other tasks that shape native and Python artifacts without being part of the runtime `torch` package.

## Key Files

| File | Purpose |
|---|---|
| `tools/README.md` | explains the directory's role as both a script collection and a Python module hierarchy |
| `tools/build_pytorch_libs.py` | top-level script for building PyTorch's native libraries |
| `tools/build_libtorch.py` | build entrypoint for the standalone libtorch distribution |
| `tools/generate_torch_version.py` | helper for generating version metadata during builds |

## Public Interface

The interface here is internal and script-oriented. Important entrypoints include the Python module hierarchy rooted at `tools/__init__.py`, the build scripts `build_pytorch_libs.py` and `build_libtorch.py`, and covered child modules such as `tools.autograd` and `tools.setup_helpers` that higher-level build entrypoints import.

## Dependencies

| Component | Direction | Nature |
|---|---|---|
| [tools/autograd](tools/autograd/ADR.md) | depends-on | autograd wrapper generation is one of the primary codegen responsibilities under this namespace |
| [tools/setup_helpers](tools/setup_helpers/ADR.md) | depends-on | source builds rely on helper code for CMake and environment coordination |
| [torchgen](torchgen/ADR.md) | interacts-with | multiple build scripts and generators invoke the shared operator codegen stack |

## Runtime Behaviour

`tools/README.md` states that the directory doubles as a Python module hierarchy, which lets build scripts share helpers without modifying `PYTHONPATH` ad hoc. The same README calls out `tools/autograd` for autograd code generation, `tools/setup_helpers` for dependency discovery and CMake orchestration, and standalone scripts like `build_pytorch_libs.py` for assembling native libraries. In practice this directory runs during source builds, packaging flows, and developer maintenance tasks rather than during model execution.

## Performance Profile

The performance impact of `tools` is paid in build and developer iteration time, not in tensor execution. Centralizing codegen and build helpers reduces duplicated work, and descendants like `tools/setup_helpers` deliberately prefer faster generators and cache reuse to shorten rebuild cycles. That build-time investment keeps runtime packages leaner because generated and configured artifacts are prepared before import or execution.

## Design Rationale

PyTorch keeps `tools` outside the runtime `torch` package so build policy, generators, and developer utilities can evolve independently of the public Python API. The parent directory is a real architectural boundary because it gathers several covered subsystems and a broad script surface that the rest of the repository depends on during development and release engineering.
