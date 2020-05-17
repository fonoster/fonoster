#!/usr/bin/env node
// Running APIServer
process.env.NODE_ENV = 'dev'
require('./core/dist/server/server')
