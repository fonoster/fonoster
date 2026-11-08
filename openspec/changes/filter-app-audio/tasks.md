# Tasks

## 1. AppBridge

- [x] 1.1 Start the app's filters at session start instead of with speech recognition
- [x] 1.2 Send filtered caller audio to the app's stream, then to speech recognition and turn detection; listen-only sockets keep the raw audio
- [x] 1.3 Tests: a `fonoster` app with no Speech command and a `twilio` app both receive filtered caller audio; a listen-only socket receives raw audio

## 2. Docs

- [x] 2.1 Operator doc (`docs/operators/audio-filters.md`) and user page (`docs-site/telephony/noise-cancelling.mdx`): every app, both protocols; recordings stay unfiltered

## 3. Verify

- [ ] 3.1 On production, one call to an agent and one to a Twilio app with noise cancelling on: no *Unfiltered* badge, and the app hears filtered audio
