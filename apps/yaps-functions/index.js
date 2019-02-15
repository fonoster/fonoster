const functions = require('yaps-functions')

functions.config(func)

function func(channel) {
  channel.answer()
  channel.play({media: 'sound:hello-world'})
}
