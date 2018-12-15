# Change Log

All notable changes to this project will be documented in this file.

## 1.2.0 - 2017-06-15

- ari client now returns an error when it is unable to connect

## 1.1.0 - 2016-10-21

- Add parsing logic to handle 'binary' responseType from Asterisk.
This allows `getStoredFile()` to properly pass back a Node.js `Buffer`
object from this method. Thanks @mpotra!

## 1.0.2 - 2016-09-15

- Use wss protocol when the baseUrl passed in is https. Keep in mind
that Asterisk still does not support wss without a patch. Thanks
@danjenkins!

## 1.0.0 - 2016-08-02

#### Backward-incompatible changes

- Support for Node versions below 4 has been removed as a result of 
upgrading the ws module to 1.x. See [#47][PR47] for details. This
module was upgraded because Node versions 6.2+ were experiencing a
critical RangeError bug that was causing unhandled exceptions to be
thrown.

- npm shrinkwrap has been removed from the project. This will cause
version upgrades for any dependencies that previously had been locked
down by the shrinkwrap, which could potentially cause behavior changes.
Please lock your application's dependencies down using your own 
shrinkwrap if you still need specific versions of this library's
dependencies.


[PR47]: https://github.com/asterisk/node-ari-client/pull/47
