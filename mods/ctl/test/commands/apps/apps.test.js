const { expect, test } = require('@oclif/test')

// Mocking the GRPC server is a bigger project
// Skiping this for now...
describe('apps topic', () => {
  test
    .stdout()
    .command(['apps:deploy'])
    .it('apps create', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })
})
