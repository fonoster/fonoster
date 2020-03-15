/**
 * @author Pedro Sanders
 * @since v1
 */
class AbstractTTS {

    constructor(name) {
        this.name = name
    }

    getEngineName() {
        return this.name
    }
}

module.exports = AbstractTTS
