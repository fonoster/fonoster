const { expect, test } = require('@oclif/test')

describe.skip('@fonos/ctl/agents', () => {
  test
    .stdout()
    .command(['agents:delete'])
    .it('deletes an agent', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })
})
