/**
 * @author Pedro Sanders
 * @since v1
 */

class AbstractTTS {

    // I have fsConfig here for testing
    constructor(name) {
        this.name = name
    }

    getEngineName() {
        return this.name
    }
}

module.exports = AbstractTTS
