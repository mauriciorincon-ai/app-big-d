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

Big-D explica las plataformas de datos (hoy Microsoft Fabric, más la Plataforma Ejemplo, ficticia, que viene del
contrato del diagramador y muestra el mapa completo; Databricks y Snowflake llegan después) **con un mismo mapa**: las mismas capas, los mismos colores y los mismos símbolos para
todas. Así puedes entender una plataforma de punta a punta y, más adelante, compararlas sin aprender un dibujo
nuevo cada vez. Todo lo que dice el mapa viene de documentación pública del fabricante, con fecha, y lo aprobó una
persona afirmación por afirmación. Big-D **planea, gestiona y controla; jamás opera una plataforma**: no se conecta
a ninguna ni pide cuentas.

### Primeros pasos

1. Abre la app. La portada está en español; **ES / EN**, arriba a la derecha, la cambia al inglés (y te deja en la
   misma página).
2. En el campo **«Plataforma»** elige una. Las que todavía no tienen mapa dicen «pronto» y no se pueden elegir.
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

- **Qué hace:** Big-D está hecho para cualquier número de plataformas. Hoy tienen mapa **Microsoft Fabric** y la
  **Plataforma Ejemplo**, que es ficticia y sirve para ver el mapa sin depender de ningún fabricante. Las demás
  dicen «pronto».
- **Cómo se usa:** cambia de plataforma en el campo «Plataforma»: te quedas en el mismo nivel de lectura.
- **Limitaciones:** «Lado a lado» (varias plataformas con el mismo mapa, juntas) aparece como pestaña pendiente y
  llega en un próximo sprint.

#### 6. El investigador: cómo entra el conocimiento · desde el Sprint 1

- **Qué hace:** el conocimiento de cada plataforma lo **propone** una inteligencia artificial, con una cita textual
  de la documentación del fabricante por cada afirmación, y lo **aprueba una persona**. La app nunca usa
  inteligencia artificial mientras la miras.
- **Cómo se usa:**
  1. Entra a **Conocimiento → Investigador** y elige la plataforma. Vas a ver:
     - su **vigencia por capa**, con semáforo de símbolo, texto y días;
     - si ya tiene mapa aprobado, que lo aprobó una persona y cuándo (la fecha, en UTC).
  2. Si no tiene mapa, la página te da el comando para investigarla (por ejemplo `/investigar databricks`) con el
     botón **«Copiar»**. Ese comando lo corre una persona en su sesión de Claude Code; la app no lo lanza.
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
     impide. El mapa aprobado se publica en el siguiente build, y la aprobación queda en el historial.
- **Limitaciones:**
  - Las preguntas guía sin fuente quedan abiertas: no se inventan respuestas.
  - Una base con un dato incompleto (por ejemplo, un componente sin fecha de verificación) **no se publica**: el
    build se detiene y dice qué falta y dónde.
  - La pestaña «Base de conocimiento» llega en un próximo sprint.

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

---

## English

### What Big-D is

Big-D explains data platforms (today Microsoft Fabric, plus the Example Platform, a fictional one that comes from the
diagramador's contract and shows the full map; Databricks and Snowflake come later) **with one shared map**: the same layers, colours and symbols for all of them. You can understand a
platform end to end and, later, compare platforms without learning a new drawing each time. Everything on the map
comes from the vendor's public documentation, dated, and a person approved it claim by claim. Big-D **plans,
manages and controls; it never operates a platform**: it connects to none and asks for no accounts.

### Getting started

1. Open the app. The home page is in Spanish; **ES / EN**, top right, switches to English and keeps you on the
   same page.
2. Pick a platform in the **“Platform”** field. Platforms without a map yet say “coming soon” and cannot be picked.
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

- **What it does:** Big-D is built for any number of platforms. Today **Microsoft Fabric** and the **Example
  Platform** have maps. The Example Platform is fictional, so you can see the map without any vendor. The rest say
  “coming soon”.
- **How to use it:** switch platforms in the “Platform” field; you stay on the same reading level.
- **Limitations:** “Side by side” (several platforms on one map, together) shows as a pending tab and arrives in a
  coming sprint.

#### 6. The researcher: how knowledge gets in · since Sprint 1

- **What it does:** an AI **proposes** each platform's knowledge, with one quote from the vendor's documentation
  for every claim. A **person approves** it. The app never uses AI while you look at it.
- **How to use it:**
  1. Go to **Knowledge → Researcher** and pick a platform. You will see:
     - its **freshness per layer**, as a signal with a symbol, a word and the days;
     - if it already has an approved map, that a person approved it and when (the date, in UTC).
  2. If it has no map, the page gives you the command to research it (for example `/investigar databricks`) with a
     **“Copy”** button. A person runs that command in their Claude Code session; the app never launches it.
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
     build, and the approval stays in the history.
- **Limitations:**
  - Guiding questions without a source stay open; no answer is made up.
  - A base with an incomplete record (say, a component with no verification date) **is not published**: the build
    stops and says what is missing and where.
  - The “Knowledge base” tab arrives in a coming sprint.

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
