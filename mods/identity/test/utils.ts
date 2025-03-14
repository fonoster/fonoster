/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const TEST_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Zvbm9zdGVyLmxvY2FsIiwic3ViIjoiNjM1YzBjZDgtODEyNS00ODNkLWI0NjctMDVjNTNjZTJjZDMxIiwiYXVkIjoiYXBpIiwidG9rZW5Vc2UiOiJhY2Nlc3MiLCJhY2Nlc3NLZXlJZCI6IlVTMTR3ajhxNnFsaXJ3MzMxZ2Zzd3VzZmJsaWU2aDc4dXoiLCJhY2Nlc3MiOlt7ImFjY2Vzc0tleUlkIjoiR1JhaG4wMnM4dGdkZmdoejcydmIwZno1MzhxcGI1ejM1cCIsInJvbGUiOiJPV05FUiJ9LHsiYWNjZXNzS2V5SWQiOiJHUmtnYmY4YW1pbnl3dWV2dXBiZHB4bDYzNmtjM2N5YmhvIiwicm9sZSI6Ik9XTkVSIn1dLCJpYXQiOjE3MTQ0MzM3MzZ9.eG6UEe8nBncu1I8TtytG5bModK42JxuSLCK74eLzUb-7MLowza8ZSfoHPHSPu5j1Wy_nj8NWa1u1SvqTfW-8inoL8Y_Mawl_u9zSM09Co85RQOI_bj7huGB7v0UECLfKyd7cAo_9wGB9TDDDX5Qo66bQz49hu_8zed8e6RzJXYRC5-5TBlyYdw3o7yHUXL5t8tFxDhT7U61kg0eVjPPZCAUiyohK74Zxdv1Z9RCfWTt9kUYXReqOUvhAFzL5Um5KwNdRnWwFRz_3-Msui2axAsZ6ztGoAvw_GhdlAminGEq7FILVCh6OHeOESAYo-qreAANmbwfBS8qNsglTiPAUEw";

const TEST_UUID = "635c0cd8-8125-483d-b467-05c53ce2cd31";

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCcuIwQMqyljT5Q
hm6brZZb/82dD8k6rX8WWfGdtvz01As6zQJWDoIsvmmair/5VUM3BCUpEWre5ust
JabH1XwRqTM4gPZnjtStaAaFv4aethh5hNUlPQHNR7nBvvTvP0KH+5vtdTXkrsyc
WojONuHrSu8WyWZR4ZNt9xdAqHs3FY14cncaBQfeAMRvwueB8z5wkJLYIOMoXvMU
JsycHS/DhQ/QpQUFJGIKHJtFOR6nEzh7nU+/jnEl4x4dZPM+k6okozJVDqO6ECpv
NdvVb4mdeMmtsbMd4YxijUY0lV05icOTHErPz4pbTDe5/FuDdOIvoSo0lzMHfwmR
hI7hu1ShAgMBAAECggEAS3br7uLP0pn8Lx9EhI8mT1+SXTZcQfaIMzWVTEnwbV3r
mGFeZhzvXudDh6iXP1LonkXPNQLPkMzl4qP2NtScPQ7Z/LPQstYKoANu3Jl4k9UA
XQdy8U76nqQSlPJEFC5EdaFZGJMvo9Ht8b4AkTfJOpknHrRVIkl6SeHI3xgh2Mg1
azaOVb11Kawg1181Vh72o8hxLzi4DgoyHUSoip/ke5fw4NlT2tjA6b+JEet972BO
im4anv6LQnjpHd8ew6hxF8ZYW2NA7/MmzMN903cnhdrj6V83YLbj81j+sc7ZFrTR
IEBQw0V9LkpWAYbMlw452JtrklZKEcxG5IORKBnkdwKBgQDSHb/Ojxnbujw2SjAF
dD0jqlji7cAvhuRR/vmfvrU9LUKGDQQCktaPaMUdrgiaH3krifJTEAKYiRFmBbSt
rvTPw/zddbtpe03bA5y+UTfIM3t64PaL53B2O75BK73Cnfgg1Z7HGJwbACOExKaO
SEUyUw4wIeXC8YcnwkWRJf6nTwKBgQC+8c7CMOIeuaVgQZWvIG+VVL9vxGW2d8rl
4NnIm7XKipMvgXj0O4ikXdIK7vZ31+PbFrYD4FoSYyojFfZ6OiDxIWQ4ZIaxTUZp
M5THUzAeNYlvdQyw0OZC8vwGksoXAvODt/uLkD6EQDO7t2/RBVCXOvgkcNoul2lW
YREabcZJDwKBgG6p9ny/R9o/czkQx8wHla/0J06V89PUUuqQxT6KfgBTlybtMgB8
//6WKsNgBu3Nx87Tn8p5szRNdNlsBeY4MH5A9ixZtrRumenRNDvUoPGTk+R7Gb9D
zSqoeqLue8pF0wrQGAk6f/WElDB4NlTX4YII1n8pS07qUMny+xrgjQfnAoGBALcV
djF+26GoUeismhCUYklmPDS3tOszi6nFYizXGIU/QAeh9k8AMnGfwAFZxZt9tu3g
pd+ro9HToZiIu4/Q4rsyUD0+LmQc+zFuEu7YVd/xZ3kmW2fCtbZl8799yiYsXz/i
DmBwi3EVekU4iw95MCABm+KdDqbz6T24zsRvk1uDAoGBAM3hqxQVlDWxofffUeWy
Bj3RoUdPJklYHctYB+Mk4JfiOq8j575Q8lmYMIFY+2HbOwlswzo58H79H2dCkfFz
a3EQQlZeiw2fy4yA6wDeEYqdeBT3MobZonlVwnVc9Xcmgvk2YsfZS1pDrrx7J10V
vrlevNo+Q3KlffS4aP/dec67
-----END PRIVATE KEY-----`;

export { TEST_PRIVATE_KEY, TEST_TOKEN, TEST_UUID };
