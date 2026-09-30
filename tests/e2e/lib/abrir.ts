import { expect, type Locator } from "@playwright/test";

/**
 * Toca un bloque o un componente hasta que su panel (ventana o ficha) se vea. El HTML llega antes que el
 * código que escucha el toque: un toque antes de hidratar no hace nada (en la CI lo vio WebKit, una vez). Se
 * reintenta el toque, nunca la aserción de lo que el panel muestra.
 */
export async function abrir(activable: Locator, panel: Locator): Promise<void> {
  await expect(async () => {
    await activable.dispatchEvent("click");
    await expect(panel).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}
