#!/usr/bin/env python3
"""
Check 1 helper: verify adr-scope.md covers all directories.
Run from the repo root (outer) or from inside src/.
Usage: python3 src/adr/_tools/check_scope.py
"""
import os
import re
import sys

def load_scope(scope_path):
    covered = {}   # dir -> reason
    excluded = {}  # dir -> reason
    if not os.path.exists(scope_path):
        return None, None
    with open(scope_path) as f:
        for line in f:
            line = line.strip()
            # Expect lines like: | ./torch/_dynamo | COVERED | ... | |
            if not line.startswith("|"):
                continue
            parts = [p.strip() for p in line.split("|")]
            # parts[0] is empty (before first |), parts[-1] is empty (after last |)
            cols = [p for p in parts if p]
            if len(cols) < 2:
                continue
            directory = cols[0].lstrip("./")
            status = cols[1].upper()
            reason = cols[3] if len(cols) > 3 else ""
            if status == "COVERED":
                covered[directory] = reason
            elif status == "EXCLUDED":
                excluded[directory] = reason
    return covered, excluded


def normalize(path):
    return path.lstrip("./").rstrip("/")


def main():
    # Determine if we're running from outer repo or inside src/
    if os.path.isdir("src"):
        repo_root = "src"
        scope_path = "src/adr-scope.md"
    else:
        repo_root = "."
        scope_path = "adr-scope.md"

    print(f"Repo root: {os.path.abspath(repo_root)}")
    print(f"Scope file: {scope_path}")

    covered, excluded = load_scope(scope_path)
    if covered is None:
        print(f"FAIL: {scope_path} does not exist.")
        sys.exit(1)

    print(f"Loaded {len(covered)} COVERED and {len(excluded)} EXCLUDED entries.")

    # Collect all directories
    missing = []
    pending = []

    for dirpath, dirnames, _ in os.walk(repo_root):
        # Skip hidden directories
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        rel = os.path.relpath(dirpath, repo_root)
        if rel == ".":
            continue
        rel = normalize(rel)
        depth = rel.count("/") + 1

        norm_rel = rel

        # Check if any ancestor is EXCLUDED
        ancestors = [norm_rel.rsplit("/", i)[0] for i in range(1, depth)]
        if any(a in excluded for a in ancestors):
            continue  # implicitly excluded

        # Depth-1: must appear explicitly
        if depth == 1:
            if norm_rel not in covered and norm_rel not in excluded:
                missing.append((norm_rel, "depth-1 not in scope"))
            continue

        # Depth > 1: check if any ancestor is COVERED
        if any(a in covered for a in ancestors):
            continue  # implicitly covered

        if norm_rel not in covered and norm_rel not in excluded:
            missing.append((norm_rel, "not in scope and no covered/excluded ancestor"))

    # Check for PENDING entries
    with open(scope_path) as f:
        for i, line in enumerate(f, 1):
            if "PENDING" in line.upper():
                pending.append(f"line {i}: {line.strip()}")

    if missing:
        print(f"\nFAIL: {len(missing)} directories not classified:")
        for d, reason in missing[:30]:
            print(f"  - {d}  ({reason})")
        if len(missing) > 30:
            print(f"  ... and {len(missing)-30} more")
    else:
        print("\nAll directories are classified.")

    if pending:
        print(f"\nFAIL: PENDING entries found:")
        for p in pending:
            print(f"  {p}")

    if not missing and not pending:
        print("Check 1: PASS")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
