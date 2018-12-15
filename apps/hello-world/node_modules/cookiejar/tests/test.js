var Cookie=require("../cookiejar")
, CookieAccessInfo = Cookie.CookieAccessInfo
, CookieJar = Cookie.CookieJar
, Cookie = Cookie.Cookie

var assert = require('assert');

// Test Cookie
var cookie = new Cookie("a=1;domain=.test.com;path=/");
assert.equal(cookie.name, "a");
assert.equal(cookie.value, "1");
assert.equal(cookie.domain, ".test.com");
assert.equal(cookie.path, "/");
assert.equal(cookie.secure, false);
assert.equal(cookie.expiration_date, Infinity);

assert.deepEqual(cookie, new Cookie("a=1;domain=.test.com;path=/"));
assert.ok(cookie.collidesWith(new Cookie("a=1;domain=.test.com;path=/")));


// Test CookieJar
var test_jar = CookieJar();
test_jar.setCookies(
 "a=1;domain=.test.com;path=/"
 +":b=2;domain=test.com;path=/"
 +":c=3;domain=test.com;path=/;expires=January 1, 1970");
var cookies=test_jar.getCookies(CookieAccessInfo("test.com","/"))
assert.equal(cookies.length, 2, "Expires on setCookies fail\n" + cookies.toString());
assert.equal(cookies.toValueString(), 'a=1;b=2', "Cannot get value string of multiple cookies");

cookies=test_jar.getCookies(CookieAccessInfo("www.test.com","/"))
assert.equal(cookies.length, 1, "Wildcard domain fail\n" + cookies.toString());

test_jar.setCookies("b=2;domain=test.com;path=/;expires=January 1, 1970");
cookies=test_jar.getCookies(CookieAccessInfo("test.com","/"))
assert.equal(cookies.length, 1, "Delete cookie fail\n" + cookies.toString());
assert.equal(String(test_jar.getCookies(CookieAccessInfo("test.com","/"))), "a=1; domain=.test.com; path=/");

cookie=Cookie("a=1;domain=test.com;path=/;HttpOnly");
assert.ok(cookie.noscript, "HttpOnly flag parsing failed\n" + cookie.toString());

var test_jar = CookieJar();
test_jar.setCookies([
	"a=1;domain=.test.com;path=/"
	, "a=1;domain=.test.com;path=/"
	, "a=2;domain=.test.com;path=/"
	, "b=3;domain=.test.com;path=/"]);
var cookies=test_jar.getCookies(CookieAccessInfo("test.com","/"))
assert.equal(cookies.length, 2);
assert.equal(cookies[0].value, 2);
