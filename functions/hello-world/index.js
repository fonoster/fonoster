/**
 * @author Pedro Sanders
 * @since v1
 */
module.exports = chan => {
    chan.wait(3)
    const result = chan.gather(chan.say('beep'), { maxDigits: 5 })
    console.log(`result: ${result}`)
}