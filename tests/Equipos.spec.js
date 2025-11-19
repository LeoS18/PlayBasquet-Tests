import { test, expect } from '@playwright/test';

test('PB-EQUIPOS-001 - Acceso a Equipos como administrador de torneos', async ({ page }) => {
  // Datos del caso
  const urlBase = 'https://mango-beach-05ebd090f.3.azurestaticapps.net';
  const adminUser = 'juana.admin@playbasquet.test';
  const adminPassword = 'test';

  // Paso 1: Iniciar sesión como Administrador
  await page.goto(`${urlBase}/login`);

  await page.locator('#email').fill(adminUser);
  await page.locator('#password').fill(adminPassword);
  await page.locator('button:has-text("Acceder")').click();

  // Resultado esperado 1: La página 'Torneos' carga correctamente
  await expect(page).toHaveURL(`${urlBase}/torneos`);
  await expect(page.locator('h1, h2')).toContainText('Torneos');

  // Paso 2: Clickear el apartado 'Equipos' en el header
  await page.click('a:has-text("Equipos")');

  // Resultado esperado 2: La página 'Equipos' carga correctamente
  await expect(page).toHaveURL(`${urlBase}/equipos`);
  await expect(page.locator('h1, h2')).toContainText('Equipos');

  // Validar presencia de elementos clave
  await expect(page.locator('input[placeholder*="Buscar equipos..."]')).toBeVisible();
  await expect(page.locator('button:has-text("Nuevo Equipo")')).toBeVisible();
  await expect(page.locator('body > app-root > ion-app > ion-router-outlet > app-main-layout > div > div > main > app-equipos > ion-content > div > div > div.relative.overflow-x-auto')).toBeVisible();

  console.log('✅ PB-EQUIPOS-001 ejecutado correctamente');
});

test('PB-EQUIPOS-002 - Crear Equipo', async ({ page }) => {
  const urlBase = 'https://mango-beach-05ebd090f.3.azurestaticapps.net';
  const adminUser = 'juana.admin@playbasquet.test';
  const adminPassword = 'test';
  const nuevoEquipoNombre = 'Equipo Test E2E';

  // Login
  await page.goto(`${urlBase}/login`);
  await page.locator('#email').fill(adminUser);
  await page.locator('#password').fill(adminPassword);
  await page.getByRole('button', { name: /Acceder/i }).click();

  // Ir a Equipos
  await page.getByRole('link', { name: /^Equipos$/ }).click();

  // Nuevo Equipo
  await page.getByRole('button', { name: /Nuevo Equipo/i }).click();

  // Completar campos
  await page.locator('input[placeholder="Ej: Leones de Córdoba"]').fill(nuevoEquipoNombre);
  await page.locator('input[placeholder="Breve descripción del equipo"]').fill('Este es un equipo creado durante una prueba E2E.');

  // --- Selección de Torneo (Ionic overlay) ---
  await page.locator('#torneoInput').click();

  // 1) Esperar si se abre como POPOVER
  const popover = page.locator('ion-popover');
  if (await popover.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Mucho Ionic renderiza opciones como ion-item dentro del popover
    await expect(popover).toBeVisible();
    await popover.getByText('Torneo UTN', { exact: true }).click();
  } else {
    // 2) Si la interfaz es ALERT (otra variante de ion-select)
    const alert = page.locator('ion-alert');
    if (await alert.isVisible({ timeout: 2000 }).catch(() => false)) {
      // En ion-alert, las opciones suelen ser buttons/labels con role radio/option
      // Probar por rol 'option'
      const opt = alert.getByRole('option', { name: 'Torneo UTN' });
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
      } else {
        // Fallback por texto visible clásico en alert
        await alert.getByText('Torneo UTN', { exact: true }).click();
      }
      // En algunos casos hay que confirmar el alert (OK/Aceptar)
      const okBtn = alert.getByRole('button', { name: /OK|Aceptar|Confirmar/i });
      if (await okBtn.isVisible().catch(() => false)) {
        await okBtn.click();
      }
    } else {
      // 3) Fallback genérico por role listbox/option (si Ion usa ARIA)
      const listbox = page.getByRole('listbox');
      if (await listbox.isVisible({ timeout: 1500 }).catch(() => false)) {
        await listbox.getByRole('option', { name: 'Torneo UTN' }).click();
      } else {
        // Último recurso: buscar globalmente la opción por texto (overlay suelto en body)
        await page.getByText('Torneo UTN', { exact: true }).click();
      }
    }
  }

  // Crear equipo
  const btnCrear = page.getByRole('button', { name: /Crear Equipo/i });
  await expect(btnCrear).toBeEnabled();
  await btnCrear.click();

  // Verificar en el listado
  await expect(page.locator('table, .relative.overflow-x-auto')).toContainText(nuevoEquipoNombre, { timeout: 50000 });
});