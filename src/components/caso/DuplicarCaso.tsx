"use client";

import { useId, useState } from "react";
import { Comando } from "@/components/investigador/Copiar";
import { comandoDuplicarCaso, problemaDuplicar } from "@/lib/caso/comando-duplicar";
import type { Textos } from "@/lib/i18n";
import { Alerta } from "./Iconos";

export type TextosDuplicar = Textos["caso"]["perfil"]["duplicar"];

/**
 * D3 (S8): «Duplicar» en el caso. La persona escribe el id de la copia y la pantalla ARMA el comando; ella lo corre en su
 * terminal (regla 2: nada se escribe ni se aprueba desde aquí). La copia nace en borrador y el original no se toca.
 */
export function DuplicarCaso({ caso, existentes, t, copiar, copiado }: { caso: string; existentes: readonly string[]; t: TextosDuplicar; copiar: string; copiado: string }) {
  const uid = useId();
  const [nuevo, setNuevo] = useState(`${caso}-b`);
  const problema = problemaDuplicar(caso, nuevo.trim(), existentes);
  return (
    <details className="lectura-seccion duplicar" data-duplicar>
      <summary>{t.titulo}</summary>
      <p className="kit-nota">{t.nota}</p>
      <label className="editor-campo" htmlFor={`${uid}-id`}>
        {t.etiqueta}
      </label>
      <input
        id={`${uid}-id`}
        className="campo-id"
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={nuevo}
        aria-invalid={problema !== null}
        aria-describedby={problema ? `${uid}-p` : undefined}
        onChange={(e) => setNuevo(e.target.value)}
      />
      {problema ? (
        <p id={`${uid}-p`} className="campo-aviso" data-duplicar-problema={problema}>
          <Alerta />
          {t.problemas[problema]}
        </p>
      ) : (
        <Comando texto={comandoDuplicarCaso(caso, nuevo.trim(), existentes)} copiar={copiar} copiado={copiado} nota={t.comandoNota} />
      )}
    </details>
  );
}
