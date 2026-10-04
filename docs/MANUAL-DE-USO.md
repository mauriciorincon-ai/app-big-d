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
persona afirmación por afirmación. Big-D **planea, gestiona y controla; jamás opera una plataforma**: no se conecta
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
  - La pestaña «Base de conocimiento» llega en un próximo sprint.

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
     texto y cuántos renovaron sus fuentes.
  4. Toca un bloque de cualquiera de las dos filas para ver sus componentes en esa versión.
- **Limitaciones:**
  - Si el mapa tiene una sola versión, la página lo dice y no muestra un dibujo.
  - El dibujo solo marca lo que cambia el mapa: componentes nuevos, retirados, renombrados o con otra madurez. Por
    eso entre las dos versiones de Fabric dice «Sin cambios en el dibujo», y lo que cambió (seis textos y las
    fuentes de todos) aparece en «Lo que dicen los componentes».

### Preguntas frecuentes

- **¿Big-D recomienda una plataforma?** Todavía no. Este primer ciclo construye el mapa común. La comparación con
  evidencia, pesos y riesgos llega en los próximos sprints.
- **¿Por qué no hay logos?** Para no favorecer a ningún fabricante. El color del mapa dice qué capacidad es, nunca
  de quién. Los nombres comerciales se usan solo para identificar productos.
- **¿Quién escribió lo que dice el mapa?** Lo propuso el investigador, con citas comprobadas por código, y una
  persona lo aprobó afirmación por afirmación. El autor declara que conoce Fabric más a fondo que las demás
  plataformas.

### Historial

| Sprint          | Funciones añadidas a este manual                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 (2026-09-29) | 1 Visión general, con la ventana de un bloque · 2 Componentes · 3 Recorrido de un dato · 4 Lectura en texto y teclado · 5 Varias plataformas con el mismo mapa · 6 El investigador |
| S2 (2026-10-04) | 5 al día: Databricks, Fabric y Snowflake con mapa · 6 la versión anterior se guarda al aprobar · 7 Lado a lado · 8 Versiones del mapa |

---

## English

### What Big-D is

Big-D explains data platforms (today Databricks, Microsoft Fabric and Snowflake, plus the Example Platform, a
fictional one that comes from the diagramador's contract and shows the full map) **with one shared map**: the same
layers, colours and symbols for all of them. You can understand a platform end to end and compare platforms side by
side without learning a new drawing each time. Everything on the map
comes from the vendor's public documentation, dated, and a person approved it claim by claim. Big-D **plans,
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
  - The “Knowledge base” tab arrives in a coming sprint.

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
     text and how many renewed their sources.
  4. Tap a block on either row to see its components in that version.
- **Limitations:**
  - If the map has a single version, the page says so and shows no drawing.
  - The drawing only marks what changes the map: new, removed or renamed components, or a different maturity. That
    is why, between Fabric's two versions, it says “No changes in the drawing”, and what did change (six texts and
    everyone's sources) appears under “What the components say”.

### Frequently asked questions

- **Does Big-D recommend a platform?** Not yet. This first cycle builds the shared map. The comparison with
  evidence, weights and risks comes in the next sprints.
- **Why are there no logos?** So no vendor is favoured. On the map, colour says which capability something is,
  never whose it is. Trade names are used only to identify products.
- **Who wrote what the map says?** The researcher proposed it, with quotes the code checked, and a person approved
  it claim by claim. The author declares a deeper knowledge of Fabric than of the other platforms.

### History

| Sprint          | Features added to this manual                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 (2026-09-29) | 1 Overview, with the block window · 2 Components · 3 A datum's journey · 4 Reading in text and the keyboard · 5 Many platforms, one map · 6 The researcher |
| S2 (2026-10-04) | 5 updated: Databricks, Fabric and Snowflake have maps · 6 the previous version is kept on approval · 7 Side by side · 8 Map versions |
