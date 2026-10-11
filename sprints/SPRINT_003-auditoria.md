# Sprint 003 — auditoría (Big-D · «El comparador»)

**Modo:** cierre mínimo (directiva del usuario 2026-10-06 en la orden): una sola pasada, un auditor, solo lectura.
Se pagan críticos y altos; medios y bajos quedan como deuda con su sitio.
**Auditor:** un subagente independiente, que no construyó el sprint, con el diff `origin/main...HEAD` (322 archivos)
delante, el 2026-10-10. Corrió `typecheck`, `lint` y 25 archivos de prueba (335 pruebas en verde) y sondas de solo
lectura en su scratchpad.
**Veredicto de la pasada:** «requiere ajustes». 0 críticos, 2 altos (pagados), 2 medios y 7 bajos (deuda).
**Fuera de alcance por la directiva:** la fase 4 (`/instrumento`, gate de publicación, matriz de envejecimiento,
guía, manual, ADRs, `design-sync/`). **Estado, no defecto:** el perfil `data/casos/hospital-futuro.yaml` sigue en
borrador y el script de aprobación no tiene modo caso, así que la comparación real dice «no evaluable».

## Hallazgos

| id | sev. | archivo:línea | defecto | escenario | estado |
|---|---|---|---|---|---|
| AU-S3-01 | Alto | `src/lib/investigador/aprobados.ts:51-79` · `scripts/instantanea.mjs:21-26` · `src/lib/datos/cargar-conocimiento.ts:187-203` | Nada comprobaba que lo congelado en una instantánea fuera lo que aprobó una persona: la huella solo prueba que el contenido no cambió después de congelarse | Editar a mano `evi-snowflake-gobierno.yaml` (puntaje 2 → 4), congelar y revertir; o editar la instantánea y recalcular su huella. El cargador lo acepta y el caso aprobado mostraría un puntaje que nadie aprobó | **Pagado** |
| AU-S3-02 | Alto (regla 4) | `src/components/caso/Comparacion.tsx:251` | `r.orden.length >= 3` en una vista | Si cambia cuántas plataformas caben a la vez, la rejilla de pros y contras se queda en 3 sin que nada lo vea | **Pagado** |
| AU-S3-03 | Medio | `scripts/investigar/comun.mjs:72-76` · `scripts/investigar/hooks/candado.mjs:12-20` | La frontera de la aprobación se puede saltar: `CLAUDECODE` vacío pasa; `BIGD_RAIZ` hacia un enlace simbólico del repo pasa sin TTY (`resolve` no sigue enlaces); el candado no ve variantes del comando (anteponer `nice` o `command`, partir el nombre del script con comillas vacías, llamar a node por su ruta absoluta) | Un agente aprueba evidencias desde Claude Code y escribe en el repo real | Deuda |
| AU-S3-04 | Medio (regla 9) | `src/lib/investigador/evidencias.ts:41` y `:241` · `src/lib/investigador/revision.ts` (`EvidenciaVista`) | El `origen` lo declara el modelo; `"curador"` se acepta en cualquier plataforma y la revisión no lo muestra | Una propuesta real con `origen: curador` se aprueba y queda registrada como curada por una persona | Deuda |
| AU-S3-05 | Bajo | `src/engine/simulacion.ts:30` y `:213` · `src/lib/datos/conocimiento.ts:78` | `N_MAX_SIMULACION = 18` supone `aceptadas ≤ 10 000` y el esquema admite 1 000 000; la suma no pasa por `seguro` | N = 18 con `aceptadas` > ~75 000 pierde exactitud en silencio (hoy N = 4 y 10 000) | Deuda |
| AU-S3-06 | Bajo | `src/components/caso/Exploracion.tsx:131-145` · `src/engine/protocolo.ts:17-23` | El Worker no tiene `onerror` y `atender` solo atrapa los errores de `iniciar` | Si el chunk no carga o `avanzar` lanza, la robustez se queda «en curso» sin mensaje | Deuda |
| AU-S3-07 | Bajo | `src/lib/caso/respuesta.ts:11-28` frente a `src/components/caso/Exploracion.tsx:387-449` | La guarda no valida campos que la UI lee (`semillas[].*`, `clase`, `ganadora`) | Un resultado malformado del Worker rompe el render (`BigInt(NaN)`) | Deuda |
| AU-S3-08 | Bajo | `src/engine/sensibilidad.ts:19` y `:116-117` · `src/engine/tipos.ts:131` · `src/components/caso/Exploracion.tsx:258` | `PUESTOS_VIGILADOS` es en parte decorativa: `puesto-2`/`puesto-3` están cableados en el tipo | Subir la constante a 4 no vigila el 4.º y nada avisa | Deuda |
| AU-S3-09 | Bajo | `README.md:8-9` y `:16-17` · `docs/MANUAL-DE-USO.md:196-198` y `:391-393` | Frases caducadas: «el núcleo que compara llega en los próximos sprints» | El núcleo, `/base` y la comparación ya están en este build | Deuda (el manual es de la fase 4) |
| AU-S3-10 | Bajo | `src/engine/tipos.ts` · `simulacion.ts` · `protocolo.ts` | Campos sin lector: `ItemProsContras.peso/mejor/evidencia_id`, `Limitante.puntaje`, `ResultadoSimulacion.frontera/objetivo`, `progreso.semillas/intentos` (8); `Resultado.caso_id/instantanea/fecha_evaluacion` solo los lee la huella (3) | Contrato más ancho que su uso | Deuda |
| AU-S3-11 | Bajo | `scripts/hooks/gitleaks-escritura.mjs:11-15` | Con una entrada que no es JSON el hook sale con 0, contra su «falla cerrado» | Casi teórico: Claude Code siempre manda JSON | Deuda |

**Nota sobre AU-S3-03.** Al escribir este informe, el candado bloqueó el comando de escritura porque citaba
literalmente la variante con comillas vacías. Así que, al menos en esa forma, la ve: la sonda del auditor no coincide
del todo con lo observado. Al pagar el hallazgo hay que volver a sondear cada variante con el hook real.

## Pagos (2026-10-10)

- **AU-S3-01.**
  - `instantaneasSinAprobacion(dir)` en `src/lib/investigador/aprobados.ts`: cada evidencia de cada instantánea tiene
    la huella que guardó alguna línea de `data/revisiones/evidencias/`.
  - `scripts/instantanea.mjs` se niega si `evidenciasSinAprobacion` encuentra algo, y su ensayo en copia exige
    `instantaneasSinAprobacion` vacía.
  - La base sembrada (`tests/unit/lib/base-futuro.ts`) escribe la revisión de cada plataforma.
  - Pruebas: `evidencias-aprobadas.test.ts` (la instantánea del repo, y una manipulada con la huella recalculada que
    el cargador acepta y esta comprobación no) y `instantanea-script.test.ts` (una edición sin aprobar, y una
    instantánea anterior manipulada que detiene la nueva).
  - Rojo con `scripts/demo-rojo.sh --debe-nombrar --minimo-tests`, los tres con exit 0:
    - la condición de `instantaneasSinAprobacion` → `false &&`: nombró «un puntaje cambiado en la instantánea» (verde, 6);
    - sin la negativa previa del script: nombró «no congela una evidencia editada que nadie aprobó» (verde, 7);
    - sin la comprobación del ensayo: nombró «una instantánea anterior manipulada» (verde, 7).
- **AU-S3-02.** `Comparacion.tsx` usa `POR_PAGINA` (`src/lib/atlas/estado-lado.ts`, la constante declarada de la
  vista). `grep -nE "length >= 3" src/components/caso/Comparacion.tsx` no devuelve nada; `ui/caso.test.tsx` en verde.

## Revisado y limpio (según el auditor)

- **Regla 1:** el núcleo es puro y entero (G2, aislamiento) y sus huellas se comparan en Node y en tres navegadores.
- **Simulación y sensibilidad:** el muestreo es uniforme y exacto; la sensibilidad tiene un oráculo de fuerza bruta.
- **Regla 2:** sin `fetch` a proveedores. El comando lo arma la pantalla, con validación de carpeta e ids.
- **Reglas 3, 5, 6, 9 y 12:** sin hallazgos.
- **Cero enlaces y CSP:** el barrido no encontró enlaces y no hay `style=` en `src/`.
- **Escrituras y contratos:** las aprobaciones e instantáneas escriben de forma atómica y con ensayo. El contrato del
  Worker tiene fixture, Zod y e2e de la costura. La perilla `BIGD_DATOS` está fuera de producción.
