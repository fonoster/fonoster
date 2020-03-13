/**
 * @author Pedro Sanders
 * @since v1
 */

const removeDirSync = path => {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

    if (files.length > 0) {
      files.forEach(function(filename) {
        if (fs.statSync(path + "/" + filename).isDirectory()) {
          removeDir(path + "/" + filename)
        } else {
          fs.unlinkSync(path + "/" + filename)
        }
      })
      fs.rmdirSync(path)
    } else {
      fs.rmdirSync(path)
    }
  } else {
      logger.log('warn', 'Directory path not found.')
  }
}

const extract = (source, target) => new Promise((resolve, reject) => {
    const extract = inly(source, target)

    extract.on('error', err => {
        reject(err)
    })

    extract.on('end', () => {
        resolve()
    })
})

module.exports.extract = extract
module.exports.removeDirSync = removeDirSync
