import { test, expect } from '@playwright/test'

test('color templates modal applies colorful styles to a map', async ({ page }) => {
  await page.goto('/')
  await page.locator('#btn-project-kanban').click()
  await page.locator('#btn-templates').click()
  await expect(page.locator('#template-modal')).toBeVisible()
  await expect(page.locator('.template-swatch')).toHaveCount(7)
  await page.locator('.template-swatch', { hasText: 'Ocean' }).click()
  await page.locator('#btn-template-apply-all').click()
  await expect(page.locator('#template-status')).toContainText('Applied Ocean')

  const styles = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    const pageData = saved.notebook.pages.find(p => p.title === 'Project Kanban')
    return pageData.nodes.map(n => n.style?.fill).filter(Boolean)
  })
  expect(styles.length).toBeGreaterThan(3)
  expect(new Set(styles)).toEqual(new Set(['#bae6fd']))
})

test('colorful button gives imported kanban multiple colors', async ({ page }) => {
  await page.goto('/')
  await page.locator('#btn-project-kanban').click()
  await page.locator('#btn-colorful').click()
  const fills = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    const pageData = saved.notebook.pages.find(p => p.title === 'Project Kanban')
    return pageData.nodes.map(n => n.style?.fill).filter(Boolean)
  })
  expect(new Set(fills).size).toBeGreaterThan(3)
  expect(fills).toContain('#dcfce7')
  expect(fills).toContain('#dbeafe')
  expect(fills).toContain('#fee2e2')
})
