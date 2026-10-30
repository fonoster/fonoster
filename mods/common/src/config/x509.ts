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
import {
  createHash,
  createPublicKey,
  KeyObject,
  randomBytes,
  sign
} from "crypto";
import { isIP } from "net";

/**
 * A minimal X.509 v3 certificate writer on Node's crypto (https-by-default): just enough DER to
 * issue the local CA and the server certificate init generates for getting started. Node reads
 * and verifies certificates itself (crypto.X509Certificate); it only lacks a way to build them.
 * Keys are ECDSA P-256, signatures ecdsa-with-SHA256.
 */

/** Big-endian bytes of a non-negative number, base 256 (at least one byte). */
const base256 = (v: number): number[] =>
  v < 256 ? [v] : [...base256(Math.floor(v / 256)), v % 256];

/** Base-128 digits of an OID arc, high bit set on every byte but the last. */
const base128 = (v: number, last = true): number[] =>
  (v < 128 ? [] : base128(Math.floor(v / 128), false)).concat(
    (v % 128) | (last ? 0 : 0x80)
  );

const tlv = (tag: number, content: Buffer): Buffer => {
  const n = content.length;
  const len = n < 0x80 ? [n] : [0x80 | base256(n).length, ...base256(n)];
  return Buffer.concat([Buffer.from([tag, ...len]), content]);
};

const seq = (...items: Buffer[]) => tlv(0x30, Buffer.concat(items));
const set = (...items: Buffer[]) => tlv(0x31, Buffer.concat(items));
const octets = (b: Buffer) => tlv(0x04, b);
const bitString = (b: Buffer, unused = 0) =>
  tlv(0x03, Buffer.concat([Buffer.from([unused]), b]));
const bool = (v: boolean) => tlv(0x01, Buffer.from([v ? 0xff : 0x00]));
const explicit = (n: number, inner: Buffer) => tlv(0xa0 | n, inner);

/** A non-negative INTEGER from big-endian bytes (a leading zero when the high bit is set). */
const integer = (b: Buffer) => {
  const first = b.findIndex((x) => x !== 0);
  const v = first < 0 ? Buffer.from([0]) : b.subarray(first);
  return tlv(0x02, v[0] & 0x80 ? Buffer.concat([Buffer.from([0]), v]) : v);
};

const oid = (dotted: string) => {
  const [a, b, ...rest] = dotted.split(".").map(Number);
  return tlv(
    0x06,
    Buffer.from([40 * a + b, ...rest.flatMap((n) => base128(n))])
  );
};

/** UTCTime until 2049, GeneralizedTime after (RFC 5280 4.1.2.5). */
const time = (d: Date) => {
  const iso = d.toISOString().replace(/[-:T]/g, "").slice(0, 14); // YYYYMMDDHHMMSS
  return d.getUTCFullYear() < 2050
    ? tlv(0x17, Buffer.from(`${iso.slice(2)}Z`, "ascii"))
    : tlv(0x18, Buffer.from(`${iso}Z`, "ascii"));
};

const OID = {
  ecdsaWithSha256: "1.2.840.10045.4.3.2",
  commonName: "2.5.4.3",
  basicConstraints: "2.5.29.19",
  keyUsage: "2.5.29.15",
  extKeyUsage: "2.5.29.37",
  subjectAltName: "2.5.29.17",
  subjectKeyIdentifier: "2.5.29.14",
  authorityKeyIdentifier: "2.5.29.35",
  serverAuth: "1.3.6.1.5.5.7.3.1"
};

const name = (commonName: string) =>
  seq(
    set(seq(oid(OID.commonName), tlv(0x0c, Buffer.from(commonName, "utf8"))))
  );

const extension = (id: string, critical: boolean, value: Buffer) =>
  seq(oid(id), ...(critical ? [bool(true)] : []), octets(value));

/** KeyUsage bits (RFC 5280 4.2.1.3) as a DER BIT STRING, trailing zero bits dropped. */
const keyUsage = (bits: number[]) => {
  const bytes = Buffer.alloc(Math.floor(Math.max(...bits) / 8) + 1);
  bits.forEach((b) => (bytes[Math.floor(b / 8)] |= 0x80 >> (b % 8)));
  const last = bytes[bytes.length - 1];
  // Unused bits: the trailing zero bits of the last byte (it has at least one bit set).
  const unused = Math.log2(last & -last);
  return bitString(bytes, unused);
};

const KEY_USAGE = { digitalSignature: 0, keyCertSign: 5, cRLSign: 6 };

/** subjectAltName: dNSName [2] and iPAddress [7] (4 or 16 bytes). */
const altNames = (names: string[]) =>
  seq(
    ...names.map((n) =>
      isIP(n) === 4
        ? tlv(0x87, Buffer.from(n.split(".").map(Number)))
        : isIP(n) === 6
          ? tlv(0x87, ipv6Bytes(n))
          : tlv(0x82, Buffer.from(n, "ascii"))
    )
  );

function ipv6Bytes(ip: string): Buffer {
  const [head, tail = ""] = ip.split("::");
  const parts = (s: string) => (s ? s.split(":") : []);
  const h = parts(head);
  const t = parts(tail);
  const groups = ip.includes("::")
    ? [...h, ...Array(8 - h.length - t.length).fill("0"), ...t]
    : h;
  return Buffer.from(
    groups.flatMap((g) => {
      const v = parseInt(g, 16);
      return [v >> 8, v & 0xff];
    })
  );
}

/** Key identifier: SHA-1 of the DER SubjectPublicKeyInfo (unique per key; RFC 7093 allows it). */
export const keyIdentifier = (publicKey: KeyObject) =>
  createHash("sha1")
    .update(publicKey.export({ type: "spki", format: "der" }))
    .digest();

export type CertificateRequest = {
  /** The subject's public key. */
  publicKey: KeyObject;
  subject: string;
  issuer: string;
  /** The issuer's private key (the subject's own for a self-signed CA). */
  signingKey: KeyObject;
  notBefore: Date;
  notAfter: Date;
  /** A CA certificate (keyCertSign) or a TLS server certificate for these names. */
  ca: boolean;
  names?: string[];
};

/** Builds and signs an X.509 v3 certificate; returns it as PEM. */
export function createCertificate(req: CertificateRequest): string {
  const signatureAlgorithm = seq(oid(OID.ecdsaWithSha256));
  const serial = randomBytes(16);
  serial[0] &= 0x7f;
  const issuerKey = createPublicKey(req.signingKey);
  const extensions = req.ca
    ? [
        extension(OID.basicConstraints, true, seq(bool(true))),
        extension(
          OID.keyUsage,
          true,
          keyUsage([KEY_USAGE.keyCertSign, KEY_USAGE.cRLSign])
        ),
        extension(
          OID.subjectKeyIdentifier,
          false,
          octets(keyIdentifier(req.publicKey))
        )
      ]
    : [
        extension(OID.basicConstraints, true, seq()),
        extension(OID.keyUsage, true, keyUsage([KEY_USAGE.digitalSignature])),
        extension(OID.extKeyUsage, false, seq(oid(OID.serverAuth))),
        extension(OID.subjectAltName, false, altNames(req.names ?? [])),
        extension(
          OID.authorityKeyIdentifier,
          false,
          seq(tlv(0x80, keyIdentifier(issuerKey)))
        )
      ];
  const tbs = seq(
    explicit(0, integer(Buffer.from([2]))),
    integer(serial),
    signatureAlgorithm,
    name(req.issuer),
    seq(time(req.notBefore), time(req.notAfter)),
    name(req.subject),
    req.publicKey.export({ type: "spki", format: "der" }),
    explicit(3, seq(...extensions))
  );
  const signature = sign("sha256", tbs, {
    key: req.signingKey,
    dsaEncoding: "der"
  });
  const der = seq(tbs, signatureAlgorithm, bitString(signature));
  const b64 = der.toString("base64").replace(/.{1,64}/g, "$&\n");
  return `-----BEGIN CERTIFICATE-----\n${b64}-----END CERTIFICATE-----\n`;
}
