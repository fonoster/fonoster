/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for Store API
 */
const StoreAPI = require('.store_api')
const RedisStore = require('.redis_store')
const assert = require('assert')

describe('Store API', () => {

    it.only('Basic store api functions', function(done) {
        const store = new StoreAPI(driver)
        store.withCollection('c1').put('test', 'test')
        assert.equal(store.withCollection('c1').get('test'), 'test')
        assert.equal(store.withCollection('c1').values().length, 1)
        store.remove('test')
        assert.equal(store.withCollection('c1').get('test'), null)

        done()
    })
})