# Big-D — Manual de uso · User manual

> **Documento vivo.** Toda función que llega a `main` se documenta aquí en el mismo sprint (la regla «manual de uso
> vivo» del CLAUDE.md).
> Está escrito para quien usa la app, en lenguaje llano; al lanzarla, es la base de la guía pública. Va en dos
> idiomas, redactado en cada uno: primero en español y después en inglés.
>
> _Living document: every feature that reaches `main` is documented here in the same sprint. Spanish first, then
> English, each written on its own._

**Contenido · Contents:** [Español](#español) · [English](#english)

---

## Español

### Qué es Big-D

Big-D explica las plataformas de datos (hoy Databricks, Microsoft Fabric y Snowflake, más la Plataforma Ejemplo,
ficticia, que viene del contrato del diagramador y muestra el mapa completo) **con un mismo mapa**: las mismas capas,
los mismos colores y los mismos símbolos para todas. Así puedes entender una plataforma de punta a punta y
compararlas lado a lado sin aprender un dibujo nuevo cada vez. Todo lo que dice el mapa viene de documentación pública del fabricante, con fecha, y lo aprobó una
persona; cada afirmación lleva su cita y su decisión registrada. Big-D **planea, gestiona y controla; jamás opera una plataforma**: no se conecta
a ninguna ni pide cuentas.

### Primeros pasos

1. Abre la app. La portada está en español; **ES / EN**, arriba a la derecha, la cambia al inglés (y te deja en la
   misma página).
2. En el campo **«Plataforma»** elige una. Si alguna todavía no tiene mapa, dice «pronto» y no se puede elegir.
3. Llegas a la **visión general** de esa plataforma. Desde ahí, las pestañas «Nivel de lectura» llevan a los demás
   niveles.
4. **Oscuro / Claro**, arriba a la derecha, cambia el tema. La app recuerda tu elección; si nunca elegiste, usa el
   tema de tu sistema.

### Funciones

#### 1. Visión general (nivel 1) · desde el Sprint 1

- **Qué hace:** muestra la plataforma entera para líderes. Se lee de izquierda a derecha, como el camino que recorre
  un dato. Cada capa responde una pregunta («¿De dónde vienen los datos?», «¿Cómo entran?»…) y las franjas de
  abajo, como el gobierno o la operación, abarcan todas las capas. Cada bloque dice cuántos componentes tiene; el
  encabezado dice qué tan al día está la información del mapa.
- **Cómo se usa:**
  1. Recorre el mapa de izquierda a derecha. En un teléfono, **desliza el mapa de lado** con el dedo o usa
     **«Ir a una capa»**.
  2. **Toca un bloque** para abrir su ventana, **«Dentro del bloque»**. Ahí están sus componentes dibujados como en
     «Componentes»: si se conectan, una línea los une; si son independientes, aparecen sueltos. Debajo hay una
     tarjeta por componente, con su tipo, su madurez, su frase y todas sus conexiones.
  3. Cierra la ventana con **«Cerrar»** o con la tecla **Esc**. El enlace del final lleva a «Componentes».
  4. La **leyenda**, al pie del mapa, explica cada color, símbolo y tipo de línea.
- **Cómo leer los estados:** el encabezado del mapa dice su vigencia con un símbolo y un texto: **«vigente ·
  verificado hace N días»**, o cuántos bloques están por revisar o vencidos. Un bloque o un componente solo lleva
  una insignia cuando su información está **«por revisar»** (desde los 30 días: un triángulo de precaución con «!» y
  los días, «34 d») o **«vencido»** (desde los 60: la insignia rellena, con una equis y los días), nunca solo un
  color. Lo vigente no lleva insignia. Si en una fila de referencias ya
  no cabe todo, los nombres se abrevian con «…»; el nombre entero sigue en la ficha y en la lectura en texto.
- **Limitaciones:** el mapa muestra lo que se aprobó; si una capa aún no tiene componentes, aparece vacía, no
  inventada.

#### 2. Componentes (nivel 2) · desde el Sprint 1

- **Qué hace:** el mismo mapa, un nivel adentro. Cada bloque se abre en sus componentes, para expertos. Cada
  componente muestra su tipo (color, símbolo y etiqueta), su madurez y cuántas fuentes lo respaldan.
- **Cómo se usa:** toca un componente para leer su **ficha**:
  - qué hace y por qué importa;
  - los términos que conviene conocer (los del glosario van marcados);
  - su madurez;
  - sus **fuentes**, con la fecha en que se verificaron y se consultaron, y si son del fabricante o de terceros.

  En pantalla ancha la ficha se abre a la derecha; en un teléfono sube desde abajo. Esc o «Cerrar» la cierran.

- **Limitaciones:** las fuentes son documentación pública; Big-D no prueba los productos por su cuenta.

#### 3. Recorrido de un dato (nivel 3) · desde el Sprint 1

- **Qué hace:** sigue un dato de ejemplo (en Fabric, un registro de admisión de un hospital ficticio) desde que
  nace hasta que alguien lo usa, paso a paso sobre el mismo mapa.
- **Cómo se usa:**
  - **«Siguiente»**, **«Anterior»** o las flechas ← → del teclado mueven el paso. El número y el componente del
    paso se marcan, y la lista **«Los pasos»** cuenta qué pasa en cada uno.
  - Donde el camino se divide (por ejemplo, 6a y 6b), la lista dice si las ramas ocurren a la vez o si el dato
    sigue por una sola.
  - **Toca un componente** del camino para saltar a su paso y abrir su ficha a la derecha.
  - **«Reproducir»** avanza solo y **«Pausar»** lo detiene. **«Ver todos»** vuelve a mostrar el camino entero.
- **Limitaciones:** si tu sistema tiene activado **«Reducir movimiento»**, «Reproducir» no aparece; lo demás
  funciona igual.

#### 4. Lectura en texto y teclado · desde el Sprint 1

- **Qué hace:** todo lo que dice un mapa también está escrito, en **«Lectura en texto»**, como una lista de capas,
  bloques, componentes, conexiones y pasos. Sirve con lector de pantalla o si prefieres leer.
- **Cómo se usa:**
  - Con **Tab** llegas a «Saltar al contenido» y a «Saltar el diagrama».
  - Dentro del mapa, Tab recorre los bloques o componentes, y **Enter o Espacio** abre su ventana o su ficha.

#### 5. Varias plataformas con el mismo mapa · desde el Sprint 1

- **Qué hace:** Big-D está hecho para cualquier número de plataformas. Hoy tienen mapa **Databricks**, **Microsoft
  Fabric** y **Snowflake** (desde el Sprint 2), y la **Plataforma Ejemplo**, que es ficticia y sirve para ver el
  mapa sin depender de ningún fabricante. Una plataforma que todavía no tenga mapa dice «pronto».
- **Cómo se usa:** cambia de plataforma en el campo «Plataforma»: te quedas en el mismo nivel de lectura.

#### 6. El investigador: cómo entra el conocimiento · desde el Sprint 1

- **Qué hace:** el conocimiento de cada plataforma lo **propone** una inteligencia artificial, con una cita textual
  de la documentación del fabricante por cada afirmación, y lo **aprueba una persona**. La app nunca usa
  inteligencia artificial mientras la miras.
- **Cómo se usa:**
  1. Entra a **Conocimiento → Investigador** y elige la plataforma. Vas a ver:
     - su **vigencia por capa**, con semáforo de símbolo, texto y días;
     - si ya tiene mapa aprobado, que lo aprobó una persona y cuándo (la fecha, en UTC).
  2. Si no tiene mapa, o si una capa está por revisar o vencida, toca **«Solicitar investigación»**. Se abre GitHub en
     otra pestaña con la solicitud ya escrita (por ejemplo «Investigar Databricks»); al confirmarla queda guardada
     como tarea del repositorio de Big-D, con su fecha. La tarea es pública y solo lleva el nombre de la plataforma.
     La app no investiga nada: quien atiende la tarea corre la investigación en su sesión de Claude Code (la tarea
     trae el comando exacto, por ejemplo `/investigar databricks`) y la cierra cuando el mapa se aprueba.
  3. Cuando llega una propuesta, esta pantalla la muestra en tres grupos:
     - **«Necesitan tu decisión»:** el código no pudo comprobar la cita.
     - **«Citas verificadas»:** aprobadas de entrada; puedes rechazarlas.
     - **«Rechazadas por el código»:** la cita no está en la fuente.

     Cada afirmación dice de qué componente o conexión habla, y trae su cita y su fuente. Marca **Aprobar** o
     **Rechazar** en cada una.

     Si la propuesta quita algo que el mapa aprobado tenía, aparece en **«Se retiran del mapa»**, y cada retiro
     dice por qué sale: con una cita de la documentación del fabricante que el código verificó, o porque sale uno
     de sus extremos (una conexión no se queda con un solo lado). Si la cita de un retiro no aparece en la fuente,
     la propuesta no se puede aprobar y la página no arma el comando: hay que volver a investigar.

  4. Cuando no falte ninguna, copia el comando de **«Aprobar lo marcado»** y córrelo en una terminal abierta en la
     carpeta del proyecto. Solo una persona puede correrlo: la inteligencia artificial tiene un candado que se lo
     impide. El mapa aprobado se publica en el siguiente build, y la aprobación queda en el historial. Si la
     plataforma ya tenía mapa, la versión anterior se guarda tal como se aprobó y aparece en **«Versiones del mapa»**
     (función 8).
- **Limitaciones:**
  - Abre la terminal tú mismo. Una terminal que abrió la inteligencia artificial lleva su marca, y el candado la
    rechaza con «solo una persona aprueba».
  - Algunos sitios cortan la conexión cuando el código intenta comprobar la cita; esa afirmación llega a «Necesitan
    tu decisión» y la decides tú, abriendo la fuente.
  - Las preguntas guía sin fuente quedan abiertas: no se inventan respuestas.
  - Una base con un dato incompleto (por ejemplo, un componente sin fecha de verificación) **no se publica**: el
    build se detiene y dice qué falta y dónde.
  - La base de conocimiento tiene su propia pantalla: ver la sección 9.

#### 7. Lado a lado · desde el Sprint 2

- **Qué hace:** pone todas las plataformas en el mismo mapa, una por fila, con cada banda en la misma columna para
  todas. Se lee por columnas: una banda, todas las plataformas. Un bloque punteado dice que esa plataforma no tiene
  componentes en esa banda.
- **Cómo se usa:**
  1. Entra a **Atlas** y toca la pestaña **«04 Lado a lado»**.
  2. **«Plataformas: N de N»** abre la lista para elegir cuáles comparar; al menos una queda elegida. Van en orden
     alfabético por su identificador, sin trato especial para ninguna.
  3. En pantalla ancha se ven tres a la vez. Con más, **«Anterior»** y **«Siguiente»** pasan de página.
  4. **«Desplegar todo»**, arriba a la derecha del recuadro del mapa, abre los componentes de todas las bandas en
     el mismo dibujo, sin mover las columnas. **«Contraer todo»** vuelve a los bloques.
  5. Toca un bloque para abrir su ventana; con todo desplegado, toca un componente para leer su ficha.
  6. En un teléfono el mapa va de una banda a la vez: elige la banda en las pestañas de arriba. Cada plataforma
     muestra sus bloques, y cada bloque se abre en sus componentes.
  7. La dirección de la página guarda qué plataformas elegiste y en qué página estás, y **ES / EN** las conserva.
  8. Debajo del mapa, la leyenda explica colores, trazos, madurez y vigencia; su nota de marcas nombra las
     plataformas reales que aparecen.
- **Limitaciones:**
  - El lado a lado compara qué hay en cada banda; las conexiones entre componentes se ven en el mapa de cada
    plataforma.
  - Cada fila dice qué tan al día está su plataforma; las fechas pueden ser distintas entre filas.

#### 8. Versiones del mapa · desde el Sprint 2

- **Qué hace:** muestra qué cambió entre una versión aprobada del mapa de una plataforma y la siguiente. Cada versión
  la aprobó una persona y se guarda tal como se aprobó.
- **Cómo se usa:**
  1. En cualquier vista del atlas de una plataforma, toca **«ver versiones»**, junto a la versión del mapa, en el
     encabezado.
  2. Cada par de versiones muestra dos filas del lado a lado: arriba la anterior y abajo la nueva. Cada cambio lleva
     una marca con símbolo y palabra: **«+ nuevo»**, **«− retirado»** (en la fila de la versión anterior),
     **«→ renombrado»** y **«madurez»**. Debajo, una lista explica cada cambio.
  3. **«Lo que dicen los componentes»** cuenta lo que cambió sin cambiar el dibujo: qué componentes cambiaron su
     texto y cuántos renovaron sus fuentes (otra fuente; la misma consultada otro día no cuenta).
  4. Toca un bloque de cualquiera de las dos filas para ver sus componentes en esa versión.
- **Limitaciones:**
  - Si el mapa tiene una sola versión, la página lo dice y no muestra un dibujo.
  - Si las reglas de hoy ya no pueden dibujar una versión vieja, la página la nombra («aprobada y archivada; las
    reglas de hoy ya no la dibujan») y no la compara.
  - El dibujo solo marca lo que cambia el mapa: componentes nuevos, retirados, renombrados o con otra madurez, y
    bloques nuevos, retirados o renombrados. Por
    eso, de la v0.1.0 a la v0.2.0 de Fabric dice «Sin cambios en el dibujo», y lo que cambió (el texto de seis
    componentes y las fuentes de nueve) aparece en «Lo que dicen los componentes». De la v0.2.0 a la v0.3.0 sí
    cambió el dibujo: dos componentes nuevos en «Gobierno y seguridad».
  - Si un bloque cambia de nombre, la página lo marca como «renombrado» y dice su nombre anterior (desde el sprint 3).
    Le pasa a Databricks, cuyo bloque «Tableros» se llama «Tableros y aplicaciones» desde la v0.2.0.

#### 9. La base de conocimiento · desde el Sprint 3

- **Qué hace:** muestra lo que Big-D sabe, en archivos legibles y con huella: criterios, evidencias, la escala de madurez y cada instantánea de la base.
- **Cómo se usa:**
  1. En la barra, abre «Conocimiento» y elige «Base de conocimiento».
  2. **Evidencias:** cada una muestra su puntaje, su madurez, su fuente y la cita que la respalda. Solo entran a la comparación las que una persona aprobó.
  3. **Escala y convenciones:** la escala tiene cinco niveles, de 0 a 4, y la pantalla dice qué pasa en un empate.
  4. **Instantáneas:** una tabla con la versión, la fecha y la huella. La primera dice «vigente».
  5. **Vigencia:** una evidencia pasa a «por revisar» a los 30 días de su verificación y a «vencida» a los 60.
- **Limitaciones:**
  - La base no se edita desde la app. Sus datos son archivos en la carpeta `data/`, y cada aprobación queda registrada.
  - Si un dato está incompleto (por ejemplo, una evidencia sin fecha de verificación), la base no carga: la pantalla dice qué falta y dónde.

#### 10. El perfil del caso · desde el Sprint 3

- **Qué hace:** el perfil de un caso de decisión: los pesos de cada criterio (que suman 100), su rango de incertidumbre, las restricciones que eliminan plataformas y las decisiones que suelen quedar sin discutir. El caso de ejemplo es un hospital ficticio.
- **Cómo se usa:**
  1. En la barra, abre «Caso» y luego «Perfil del caso».
  2. Mientras el perfil está en **borrador**, cada peso dice quién lo propuso. Puedes cambiar los pesos (en puntos, con dos decimales), sus rangos, marcar las restricciones que aplicas y responder cada decisión implícita.
  3. La pantalla suma los pesos mientras escribes. El comando aparece solo cuando la suma es 100,00 y todas las decisiones tienen respuesta; el botón «Aprobar perfil» queda deshabilitado, porque la vía es el comando.
  4. Entonces la pantalla arma un comando con tus respuestas. Cópialo con su botón, abre Terminal tú mismo en la carpeta del proyecto, pégalo con Cmd+V y pulsa Enter. Solo una persona lo ejecuta: la app no aprueba nada.
  5. Vuelve a construir la app con `pnpm build` y abre la página. El perfil aparece con el sello «aprobado» y en solo lectura.
- **Limitaciones:**
  - El comando sale de la pantalla, y solo de ella: no lo copies de este manual ni de otro lugar. Si el perfil cambió después de armarlo, el comando se niega y hay que copiar el nuevo desde la pantalla.
  - Un perfil aprobado que alguien edita a mano se rechaza al cargar.

#### 11. La comparación · desde el Sprint 3

- **Qué hace:** compara las plataformas del caso con su perfil aprobado y con la evidencia aprobada. Si el perfil no está aprobado, no puntúa y dice por qué.
- **Cómo se usa:**
  1. En el caso, abre «Comparación».
  2. **Con el perfil en borrador:** la pantalla dice «La comparación no se calcula» y el motivo: el perfil está en borrador. Un enlace lleva a la base de conocimiento.
  3. **Con el perfil aprobado:** cada plataforma aparece con su puntaje, su fecha de evaluación y la instantánea que usó. Eliges la vista: Totales, Sensibilidad, Robustez o Pros y contras.
  4. Las plataformas que una restricción elimina aparecen como eliminadas, con la razón.
  5. Las alertas de vigencia se calculan contra la fecha de evaluación del perfil, no contra la de hoy.
- **Limitaciones:**
  - Big-D no recomienda una plataforma: muestra el resultado con sus supuestos, y la decisión es de quien pregunta.
  - Quien repita el cálculo con el mismo perfil y la misma base obtiene los mismos bytes.

#### 12. El instrumento · desde el Sprint 4

- **Qué hace:** dice si puedes confiar en la herramienta antes de publicar. Corre casos con respuesta conocida, propiedades matemáticas, siete errores sembrados y la comprobación de que lo aprobado no se editó a mano. Si algo falla, no se publica nada.
- **Cómo se usa:**
  1. En la barra, abre «Instrumento».
  2. Lee el estado: «Validación en verde: se puede publicar» o «Validación en rojo». Cada fila dice si pasó.
  3. En **errores sembrados** ves cuántos de los siete errores deliberados detectó la herramienta. Debe decir «7 de 7 detectados».
  4. Para publicar, corre `pnpm build` en la carpeta del proyecto. Si la validación falla, el build se detiene, no queda nada que publicar y la pantalla dice «No se publica» con lo que hay que corregir.
- **Limitaciones:**
  - La validación corre sobre la base que se va a publicar. Si abres la app sin haber corrido `pnpm build`, la pantalla dice que no hay validación y te pide correrlo.
  - Las propiedades son las mismas que prueba la suite de pruebas: no hay dos versiones de la verdad.

#### 13. Las decisiones del caso · desde el Sprint 5

- **Qué hace:** muestra las decisiones que el caso tiene que tomar, en el orden en que conviene tomarlas: primero las que son de una sola vía (rehacerlas cuesta migrar datos, rediseñar permisos o renegociar un contrato). Para cada decisión, su ficha dice cómo la resuelve cada plataforma y con qué evidencia. Debajo, los riesgos ordenados por prioridad de acción y los supuestos con su prueba barata.
- **Cómo se usa:**
  1. En el caso, abre «Decisiones y riesgos».
  2. Lee el diagrama: cada decisión es una tarjeta. Las de borde grueso son de una sola vía y se deciden primero; las de borde discontinuo son costosas de revertir; las de borde fino se pueden revertir. Toca una tarjeta para abrir su ficha.
  3. En la ficha, cada plataforma tiene su opción y la evidencia que la sostiene. «Opción recomendada» aparece cuando el perfil del caso está aprobado; mientras no, la pantalla dice por qué no hay recomendación.
  4. En «Riesgos», la tabla ordena por prioridad de acción (alta, media, baja) y después por severidad. Una acción alta sin mitigación queda marcada y bloquea la aprobación del plan.
  5. Si hay un ciclo de dependencias, la pantalla lo muestra con su camino («a → b → a») en lugar de esconderlo. Para resolverlo hay que quitar una de sus flechas.
  6. Para aprobar el plan, la pantalla arma un comando solo si no hay bloqueos. Cópialo y córrelo tú, en la carpeta del proyecto. Solo una persona lo ejecuta: la app no aprueba nada.
- **Limitaciones:**
  - Severidad, ocurrencia y detección son juicio, no evidencia: las propone el agente con su razón, y quien aprueba el plan las hace suyas.
  - La prueba barata de un supuesto es una tarea para el equipo del caso: la app la registra, con responsable y fecha, pero no la ejecuta ni se conecta a ninguna plataforma.
  - Una opción sin fuente aparece marcada con «Sin fuente en la base» y la pantalla no afirma nada de ella; no se inventa un respaldo.
  - Un plan aprobado que alguien edita a mano se rechaza al cargar.

#### 14. El informe del caso · desde el Sprint 6

- **Qué hace:** reúne el caso entero en una página: la hoja de ruta por fases, con cada ítem, su origen y el criterio para darlo por cumplido; la lista de alistamiento por categoría; y el informe de catorce secciones en español e inglés, con las mismas cifras en los dos. Se puede imprimir: el papel sale sin menús, pestañas ni botones.
- **Cómo se usa:**
  1. En el caso, abre la pestaña «Hoja de ruta e informe».
  2. Si el perfil o el plan siguen en borrador, una banda arriba dice por qué. Con el perfil en borrador la comparación no puntúa, y la sección 3 del informe lo dice.
  3. La hoja de ruta reparte el trabajo en fases. La fase 0 son las pruebas baratas de los supuestos que sostienen una decisión de una sola vía; después, una fase por onda de decisiones. Cada ítem dice «viene de» una decisión, una mitigación o un supuesto: toca ese enlace para ir a su explicación.
  4. Un ciclo de dependencias deja a las decisiones sin fase, con su camino, hasta que se resuelva.
  5. El resumen (sección 1) cuenta las decisiones de una sola vía y los riesgos de prioridad alta, con cifras y en pocas palabras.
  6. Para imprimir, toca «Imprimir» y elige la impresora o «Guardar como PDF» en el diálogo del navegador.
- **Limitaciones:**
  - El informe no decide ni recomienda por sí solo. Su texto sale de plantillas revisadas y de los datos aprobados, nunca de un modelo de lenguaje.
  - La hoja de ruta no trae semanas ni fechas: el plan no las tiene y la app no las inventa.
  - El relato de fracaso generado es una plantilla y va marcado como generado. Un relato humano aparece solo si alguien lo escribe: un archivo `data/casos/<caso>/relato-de-fracaso.yaml` con `caso_id`, `texto` (en español y en inglés), `escrito_por`, `fecha` y `origen: declarado-por-usuario`. Si el archivo no existe, la sección dice «sin relato humano».
  - La prueba barata de un supuesto sigue siendo una tarea del equipo: el informe la registra, pero no la ejecuta.

### Preguntas frecuentes

- **¿Big-D recomienda una plataforma?** No decide por ti. Compara con tus pesos y tu evidencia, muestra la sensibilidad del resultado a esos pesos y deja la decisión a quien pregunta. Mientras el perfil del caso de ejemplo esté en borrador, su comparación no se calcula: hace falta que una persona apruebe el perfil (sección 10).

- **¿Por qué no hay logos?** Para no favorecer a ningún fabricante. El color del mapa dice qué capacidad es, nunca
  de quién. Los nombres comerciales se usan solo para identificar productos.
- **¿Quién escribió lo que dice el mapa?** Lo propuso el investigador, con citas comprobadas por código, y una
  persona lo aprobó; la decisión sobre cada afirmación queda registrada. El autor declara que conoce Fabric más a fondo que las demás
  plataformas.

### Historial

| Sprint          | Funciones añadidas a este manual                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 (2026-09-29) | 1 Visión general, con la ventana de un bloque · 2 Componentes · 3 Recorrido de un dato · 4 Lectura en texto y teclado · 5 Varias plataformas con el mismo mapa · 6 El investigador |
| S2 (2026-10-04) | 5 al día: Databricks, Fabric y Snowflake con mapa · 6 la versión anterior se guarda al aprobar · 7 Lado a lado · 8 Versiones del mapa                                              |
| S3 (2026-10-10) | 9 La base de conocimiento · 11 La comparación (no puntúa mientras el perfil esté en borrador)                                                                                      |
| S4 (2026-10-11) | 10 El perfil del caso (se aprueba desde su pantalla) · 12 El instrumento (validación antes de publicar)                                                                            |
| S5 (2026-10-11) | 13 Las decisiones del caso: ondas, fichas con evidencia, riesgos por prioridad y supuestos (se aprueba el plan desde su pantalla)                                                  |
| S6 (2026-10-11) | 14 El informe del caso: hoja de ruta por fases con su origen, alistamiento, informe de catorce secciones en dos idiomas e impresión                                                |

---

## English

### What Big-D is

Big-D explains data platforms (today Databricks, Microsoft Fabric and Snowflake, plus the Example Platform, a
fictional one that comes from the diagramador's contract and shows the full map) **with one shared map**: the same
layers, colours and symbols for all of them. You can understand a platform end to end and compare platforms side by
side without learning a new drawing each time. Everything on the map
comes from the vendor's public documentation, dated, and a person approved it; every claim carries its quote and its
recorded decision. Big-D **plans,
manages and controls; it never operates a platform**: it connects to none and asks for no accounts.

### Getting started

1. Open the app. The home page is in Spanish; **ES / EN**, top right, switches to English and keeps you on the
   same page.
2. Pick a platform in the **“Platform”** field. A platform without a map yet says “coming soon” and cannot be picked.
3. You land on that platform's **overview**. From there, the “Reading level” tabs take you to the other levels.
4. **Dark / Light**, top right, changes the theme. The app remembers your choice; until you choose, it follows your
   system.

### Features

#### 1. Overview (level 1) · since Sprint 1

- **What it does:** shows the whole platform, for leaders. You read it left to right, like the road a piece of
  data travels. Each layer answers one question (“Where does the data come from?”, “How does it get in?”…). The
  bands at the bottom, such as governance or operations, span every layer. Each block tells how many components it
  holds; the header tells how current the map's information is.
- **How to use it:**
  1. Read the map from left to right. On a phone, **swipe the map sideways** or use **“Go to a layer”**.
  2. **Tap a block** to open its window, **“Inside the block”**. Its components are drawn as in “Components”: a
     line joins the ones that connect; independent ones stand apart. Below, one card per component shows its type,
     maturity, summary and every connection.
  3. Close it with **“Close”** or the **Esc** key. The link at the end takes you to “Components”.
  4. The **legend**, under the map, explains every colour, symbol and line style.
- **Reading the states:** the map's header gives its freshness as a symbol and a word: **“current · verified N
  days ago”**, or how many blocks are to review or expired. A block or a component carries a badge only when its
  information is **“to review”** (from 30 days: a warning triangle with “!” and the days, “34 d”) or **“expired”**
  (from 60: a filled badge with a cross and the days), never colour alone. Current information carries no badge. When a row of references no longer fits, names are
  shortened with “…”; the full name stays in the card and in the text reading.
- **Limitations:** the map shows what was approved; a layer with no components yet stays empty, never invented.

#### 2. Components (level 2) · since Sprint 1

- **What it does:** the same map, one level in, for experts. Each block opens into its components. Each component
  shows its type (colour, symbol and label), its maturity and how many sources back it.
- **How to use it:** tap a component to read its **card**:
  - what it does and why it matters;
  - the terms worth knowing (glossary terms are marked);
  - its maturity;
  - its **sources**, with the dates they were verified and checked, and whether each is the vendor's or a third
    party's.

  On a wide screen the card opens on the right; on a phone it slides up from the bottom. Esc or “Close” closes it.

- **Limitations:** sources are public documentation; Big-D does not test the products itself.

#### 3. A datum's journey (level 3) · since Sprint 1

- **What it does:** follows one sample piece of data, step by step on the same map, from where it is born to where
  someone uses it. In Fabric it is an admission record from a fictional hospital.
- **How to use it:**
  - **“Next”**, **“Previous”** or the ← → keys move the step. The step's number and component are highlighted, and
    **“The steps”** says what happens at each one.
  - Where the road splits (for instance, 6a and 6b), the list says whether the branches happen at the same time or
    the data takes only one.
  - **Tap a component** on the road to jump to its step and open its card on the right.
  - **“Play”** advances on its own and **“Pause”** stops it. **“Show all”** brings the whole road back.
- **Limitations:** with **“Reduce motion”** turned on in your system, “Play” is not shown; everything else works
  the same.

#### 4. Reading in text and the keyboard · since Sprint 1

- **What it does:** everything a map says is also written out, under **“Reading in text”**, as a list of layers,
  blocks, components, connections and steps. It works with a screen reader, or if you simply prefer reading.
- **How to use it:**
  - **Tab** reaches “Skip to content” and “Skip the diagram”.
  - Inside the map, Tab moves through blocks or components, and **Enter or Space** opens a window or a card.

#### 5. Many platforms, one map · since Sprint 1

- **What it does:** Big-D is built for any number of platforms. Today **Databricks**, **Microsoft Fabric** and
  **Snowflake** have maps (since Sprint 2), and so does the **Example Platform**. The Example Platform is fictional,
  so you can see the map without any vendor. A platform with no map yet says “coming soon”.
- **How to use it:** switch platforms in the “Platform” field; you stay on the same reading level.

#### 6. The researcher: how knowledge gets in · since Sprint 1

- **What it does:** an AI **proposes** each platform's knowledge, with one quote from the vendor's documentation
  for every claim. A **person approves** it. The app never uses AI while you look at it.
- **How to use it:**
  1. Go to **Knowledge → Researcher** and pick a platform. You will see:
     - its **freshness per layer**, as a signal with a symbol, a word and the days;
     - if it already has an approved map, that a person approved it and when (the date, in UTC).
  2. If it has no map, or a layer is to review or expired, tap **“Request research”**. GitHub opens in another tab
     with the request already written (for example “Research Databricks”); once you confirm it, it is kept as a
     task of the Big-D repository, with its date. The task is public and only carries the platform's name. The
     app researches nothing: whoever handles the task runs the research in their Claude Code session (the task
     carries the exact command, for example `/investigar databricks`) and closes it once the map is approved.
  3. When a proposal arrives, this screen shows it in three groups:
     - **“Need your decision”:** the code could not check the quote.
     - **“Quotes verified”:** approved to start with; you can reject them.
     - **“Rejected by the code”:** the quote is not on the source page.

     Every claim says which component or connection it is about, and shows its quote and its source. Mark
     **Approve** or **Reject** on each one.

     If the proposal drops something the approved map had, it appears under **“Removed from the map”**, and
     each removal says why it leaves: with a quote from the vendor's documentation that the code verified, or
     because one of its ends leaves (a connection cannot keep only one side). If a removal's quote is not in the
     source, the proposal cannot be approved and the page does not build the command: it has to be researched
     again.

  4. When nothing is left to decide, copy the **“Approve what is marked”** command and run it in a terminal opened
     in the project folder. Only a person can run it: a lock stops the AI. The approved map goes live on the next
     build, and the approval stays in the history. If the platform already had a map, the previous version is kept
     exactly as approved and shows up in **“Map versions”** (feature 8).
- **Limitations:**
  - Open the terminal yourself. A terminal the AI opened carries its mark, and the lock turns it down with “only a
    person approves”.
  - Some sites cut the connection when the code tries to check a quote; that claim lands in “Need your decision”,
    and you decide by opening the source.
  - Guiding questions without a source stay open; no answer is made up.
  - A base with an incomplete record (say, a component with no verification date) **is not published**: the build
    stops and says what is missing and where.
  - The knowledge base has its own screen: see section 9.

#### 7. Side by side · since Sprint 2

- **What it does:** puts every platform on the same map, one per row, with each band in the same column for all of
  them. You read it by columns: one band, every platform. A dotted block means that platform has no components in
  that band.
- **How to use it:**
  1. Go to **Atlas** and tap the **“04 Side by side”** tab.
  2. **“Platforms: N of N”** opens the list to choose which to compare; at least one stays chosen. They go in
     alphabetical order of their identifier, with no special treatment for any.
  3. On a wide screen you see three at a time. With more, **“Previous”** and **“Next”** turn the page.
  4. **“Expand all”**, at the top right of the map's frame, opens the components of every band in the same drawing,
     without moving the columns. **“Collapse all”** goes back to the blocks.
  5. Tap a block to open its window; with everything expanded, tap a component to read its card.
  6. On a phone the map shows one band at a time: pick the band in the tabs at the top. Each platform shows its
     blocks, and each block opens into its components.
  7. The page's address keeps which platforms you chose and which page you are on, and **ES / EN** keeps them too.
  8. Below the map, the legend explains colours, strokes, maturity and validity; its trademark note names the real
     platforms that appear.
- **Limitations:**
  - Side by side compares what each band holds; the connections between components are on each platform's map.
  - Each row says how current its platform is; the dates can differ between rows.

#### 8. Map versions · since Sprint 2

- **What it does:** shows what changed from one approved version of a platform's map to the next. A person approved
  each version, and it is kept exactly as approved.
- **How to use it:**
  1. On any atlas view of a platform, tap **“see versions”**, next to the map's version in the header.
  2. Each pair of versions shows two side-by-side rows: the previous one above and the new one below. Every change
     carries a mark with a symbol and a word: **“+ new”**, **“− removed”** (on the previous version's row),
     **“→ renamed”** and **“maturity”**. Below, a list explains each change.
  3. **“What the components say”** counts what changed without changing the drawing: which components changed their
     text and how many renewed their sources (a different source; the same one consulted on another day does not
     count).
  4. Tap a block on either row to see its components in that version.
- **Limitations:**
  - If the map has a single version, the page says so and shows no drawing.
  - If today's rules can no longer draw an old version, the page names it (“approved and archived; today's rules no
    longer draw it”) and does not compare it.
  - The drawing only marks what changes the map: new, removed or renamed components, a different maturity, and new,
    removed or renamed blocks. That
    is why, from Fabric's v0.1.0 to its v0.2.0, it says “No changes in the drawing”, and what did change (the text of
    six components and the sources of nine) appears under “What the components say”. From v0.2.0 to v0.3.0 the
    drawing did change: two new components in “Governance and security”.
  - If a block is renamed, the page marks it as “renamed” and gives its former name (since sprint 3). It happens to
    Databricks, whose “Dashboards” block is called “Dashboards and apps” since v0.2.0.

#### 9. The knowledge base · since Sprint 3

- **What it does:** shows what Big-D knows, in readable files with a fingerprint: criteria, evidence, the maturity scale and every snapshot of the base.
- **How to use it:**
  1. In the top bar, open **“Knowledge”** and choose **“Knowledge base”**.
  2. **Evidence:** each one shows its score, its maturity, its source and the quote that backs it. Only the ones a person approved enter the comparison.
  3. **Scale and conventions:** the scale has five levels, 0 to 4, and the page says what happens in a tie.
  4. **Snapshots:** a table with the version, the date and the fingerprint. The first one says **“current”**.
  5. **Validity:** an evidence goes to **“to review”** 30 days after its verification, and to **“expired”** after 60.
- **Limitations:**
  - The base is not edited from the app. Its data are files in the `data/` folder, and every approval is recorded.
  - If a record is incomplete (say, evidence with no verification date), the base does not load: the page says what is missing and where.

#### 10. The case profile · since Sprint 3

- **What it does:** the profile of a decision case: the weight of each criterion (they add up to 100), its uncertainty range, the constraints that rule platforms out, and the implicit decisions that usually go undiscussed. The example case is a fictional hospital.
- **How to use it:**
  1. In the top bar, open **“Case”**, then **“Case profile”**.
  2. While the profile is a **draft**, each weight says who proposed it. You can change the weights (in points, to two decimals), their ranges, tick the constraints that apply, and answer each implicit decision.
  3. The page adds up the weights as you type. The command appears only when the sum is 100.00 and every decision has an answer; the “Approve profile” button stays disabled, because the command is the way.
  4. Then the page builds a command with your answers. Copy it with its button, open Terminal yourself in the project folder, paste it with Cmd+V and press Enter. Only a person runs it: the app approves nothing.
  5. Build the app again with `pnpm build` and open the page. The profile shows the **“approved”** seal and is read-only.
- **Limitations:**
  - The command comes from the page, and only from it: do not copy it from this manual or anywhere else. If the profile changed after the command was built, the command is refused and you need to copy the new one from the page.
  - An approved profile that someone edits by hand is rejected when it loads.

#### 11. The comparison · since Sprint 3

- **What it does:** compares the case's platforms with its approved profile and the approved evidence. If the profile is not approved, it does not score and says why.
- **How to use it:**
  1. In the case, open **“Comparison”**.
  2. **With the profile in draft:** the page says **“The comparison is not calculated”** and gives the reason: the profile is a draft. A link leads to the knowledge base.
  3. **With the profile approved:** each platform shows its score, its evaluation date and the snapshot it used. You choose the view: Totals, Sensitivity, Robustness, or Pros and cons.
  4. Platforms that a constraint rules out appear as eliminated, with the reason.
  5. Validity alerts are calculated against the profile's evaluation date, not today's.
- **Limitations:**
  - Big-D does not recommend a platform: it shows the result with its assumptions, and the decision belongs to whoever asks.
  - Anyone who repeats the calculation with the same profile and the same base gets the same bytes.

#### 12. The instrument · since Sprint 4

- **What it does:** tells you whether the tool can be trusted before anything is published. It runs cases with a known answer, mathematical properties, seven seeded errors and a check that approved records were not edited by hand. If something fails, nothing is published.
- **How to use it:**
  1. In the top bar, open **“Instrument”**.
  2. Read the status: green means it can be published, red means something failed. Each row says whether it passed.
  3. Under **seeded errors** you see how many of the seven deliberate errors the tool caught. It should read 7 of 7.
  4. To publish, run `pnpm build` in the project folder. If validation fails, the build stops, there is nothing to publish, and the page says it is not published and what to fix.
- **Limitations:**
  - Validation runs on the base that will be published. If you open the app without having run `pnpm build`, the page says there is no validation yet and asks you to run it.
  - The properties are the same ones the test suite checks: there are not two versions of the truth.

#### 13. The case's decisions · since Sprint 5

- **What it does:** shows the decisions the case has to make, in the order they should be taken: first the one-way ones (reversing them costs a data migration, a permissions redesign or a renegotiated contract). Each decision's sheet says how each platform resolves it and with what evidence. Below it, the risks ordered by action priority and the assumptions with their cheap test.
- **How to use it:**
  1. In the case, open **“Decisions and risks”**.
  2. Read the diagram: each decision is a card. Thick border means one-way and decided first; dashed border means costly to reverse; thin border means reversible. Tap a card to open its sheet.
  3. On the sheet, each platform has its option and the evidence behind it. **“Recommended option”** appears when the case profile is approved; until then the page says why there is no recommendation.
  4. Under **Risks**, the table sorts by action priority (high, medium, low) and then by severity. A high action without a mitigation is marked and blocks approving the plan.
  5. If there is a dependency cycle, the page shows it with its path (“a → b → a”) instead of hiding it. To resolve it, remove one of its arrows.
  6. To approve the plan, the page builds a command only when there are no blockers. Copy it and run it yourself, in the project folder. Only a person runs it: the app approves nothing.
- **Limitations:**
  - Severity, occurrence and detection are judgement, not evidence: the agent proposes them with their reason, and whoever approves the plan makes them their own.
  - An assumption's cheap test is a task for the case team: the app records it, with an owner and a date, but does not run it or connect to any platform.
  - An option with no source is marked “No source in the base”, and the page claims nothing about it; no backing is invented for it.
  - An approved plan that someone edits by hand is rejected when it loads.

#### 14. The case report · since Sprint 6

- **What it does:** gathers the whole case on one page: the roadmap by phases, with each item, its origin and the criterion for calling it done; the readiness checklist by category; and the report of fourteen sections in Spanish and English, with the same figures in both. It can be printed: the paper comes out without menus, tabs or buttons.
- **How to use it:**
  1. In the case, open the **“Roadmap and report”** tab.
  2. If the profile or the plan is still a draft, a band at the top says why. With a draft profile the comparison does not score, and section 3 of the report says so.
  3. The roadmap spreads the work over phases. Phase 0 holds the cheap tests of the assumptions that back a one-way decision; after that, one phase per wave of decisions. Each item says “comes from” a decision, a mitigation or an assumption: follow that link to see where it is explained.
  4. A dependency cycle leaves the decisions without a phase, with its path, until it is resolved.
  5. The summary (section 1) counts the one-way decisions and the high-priority risks, with figures and in few words.
  6. To print, tap **“Print”** and choose the printer or “Save as PDF” in the browser's dialog.
- **Limitations:**
  - The report does not decide or recommend anything on its own. Its text comes from reviewed templates and approved data, never from a language model.
  - The roadmap carries no weeks or dates: the plan does not have them and the app does not invent them.
  - The generated failure story is a template and is marked as generated. A human account appears only if someone writes it: a file `data/casos/<case>/relato-de-fracaso.yaml` with `caso_id`, `texto` (in Spanish and English), `escrito_por`, `fecha` and `origen: declarado-por-usuario`. If the file does not exist, the section says “no human story”.
  - An assumption's cheap test is still a task for the case team: the report records it, but does not run it.

### Frequently asked questions

- **Does Big-D recommend a platform?** No, it does not decide for you. It compares with your weights and your evidence, shows how sensitive the result is to those weights, and leaves the decision to whoever asks. While the example case's profile is a draft, its comparison is not calculated: a person has to approve the profile (section 10).

- **Why are there no logos?** So no vendor is favoured. On the map, colour says which capability something is,
  never whose it is. Trade names are used only to identify products.
- **Who wrote what the map says?** The researcher proposed it, with quotes the code checked, and a person approved
  it; the decision on each claim is on record. The author declares a deeper knowledge of Fabric than of the other platforms.

### History

| Sprint          | Features added to this manual                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 (2026-09-29) | 1 Overview, with the block window · 2 Components · 3 A datum's journey · 4 Reading in text and the keyboard · 5 Many platforms, one map · 6 The researcher |
| S2 (2026-10-04) | 5 updated: Databricks, Fabric and Snowflake have maps · 6 the previous version is kept on approval · 7 Side by side · 8 Map versions                       |
| S3 (2026-10-10) | 9 The knowledge base · 11 The comparison (does not score while the profile is a draft)                                                                     |
| S4 (2026-10-11) | 10 The case profile (approved from its page) · 12 The instrument (validation before publishing)                                                            |
| S5 (2026-10-11) | 13 The case's decisions: waves, sheets with evidence, risks by priority and assumptions (the plan is approved from its page)                               |
| S6 (2026-10-11) | 14 The case report: the roadmap by phases with its origin, the readiness checklist, a fourteen-section report in two languages, and printing               |
