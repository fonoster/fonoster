const client = require('ari-client')
const path = require('path')

class Functions {

  config(callback) {
    client.connect('http://mediaserver:8088', 'admin', 'changeit',  (err, ari) => {
      this.ari = ari
      ari.once('StasisStart', (event, channel) => {
        this.channel = channel
        callback(this)
      })
      ari.start('hello-world')
    })
  }

  async answer() {
    try {
      await this.channel.answer()
    } catch(err) {
      console.log(err)
    }
  }

  async play(file) {
    try {
      await this.channel.play(file, this.ari.Playback())
    } catch(err) {
      console.log(err)
    }
  }

}

module.exports = new Functions()
