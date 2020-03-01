/**
 * @author Pedro Sanders
 * @since v1
 */
module.exports = chan => {
    // Wait for three seconds
    chan.wait(3)

    // Play audio from url
    chan.play('https://www.nch.com.au/acm/8k16bitpcm.wav')

    // Play audio from text (using the default tts)
    // The second time it will run faster because it is cache
    chan.say('Hello world!')

    // This verb waits for the user to input from the keypad
    const result = chan.gather(chan.play('beep'), { maxDigits: 5 })
    console.log(`result: ${result}`)
}
