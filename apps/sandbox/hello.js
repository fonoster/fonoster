var fs = require('fs');
var path2 = require('/Users/psanders/Projects/yaps/apps/hello-world/index.js');
//var path = require('/Users/psanders/Projects/yaps/apps/hello-world/yaps-functions.js');
var dir = './tmp';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

console.log('WTF!')
