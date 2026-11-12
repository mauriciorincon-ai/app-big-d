---
sprint: 008
app: big-d
hito: H-2 «El caso se mueve (apertura del H-2)»
opened: 2026-11-11
closed: 2026-11-11
branch: sprint-008/el-caso-se-mueve
pr: pendiente
---

# Sprint 008 · cierre

- **Resultado:** D3 (duplicar), D2 (diferencias entre instantáneas) y D7 (comparar por pares) construidos; guía S8, manual ES/EN, export y brochure al día. **Construido; gate humano pendiente (STOP).**
- **Tiempo:** estimado 4 h. `node scripts/horas-sprint.mjs` (`origin/main..HEAD`):

| Commits | Sesiones | Horas activas | Span |
|---:|---:|---:|---|
| 26 | 1 | 2,1 h | 2026-11-11 18:25 → 2026-11-11 20:04 (1,6 h) |

| Fase | Commits | Horas activas |
|---|---:|---:|
| F1 | 12 | 0,7 h |
| F2 | 4 | 1,0 h |
| F3 | 10 | 0,5 h |

- **Diferencia:** −1,9 h frente a las 4 h (−48 %).
- **Modelo por fase:** F1 Sonnet 5.5 · F2 Opus 5.5 medium · F3 Sonnet 5.5 medium · cierre Haiku 5.5 low. Sin desvío. Haiku solo redactó este cierre.
- **Relevos:** ninguno.
- **Tokens:** 4 Explore (Haiku 5.5) y 2 general-purpose (una auditoría Sonnet 5.5 en solo lectura y una lectura de código). Pedidos: `/model opus` (F2), `/compact` (F2→F3), `/model claude-haiku-5-5` y `/effort low` (cierre).
- **Verificación:** tsc y lint limpios. Vitest 2248 pasan, 1 omitido, 97,89 % líneas. e2e 1176 pasan, 9 omitidos (determinismo, corre aparte), 0 fallan. Determinismo 9/9.
- **Servidores:** `lsof` LISTEN en este repo: 0 (el test-server de la extensión Playwright de VS Code no cuenta).
- **Huellas:** `NUCLEO.SHA256SUMS`: F1 cambió 6 `simulacion-*`; F2 añadió 5 `pares-*`. `CONTRATO.lock`: sin cambios.
- **F1 (id → commit):** M3 6c37817 · M5 1658801 · B2 000e37a · B3 8cec09b · B4 177d30a · B5, B6 285b9fd · B10 5b65e02 · 026-1 3d81f87, 26d47db · 026-2 3d81f87 · 026-3 ab7565d, 2b5cdf2 (next 16.4.3, #23 en main; la base sembrada se construye en la CI de este PR) · 026-5 22201fc.
- **F2:** 2036b92 · a10a0ec · e0640e5 · 5cfab92. **F3:** 36e1d26 (guía y manual) · 0cc9440, f24a776 (export y brochure).
- **Auditoría** (4 casillas, Sonnet 5.5, solo lectura): alcance completo salvo lo declarado. Pagados: A-1, M-5, B-4, B-5 · a7cff96; M-1 · b3d715d; M-2 · e1e24e7; M-3, B-1, B-2 · 04eb4a0; M-4 · 645102d; M-7 · d105330; M-8, B-8, B-9 · a6fb3f3. Declarados (preguntas del STOP): M-6, B-3, B-6, B-7.
- **Desviaciones:** la matriz `cubre` pasa a S10, según el manifiesto. El origen de los pares no se persiste: la propuesta vive en la URL.
- **Aprendizaje:** con el dato real aprobado, los e2e de edición no corren; el ensayo en copia sigue siendo manual.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint big-d`.
