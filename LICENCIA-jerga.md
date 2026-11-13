# Tabla de jerga — fuente, licencia y atribución

La tabla de palabras comunes del detector de jerga (`data/convenciones/jerga.yaml`, campos `cubos` y `fuente`) se genera con
`scripts/jerga/derivar.mjs` a partir de **Google Books Ngram** (1-gramas, edición 20200217, español `spa` e inglés `eng`).

- **Fuente:** Google Books Ngram Viewer datasets — https://storage.googleapis.com/books/ngrams/books/datasetsv3.html
- **Licencia:** Creative Commons Attribution 3.0 Unported (**CC BY 3.0**) — https://creativecommons.org/licenses/by/3.0/
- **Atribución:** «Google Books Ngram · CC BY 3.0». La cita viaja en el campo `fuente` de `jerga.yaml` (en los dos idiomas), en este
  archivo y en `decisions/jargon-detector.md`.
- **Qué exige:** solo la atribución; no hay cláusula de compartir igual ni de uso no comercial.
- **Qué viaja al repo:** únicamente las 12 000 formas más usadas de cada idioma (años 1990-2019, minúsculas del alfabeto, sin
  etiquetas gramaticales, sin nombres propios ni palabras del otro idioma), repartidas en cuatro cubos por rango de frecuencia. El
  crudo (≈ 8 GB) se lee en flujo —descarga, gunzip, línea— y **no se guarda** en el disco ni en el repo.
- **Qué escribe una persona:** `permitidas` (solo nombres propios: los de las plataformas) y los textos para líderes que la tabla
  marca; ninguna palabra de la tabla se edita a mano (`huella` = SHA-256 de los cubos; `--comprobar` la recalcula).

Misma fuente y misma edición que la app hermana Habla (S8), reescrita aquí: ningún archivo se copia entre repos.
