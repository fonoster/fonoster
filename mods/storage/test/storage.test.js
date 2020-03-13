/**
 * @author Pedro Sanders
 * @since v1
 */
const Storage = require('../src/storage')
const assert = require('assert')

if(process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV ) {
    require('dotenv').config({ path: __dirname + '/../../.env.dev' })
}

describe('Storage Service', () => {
    let storage

    before(() => {
        storage = new Storage({
            endpoint: `${process.env.APISERVER_ENDPOINT}`
        })
    })

    it('Upload Object', done => {
        storage.uploadObject(__dirname + '/../.npmignore')
        //.then(result => {
        //    console.log('NO SHIT!: ' + result)
            done()
        //}).catch(e => done(e))
    })
})
