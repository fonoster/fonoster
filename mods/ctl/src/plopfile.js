module.exports = function (plop) {
  plop.setGenerator('init', {
    description: 'application controller logic',
    actions: [
      {
        type: 'add',
        path: '{{cwd}}/{{entryPoint}}',
        templateFile: 'templates/index.js',
        abortOnFail: true
      },
      {
        type: 'add',
        path: '{{cwd}}/package.json',
        templateFile: 'templates/package.json',
        abortOnFail: true
      },
      {
        type: 'add',
        path: '{{cwd}}/fonos.json',
        templateFile: 'templates/fonos.json',
        abortOnFail: true
      }
    ]
  })
}
