import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {ChannelMock} from "./mock_channel";
import Verbs from "../src/verbs";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonos/voice/verbs", () => {
  context("answer/hangup verbs", () => {
    const channel = new ChannelMock();
    const verbs = new Verbs(channel);

    it("will return zero", () => {
      expect(verbs.answer()).to.be.equal(0);
    });

    it("it will hangup and return one", () => {
      expect(verbs.hangup()).to.be.equal(1);
    });
  });

  context("play verb", () => {
    const channel = new ChannelMock();
    channel.setData(["1"]);
    const verbs = new Verbs(channel);

    it.skip("plays the file", () => {
      const result = verbs.play("beep");
      expect(result).to.be.equal("1");
    });

    it("will fail if finishOnKey is an invalid character", () => {
      expect(() => verbs.play("beep", {finishOnKey: "%"})).to.throw(
        "Invalid finishOnKey parameter: found % but must be a single digit type of 0-9,#,*"
      );
    });
  });

  context("gather verb", () => {
    const channel = new ChannelMock();
    const verbs = new Verbs(channel);

    it("will fail finishOnKey is not a single char", () => {
      expect(() => verbs.gather("", {finishOnKey: "aa"})).to.throw(
        "finishOnKey must a single char. Default value is #. Acceptable values are digits from 0-9,#,*"
      );
    });

    it("will fail if timeout < 0", () => {
      expect(() => verbs.gather("", {timeout: -1})).to.throw(
        "-1 is not an acceptable timeout value. For no timeout use zero. Timeout must be equal or greater than zero"
      );
      /*expect(() => verbs.gather('', { timeout: 'a' })).to.throw(
        'a is not an acceptable timeout value. For no timeout use zero. Timeout must be equal or greater than zero'
      )*/
    });

    it("will fail if maxDigits < 0 or not a number", () => {
      expect(() => verbs.gather("", {maxDigits: -1})).to.throw(
        "-1 is not an acceptable maxDigits value. The maxDigits value must be greater than zero. Omit value for no limit on the number of digits"
      );
      /*expect(() => verbs.gather('', { maxDigits: 'a' })).to.throw(
        'a is not an acceptable maxDigits value. The maxDigits value must be greater than zero. Omit value for no limit on the number of digits'
      )*/
    });

    it("will fail if not maxDigits or timeout is present", () => {
      expect(() => verbs.gather("", {})).to.throw(
        "you must provide either maxDigits or timeout"
      );
    });

    it("will gather some digits", () => {
      // Stops reading at maxDigits
      channel.setData(["1", "2", "3", "4"]);
      let result = verbs.gather("", {maxDigits: 4});
      expect(result).to.be.equal("1234");

      // Stops reading at finishOnKey char
      channel.setData(["1", "2", "3", "4", "*"]);
      channel.resetDataPointer();
      result = verbs.gather("", {maxDigits: 6, finishOnKey: "*"});
      expect(result).to.be.equal("1234");

      // Stops reading at null because a timeout event
      channel.setData(["1", "2", "3", null]);
      channel.resetDataPointer();
      result = verbs.gather("", {timeout: 5, maxDigits: 4});
      expect(result).to.be.equal("123");
    });
  });

  context("wait verb", () => {
    const channel = new ChannelMock();
    const verbs = new Verbs(channel);

    it("wait for chacter", () => {
      expect(() => verbs.wait(-1));
    });
  });

  context("stash verb", () => {
    const channel = new ChannelMock();
    const verbs = new Verbs(channel);

    it("throws because of invalid chacter", () => {
      /*expect(() => verbs.record({ beep: 'a' })).to.throw(
        'a is not an acceptable value. Must be a true or false'
      )*/
    });

    it("does not throw", () => {
      expect(() => verbs.record()).to.not.throw;
    });
  });

  context("record verb", () => {
    it("throws because of invalid chacter", () => {
      const channel = new ChannelMock();
      const verbs = new Verbs(channel);
      verbs.stash("key1", "val1");
      verbs.stash("key2", "val2");
      verbs.stash("key3", "val3");

      expect(verbs.getCallDetailRecord().vars)
        .to.be.a("map")
        .to.have.all.keys(["key1", "key2", "key3"]);
    });
  });
});
