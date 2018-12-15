# Copyright (c) 2011 Border Stylo

task 'bundle', 'Generate the browser bundle for ax.js', (options)->
  fs = require 'fs'
  path = require 'path'
  browserify = require 'browserify'
  _module = path.join __dirname, 'lib', 'ax.js'
  bundle = path.join __dirname, 'browser', 'ax.js'
  example = path.join __dirname, 'examples', 'javascripts', 'lib', 'ax.js'

  src = browserify({ filter : require('uglify-js') })
    .require(_module)
    .bundle()
  ;

  buffer = new Buffer [
    'var Ax = (function () {'
    src
    '; return require("./ax")'
    '})()'
  ].join '';

  fs.writeFile bundle, buffer, (err) ->
    throw err if err;

    console.log bundle + ' written (' + buffer.length + ' bytes)'

  fs.writeFile example, buffer, (err) ->
    throw err if err;

    console.log example + ' written (' + buffer.length + ' bytes)'

task 'watch', 'Watch lib/ax.js for auto-bundling', (options)->
  invoke 'bundle'

  fs = require 'fs'
  path = require 'path'
  _module = path.join __dirname, 'lib', 'ax.js'

  fs.watchFile _module, (current, previous) ->
    if current.mtime > previous.mtime
      invoke 'bundle'


option '-p', '--port [PORT]', 'port to run the server on'
task 'test:server', 'launch a server for the browser tests', (o)->
  browserify = require 'browserify'
  path = require 'path'
  express = require 'express'
  app = express.createServer()
  public_path = path.join __dirname, 'test', 'browser'
  ax = path.join __dirname, 'lib', 'ax'


  app.configure ->
    app.use express.logger 'dev'
    app.use express.static public_path

  app.get '/ax.js', (req, res)->
    res.header 'Content-Type', 'text/javascript'

    src = browserify({
      require: ['./lib/ax']
    }).bundle()

    res.end(src);

  app.listen o.port || 8080
