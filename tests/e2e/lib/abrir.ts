import { expect, type Locator, type Page } from "@playwright/test";

/**
 * La página ya hidrató: el conmutador de tema marca el tema vigente solo en el cliente (el servidor no lo
 * conoce), en el render que sigue a la hidratación, cuando los efectos que escuchan clics y teclas ya
 * corrieron. El HTML llega antes que ese código: un toque o una tecla antes de hidratar no hace nada (en la CI
 * lo vio WebKit). M-9 de la auditoría del S1: toda prueba que interactúa justo después de `goto` espera esto.
 */
export async function listo(page: Page): Promise<void> {
  await expect(page.locator('[data-theme-set][aria-pressed="true"]')).toHaveCount(1);
}

/**
 * Toca un bloque o un componente hasta que su panel (ventana o ficha) se vea. Se reintenta el toque, nunca la
 * aserción de lo que el panel muestra.
 */
export async function abrir(activable: Locator, panel: Locator): Promise<void> {
  await expect(async () => {
    await activable.dispatchEvent("click");
    await expect(panel).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

/** Como `abrir`, con el teclado: foco en el activable y la tecla (Enter por defecto), hasta que el panel se vea. */
export async function abrirConTecla(activable: Locator, panel: Locator, tecla = "Enter"): Promise<void> {
  await expect(async () => {
    await activable.focus();
    await activable.press(tecla);
    await expect(panel).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}
