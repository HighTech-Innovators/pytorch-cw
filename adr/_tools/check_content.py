#!/usr/bin/env python3
"""Check 4/5 content verifier for ADR.md files. Run from src/ or outer root."""
import os,re,sys
base="." if os.path.isdir("c10") else "src"
SECTIONS=["Role","Key Files","Public Interface","Dependencies","Runtime Behaviour","Performance Profile","Design Rationale"]
def sentences(t):
    return [s for s in re.split(r'(?<=[.!?])\s+', t.strip()) if len(s.strip())>3]
fails=[]
adrs=[]
for dp,dn,fn in os.walk(base):
    if 'ADR.md' in fn: adrs.append(os.path.join(dp,'ADR.md'))
adrs.sort()
for f in adrs:
    txt=open(f).read()
    lines=txt.splitlines()
    rel=os.path.relpath(f,base)
    d=os.path.dirname(rel)
    # title
    first=next((l for l in lines if l.strip()),"")
    if not re.match(r'^#\s+`[^`]+`\s*$', first):
        fails.append((f,"title not level-1 backtick heading: "+first))
    else:
        want="# `%s`"%d
        if first.strip()!=want:
            fails.append((f,"title mismatch: got %r want %r"%(first.strip(),want)))
    # section index right after title
    ti=lines.index(first)
    after=[l for l in lines[ti+1:] if l.strip()!=""]
    idxlinks=[]
    for l in lines[ti+1:]:
        if l.strip()=="" : 
            if idxlinks: break
            else: continue
        if l.strip().startswith("- ["):
            idxlinks.append(l.strip())
        else:
            break
    need=["#role","#key-files","#public-interface","#dependencies","#runtime-behaviour","#performance-profile","#design-rationale"]
    joined=" ".join(idxlinks).lower()
    for n in need:
        if "("+n+")" not in joined:
            fails.append((f,"section index missing link "+n))
    # sections present
    for s in SECTIONS:
        if not re.search(r'^##\s+'+re.escape(s)+r'\s*$', txt, re.M):
            fails.append((f,"missing section ## "+s))
    # Key Files exactly once and is table
    kf=re.findall(r'^##\s+Key Files\s*$', txt, re.M)
    if len(kf)!=1: fails.append((f,"Key Files count=%d"%len(kf)))
    def body(name):
        m=re.search(r'^##\s+'+re.escape(name)+r'\s*$',txt,re.M)
        if not m: return ""
        st=m.end(); nh=re.search(r'^##\s',txt[st:],re.M)
        return txt[st: st+nh.start() if nh else len(txt)]
    kfb=body("Key Files")
    if re.search(r'^\s*-\s',kfb,re.M): fails.append((f,"Key Files has bullet list"))
    if kfb.count("|")<4: fails.append((f,"Key Files not a table"))
    # Dependencies table or 'No notable dependencies.'
    db=body("Dependencies")
    if "No notable dependencies." not in db and db.count("|")<4:
        fails.append((f,"Dependencies not table and no explicit none"))
    # Runtime & Perf >=2 sentences
    for s in ["Runtime Behaviour","Performance Profile"]:
        if len(sentences(body(s)))<2: fails.append((f,s+" <2 sentences"))
    # no '..'
    for i,l in enumerate(lines,1):
        if '..' in l: fails.append((f,"line %d contains '..': %s"%(i,l.strip()[:80])))
    # ADR links exist
    for m in re.finditer(r'\]\(([^)]*ADR\.md)\)',txt):
        p=m.group(1)
        if p.startswith('../') or '..' in p: fails.append((f,"bad link path "+p))
        if not os.path.exists(os.path.join(base,p)): fails.append((f,"broken ADR link -> "+p))
print("ADR files:",len(adrs))
if fails:
    print("FAILS:",len(fails))
    for f,m in fails: print(" -",os.path.relpath(f,base),"::",m)
    sys.exit(1)
print("Check content: PASS")
