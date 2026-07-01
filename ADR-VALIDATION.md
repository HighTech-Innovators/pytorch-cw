# ADR Validation Report

Run: 1
Date: 2026-07-01

## Results

| Check | Status | Notes |
|---|---|---|
| 1. Scope map current | PASS | No PENDING entries; all 17 depth-1 directories explicitly listed; all depth-2+ directories covered by excluded/covered ancestor rules |
| 2. Files match COVERED | PASS | 44 ADR.md files found = 44 COVERED entries; no ./src/src/ mis-nesting; all ADRs at correct ./src/<dir>/ADR.md paths; all 34 unique dependency link targets exist |
| 3. Exclusion justifications | PASS | All 10 EXCLUDED directories use valid reasons; Build/config only dirs (maxdepth 1): adr=172 lines, android=0, cmake=0, mypy_plugins=105, scripts=340 — all <2000; binaries and docs not named as distinct architectural units in book chapters |
| 4. ADR content non-stub | PASS | All 44 ADR.md files have level-1 title heading with backtick path, bare section-index bullet list, table-form Key Files with real rows, Dependencies section, Runtime Behaviour ≥2 sentences, Performance Profile ≥2 sentences, and at least one real file/function/type reference; no ../  relative paths found |
| 5. Book cross-reference | PASS | All subsystems named in architecture-map.md, chapter-map.md, and component-map.md are either explicitly COVERED or have a COVERED ancestor (torch/csrc/inductor implicitly covered via torch/csrc) |

## Overall: PASS

## Required Actions

None.
