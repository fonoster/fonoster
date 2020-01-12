/**
 * @author Pedro Sanders
 * @since v1
 */
class AbstractTTS {

    constructor(name, config) {
        this.name = name
        this.config = config
    }

    getEngineName() {
        return this.name
    }
}

module.exports = AbstractTTS