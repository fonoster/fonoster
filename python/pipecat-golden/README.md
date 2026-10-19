# Pipecat golden test

An unmodified Pipecat bot (`TwilioFrameSerializer` + `FastAPIWebsocketTransport`) answering calls
through AppBridge's `twilio` flavor. The test (`mods/appbridge/test/pipecat.test.ts`) checks that
the bot hears the caller, the caller hears the bot, `clear` stops playback on barge-in, DTMF
reaches the bot, and the call hangs up both through `auto_hang_up` with `base_url` pointing at the
appbridge's Calls endpoint and by closing the socket.

```sh
cd python
uv venv .venv-pipecat --python 3.12
uv pip install --python .venv-pipecat/bin/python -r pipecat-golden/requirements.txt
cd ..
CONFORMANCE_NATS_URL=nats://127.0.0.1:4222 PIPECAT_PYTHON=$PWD/python/.venv-pipecat/bin/python \
  npx mocha --timeout 60000 'mods/appbridge/test/pipecat.test.ts'
```

Last verified with pipecat-ai 1.12.0 (2026-10-15).
