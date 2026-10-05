// Convierte los prototipos .dc.html del handoff de diseño en componentes React (JSX).
// Uso: node tools/convert-dc.mjs <carpeta_handoff> <carpeta_salida>
// Se usó una sola vez para portar el diseño; los archivos generados se editan a mano después.
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';

const [, , SRC, OUT] = process.argv;
const FILES = [
  { file: 'Tienda.dc.html', name: 'Tienda' },
  { file: 'Administrador.dc.html', name: 'Administrador' },
  { file: 'Tarjeta Producto.dc.html', name: 'TarjetaProducto' },
];
const IMPORTS = { 'Tarjeta Producto': 'TarjetaProducto' };

const EVENT_MAP = {
  onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onsubmit: 'onSubmit', onkeydown: 'onKeyDown',
  onkeyup: 'onKeyUp', onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', onfocus: 'onFocus', onblur: 'onBlur',
  onmousemove: 'onMouseMove', onpointerdown: 'onPointerDown', onpointerup: 'onPointerUp',
};
const ATTR_MAP = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
  autocomplete: 'autoComplete', colspan: 'colSpan', rowspan: 'rowSpan', inputmode: 'inputMode', spellcheck: 'spellCheck', autofocus: 'autoFocus' };
const BOOL_ATTRS = new Set(['disabled', 'checked', 'selected', 'readonly', 'multiple', 'required', 'autofocus', 'hidden']);
const NO_WS = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'select', 'colgroup', 'textarea']);
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// ---------- expresiones {{ }} ----------
function topEq(expr) {
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (depth === 0 && (c === '=' || c === '!') && expr[i + 1] === '=') {
      if (i > 0 && (expr[i - 1] === '=' || expr[i - 1] === '!')) continue;
      if (!expr.slice(0, i).trim()) continue;
      const op = expr[i + 2] === '=' ? c + '==' : c + '=';
      return { index: i, op };
    }
  }
  return null;
}
function wrapsWhole(e) {
  let d = 0;
  for (let i = 0; i < e.length - 1; i++) { if (e[i] === '(') d++; else if (e[i] === ')') { d--; if (d === 0) return false; } }
  return true;
}
function js(src, scope) {
  const e = String(src).trim();
  if (!e) return 'undefined';
  if (e[0] === '(' && e.at(-1) === ')' && wrapsWhole(e)) return js(e.slice(1, -1), scope);
  const eq = topEq(e);
  if (eq) return `(${js(e.slice(0, eq.index), scope)} ${eq.op} ${js(e.slice(eq.index + eq.op.length), scope)})`;
  if (e[0] === '!') return `!(${js(e.slice(1), scope)})`;
  if (['true', 'false', 'null', 'undefined'].includes(e)) return e;
  if (/^-?\d+(\.\d+)?$/.test(e)) return e;
  if (e.length >= 2 && (e[0] === '"' || e[0] === "'") && e.at(-1) === e[0]) return JSON.stringify(e.slice(1, -1));
  const head = e.match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
  if (!head) throw new Error('Expresión no soportada: ' + e);
  let out = scope.has(head[0]) ? head[0] : `$v.${head[0]}`;
  let i = head[0].length;
  while (i < e.length) {
    if (e[i] === '.') {
      const m = e.slice(i + 1).match(/^[A-Za-z_$][A-Za-z0-9_$]*/) || e.slice(i + 1).match(/^\d+/);
      out += /^\d/.test(m[0]) ? `?.[${m[0]}]` : `?.${m[0]}`;
      i += 1 + m[0].length;
    } else if (e[i] === '[') {
      let d = 1, j = i + 1;
      while (j < e.length && d > 0) { if (e[j] === '[') d++; else if (e[j] === ']') { d--; if (!d) break; } j++; }
      out += `?.[${js(e.slice(i + 1, j), scope)}]`;
      i = j + 1;
    } else throw new Error('Expresión no soportada: ' + e);
  }
  return out;
}
const HOLE = /\{\{([\s\S]+?)\}\}/g;
function attrExpr(raw, scope) {
  const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
  if (whole) return js(whole[1], scope);
  if (raw.includes('{{')) {
    const parts = raw.split(HOLE);
    return '`' + parts.map((p, i) => (i & 1 ? '${' + js(p, scope) + ' ?? ""}' : p.replace(/[`\\$]/g, '\\$&'))).join('') + '`';
  }
  return JSON.stringify(raw);
}
function styleExpr(raw, scope) {
  const decls = [];
  for (const d of raw.split(';')) {
    const i = d.indexOf(':');
    if (i < 0) continue;
    const prop = d.slice(0, i).trim();
    const key = prop.startsWith('--') ? JSON.stringify(prop) : (/^-/.test(prop) ? JSON.stringify(camel(prop.replace(/^-webkit-/, 'Webkit-').replace(/^-/, ''))) : camel(prop));
    decls.push(`${key}: ${attrExpr(d.slice(i + 1).trim(), scope)}`);
  }
  return `{ ${decls.join(', ')} }`;
}

// ---------- pseudo-clases (style-hover) ----------
const pseudo = new Map();
function pseudoClass(kind, css) {
  const k = kind + '|' + css;
  if (!pseudo.has(k)) pseudo.set(k, { cls: 'dcp' + (pseudo.size + 1), kind, css });
  return pseudo.get(k).cls;
}
function importantify(css) {
  return css.split(';').map((d) => d.trim()).filter(Boolean).map((d) => (/!\s*important$/i.test(d) ? d : d + ' !important')).join(';');
}

// ---------- nodos ----------
function emitChildren(node, scope, ind) {
  const parentTag = node.name;
  const out = [];
  const kids = node.children || [];
  const BLOCK = /^(div|section|article|header|footer|nav|aside|main|p|h[1-6]|ul|ol|li|form|table|thead|tbody|tr|td|th|dl|details|summary|figure|hr|style|script|helmet)$/;
  const sib = (i, d) => { for (let j = i + d; j >= 0 && j < kids.length; j += d) { const k = kids[j]; if (k.type === 'comment') continue; return k; } return null; };
  const isBlockish = (k) => !k || (k.type === 'tag' && BLOCK.test(k.name));
  for (let i = 0; i < kids.length; i++) {
    const c = kids[i];
    if (c.type === 'text' && !c.data.trim() && (isBlockish(sib(i, -1)) || isBlockish(sib(i, 1)))) continue;
    const s = emit(c, scope, ind, parentTag);
    if (s != null) out.push(s);
  }
  return out;
}
function emitText(txt, scope, ind, parentTag) {
  if (!txt.includes('{{')) {
    if (!txt.trim()) return NO_WS.has(parentTag) || !txt.includes(' ') ? null : ind + '{" "}';
    return ind + '{' + JSON.stringify(txt.replace(/\s+/g, ' ')) + '}';
  }
  const parts = txt.split(HOLE);
  return parts.map((p, i) => (i & 1 ? `{${js(p, scope)}}` : p ? `{${JSON.stringify(p.replace(/\s+/g, ' '))}}` : '')).filter(Boolean).map((x) => ind + x).join('\n');
}
function emitAttrs(attrs, scope, kind) {
  const props = [];
  const classes = [];
  for (const [name, value] of Object.entries(attrs)) {
    if (name.startsWith('hint-') || name === 'sc-name') continue;
    if (name.startsWith('style-')) { classes.push(JSON.stringify(pseudoClass(name.slice(6), value))); continue; }
    if (name === 'style') { props.push(`style={${styleExpr(value, scope)}}`); continue; }
    let key = name;
    if (kind === 'dom') {
      const low = name.toLowerCase();
      if (ATTR_MAP[low]) key = ATTR_MAP[low];
      else if (low.startsWith('on')) key = EVENT_MAP[low] || name;
      else if (name.includes('-') && !name.startsWith('aria-') && !name.startsWith('data-')) key = camel(name);
    } else if (name.includes('-')) key = camel(name);
    if (name === 'class') { classes.push(attrExpr(value, scope)); continue; }
    let ex;
    if (value === '' && BOOL_ATTRS.has(name.toLowerCase())) ex = 'true';
    else ex = attrExpr(value, scope);
    if (kind === 'dom' && (key === 'value' || key === 'checked') && value.includes('{{')) ex = `${ex} ?? ${key === 'checked' ? 'false' : '""'}`;
    props.push(`${key}={${ex}}`);
  }
  if (classes.length) props.push(`className={${classes.length === 1 ? classes[0] : `[${classes.join(', ')}].filter(Boolean).join(' ')`}}`);
  return props;
}
function tagOpen(tag, props, ind) {
  if (!props.length) return `<${tag}`;
  return `<${tag} ${props.join(' ')}`;
}
function emit(node, scope, ind, parentTag) {
  if (node.type === 'text') return emitText(node.data, scope, ind, parentTag);
  if (node.type === 'comment') return null;
  if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') return null;
  const tag = node.name;
  const nx = ind + '  ';
  if (tag === 'helmet') return null;
  if (tag === 'sc-for') {
    const list = attrExpr(node.attribs.list || '', scope);
    let as = node.attribs.as || 'item';
    const sub = new Set([...scope, as, '$index']);
    const kids = emitChildren(node, sub, nx + '  ');
    return `${ind}{arr(${list}).map((${as}, $index) => (\n${nx}<Fragment key={$index}>\n${kids.join('\n')}\n${nx}</Fragment>\n${ind}))}`;
  }
  if (tag === 'sc-if') {
    const cond = attrExpr(node.attribs.value || '', scope);
    const kids = emitChildren(node, scope, nx + '  ');
    return `${ind}{${cond} ? (\n${nx}<>\n${kids.join('\n')}\n${nx}</>\n${ind}) : null}`;
  }
  if (tag === 'dc-import') {
    const comp = IMPORTS[node.attribs.name];
    const a = { ...node.attribs }; delete a.name;
    return `${ind}${tagOpen(comp, emitAttrs(a, scope, 'comp'))} />`;
  }
  if (tag === 'image-slot') {
    return `${ind}${tagOpen('ImageSlot', emitAttrs(node.attribs, scope, 'comp'))} />`;
  }
  const props = emitAttrs(node.attribs, scope, 'dom');
  const kids = emitChildren(node, scope, nx);
  if (!kids.length) return `${ind}${tagOpen(tag, props)} />`;
  return `${ind}${tagOpen(tag, props)}>\n${kids.join('\n')}\n${ind}</${tag}>`;
}

// ---------- archivos ----------
const allCss = [];
for (const { file, name } of FILES) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8');
  const open = src.indexOf('<x-dc>');
  const close = src.lastIndexOf('</x-dc>');
  const tpl = src.slice(open + 6, close);
  const scriptM = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/);
  const logic = scriptM[1].trim().replace(/^class Component extends DCLogic \{/, `export default class ${name} extends DCLogic {`);
  const doc = parseDocument(tpl, { lowerCaseAttributeNames: false, lowerCaseTags: false, recognizeSelfClosing: true, decodeEntities: true });
  const kids = emitChildren(doc, new Set(), '    ');
  const body = logic.replace(/\}\s*$/, '') +
    `\n  render() { return view({ ...this.props, ...this.renderVals() }); }\n}\n`;
  const imports = [
    `'use client';`,
    `// Generado desde ${file} con tools/convert-dc.mjs y luego ajustado a mano.`,
    `import React, { Fragment } from 'react';`,
    `import { DCLogic, arr } from '@/lib/dc';`,
    `import ImageSlot from '@/components/ImageSlot';`,
    ...(name === 'Tienda' ? [`import TarjetaProducto from '@/components/TarjetaProducto';`] : []),
  ];
  const out = `${imports.join('\n')}\n\n${body}\nfunction view($v) {\n  return (\n  <>\n${kids.join('\n')}\n  </>\n  );\n}\n`;
  fs.writeFileSync(path.join(OUT, name + '.jsx'), out);
  console.log('ok', name, out.length);
}
for (const { cls, kind, css } of pseudo.values()) allCss.push(`.${cls}:${kind}{${importantify(css)}}`);
fs.writeFileSync(path.join(OUT, '..', 'app', 'dc-pseudo.css'), '/* Estados :hover del diseño (generado) */\n' + allCss.join('\n') + '\n');
console.log('pseudo', pseudo.size);
