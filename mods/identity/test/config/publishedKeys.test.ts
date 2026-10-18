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
import { generateKeyPairSync } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { expect } from "chai";
import { parse } from "yaml";
import { assertUnpublishedKeys } from "../../src/config/publishedKeys";

// M12: the signing key and encryption key once committed to the repository (and the example's
// placeholder) are refused, so a copied config can't run with publicly known keys.

// The removed config/keys/public.pem, as published in the repository's history.
const PUBLISHED_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmTrRbOKghQO9BRKu1YNK
01yv0n1mc7OcHz24gZbki8FtAI5JHzF4xFXoFEwTjfyuW2JNnwlFQhGd1Spvp74q
QFWSD3xZAGBpec4xozNOBYZhjku+uaKoeRPLpy6zefnpWhS5i4UNgZOMqh7euzk1
zGXoc2W0HbWUVeGB/ED5sHfSMHGwGZ48h25qzuXkhA+Pxtwccnx6XLNvuUJwHp4H
L+/ULkLK/UIgSOb5rMue3m1xcw74xlY+mlG3hYPa3VPvMfukv6FmJqZkOB8kI7vb
EvYRQCWlqurArhOkksdWTbhTAQfor/XmfmrkoX4/oZN3Y/wm4/a7YMAANxVHFaKT
fQIDAQAB
-----END PUBLIC KEY-----`;

const fresh = () => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return {
    privateKey: pair.privateKey
      .export({ type: "pkcs8", format: "pem" })
      .toString(),
    publicKey: pair.publicKey.export({ type: "spki", format: "pem" }).toString()
  };
};

describe("@identity[config/published keys]", function () {
  const own = "k1.aesgcm256.QbAsmmaz84hmSaol9HreK-s91rE1Rk8YAAkTq48kZGw=";

  it("accepts keys generated for the install", function () {
    expect(() =>
      assertUnpublishedKeys({ ...fresh(), encryptionKey: own })
    ).not.to.throw();
  });

  it("refuses the encryption key once committed and the example's placeholder", function () {
    const example = parse(
      readFileSync(
        join(__dirname, "../../../../config/fonoster.example.yaml"),
        "utf8"
      )
    ).encryption.key;
    for (const encryptionKey of [
      "k1.aesgcm256.MmPSvzCG9fk654bAbl30tsqq4h9d3N4F11hlue8bGAY=",
      example
    ])
      expect(() =>
        assertUnpublishedKeys({ ...fresh(), encryptionKey })
      ).to.throw(/encryption.key/);
  });

  it("refuses the signing key once committed (by fingerprint)", function () {
    expect(() =>
      assertUnpublishedKeys({
        privateKey: fresh().privateKey,
        publicKey: PUBLISHED_PUBLIC_KEY,
        encryptionKey: own
      })
    ).to.throw(/signing key/);
  });
});
