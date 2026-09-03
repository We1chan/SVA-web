const { CLIEngine } = require('eslint')
const path = require('path')

describe('shared form model lint contract', () => {
  const cli = new CLIEngine()
  const filename = path.resolve(__dirname, '../../src/views/tool/gen/basicInfoForm.vue')
  const lint = body => cli.executeOnText(`<script>\nexport default {\n  props: ['info'],\n  methods: {\n    update() {\n      ${body}\n    }\n  }\n}\n</script>\n`, filename).results[0].messages

  it('permits nested editing of the parent-owned shared form', () => {
    expect(lint("this.info.tableName = 'updated'").filter(message => message.severity === 2)).toEqual([])
  })

  it('still rejects replacing the parent-owned model', () => {
    expect(lint('this.info = {}').some(message => message.severity === 2)).toBe(true)
  })
})
