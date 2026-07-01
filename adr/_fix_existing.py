import re, os

INDEX = """- [Role](#role)
- [Key Files](#key-files)
- [Public Interface](#public-interface)
- [Dependencies](#dependencies)
- [Runtime Behaviour](#runtime-behaviour)
- [Performance Profile](#performance-profile)
- [Design Rationale](#design-rationale)"""

files = {
 "caffe2/serialize/ADR.md":"caffe2/serialize",
 "functorch/ADR.md":"functorch",
 "tools/autograd/ADR.md":"tools/autograd",
 "tools/setup_helpers/ADR.md":"tools/setup_helpers",
 "torch/ao/ADR.md":"torch/ao",
 "torch/_C/ADR.md":"torch/_C",
 "torch/cuda/ADR.md":"torch/cuda",
 "torch/_decomp/ADR.md":"torch/_decomp",
 "torch/export/ADR.md":"torch/export",
 "torchgen/ADR.md":"torchgen",
 "torch/jit/ADR.md":"torch/jit",
 "torch/onnx/ADR.md":"torch/onnx",
 "torch/_prims/ADR.md":"torch/_prims",
 "torch/_refs/ADR.md":"torch/_refs",
}

def fix_keyfiles(section_body):
    # section_body: lines of the Key Files section (excluding heading)
    rows=[]
    for line in section_body.splitlines():
        s=line.strip()
        if not s.startswith("- "):
            continue
        s=s[2:].strip()
        # patterns: [`path`](link) - desc   OR  `path` - desc
        m=re.match(r"\[`([^`]+)`\]\([^)]*\)\s*[-–]\s*(.*)", s)
        if not m:
            m=re.match(r"`([^`]+)`\s*[-–]\s*(.*)", s)
        if m:
            path=m.group(1); desc=m.group(2).strip().rstrip(".")
            # strip leading src/ for brevity but keep as-is path
            rows.append((path,desc))
    if not rows:
        return None
    out=["| File | Purpose |","|---|---|"]
    for p,d in rows:
        out.append(f"| `{p}` | {d} |")
    return "\n".join(out)

for rel,dirname in files.items():
    with open(rel) as f:
        txt=f.read()
    # Split header (before ## Role) from body
    idx=txt.find("## Role")
    assert idx!=-1, rel
    body=txt[idx:]
    header=f"# `{dirname}`\n\n{INDEX}\n\n"
    # Now within body, convert Key Files section
    # find "## Key Files" heading
    kf=re.search(r"^## Key Files\s*$", body, re.M)
    if kf:
        start=kf.end()
        # next heading
        nh=re.search(r"^## ", body[start:], re.M)
        end=start+nh.start() if nh else len(body)
        section=body[start:end]
        table=fix_keyfiles(section)
        if table:
            body=body[:start]+"\n\n"+table+"\n\n"+body[end:]
    new=header+body
    with open(rel,"w") as f:
        f.write(new)
    print("fixed header+keyfiles:",rel)
