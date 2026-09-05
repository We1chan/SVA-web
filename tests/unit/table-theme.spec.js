const fs = require('fs')
const path = require('path')

const stylesheet = fs.readFileSync(
  path.resolve(__dirname, '../../src/assets/styles/admin-workspace.scss'),
  'utf8'
)

const menuView = fs.readFileSync(
  path.resolve(__dirname, '../../src/views/system/menu/index.vue'),
  'utf8'
)

describe('浅色科技表格视觉契约', () => {
  test('声明方案 C 的表格层级、动态效果和状态语义选择器', () => {
    expect(stylesheet).toContain('.sva-workspace .el-table')
    expect(stylesheet).toContain('.el-table__header-wrapper')
    expect(stylesheet).toContain('.el-table__fixed-header-wrapper')
    expect(stylesheet).toContain('.el-table__row:hover')
    expect(stylesheet).toContain('.tech-status')
    expect(stylesheet).toContain('.tech-table-action')
    expect(stylesheet).toContain('@keyframes sva-table-scan')
    expect(stylesheet).toContain('prefers-reduced-motion: reduce')
    expect(stylesheet).not.toContain('transform: translateX(2px)')
    expect(menuView).toContain('class="tech-table"')
    expect(menuView).toContain('class="tech-table-action"')
  })
})
