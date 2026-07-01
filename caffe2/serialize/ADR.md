# ADR: caffe2/serialize archive format and IO layer

- Status: Draft
- Date: 2026-07-01
- Scope: `src/caffe2/serialize`
- Decision: Keep checkpoint and package serialization on a zip-based container with explicit versioning, alignment, and random-access readers.
- Primary entrypoints: `PyTorchStreamReader`, `PyTorchStreamWriter`, `ChunkRecordIterator`, `ReadAdapterInterface`, `FileAdapter`, `IStreamAdapter`
- Evidence: `src/caffe2/serialize/inline_container.h`, `src/caffe2/serialize/inline_container.cc`, `src/caffe2/serialize/file_adapter.h`, `src/caffe2/serialize/read_adapter_interface.h`
- Caveats: The directory is C++ infrastructure, so the ADR documents file-format and IO behavior rather than Python call patterns.

## Role

`caffe2/serialize` owns the container-level read/write path for PyTorch archives such as saved modules and checkpoints. `src/caffe2/serialize/inline_container.h` defines `PyTorchStreamReader` and `PyTorchStreamWriter` around a constrained zip layout, and `src/caffe2/serialize/inline_container.cc` implements version checks, archive discovery, record lookup, and chunked reading.

## Key Files

- [`src/caffe2/serialize/inline_container.h`](src/caffe2/serialize/inline_container.h) - archive format contract and reader/writer declarations.
- [`src/caffe2/serialize/inline_container.cc`](src/caffe2/serialize/inline_container.cc) - reader initialization, validation, and offset logic.
- [`src/caffe2/serialize/file_adapter.h`](src/caffe2/serialize/file_adapter.h) - file-backed read adapter.
- [`src/caffe2/serialize/read_adapter_interface.h`](src/caffe2/serialize/read_adapter_interface.h) - abstract reader contract.
- [`src/caffe2/serialize/istream_adapter.h`](src/caffe2/serialize/istream_adapter.h) - stream-backed read adapter.

## Public Interface

The directory exposes C++ reader and writer classes rather than Python functions. `PyTorchStreamReader` offers `getRecord`, `getRecordSize`, `getRecordOffset`, `getAllRecords`, and chunk-reader helpers, while `PyTorchStreamWriter` handles aligned zip output and version management. The adapter interfaces let callers supply file-backed, stream-backed, or custom readers without changing the archive logic.

## Dependencies

The implementation depends on [`src/c10/core/Allocator.h`](src/c10/core/Allocator.h) and [`src/c10/core/CPUAllocator.h`](src/c10/core/CPUAllocator.h) for record allocation, on [`src/caffe2/serialize/versions.h`](src/caffe2/serialize/versions.h) for format bounds, and on the miniz integration pulled in from `inline_container.cc`. Higher-level serialization consumers live under [`src/torch/jit`](src/torch/jit), [`src/torch/package`](src/torch/package), and checkpointing code elsewhere in the tree.

## Runtime Behaviour

`src/caffe2/serialize/inline_container.cc` initializes a miniz archive reader, infers the archive root directory from the first entry, loads an optional serialization id, and then enforces supported file-format versions before reading payload records. `src/caffe2/serialize/inline_container.h` also exposes multi-reader and chunked read APIs so large records can be read concurrently or incrementally instead of forcing one giant copy path. The format contract in the header requires records to live under a top-level archive directory and treats metadata files such as `version` and `model.json` as first-class records.

## Performance Profile

The format is tuned for fast reading rather than maximal compression. `src/caffe2/serialize/inline_container.h` states that writer output is uncompressed, ZIP64, and 64-byte aligned so tensor data can be mmap-friendly and offset-addressable. `src/caffe2/serialize/inline_container.cc` also includes chunked and multi-reader record access, which helps large tensor loads avoid a single serialized read bottleneck. That design spends more disk space to reduce IO indirection and data-copy overhead.

## Design Rationale

PyTorch needs a container format that supports both sequential writing and random-access reading, and the zip layout in this directory provides that without inventing a custom filesystem from scratch. Writing variable-size metadata late and keeping tensor records aligned fits the workloads this repository cares about: large immutable tensor payloads plus metadata that may evolve independently.
