// Assign explicit implementation status to existing JSX controls. Existing
// annotations are authoritative; inspect flagged placeholders when finishing work.
const ts = require('typescript');
const fs = require('node:fs');
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const counts = { missing: 0, partial: 0, linked: 0, complete: 0 };
const unfinished = /not (?:yet )?(?:available|implemented|connected|supported)|coming soon|not connected yet|placeholder|not wired|not configured/i;
function navigates(node, seen = new Set(), depth = 0) {
  if (!node || depth > 5 || seen.has(node)) return false;
  seen.add(node);
  if (ts.isCatchClause(node)) return false;
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const receiver = node.expression.expression.getText();
    const method = node.expression.name.text;
    if ((/router$/i.test(receiver) && ['push', 'replace', 'back', 'forward'].includes(method)) ||
        (/location$/.test(receiver) && ['assign', 'replace'].includes(method)) ||
        (receiver === 'window' && method === 'open')) return true;
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      /(?:window\.)?location(?:\.href)?$/.test(node.left.getText())) return true;
  if (ts.isIdentifier(node)) {
    for (const declaration of checker.getSymbolAtLocation(node)?.declarations ?? []) {
      if ((ts.isFunctionDeclaration(declaration) || ts.isVariableDeclaration(declaration)) &&
          navigates(declaration.body ?? declaration.initializer, seen, depth + 1)) return true;
    }
  }
  let found = false;
  ts.forEachChild(node, child => { if (navigates(child, seen, depth)) found = true; });
  return found;
}
function placeholder(node, seen = new Set(), depth = 0) {
  if (!node || depth > 5 || seen.has(node)) return false;
  seen.add(node);
  // Failure handling does not make an otherwise implemented action incomplete.
  if (ts.isCatchClause(node)) return false;
  if ((ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) && unfinished.test(node.text)) return true;
  if (ts.isIdentifier(node)) {
    const symbol = checker.getSymbolAtLocation(node);
    for (const declaration of symbol?.declarations ?? []) {
      if ((ts.isFunctionDeclaration(declaration) || ts.isVariableDeclaration(declaration)) &&
          placeholder(declaration.body ?? declaration.initializer, seen, depth + 1)) return true;
    }
  }
  let found = false;
  ts.forEachChild(node, child => { if (placeholder(child, seen, depth)) found = true; });
  return found;
}
for (const source of program.getSourceFiles()) {
  if (!/src[\\/].*\.tsx$/.test(source.fileName) || source.isDeclarationFile || source.fileName.includes('node_modules')) continue;
  if (/components[\\/](?:access[\\/]AccessButton|ui[\\/]Button)\.tsx$/.test(source.fileName)) continue;
  const edits = [];
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (['button', 'AccessButton', 'Button'].includes(tag)) {
        const attrs = node.attributes.properties;
        const existing = attrs.find(a => a.name?.getText(source) === 'data-action-status');
        if (!existing || ((process.argv.includes('--reclassify') || process.argv.includes('--navigation-only')) && existing.initializer && ts.isStringLiteral(existing.initializer))) {
          const handlers = attrs.filter(a => /^on(?:Click|DoubleClick|MouseDown|PointerDown|KeyDown)$/.test(a.name?.getText(source) ?? ''));
          const spread = attrs.some(ts.isJsxSpreadAttribute);
          let linked = false;
          let form = false;
          for (let parent = node.parent; parent; parent = parent.parent) {
            if (ts.isJsxElement(parent)) {
              const ancestor = parent.openingElement;
              const name = ancestor.tagName.getText(source);
              if (['Link', 'a'].includes(name) && ancestor.attributes.properties.some(a => a.name?.getText(source) === 'href')) linked = true;
              if (ancestor.attributes.properties.some(a => a.name?.getText(source) === 'onClick' && navigates(a.initializer))) linked = true;
              if (name === 'form') form = true;
            }
          }
          const type = attrs.find(a => a.name?.getText(source) === 'type')?.initializer?.getText(source);
          const submit = form && (type === '"submit"' || type === "'submit'" || (tag === 'button' && !type));
          const navigation = linked || handlers.some(a => navigates(a.initializer));
          if (process.argv.includes('--navigation-only') && (!navigation || existing?.initializer?.text === 'linked')) {
            ts.forEachChild(node, visit);
            return;
          }
          // Page navigation is green, independently of the destination page's
          // implementation status. Completed non-navigation actions stay neutral.
          const status = navigation ? 'linked' : handlers.some(a => placeholder(a.initializer)) ? 'partial' : handlers.length || submit || spread ? 'complete' : 'missing';
          counts[status]++;
          edits.push(existing
            ? { pos: existing.initializer.getStart(source), end: existing.initializer.end, text: `"${status}"` }
            : { pos: node.tagName.end, end: node.tagName.end, text: ` data-action-status="${status}"` });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (process.argv.includes('--write') && edits.length) {
    let text = source.text;
    for (const edit of edits.reverse()) text = text.slice(0, edit.pos) + edit.text + text.slice(edit.end);
    if (text !== source.text) fs.writeFileSync(source.fileName, text);
  }
}
console.log(JSON.stringify(counts));
