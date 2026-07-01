# ADR Validation Report

Run: 1
Date: 2026-07-01

## Results

| Check | Status | Notes |
|---|---|---|
| 1. Scope map current | PASS | all present |
| 2. Files match COVERED | PASS | count matches |
| 3. Exclusion justifications | FAIL | aten: named as a distinct subsystem in book maps; aten/src: named as a distinct subsystem in book maps; benchmarks: Leaf with no architectural boundary but 238 source lines at maxdepth 1; binaries: Leaf with no architectural boundary but 1456 source lines at maxdepth 1; c10: named as a distinct subsystem in book maps; caffe2: named as a distinct subsystem in book maps; tools: named as a distinct subsystem in book maps; tools: Leaf with no architectural boundary but 4305 source lines at maxdepth 1; torch: named as a distinct subsystem in book maps; torch: Leaf with no architectural boundary but 61203 source lines at maxdepth 1 |
| 4. ADR content non-stub | PASS | all ADRs satisfy required structure |
| 5. Book cross-reference | FAIL | aten: EXCLUDED (Leaf with no architectural boundary); aten/src: EXCLUDED (Leaf with no architectural boundary); c10: EXCLUDED (Leaf with no architectural boundary); c10/macros: not covered; c10/xpu: not covered; caffe2: EXCLUDED (Leaf with no architectural boundary); tools: EXCLUDED (Leaf with no architectural boundary); torch: EXCLUDED (Leaf with no architectural boundary); torch/_subclasses: not covered |

## Overall: FAIL

## Required Actions

- `./aten` is named in the book; change its scope classification from EXCLUDED to COVERED and add/update the corresponding ADR coverage.
- `./aten/src` is named in the book; change its scope classification from EXCLUDED to COVERED and add/update the corresponding ADR coverage.
- `./benchmarks` exceeds the 200-line limit for `Leaf with no architectural boundary`; either COVER it or use a different valid exclusion reason.
- `./binaries` exceeds the 200-line limit for `Leaf with no architectural boundary`; either COVER it or use a different valid exclusion reason.
- `./c10` is named in the book; change its scope classification from EXCLUDED to COVERED and add/update the corresponding ADR coverage.
- `./caffe2` is named in the book; change its scope classification from EXCLUDED to COVERED and add/update the corresponding ADR coverage.
- `./tools` is named in the book; change its scope classification from EXCLUDED to COVERED and add/update the corresponding ADR coverage.
- `./tools` exceeds the 200-line limit for `Leaf with no architectural boundary`; either COVER it or use a different valid exclusion reason.
- `./torch` is named in the book; change its scope classification from EXCLUDED to COVERED and add/update the corresponding ADR coverage.
- `./torch` exceeds the 200-line limit for `Leaf with no architectural boundary`; either COVER it or use a different valid exclusion reason.
- aten is named in the book maps; mark `./aten` COVERED in `./src/adr-scope.md` and provide `./src/aten/ADR.md` unless a COVERED ancestor is intentionally used.
- aten/src is named in the book maps; mark `./aten/src` COVERED in `./src/adr-scope.md` and provide `./src/aten/src/ADR.md` unless a COVERED ancestor is intentionally used.
- c10 is named in the book maps; mark `./c10` COVERED in `./src/adr-scope.md` and provide `./src/c10/ADR.md` unless a COVERED ancestor is intentionally used.
- c10/macros is named in the book maps; mark `./c10/macros` COVERED in `./src/adr-scope.md` and provide `./src/c10/macros/ADR.md` unless a COVERED ancestor is intentionally used.
- c10/xpu is named in the book maps; mark `./c10/xpu` COVERED in `./src/adr-scope.md` and provide `./src/c10/xpu/ADR.md` unless a COVERED ancestor is intentionally used.
- caffe2 is named in the book maps; mark `./caffe2` COVERED in `./src/adr-scope.md` and provide `./src/caffe2/ADR.md` unless a COVERED ancestor is intentionally used.
- tools is named in the book maps; mark `./tools` COVERED in `./src/adr-scope.md` and provide `./src/tools/ADR.md` unless a COVERED ancestor is intentionally used.
- torch is named in the book maps; mark `./torch` COVERED in `./src/adr-scope.md` and provide `./src/torch/ADR.md` unless a COVERED ancestor is intentionally used.
- torch/_subclasses is named in the book maps; mark `./torch/_subclasses` COVERED in `./src/adr-scope.md` and provide `./src/torch/_subclasses/ADR.md` unless a COVERED ancestor is intentionally used.
