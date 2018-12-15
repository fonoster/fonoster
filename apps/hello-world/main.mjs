'use strict'

import client from 'ari-client'
import util from 'util'

client.connect('http://mediaserver:8088', 'admin', 'changeit', function (err, ari) {
  // Use once to start the application
  ari.once('StasisStart', function (event, channel) {
    channel.answer(
      function (err) {
        var playback = ari.Playback()
        channel.play({media: 'sound:hello-world'}, playback,
          function (err, playback) {
            registerDtmfListeners(err, playback, channel)
          }
        )
    })
  })

  function registerDtmfListeners (err, playback, channel) {
    channel.on('ChannelDtmfReceived',
      function (event, channel) {
        var digit = event.digit

        switch (digit) {
          case '5':
            playback.control({operation: 'pause'}, function(err) {})
            break
          case '8':
            playback.control({operation: 'unpause'}, function(err) {})
            break
          case '4':
            playback.control({operation: 'reverse'}, function(err) {})
            break
          case '6':
            playback.control({operation: 'forward'}, function(err) {})
            break
          case '2':
            playback.control({operation: 'restart'}, function(err) {})
            break
          case '#':
            playback.control({operation: 'stop'}, function(err) {})
            channel.hangup(function (err) {
              process.exit(0)
            })
            break
          default:
            console.error(util.format('Unknown DTMF %s', digit))
        }
    })
  }

  // can also use ari.start(['app-name'...]) to start multiple applications
  ari.start('hello-world')
})
