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

test('PB-EQUIPOS-003 - Crear equipo - validación de obligatorios', async ({ page }) => {
  // Datos del caso
  const urlBase = 'https://mango-beach-05ebd090f.3.azurestaticapps.net';
  const adminUser = 'juana.admin@playbasquet.test';
  const adminPassword = 'test';

  // Paso 1: Iniciar sesión como Administrador
  await page.goto(`${urlBase}/login`);
  await page.locator('#email').fill(adminUser);
  await page.locator('#password').fill(adminPassword);
  await page.getByRole('button', { name: /Acceder|Iniciar sesión/i }).click();

  // Confirmar login exitoso → redirección a Torneos
  await expect(page).toHaveURL(/.*\/torneos/);

  // Paso 2: Navegar a la página 'Equipos'
  await page.getByRole('link', { name: /^Equipos$/ }).click();
  await expect(page).toHaveURL(/.*\/equipos/);

  // Paso 3: Clickear en 'Nuevo Equipo'
  await page.getByRole('button', { name: /Nuevo Equipo/i }).click();

  // Verificar que el popup de 'Nuevo Equipo' aparece
  await expect(page.getByText(/Nuevo Equipo/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Cancelar/i })).toBeVisible();
  const crearBtn = page.getByRole('button', { name: /Crear Equipo/i });
  await expect(crearBtn).toBeVisible();
  await expect(crearBtn).toBeDisabled();

  // Paso 4: Dejar los campos obligatorios vacíos
  // (No llenamos nombre ni descripción)
  await page.waitForTimeout(1000); // pequeña espera para estabilidad visual

  // Resultado esperado: botón "Crear Equipo" sigue deshabilitado
  await expect(crearBtn).toBeDisabled();
});

test('PB-EQUIPOS-004 - Editar Equipo', async ({ page }) => {
  const urlBase = 'https://mango-beach-05ebd090f.3.azurestaticapps.net';
  const adminUser = 'juana.admin@playbasquet.test';
  const adminPassword = 'test';
  const equipoEditadoNombre = 'Equipo Test E2E - Editado';
  // Login
  await page.goto(`${urlBase}/login`);
  await page.locator('#email').fill(adminUser);
  await page.locator('#password').fill(adminPassword);
  await page.getByRole('button', { name: /Acceder/i }).click();

  // Ir a Equipos
  await page.getByRole('link', { name: /^Equipos$/ }).click();

  // Click en Editar del primer equipo
  const editarBtn = page.locator('.relative.overflow-x-auto').getByRole('button', { name: /Editar/i }).first();
  await editarBtn.click();

  // Editar nombre del equipo
  const nombreInput = page.locator('input[placeholder="Ej: Leones de Córdoba"]');
  await nombreInput.fill(equipoEditadoNombre);

  // Guardar cambios
  const guardarBtn = page.getByRole('button', { name: /Guardar Cambios/i });
  await expect(guardarBtn).toBeEnabled();
  await guardarBtn.click();

  // Verificar en el listado
  await expect(page.locator('table, .relative.overflow-x-auto')).toContainText(equipoEditadoNombre, { timeout: 50000 });

});

test('PB-EQUIPOS-005 - Cancelar Editar Equipo', async ({ page }) => {
  const urlBase = 'https://mango-beach-05ebd090f.3.azurestaticapps.net';
  const adminUser = 'juana.admin@playbasquet.test';
  const adminPassword = 'test';

  // Login
  await page.goto(`${urlBase}/login`);
  await page.locator('#email').fill(adminUser);
  await page.locator('#password').fill(adminPassword);
  await page.getByRole('button', { name: /Acceder/i }).click();

  // Ir a Equipos
  await page.getByRole('link', { name: /^Equipos$/ }).click();

  // Click en Editar del primer equipo
  const editarBtn = page.locator('.relative.overflow-x-auto').getByRole('button', { name: /Editar/i }).first();
  await editarBtn.click();
  // Obtener el nombre original
  const nombreInput = page.locator('input[placeholder="Ej: Leones de Córdoba"]');
  const nombreOriginal = await nombreInput.inputValue();

  // Modificar el nombre del equipo
  await nombreInput.fill('Nombre Temporal para Cancelar');

  // Click en Cancelar
  const cancelarBtn = page.getByRole('button', { name: /Cancelar/i });
  await cancelarBtn.click();

  // Verificar que el nombre no se haya modificado en el listado
  await expect(page.locator('table, .relative.overflow-x-auto')).toContainText(nombreOriginal, { timeout: 50000 });
  await expect(page.locator('table, .relative.overflow-x-auto')).not.toContainText('Nombre Temporal para Cancelar');

});

test('PB-EQUIPOS-006 - Cancelar Crear Equipo', async ({ page }) => {
  const urlBase = 'https://mango-beach-05ebd090f.3.azurestaticapps.net';
  const adminUser = 'juana.admin@playbasquet.test';
  const adminPassword = 'test';
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
  await page.locator('input[placeholder="Ej: Leones de Córdoba"]').fill('Equipo Temporal para Cancelar');
  await page.locator('input[placeholder="Breve descripción del equipo"]').fill('Descripción temporal.');
  // --- Selección de Torneo (Ionic overlay) ---
  await page.locator('#torneoInput').click();

  // 1) Esperar si se abre como POPOVER
  const popover = page.locator('ion-popover');
  if (await popover.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Mucho Ionic renderiza opciones como ion-item dentro del popover
    await expect(popover).toBeVisible();
    await popover.getByText('Torneo UTN', { exact: true }).click();
  } else {
    } 
  // Click en Cancelar
  const cancelarBtn = page.getByRole('button', { name: /Cancelar/i });
  await cancelarBtn.click();
  // Verificar que el equipo no aparezca en el listado
  await expect(page.locator('table, .relative.overflow-x-auto')).not.toContainText('Equipo Temporal para Cancelar', { timeout: 50000 });

});

test('PB-EQUIPOS-007 - Eliminar Equipo', async ({ page }) => {
  await page.goto('https://mango-beach-05ebd090f.3.azurestaticapps.net/login');
  await page.getByRole('textbox', { name: 'tucorreo@ejemplo.com' }).click();
  await page.getByRole('textbox', { name: 'tucorreo@ejemplo.com' }).fill('juana.admin@playbasquet.test');
  await page.getByRole('textbox', { name: '••••••••' }).click();
  await page.getByRole('textbox', { name: '••••••••' }).fill('test');
  await page.getByRole('button', { name: 'Acceder' }).click();
  await page.getByRole('link', { name: 'Equipos' }).click();
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).click();
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).fill('E');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).fill('Equipo ');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).fill('Equipo T');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).fill('Equipo Test ');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).fill('Equipo Test E2E');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).press('CapsLock');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).press('Enter');
  await page.getByRole('button', { name: 'Eliminar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
  await page.getByRole('link', { name: 'Equipos' }).click();
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).click();
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).fill('');
  await page.getByRole('textbox', { name: 'Buscar equipos...' }).press('Enter');
  await expect(page.locator('table, .relative.overflow-x-auto')).not.toContainText('Equipo Test', { timeout: 50000 });
});
 

