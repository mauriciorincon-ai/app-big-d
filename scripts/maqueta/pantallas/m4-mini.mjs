// Miniaturas de la portada (D81): un esquema de lo que muestra cada pantalla, en 160 × 90. Son decorativas
// (aria-hidden): el nombre y la frase del nodo dicen lo mismo en texto. Solo tinta y superficie; los matices
// de tipo aparecen donde la pantalla dibuja la gramática (atlas y kit), como en la pantalla real.
const r = (x, y, w, h, c, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${c}"/>`;
const l = (d, c = "l") => `<path d="${d}" class="${c}"/>`;
const o = (x, y, rad, c) => `<circle cx="${x}" cy="${y}" r="${rad}" class="${c}"/>`;
const nodo = (x, y, w, h, tipo) => r(x, y, w, h, "f") + r(x, y, 2.5, h, `c${tipo}`, 1);
const check = (x, y, c = "la") => l(`M${x - 3},${y} L${x - 1},${y + 2.2} L${x + 3.2},${y - 2.4}`, c);
const cruz = (x, y) => l(`M${x - 2.6},${y - 2.6} L${x + 2.6},${y + 2.6} M${x + 2.6},${y - 2.6} L${x - 2.6},${y + 2.6}`, "la");
const svg = (cuerpo) => `<svg class="mini" viewBox="0 0 160 90" aria-hidden="true" focusable="false">${cuerpo}</svg>`;

const vision = () => {
  const cols = [[1, 2], [2, 1], [3, 2], [5, 1], [6, 1]];
  let s = "";
  cols.forEach(([t, n], i) => {
    const x = 8 + i * 30;
    s += r(x, 8, 24, 56, "k") + r(x + 4, 12, 12, 3, "t", 1);
    for (let k = 0; k < n; k++) s += nodo(x + 2, 20 + k * 20, 20, 12, t);
    if (i < cols.length - 1) s += l(`M${x + 22},26 H${x + 32}`);
  });
  return svg(s + nodo(8, 70, 142, 12, 4) + r(16, 75, 30, 2.5, "t", 1));
};
const nivel2 = () => {
  let s = "";
  [8, 38, 68].forEach((x, i) => {
    s += r(x, 8, 26, 74, "k");
    [14, 34, 54].slice(0, 3 - (i % 2)).forEach((y) => { s += nodo(x + 2, y, 22, 12, [1, 2, 3][i]); });
  });
  s += `<rect x="39" y="33" width="24" height="14" rx="2.5" class="la"/>` + l("M63,40 H106");
  s += r(106, 8, 46, 74, "f", 3) + r(112, 15, 28, 4, "a", 1);
  [34, 28, 32, 22].forEach((w, i) => { s += r(112, 25 + i * 6, w, 2.5, "t", 1); });
  [0, 1, 2, 3].forEach((i) => { s += r(112 + i * 7, 54, 5, 5, i < 3 ? "a" : "o", 1); });
  return svg(s + r(112, 67, 26, 2.5, "t", 1) + r(112, 73, 18, 2.5, "t", 1));
};
const recorrido = () => {
  const P = [[14, 40], [40, 40], [66, 40], [92, 40], [118, 26], [118, 54], [146, 40]];
  let s = l("M14,40 H66", "la") + l("M66,40 H92 M92,40 L118,26 M92,40 L118,54 M118,26 L146,40 M118,54 L146,40");
  P.forEach(([x, y], i) => { s += i < 2 ? o(x, y, 4.5, "a") : i === 2 ? o(x, y, 6, "a") + o(x, y, 10, "la") : o(x, y, 4.5, "p"); });
  return svg(s + r(8, 74, 44, 4, "t", 1) + r(114, 70, 16, 12, "f") + r(134, 70, 18, 12, "a"));
};
const lado = () => {
  let s = "";
  [37, 51, 65].forEach((y) => { s += l(`M6,${y} H154`, "g"); });
  [8, 58, 108].forEach((x, j) => {
    s += r(x, 8, 44, 12, "f") + r(x + 4, 12, 22, 3.5, "a", 1);
    [1, 2, 3, 5].forEach((t, i) => { s += nodo(x + 3, 25 + i * 14, 38, 9, t); });
    if (j === 2) s += `<rect x="${x + 1}" y="37" width="42" height="13" rx="2" class="d"/>`;
  });
  return svg(s);
};
const investigador = () => {
  let s = "";
  ["o", "a", "d", "o"].forEach((c, i) => {
    const y = 9 + i * 13;
    s += r(8, y, 22, 8, c, 4) + r(36, y + 2.5, [70, 56, 80, 48][i], 3.5, "t", 1) + r(128, y + 3, 22, 2.5, "t", 1);
  });
  return svg(s + r(8, 64, 144, 18, "f", 3) + l("M13,69.5 L17,73 L13,76.5", "la") + r(22, 71, 80, 4, "a", 1) + r(136, 68, 8, 9, "o", 1) + r(139, 70.5, 8, 9, "f", 1));
};
const base = () => {
  let s = "";
  [8, 35].forEach((y) => { s += r(8, y, 92, 22, "f", 3) + r(8, y, 2.5, 22, "a", 1) + r(15, y + 6, 50, 3.5, "a", 1) + r(15, y + 13, 70, 2.5, "t", 1); });
  s += `<rect x="8" y="62" width="92" height="20" rx="3" class="d"/>` + r(15, 67, 2, 6, "a", 1) + r(15, 75, 2, 2, "a", 1) + r(22, 70, 60, 3, "t", 1);
  s += r(106, 8, 46, 74, "f", 3);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) s += r(111 + j * 13, 16 + i * 8, 10, 2.5, "t", 1);
  return svg(s + o(129, 64, 7, "la") + check(129, 64));
};
const perfil = () => {
  let s = "";
  [110, 80, 96, 66, 124].forEach((v, i) => {
    const y = 12 + i * 15;
    s += r(8, y - 1.5, 30, 3, "t", 1) + l(`M46,${y} H144`, "o") + r(v - 13, y - 4.5, 26, 9, "p", 2) + l(`M46,${y} H${v}`, "la") + o(v, y, 3.5, "a");
  });
  return svg(s);
};
const comparacion = () => {
  let s = "";
  [[100, "a"], [96, "a"], [70, "b"]].forEach(([w, c], i) => { const y = 9 + i * 14; s += r(8, y + 2, 22, 3.5, "t", 1) + r(36, y, w, 8, c, 2); });
  s += l("M140,13 H144 V27 H140", "la");
  s += r(8, 58, 96, 12, "a", 0) + r(104, 58, 40, 12, "b", 0) + r(144, 58, 8, 12, "o", 0) + l("M109,53 V75", "d");
  return svg(s + r(8, 78, 30, 3, "t", 1) + r(100, 78, 20, 3, "t", 1));
};
const decisiones = () => {
  const N = [[18, 16], [18, 46], [70, 10], [70, 38], [70, 64], [122, 24], [122, 56]];
  let s = [18, 70, 122].map((x) => r(x + 8, 3, 10, 3, "t", 1)).join("");
  s += l("M44,22 H57 V16 H70 M44,52 H57 V44 H70 M57,52 V70 H70 M96,44 H109 V30 H122 M96,16 H109 V30 M96,70 H109 V62 H122");
  N.forEach(([x, y], i) => { s += i === 3 ? r(x, y, 26, 12, "a") + `<rect x="${x - 2.5}" y="${y - 2.5}" width="31" height="17" rx="3" class="la"/>` : r(x, y, 26, 12, "f"); });
  return svg(s);
};
const informe = () => {
  let s = r(8, 6, 58, 78, "f", 2) + r(14, 12, 30, 4, "a", 1);
  [36, 30, 38, 26, 34, 28].forEach((w, i) => { const y = 23 + i * 10; s += r(14, y, 4, 4, "t", 1) + r(21, y + 0.8, w - 8, 2.5, "t", 1); });
  [74, 100, 126, 152].forEach((x) => { s += l(`M${x},8 V82`, "g"); });
  [[74, 30, "a"], [90, 34, "a"], [106, 30, "b"], [122, 30, "d"]].forEach(([x, w, c], i) => {
    const y = 14 + i * 16;
    s += c === "d" ? `<rect x="${x}" y="${y}" width="${w}" height="9" rx="2" class="d"/>` : r(x, y, w, 9, c, 2);
  });
  return svg(s);
};
const instrumento = () => {
  let s = "";
  [80, 64, 90, 58].forEach((w, i) => {
    const y = 12 + i * 13;
    if (i === 3) s += `<rect x="6" y="${y - 6}" width="148" height="12" rx="2" class="d"/>` + cruz(14, y);
    else s += check(14, y);
    s += r(24, y - 1.75, w, 3.5, "t", 1) + r(128, y - 1.25, 22, 2.5, "t", 1);
  });
  return svg(s + r(8, 64, 144, 18, "f", 3) + r(14, 70, 60, 3, "t", 1) + r(14, 75.5, 30, 3, "a", 1));
};
const kit = () => {
  let s = "";
  for (let i = 0; i < 8; i++) s += r(8 + i * 18.4, 8, 12, 12, `c${i + 1}`, 2);
  s += r(8, 30, 44, 14, "a", 3) + r(58, 30, 44, 14, "o", 3) + r(108, 32, 44, 10, "o", 5);
  s += nodo(8, 54, 70, 28, 2) + r(15, 60, 34, 3.5, "a", 1) + r(15, 67, 50, 2.5, "t", 1) + r(15, 73, 40, 2.5, "t", 1);
  return svg(s + r(86, 56, 30, 8, "o", 4) + r(86, 68, 30, 8, "a", 4) + r(122, 56, 30, 8, "d", 4) + r(122, 68, 30, 8, "o", 1));
};

export const MINI = { vision, nivel2, recorrido, lado, investigador, base, perfil, comparacion, decisiones, informe, instrumento, kit };
