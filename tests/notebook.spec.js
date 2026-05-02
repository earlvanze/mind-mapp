import { test, expect } from '@playwright/test'

test('notebook can create and switch between isolated pages', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('#page-select')).toHaveValue('1')
  await expect(page.locator('#page-select option')).toHaveCount(1)

  await page.locator('#btn-new-page').click()
  await expect(page.locator('#page-select option')).toHaveCount(2)
  await expect(page.locator('#page-select')).toHaveValue('2')

  await page.locator('#btn-add').click()
  await page.keyboard.press('Enter')

  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.notebook.pages).toHaveLength(2)
  expect(saved.notebook.activePageId).toBe(2)
  expect(saved.notebook.pages[1].nodes).toHaveLength(2)

  await page.locator('#page-select').selectOption('1')
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.notebook.activePageId).toBe(1)
  expect(saved.nodes).toEqual(saved.notebook.pages[0].nodes)
  expect(saved.nodes).toHaveLength(1)

  await page.locator('#page-select').selectOption('2')
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.notebook.activePageId).toBe(2)
  expect(saved.nodes).toHaveLength(2)
})

test('legacy single-page maps migrate into a notebook', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [{ id: 1, x: 100, y: 100, text: 'Legacy', width: 80, height: 40 }],
      edges: [],
      lastId: 1,
      lastEdgeId: 0,
      edgeLabels: {},
    }))
  })

  await page.goto('/')
  await expect(page.locator('#page-select option')).toHaveCount(1)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.notebook.pages[0].nodes[0].text).toBe('Legacy')
})
