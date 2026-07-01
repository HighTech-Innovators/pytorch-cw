const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const bookRoot = path.join(root, 'book');
const generatedRoot = path.join(bookRoot, '_generated');
const scopePath = path.join(srcRoot, 'adr-scope.md');
const reportPath = path.join(srcRoot, 'ADR-VALIDATION.md');
const completionPath = path.join(srcRoot, 'adrs-complete.md');
const RUN_NUMBER = '1';
const RUN_DATE = '2026-07-01';

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function exists(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

function toPosix(relPath) {
  return relPath.split(path.sep).join('/');
}

function walkDirs(dir, rel = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const childRel = rel ? path.posix.join(rel, entry.name) : entry.name;
    const childAbs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(childRel);
      results.push(...walkDirs(childAbs, childRel));
    }
  }
  return results.sort();
}

function walkFiles(dir, rel = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const childRel = rel ? path.posix.join(rel, entry.name) : entry.name;
    const childAbs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(childAbs, childRel));
    } else {
      results.push(childRel);
    }
  }
  return results.sort();
}

function parseScope(text) {
  const entries = [];
  const byDir = new Map();
  const pending = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.startsWith('| ./')) {
      continue;
    }
    const parts = line.split('|').slice(1, -1).map((part) => part.trim());
    if (parts.length < 4) {
      continue;
    }
    const dir = parts[0].replace(/^\.\//, '');
    const entry = {
      dir,
      status: parts[1],
      sourceFilesPresent: parts[2],
      reason: parts[3],
      line: index + 1,
    };
    entries.push(entry);
    byDir.set(dir, entry);
    if (entry.status === 'PENDING') {
      pending.push(entry);
    }
  }
  return { entries, byDir, pending };
}

function ancestors(dir) {
  const parts = dir.split('/');
  const res = [];
  for (let i = parts.length - 1; i >= 1; i -= 1) {
    res.push(parts.slice(0, i).join('/'));
  }
  return res;
}

function explicitOrImplicitCoverage(dir, scopeByDir) {
  const self = scopeByDir.get(dir);
  if (self) {
    return self.status;
  }
  for (const anc of ancestors(dir)) {
    const entry = scopeByDir.get(anc);
    if (!entry) {
      continue;
    }
    if (entry.status === 'COVERED') {
      return 'COVERED';
    }
    if (entry.status === 'EXCLUDED') {
      return 'EXCLUDED';
    }
  }
  return null;
}

function sentenceCount(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 0;
  }
  const matches = normalized.match(/[^.!?]+[.!?](?=\s|$)/g);
  return matches ? matches.length : 0;
}

function sectionBody(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) {
    return '';
  }
  const body = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith('## ')) {
      break;
    }
    body.push(lines[i]);
  }
  return body.join('\n').trim();
}

function listMarkdownLinks(text) {
  const links = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const re = /\[[^\]]+\]\(([^)]+ADR\.md)\)/g;
    let match;
    while ((match = re.exec(line)) !== null) {
      links.push({ line: i + 1, target: match[1] });
    }
  }
  return links;
}

function countSourceLinesMaxDepthOne(dirRel) {
  const dirAbs = path.join(srcRoot, dirRel);
  const exts = new Set(['.py', '.cpp', '.h', '.cu', '.cc', '.cxx', '.hpp']);
  let total = 0;
  if (!exists(dirAbs) || !fs.statSync(dirAbs).isDirectory()) {
    return 0;
  }
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }
    if (!exts.has(path.extname(entry.name))) {
      continue;
    }
    const fileText = readText(path.join(dirAbs, entry.name));
    total += fileText.split(/\r?\n/).length;
  }
  return total;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePathLike(token) {
  return token.replace(/^\.\//, '').replace(/^src\//, '').replace(/\/$/, '');
}

function runCmd(command) {
  return cp.execSync(command, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function extractNamedSubsystems(mapTexts, allDirs) {
  const named = new Set();
  const combined = Object.values(mapTexts).join('\n');
  for (const match of mapTexts.architecture.matchAll(/\|\s*src\/([^|]+?)\s*\|/g)) {
    const raw = match[1].trim();
    if (allDirs.includes(raw)) {
      named.add(raw);
    }
  }
  for (const dir of allDirs) {
    if (
      combined.includes(`\`${dir}\``)
      || combined.includes(`src/${dir}`)
      || combined.includes(`./${dir}`)
      || combined.includes(`${dir}/`)
    ) {
      named.add(dir);
    }
  }
  const architectureText = mapTexts.architecture;
  for (const match of architectureText.matchAll(/\|\s*src\/([^|]+?)\s*\|/g)) {
    const raw = match[1].trim();
    const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2 && raw.includes(' / ')) {
      const prefix = parts[0];
      for (const part of parts.slice(1)) {
        if (part.startsWith('_')) {
          const maybe = `${prefix}/${part}`;
          if (allDirs.includes(maybe)) {
            named.add(maybe);
          }
        }
      }
    }
  }
  ['c10/xpu', 'c10/macros', 'torch/csrc/inductor', 'torch/_subclasses'].forEach((dir) => {
    if (combined.includes(`src/${dir}`) || combined.includes(dir)) {
      named.add(dir);
    }
  });
  return Array.from(named).sort();
}

function buildValidation() {
  const results = [];
  const actions = [];

  if (!exists(scopePath)) {
    const report = [
      '# ADR Validation Report',
      '',
      `Run: ${RUN_NUMBER}`,
      `Date: ${RUN_DATE}`,
      '',
      '## Results',
      '',
      '| Check | Status | Notes |',
      '|---|---|---|',
      '| 1. Scope map current | FAIL | adr-scope.md missing |',
      '| 2. Files match COVERED | FAIL | adr-scope.md missing |',
      '| 3. Exclusion justifications | FAIL | adr-scope.md missing |',
      '| 4. ADR content non-stub | FAIL | adr-scope.md missing |',
      '| 5. Book cross-reference | FAIL | adr-scope.md missing |',
      '',
      '## Overall: FAIL',
      '',
      '## Required Actions',
      '',
      '- Restore `./src/adr-scope.md` before re-running validation.',
      '',
    ].join('\n');
    return { report, overallPass: false };
  }

  const scope = parseScope(readText(scopePath));
  const allDirs = walkDirs(srcRoot);
  const depthOne = allDirs.filter((dir) => !dir.includes('/'));
  const allFiles = walkFiles(srcRoot);
  const adrFiles = allFiles.filter((file) => file.endsWith('/ADR.md'));
  const actualAdrDirs = adrFiles.map((file) => file.slice(0, -'/ADR.md'.length));
  const coveredEntries = scope.entries.filter((entry) => entry.status === 'COVERED').map((entry) => entry.dir);
  const excludedEntries = scope.entries.filter((entry) => entry.status === 'EXCLUDED');
  const coveredSet = new Set(coveredEntries);

  const chapterFiles = fs.readdirSync(bookRoot)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(bookRoot, name));
  const chapterTexts = Object.fromEntries(chapterFiles.map((file) => [file, readText(file)]));

  const mapTexts = {
    chapter: readText(path.join(generatedRoot, 'chapter-map.md')),
    architecture: readText(path.join(generatedRoot, 'architecture-map.md')),
    component: readText(path.join(generatedRoot, 'component-map.md')),
  };
  const namedSubsystems = extractNamedSubsystems(mapTexts, allDirs);
  const namedSubsystemSet = new Set(namedSubsystems);

  const check1Missing = [];
  for (const dir of depthOne) {
    if (!scope.byDir.has(dir)) {
      check1Missing.push(dir);
    }
  }
  for (const dir of allDirs) {
    if (scope.byDir.has(dir)) {
      continue;
    }
    if (!dir.includes('/')) {
      continue;
    }
    const inherited = explicitOrImplicitCoverage(dir, scope.byDir);
    if (!inherited) {
      check1Missing.push(dir);
    }
  }
  const pendingDirs = scope.pending.map((entry) => entry.dir);
  const check1Issues = [];
  if (check1Missing.length) {
    check1Issues.push(`missing entries: ${check1Missing.join(', ')}`);
    for (const dir of check1Missing) {
      actions.push(`- Add an explicit row for \`./${dir}\` to \`./src/adr-scope.md\` with a final COVERED or EXCLUDED status.`);
    }
  }
  if (pendingDirs.length) {
    check1Issues.push(`pending entries: ${pendingDirs.join(', ')}`);
    for (const dir of pendingDirs) {
      actions.push(`- Resolve \`./${dir}\` in \`./src/adr-scope.md\`; \`PENDING\` is not allowed in the final scope map.`);
    }
  }
  const check1Pass = check1Issues.length === 0;
  results.push({
    label: '1. Scope map current',
    pass: check1Pass,
    notes: check1Pass ? 'all present' : check1Issues.join('; '),
  });

  const wrongDepthRaw = runCmd("find ./src/src -name 'ADR.md' 2>/dev/null | sort").trim();
  const wrongDepth = wrongDepthRaw ? wrongDepthRaw.split(/\r?\n/).filter(Boolean) : [];
  const actualAdrRaw = runCmd("find ./src -name 'ADR.md' | sort").trim();
  const actualAdrList = actualAdrRaw ? actualAdrRaw.split(/\r?\n/).filter(Boolean) : [];

  const missingCovered = coveredEntries.filter((dir) => !exists(path.join(srcRoot, dir, 'ADR.md')));
  const extraAdrs = actualAdrDirs.filter((dir) => !coveredSet.has(dir));
  const check2Issues = [];
  if (wrongDepth.length) {
    check2Issues.push(`wrong-depth ADRs: ${wrongDepth.join(', ')}`);
    for (const file of wrongDepth) {
      const target = file.replace('./src/src/', './src/');
      actions.push(`- ADR at wrong nesting depth: move \`${file}\` to \`${target}\`.`);
    }
  }
  if (missingCovered.length) {
    check2Issues.push(`missing COVERED ADRs: ${missingCovered.join(', ')}`);
    for (const dir of missingCovered) {
      actions.push(`- Write ADR for \`${dir}\` at \`./src/${dir}/ADR.md\`.`);
    }
  }
  if (extraAdrs.length) {
    check2Issues.push(`ADR files without COVERED entry: ${extraAdrs.join(', ')}`);
    for (const dir of extraAdrs) {
      actions.push(`- Either add \`./${dir}\` as COVERED in \`./src/adr-scope.md\` or remove/move \`./src/${dir}/ADR.md\` so every ADR matches a COVERED scope entry.`);
    }
  }
  if (actualAdrDirs.length !== coveredEntries.length) {
    check2Issues.push(`ADR count ${actualAdrDirs.length} != COVERED count ${coveredEntries.length}`);
  }
  const check2Pass = check2Issues.length === 0;
  results.push({
    label: '2. Files match COVERED',
    pass: check2Pass,
    notes: check2Pass ? 'count matches' : check2Issues.join('; '),
  });

  const validReasons = new Set([
    'Auto-generated code',
    'Build/config only',
    'Vendored/third-party',
    'Test data only',
    'Test suite',
    'Empty or stub',
    'Leaf with no architectural boundary',
  ]);
  const invalidExclusions = [];
  for (const entry of excludedEntries) {
    const depth = entry.dir.split('/').length;
    if (!validReasons.has(entry.reason)) {
      invalidExclusions.push(`${entry.dir}: invalid reason \`${entry.reason}\``);
      actions.push(`- Update \`./src/adr-scope.md\` row for \`./${entry.dir}\`; \`${entry.reason}\` is not an allowed exclusion reason.`);
      continue;
    }
    if (entry.reason === 'Leaf with no architectural boundary' && depth > 2) {
      invalidExclusions.push(`${entry.dir}: leaf exclusions are only valid through depth 2`);
      actions.push(`- Change \`./src/adr-scope.md\` for \`./${entry.dir}\`; \`Leaf with no architectural boundary\` is invalid below depth 2.`);
    }
    if (namedSubsystemSet.has(entry.dir)) {
      invalidExclusions.push(`${entry.dir}: named as a distinct subsystem in book maps`);
      actions.push(`- \`./${entry.dir}\` is named in the book; change its scope classification from EXCLUDED to COVERED and add/update the corresponding ADR coverage.`);
    }
    const lines = countSourceLinesMaxDepthOne(entry.dir);
    if (entry.reason === 'Build/config only' && lines > 2000) {
      invalidExclusions.push(`${entry.dir}: Build/config only but ${lines} source lines at maxdepth 1`);
      actions.push(`- \`./${entry.dir}\` exceeds the 2000-line limit for \`Build/config only\`; either COVER it with an ADR or justify it with a different valid reason.`);
    }
    if (entry.reason === 'Empty or stub' && lines > 50) {
      invalidExclusions.push(`${entry.dir}: Empty or stub but ${lines} source lines at maxdepth 1`);
      actions.push(`- \`./${entry.dir}\` exceeds the 50-line limit for \`Empty or stub\`; reclassify it and document the architecture.`);
    }
    if (entry.reason === 'Leaf with no architectural boundary' && lines > 200) {
      invalidExclusions.push(`${entry.dir}: Leaf with no architectural boundary but ${lines} source lines at maxdepth 1`);
      actions.push(`- \`./${entry.dir}\` exceeds the 200-line limit for \`Leaf with no architectural boundary\`; either COVER it or use a different valid exclusion reason.`);
    }
  }
  const check3Pass = invalidExclusions.length === 0;
  results.push({
    label: '3. Exclusion justifications',
    pass: check3Pass,
    notes: check3Pass ? 'all valid' : invalidExclusions.join('; '),
  });

  const dotdotRaw = runCmd("grep -rn '\\.\\.' ./src --include='ADR.md' || true").trim();
  const adrLinkRaw = runCmd("grep -rn '](.*ADR\\.md)' ./src --include='ADR.md' || true").trim();
  const dotdotMatches = dotdotRaw ? dotdotRaw.split(/\r?\n/).filter(Boolean) : [];
  const adrLinkMatches = adrLinkRaw ? adrLinkRaw.split(/\r?\n/).filter(Boolean) : [];

  const stubAdrs = [];
  for (const adrRel of adrFiles) {
    const dirRel = adrRel.slice(0, -'/ADR.md'.length);
    const adrAbs = path.join(srcRoot, adrRel);
    const text = readText(adrAbs);
    const lines = text.split(/\r?\n/);
    const firstNonEmpty = lines.find((line) => line.trim() !== '') || '';
    const issues = [];

    if (firstNonEmpty !== `# \`${dirRel}\``) {
      issues.push('first non-empty line is not the exact level-1 directory heading');
      actions.push(`- Fix \`./src/${adrRel}\` so the first non-empty line is exactly \`# \`${dirRel}\`\`.`);
    }

    const headingIndex = lines.findIndex((line) => line.trim() === `# \`${dirRel}\``);
    const sectionIndexExpected = [
      '- [Role](#role)',
      '- [Key Files](#key-files)',
      '- [Public Interface](#public-interface)',
      '- [Dependencies](#dependencies)',
      '- [Runtime Behaviour](#runtime-behaviour)',
      '- [Performance Profile](#performance-profile)',
      '- [Design Rationale](#design-rationale)',
    ];
    const afterHeading = headingIndex >= 0 ? lines.slice(headingIndex + 1) : [];
    const nonEmptyAfterHeading = [];
    for (const line of afterHeading) {
      if (line.trim() === '') {
        continue;
      }
      if (line.startsWith('## ')) {
        break;
      }
      nonEmptyAfterHeading.push(line.trim());
    }
    if (nonEmptyAfterHeading.length !== sectionIndexExpected.length || !sectionIndexExpected.every((line, i) => nonEmptyAfterHeading[i] === line)) {
      issues.push('missing or malformed bare bullet-list section index after title');
      actions.push(`- Fix the section index in \`./src/${adrRel}\`; it must be the seven bare bullet links immediately after the title heading.`);
    }

    const keyFilesMatches = text.match(/^## Key Files\s*$/gm) || [];
    if (keyFilesMatches.length !== 1) {
      issues.push(`## Key Files appears ${keyFilesMatches.length} times`);
      actions.push(`- Ensure \`./src/${adrRel}\` contains exactly one \`## Key Files\` section.`);
    }

    const keyFilesBody = sectionBody(text, 'Key Files');
    if (/^-\s+/m.test(keyFilesBody)) {
      issues.push('Key Files section is a bullet list instead of a table');
      actions.push(`- Rewrite \`## Key Files\` in \`./src/${adrRel}\` as a markdown table, not a bullet list.`);
    }
    const keyFilesLines = keyFilesBody.split(/\r?\n/).filter((line) => line.trim() !== '');
    const keyFilesTableLines = keyFilesLines.filter((line) => line.trim().startsWith('|'));
    const keyFileRows = keyFilesTableLines.slice(2).map((line) => line.split('|').slice(1, -1).map((part) => part.trim()));
    const realKeyFileRows = keyFileRows.filter((cols) => cols.length >= 2 && /[A-Za-z0-9_./-]+\.[A-Za-z0-9_]+/.test(cols[0]) && !/placeholder|tbd|todo/i.test(cols[0]) && cols[1]);
    if (!realKeyFileRows.length) {
      issues.push('Key Files table has no real file-path rows');
      actions.push(`- Add at least one real source file row to \`## Key Files\` in \`./src/${adrRel}\`.`);
    }

    const depsBody = sectionBody(text, 'Dependencies');
    const hasNoDepsStatement = /no notable dependencies/i.test(depsBody);
    const depsTableLines = depsBody.split(/\r?\n/).filter((line) => line.trim().startsWith('|'));
    const depRows = depsTableLines.slice(2).filter((line) => /\|/.test(line));
    if (!depRows.length && !hasNoDepsStatement) {
      issues.push('Dependencies section has neither rows nor a no-notable-dependencies statement');
      actions.push(`- Add a dependency table or an explicit \`no notable dependencies\` statement to \`./src/${adrRel}\`.`);
    }

    const links = listMarkdownLinks(text);
    for (const link of links) {
      if (link.target.startsWith('../')) {
        issues.push(`relative ADR link at line ${link.line}: ${link.target}`);
        actions.push(`- Relative path in \`./src/${adrRel}\` line ${link.line}: replace \`${link.target}\` with a src-root ADR path.`);
      }
      const targetAbs = path.join(srcRoot, normalizePathLike(link.target));
      if (!exists(targetAbs) || !fs.statSync(targetAbs).isFile()) {
        issues.push(`broken ADR link at line ${link.line}: ${link.target}`);
        actions.push(`- Broken link in \`./src/${adrRel}\` line ${link.line}: \`${link.target}\` does not exist at \`./src/${normalizePathLike(link.target)}\`; replace it with an existing ADR path.`);
      }
    }

    const runtimeBody = sectionBody(text, 'Runtime Behaviour');
    if (sentenceCount(runtimeBody) < 2) {
      issues.push('Runtime Behaviour has fewer than 2 sentences');
      actions.push(`- Expand \`## Runtime Behaviour\` in \`./src/${adrRel}\` to at least two source-grounded sentences.`);
    }

    const perfBody = sectionBody(text, 'Performance Profile');
    const perfSentences = sentenceCount(perfBody);
    const perfKeywords = /(alloc|allocation|synchron|lock|data movement|copy|copies|redundant|memory|heap|latency|bandwidth|communication|traffic|cost|costly|expensive|overhead|hot path|hot-path|startup|build time|io|compression|bottleneck|reuse|steady-state|parallel)/i;
    if (perfSentences < 2 || !perfKeywords.test(perfBody)) {
      issues.push('Performance Profile is too short or does not discuss performance concerns');
      actions.push(`- Expand \`## Performance Profile\` in \`./src/${adrRel}\` to at least two sentences covering allocation, synchronization, data movement, redundant work, or an explicit statement that none are visible.`);
    }

    const actualReferenceOk = realKeyFileRows.some((cols) => exists(path.join(srcRoot, normalizePathLike(cols[0].replace(/`/g, '')))))
      || /`[^`]+\.[A-Za-z0-9_]+`/.test(text)
      || /`[A-Za-z_][A-Za-z0-9_:]*\([^`]*\)`/.test(text)
      || /`[A-Za-z_][A-Za-z0-9_:<>]*`/.test(text);
    if (!actualReferenceOk) {
      issues.push('no reference to an actual file, function, or type from the repo');
      actions.push(`- Add at least one concrete file, function, or type reference to \`./src/${adrRel}\`.`);
    }

    if (issues.length) {
      stubAdrs.push(`${dirRel}: ${issues.join('; ')}`);
    }
  }

  const relativeLinkMatches = [];
  for (const match of dotdotMatches) {
    const [, file, line, text] = match.match(/^(.*?):(\d+):(.*)$/) || [];
    if (!file) {
      continue;
    }
    const re = /\[[^\]]+\]\((\.\.\/[^)]+ADR\.md)\)/g;
    let link;
    while ((link = re.exec(text)) !== null) {
      relativeLinkMatches.push(`${file}:${line}:${link[1]}`);
      stubAdrs.push(`relative ADR link: ${file}:${line}:${link[1]}`);
      actions.push(`- Relative path in \`${file}\` line ${line}: replace \`${link[1]}\` with a src-root ADR path.`);
    }
  }
  if (adrLinkMatches.length) {
    for (const match of adrLinkMatches) {
      const [, file, line, text] = match.match(/^(.*?):(\d+):(.*)$/) || [];
      if (!file) {
        continue;
      }
      const re = /\[[^\]]+\]\(([^)]+ADR\.md)\)/g;
      let link;
      while ((link = re.exec(text)) !== null) {
        const target = normalizePathLike(link[1]);
        const targetAbs = path.join(srcRoot, target);
        if (!exists(targetAbs) || !fs.statSync(targetAbs).isFile()) {
          stubAdrs.push(`broken link grep match: ${file}:${line}:${link[1]}`);
          actions.push(`- Broken link in \`${file}\` line ${line}: \`${link[1]}\` does not exist at \`./src/${target}\`; replace it with an existing ADR path.`);
        }
      }
    }
  }

  const dedupStubAdrs = Array.from(new Set(stubAdrs));
  const check4Pass = dedupStubAdrs.length === 0;
  results.push({
    label: '4. ADR content non-stub',
    pass: check4Pass,
    notes: check4Pass ? 'all ADRs satisfy required structure' : dedupStubAdrs.join('; '),
  });

  const uncoveredSubsystems = [];
  for (const dir of namedSubsystems) {
    const classification = explicitOrImplicitCoverage(dir, scope.byDir);
    if (classification !== 'COVERED') {
      const scopeEntry = scope.byDir.get(dir);
      const reason = scopeEntry && scopeEntry.status === 'EXCLUDED'
        ? `EXCLUDED (${scopeEntry.reason})`
        : 'not covered';
      uncoveredSubsystems.push(`${dir}: ${reason}`);
      actions.push(`- ${dir} is named in the book maps; mark \`./${dir}\` COVERED in \`./src/adr-scope.md\` and provide \`./src/${dir}/ADR.md\` unless a COVERED ancestor is intentionally used.`);
    }
  }
  const check5Pass = uncoveredSubsystems.length === 0;
  results.push({
    label: '5. Book cross-reference',
    pass: check5Pass,
    notes: check5Pass ? 'all book-named subsystems are covered' : uncoveredSubsystems.join('; '),
  });

  const overallPass = results.every((result) => result.pass);
  const reportLines = [
    '# ADR Validation Report',
    '',
    `Run: ${RUN_NUMBER}`,
    `Date: ${RUN_DATE}`,
    '',
    '## Results',
    '',
    '| Check | Status | Notes |',
    '|---|---|---|',
    ...results.map((result) => `| ${result.label} | ${result.pass ? 'PASS' : 'FAIL'} | ${result.notes.replace(/\|/g, '\\|')} |`),
    '',
    `## Overall: ${overallPass ? 'PASS' : 'FAIL'}`,
    '',
    '## Required Actions',
    '',
  ];

  const dedupActions = Array.from(new Set(actions));
  if (overallPass) {
    reportLines.push('None.');
  } else {
    reportLines.push(...dedupActions);
  }
  reportLines.push('');

  return {
    report: reportLines.join('\n'),
    overallPass,
  };
}

const { report, overallPass } = buildValidation();
fs.writeFileSync(reportPath, report);
if (overallPass) {
  const scope = parseScope(readText(scopePath));
  const mapTexts = {
    chapter: readText(path.join(generatedRoot, 'chapter-map.md')),
    architecture: readText(path.join(generatedRoot, 'architecture-map.md')),
    component: readText(path.join(generatedRoot, 'component-map.md')),
  };
  const allDirs = walkDirs(srcRoot);
  const namedSubsystems = extractNamedSubsystems(mapTexts, allDirs);
  const coverageTable = scope.entries.map((entry) => {
    const adrPath = entry.status === 'COVERED' ? `./${entry.dir}/ADR.md` : '—';
    return `| ./${entry.dir} | ${entry.status} | ${adrPath} | ${entry.reason || ''} |`;
  });
  const xrefTable = namedSubsystems.map((dir) => `| ${dir} | ./${dir} | COVERED |`);
  const completion = [
    '# ADR Coverage Complete',
    '',
    `Gate passed: ${RUN_DATE}`,
    'Validator: work/2-validate-adrs.md',
    '',
    '## Coverage Table',
    '',
    '| Directory | Status | ADR path | Exclusion reason |',
    '|---|---|---|---|',
    ...coverageTable,
    '',
    '## Book Subsystem Cross-reference',
    '',
    '| Subsystem (from book) | Directory | Status |',
    '|---|---|---|',
    ...xrefTable,
    '',
    '## Known Partial Coverage',
    '',
    'None.',
    '',
  ].join('\n');
  fs.writeFileSync(completionPath, completion);
}
console.log(report);
