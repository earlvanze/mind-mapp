import { test, expect } from '@playwright/test'

test('colorful groups child concepts under their parent color when no stronger concept matches', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mind-mapp-v1', JSON.stringify({
      nodes: [
        { id: 1, x: 100, y: 100, text: 'Infrastructure', width: 140, height: 44 },
        { id: 2, x: 300, y: 100, text: 'Gateway cleanup', width: 150, height: 44 },
        { id: 3, x: 300, y: 180, text: 'Blocked deploy timeout', width: 190, height: 44 },
      ],
      edges: [{ id: 1, from: 1, to: 2 }, { id: 2, from: 1, to: 3 }],
      lastId: 3,
      lastEdgeId: 2,
      edgeLabels: {},
    }))
  })
  await page.goto('/')
  await page.locator('#btn-colorful').click()
  const styles = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mind-mapp-v1'))
    return Object.fromEntries(saved.nodes.map(n => [n.text, n.style.fill]))
  })
  expect(styles.Infrastructure).toBe('#e0e7ff')
  expect(styles['Gateway cleanup']).toBe('#e0e7ff')
  expect(styles['Blocked deploy timeout']).toBe('#fee2e2')
})
