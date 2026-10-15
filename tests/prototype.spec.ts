import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('RN-0099 demonstra a navegação do protótipo aprovado na F3', async ({ page }) => {
  await page.goto(pathToFileURL(resolve('prototype/index.html')).href);
  await page.getByRole('button', { name: 'Abrir demonstração' }).click();
  await expect(page.getByRole('region', { name: 'Demonstração de leitura' })).toBeVisible();
  await page.getByRole('button', { name: 'Índice' }).click();
  await expect(page.getByRole('navigation', { name: 'Índice do texto' })).toBeHidden();
});
