/**
 * @author Pedro Sanders
 * @since v1
 */
class StoreAPI {

    constructor(store) {
        this.store = store
        this.c = 'default'
    }

    withCollection(c) {
        this.c = c
        return this
    }

    put(k, v) {
        this.store.put(this.c, k, v)
    }

    get(k) {
        return this.store.get(this.c, k)
    }

    remove(k) {
        return this.store.remove(this.c, k)
    }

    values() {
        return this.store.values(this.c)
    }

    keySet() {
        return this.store.keySet(this.c)
    }
}

module.exports = StoreAPI