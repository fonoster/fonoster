/**
 * @author Pedro Sanders
 * @since v1
 */
module.exports = chan => {
    chan.play('beep')
    chan.wait(1)
    chan.say('beep')
}