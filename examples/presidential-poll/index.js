/**
 * @author Pedro Sanders
 * @since v1
 */

module.exports = chan => {

    console.log('Handler got call %s -> %s',
        chan.callDetailRecord.ref, chan.callDetailRecord.to)

    const candidates = {
      '1': { name: 'Donald Trump' },
      '2': { name: 'Hillary Clinton' },
      '3': {name: 'Beny Sanders' }
    }

    // Play audio from url
    //chan.play('https://www.nch.com.au/acm/8k16bitpcm.wav')

    // This will run slow the first time.
    chan.say('Hello, this is a presidential poll from the Georgia Statistics Center.')

    const key = chan.gather(chan.say('If you would like to be remove from our list, press 7'),
        {timeout: 2, numDigits: 1})

    console.log(`Remove from list? ${key}`)

    if (key == 7) {
        // This address does not exist, it its only for ilustration
        http.post('https://georgia.gov/removeFromList')
          .timeout(1200)
          .basicAuth('username', 'password')
          .then( result => {
              if (result.body === 'OK') {
                  chan.say('You have been remove from our list')
              } else {
                // Do nothing for now
              }
        })
    }

    const config = {
        finishOnKey: '*',
        timeout: 1,
        numDigits: 1
    }

    while(true) {
        const key = chan.gather(
          chan.say('For Trump Press one. For Hillary, press two and for Sanders 3'),
            config)

        if (!['1', '2', '3'].includes(key)) {
            chan.say('I could not register your selection. Lets try again.')
            // You can use Play to stream a pre-recorded audio
            chan.play('beep')
            continue
        }

        chan.say(`You selected option ${key}, ${candidates[key].name}`)
        // Store the result as part of the cdr
        chan.stash('candidate', key)

        break
    }

    chan.say('Thank you for participating. Review the results at www.georgia.gov. Goodbye!')

    console.log(`Call ${chan.callDetailRecord.ref} ${Date.now()} ended`)
}
