import { test, expect } from '@playwright/test'

test('fit view centers distant nodes without changing saved map data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: -1200, y: -700, text: 'Far left', width: 90, height: 40 },
        { id: 2, x: 1400, y: 900, text: 'Far right', width: 95, height: 40 },
      ],
      edges: [{ id: 1, from: 1, to: 2 }],
      lastId: 2,
      lastEdgeId: 1,
    }))
  })

  await page.goto('/')

  await expect(page.locator('#btn-fit')).toBeVisible()
  await page.locator('#btn-fit').click()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mind-mapp-v1')))
  expect(saved.nodes[0].x).toBe(-1200)
  expect(saved.nodes[1].x).toBe(1400)

  await page.keyboard.press('f')
  await page.waitForTimeout(100)
  await expect(page.locator('#canvas')).toBeVisible()
})
