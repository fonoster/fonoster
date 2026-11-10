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
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { EmailParams } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { Role } from "@fonoster/types";
import { expect } from "chai";
import nodemailer from "nodemailer";
import { createSandbox } from "sinon";
import { Prisma } from "../../src/db";
import { IdentityConfig } from "../../src/exchanges/types";
import { createInviteBody } from "../../src/invites/createInviteBody";
import { sendInvite } from "../../src/invites/sendInvite";
import { loadConfig } from "../../src/server/config";
import { createResetPasswordBody } from "../../src/users/createResetPasswordBody";
import { createSendResetPasswordCode } from "../../src/users/createSendResetPasswordCode";
import { sendResetPasswordEmail } from "../../src/users/sendResetPasswordEmail";
import { createBodyForVerificationEmail } from "../../src/verification/createBodyForVerificationEmail";
import { createSendVerificationCode } from "../../src/verification/createSendVerificationCode";
import { sendVerificationEmail } from "../../src/verification/sendVerificationEmail";
import { createInviteUserToWorkspace } from "../../src/workspaces/createInviteUserToWorkspace";
import { createResendWorkspaceMembershipInvitation } from "../../src/workspaces/createResendWorkspaceMembershipInvitation";
import { TEST_PRIVATE_KEY, TEST_TOKEN, TEST_UUID } from "../utils";

// The account emails render the approved frames in designs/emails.pen (#1268).

const sandbox = createSandbox();

const LOGO = "https://app.acme.test/logo-email.png";
const OTP = "83sgd9e6ar";
const CODE = "482917";
const INVITE_URL = "https://app.acme.test/invites?token=jwt";
const RESET_URL = "https://app.acme.test/reset-password?token=abc";
const TEMPLATES = join(__dirname, "..", "..", "src", "templates");

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
  "&#x3D;": "=",
  "&#x60;": "`",
  "&nbsp;": " "
};

/** The visible words of an email: no head, no preheader, no tags. */
const wordsOf = (html: string) =>
  html
    .replace(/<head[\s\S]*?<\/head>/i, "")
    .replace(/<div[^>]*display:\s*none[\s\S]*?<\/div>/i, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#\w]+;/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, " ")
    .trim();

const preheaderOf = (html: string) =>
  html
    .match(/<div[^>]*display:\s*none[^>]*>([^<]*)</i)?.[1]
    .replace(/&[#\w]+;/g, (e) => ENTITIES[e] ?? e)
    .trim();

const logoOf = (html: string) => html.match(/<img[^>]*>/i)?.[0] ?? "";

const expectLogo = (html: string, src = LOGO) => {
  const img = logoOf(html);
  expect(img).to.include(`src="${src}"`);
  expect(img).to.include('alt="Fonoster"');
  expect(img).to.include('width="124"');
  expect(img).to.include('height="32"');
  expect(html).to.not.include("fonoster.com");
};

const expectWords = (html: string, sentences: string[]) => {
  const words = wordsOf(html);
  for (const sentence of sentences) {
    expect(words).to.include(sentence);
  }
};

const INVITE_FOOTER =
  "You got this email because someone invited you to a workspace on Fonoster. If you weren't expecting it, you can ignore it.";

const newUserInvite = (workspaceName = "Acme") =>
  createInviteBody({
    isExistingUser: false,
    workspaceName,
    oneTimePassword: OTP,
    inviteUrl: INVITE_URL,
    logoUrl: LOGO
  });

const existingUserInvite = () =>
  createInviteBody({
    isExistingUser: true,
    workspaceName: "Acme",
    oneTimePassword: OTP,
    inviteUrl: INVITE_URL,
    logoUrl: LOGO
  });

const reset = () =>
  createResetPasswordBody({ resetPasswordUrl: RESET_URL, logoUrl: LOGO });

const verification = () =>
  createBodyForVerificationEmail({ verificationCode: CODE, logoUrl: LOGO });

describe("@identity[templates/email templates]", function () {
  afterEach(() => sandbox.restore());

  describe("invite, new user (frame Email / Invite new user)", function () {
    it("renders the frame's words, preheader and logo", function () {
      const html = newUserInvite();

      expect(preheaderOf(html)).to.equal(
        "Accept the invitation, then sign in with the temporary password inside."
      );
      expectWords(html, [
        "Join Acme on Fonoster",
        "You've been invited to the Acme workspace on Fonoster.",
        "Your temporary password:",
        "Accept the invitation, then sign in with this email address and the temporary password. You'll be asked to choose a new password.",
        "Accept invitation",
        "If the link has expired, ask the person who invited you to send it again.",
        INVITE_FOOTER
      ]);
      expectLogo(html);
    });

    it("marks the password with data-otp and links the button to the escaped invite URL", function () {
      const html = newUserInvite();

      expect(html.match(/data-otp[^>]*>([^<]+)</)?.[1]).to.equal(OTP);
      const button = html.match(/<a [^>]*>\s*Accept invitation\s*<\/a>/)?.[0];
      expect(button).to.include(
        'href="https://app.acme.test/invites?token&#x3D;jwt"'
      );
      expect(preheaderOf(html)).to.not.include(OTP);
    });

    it("escapes the workspace name", function () {
      const html = newUserInvite("<script>x</script>");

      expect(html).to.include("&lt;script&gt;");
      expect(html).to.not.include("<script>");
    });
  });

  describe("invite, existing user (frame Email / Invite existing user)", function () {
    it("renders the frame's words without a password", function () {
      const html = existingUserInvite();

      expect(preheaderOf(html)).to.equal(
        "Accept the invitation to start working in Acme."
      );
      expectWords(html, [
        "Join Acme on Fonoster",
        "You've been invited to the Acme workspace on Fonoster.",
        "Accept the invitation, then sign in to start working in it.",
        "Accept invitation",
        "If the link has expired, ask the person who invited you to send it again.",
        INVITE_FOOTER
      ]);
      expect(html).to.not.include(OTP);
      expect(html).to.not.include("data-otp");
      expectLogo(html);
    });
  });

  describe("reset password (frame Email / Reset password)", function () {
    it("renders the frame's words and links the button to the escaped URL", function () {
      const html = reset();

      expect(preheaderOf(html)).to.equal(
        "Use this link within 5 minutes to choose a new password."
      );
      expectWords(html, [
        "Reset your password",
        "We got a request to reset the password for your Fonoster account.",
        "Select the button to choose a new password. The link expires in 5 minutes.",
        "Reset password",
        "If the link has expired, request a new one from the sign-in page.",
        "If you didn't ask to reset your password, ignore this email. Your password won't change."
      ]);
      const button = html.match(/<a [^>]*>\s*Reset password\s*<\/a>/)?.[0];
      expect(button).to.include(
        'href="https://app.acme.test/reset-password?token&#x3D;abc"'
      );
      expectLogo(html);
    });
  });

  describe("verification code (frame Email / Verification code)", function () {
    it("renders the frame's words and marks the code with data-verification-code", function () {
      const html = verification();

      expect(preheaderOf(html)).to.equal(
        "Enter this code to verify your email. It expires in 5 minutes."
      );
      expectWords(html, [
        "Verify your email",
        "Enter this code in Fonoster to verify your email address:",
        "The code expires in 5 minutes.",
        "If you didn't ask for this code, you can ignore this email."
      ]);
      expect(html.match(/data-verification-code[^>]*>(\d{6})</)?.[1]).to.equal(
        CODE
      );
      expect(html).to.not.match(/<a /);
      expectLogo(html);
    });
  });

  describe("every email", function () {
    const bodies = () => [
      newUserInvite(),
      existingUserInvite(),
      reset(),
      verification()
    ];

    it("has one button at most and keeps the light look inline: <style> holds only the dark media query", function () {
      for (const html of bodies()) {
        const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? [];
        expect(styles).to.have.length(1);
        const css = styles[0]
          .replace(/<\/?style[^>]*>/gi, "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .trim();
        expect(css).to.match(/^@media \(prefers-color-scheme: dark\) \{/);
        // Drop the media query's balanced braces; nothing may remain.
        let depth = 0;
        let rest = "";
        for (const ch of css.replace(/^@media[^{]*/, "")) {
          if (ch === "{") depth++;
          else if (ch === "}") depth--;
          else if (depth === 0) rest += ch;
        }
        expect(depth).to.equal(0);
        expect(rest.trim()).to.equal("");
        expect((html.match(/<a /g) ?? []).length).to.be.at.most(1);
      }
    });

    it("no template uses triple-stash", function () {
      for (const file of readdirSync(TEMPLATES).filter((f) =>
        f.endsWith(".hbs")
      )) {
        expect(
          readFileSync(join(TEMPLATES, file), "utf8"),
          file
        ).to.not.include("{{{");
      }
    });
  });

  describe("subjects", function () {
    it("sendInvite uses the workspace name", async function () {
      const sendEmail = sandbox.stub().resolves();
      await sendInvite(sendEmail, {
        recipient: "ana@acme.test",
        isExistingUser: false,
        workspaceName: "Acme",
        oneTimePassword: OTP,
        inviteUrl: INVITE_URL,
        logoUrl: LOGO
      });
      expect(sendEmail.firstCall.args[0].subject).to.equal(
        "You're invited to Acme on Fonoster"
      );
    });

    it("sendResetPasswordEmail", async function () {
      const sendEmail = sandbox.stub().resolves();
      await sendResetPasswordEmail(sendEmail, {
        recipient: "ana@acme.test",
        resetPasswordUrl: RESET_URL,
        logoUrl: LOGO
      });
      expect(sendEmail.firstCall.args[0].subject).to.equal(
        "Reset your Fonoster password"
      );
    });

    it("sendVerificationEmail", async function () {
      const sendEmail = sandbox.stub().resolves();
      await sendVerificationEmail(sendEmail, {
        recipient: "ana@acme.test",
        verificationCode: CODE,
        logoUrl: LOGO
      });
      expect(sendEmail.firstCall.args[0].subject).to.equal(
        "Your Fonoster verification code"
      );
    });
  });

  describe("the logo URL through each sender", function () {
    let sent: EmailParams[];

    beforeEach(function () {
      sent = [];
      // Catch the emails where they would leave for the SMTP server.
      sandbox.stub(nodemailer, "createTransport").returns({
        sendMail: async (params: EmailParams) => {
          sent.push(params);
          return { messageId: "test" };
        }
      } as unknown as ReturnType<typeof nodemailer.createTransport>);
    });

    const invoke = (handler: Function, call: unknown) =>
      new Promise<void>((resolve) => handler(call, () => resolve()));

    const workspaceCall = (request: unknown) => {
      const metadata = new grpc.Metadata();
      metadata.set("token", TEST_TOKEN);
      return { metadata, request };
    };

    const prismaForInvite = () =>
      ({
        user: {
          findUnique: sandbox.stub().resolves(),
          create: sandbox.stub().resolves({ ref: TEST_UUID })
        },
        workspaceMember: {
          create: sandbox.stub().resolves({ workspace: { name: "Acme" } }),
          findFirst: sandbox.stub().resolves()
        },
        workspace: {
          findUnique: sandbox.stub().resolves({
            ref: TEST_UUID,
            ownerRef: "635c0cd8-8125-483d-b467-05c53ce2cd31",
            members: []
          })
        }
      }) as unknown as Prisma;

    const prismaForResend = () =>
      ({
        workspace: {
          findUnique: sandbox.stub().resolves({
            ref: "123",
            ownerRef: TEST_UUID,
            members: [{ userRef: TEST_UUID, role: "ADMIN" }]
          })
        },
        workspaceMember: {
          findFirst: sandbox.stub().resolves({
            ref: "m1",
            user: {
              ref: TEST_UUID,
              email: "ana@acme.test",
              accessKeyId: "US123",
              mustChangePassword: false
            },
            workspace: { name: "Acme" }
          })
        }
      }) as unknown as Prisma;

    const prismaForCodes = () =>
      ({
        user: { findUnique: sandbox.stub().resolves({ ref: TEST_UUID }) },
        verificationCode: {
          deleteMany: sandbox.stub().resolves(),
          create: sandbox.stub().resolves()
        }
      }) as unknown as Prisma;

    /** Sends all four emails through their real senders and returns them. */
    const sendAll = async (identityConfig: IdentityConfig) => {
      await invoke(
        createInviteUserToWorkspace(
          prismaForInvite(),
          identityConfig,
          sendInvite
        ),
        workspaceCall({
          workspaceRef: "1",
          email: "new@acme.test",
          name: "New",
          role: Role.WORKSPACE_ADMIN
        })
      );
      await invoke(
        createResendWorkspaceMembershipInvitation(
          prismaForResend(),
          identityConfig,
          sendInvite
        ),
        workspaceCall({ userRef: TEST_UUID })
      );
      await invoke(
        createSendResetPasswordCode(prismaForCodes(), identityConfig),
        { metadata: new grpc.Metadata(), request: { username: "a@acme.test" } }
      );
      await invoke(
        createSendVerificationCode(prismaForCodes(), identityConfig),
        {
          metadata: new grpc.Metadata(),
          request: { contactType: "EMAIL", value: "v@acme.test" }
        }
      );
      // The verification email is sent after the answer.
      await new Promise((resolve) => setImmediate(resolve));
      return sent;
    };

    const baseConfig = {
      smtpConfig: {
        host: "smtp.acme.test",
        port: 587,
        secure: false,
        sender: "Acme <no-reply@acme.test>",
        auth: { user: "u", pass: "p" }
      },
      privateKey: TEST_PRIVATE_KEY,
      workspaceInviteUrl: "https://app.acme.test/invites",
      workspaceInviteExpiration: "1d",
      auth: { methods: ["password"], signup: "invite" }
    };

    it("uses <appUrl>/logo-email.png when identity is configured with appUrl", async function () {
      const dir = mkdtempSync(join(tmpdir(), "fonoster-identity-"));
      try {
        const path = join(dir, "identity.json");
        writeFileSync(
          path,
          JSON.stringify({
            database: { url: "postgresql://u:p@db/identity" },
            encryptionKey:
              "k1.aesgcm256.QbAsmmaz84hmSaol9HreK-s91rE1Rk8YAAkTq48kZGw=",
            issuer: "https://id.acme.test",
            appUrl: "https://app.acme.test",
            keys: { privateKey: "test-private", publicKey: "test-public" }
          })
        );
        const { identityConfig } = loadConfig([
          "node",
          "identity",
          "--config",
          path
        ]);
        expect(identityConfig.emailLogoUrl).to.equal(LOGO);

        const emails = await sendAll({
          ...identityConfig,
          ...baseConfig
        } as IdentityConfig);

        expect(emails).to.have.length(4);
        emails.forEach((email) => expectLogo(email.html as string));
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("falls back to <issuer>/logo-email.png when emailLogoUrl is unset", async function () {
      const emails = await sendAll({
        ...baseConfig,
        issuer: "https://id.acme.test/"
      } as unknown as IdentityConfig);

      expect(emails).to.have.length(4);
      emails.forEach((email) =>
        expectLogo(email.html as string, "https://id.acme.test/logo-email.png")
      );
    });
  });
});
