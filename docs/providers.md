# Providers: voices, speech models and LLMs

Fonoster calls speech and language vendors for you. Each model and voice has a catalog id of the
form `<provider>/<name>`, for example:

| Kind | Example ids |
| --- | --- |
| STT model | `deepgram/nova-3` |
| TTS voice | `deepgram/aura-2-thalia-en` |
| LLM | `openai/gpt-5.4-mini` |

The catalog depends on the platform you use; list what yours offers:

```sh
fonoster providers:catalog                          # everything
fonoster providers:catalog --kind voice             # provider, model or voice
fonoster providers:catalog --kind model --type stt  # stt, tts or llm
```

Each line shows the id, its state and languages (a deprecated item shows its replacement). The
dashboard's app editor shows the same catalog in its pickers. Providers that the platform cannot
run, or that have no key available to your workspace, are not listed.

## Using an id

- **Apps**: `speech.voice` and `speech.sttModel` take catalog ids, for example
  `voice: deepgram/aura-2-thalia-en`, `sttModel: deepgram/nova-3`.
- **Autopilot agents**: the language model (`languageModel.model`) and voice
  (`conversationSettings.voice`) take catalog ids. An agent with tools needs an LLM that
  supports tool calling.
- An id that is not in the catalog is refused (the app gets an `invalid_catalog_id` error, which is not fatal to the call).

## Bring your own key

By default calls use the platform's vendor keys. To use your own vendor account, set a key for
the provider. It is stored encrypted as a workspace Secret, is write-only (nothing returns it) and
is used only for your workspace's calls. Setting it again replaces it. You need the owner or admin
role.

```sh
fonoster providers:keys:set deepgram           # asks for the key without echo
fonoster providers:keys:set elevenlabs --key "$ELEVENLABS_API_KEY"
fonoster providers:keys:list                   # which providers have a key; never the key
fonoster providers:keys:delete deepgram
```

The dashboard has the same under Vendor keys. A provider the platform has no key for becomes
usable once your workspace sets its own. If the lookup of your key is slow or fails at session start, the call uses the platform key.

In a private region, provider keys are set on the region machine instead
(`fonoster-region secrets set <provider>`); see
[Running a region](./operators/regions.md).

## What a deprecation warning means

Vendors retire models. When Fonoster deprecates a model, voice or provider, it names a
replacement and a retirement date. Until that date nothing changes: your calls keep using the old
id.

You are told in three places:

- **Dashboard**: the Apps page shows a warning for each deprecated item that one of your apps or
  agents names (or that a call used in the last 7 days), with the retire date, the
  replacement and the apps affected. It clears when you change every config away from the item.
- **Webhook**: `provider.deprecated` with `id`, `replacement` and `retireOn`. See
  [webhooks](./webhooks.md).
- **Call record**: a session that used the item records `provider.deprecated_used`.

What to do: pick the replacement in your app or agent before the retire date, and listen to a
test call. Models differ, and a replacement can sound or behave a little differently.

On the retire date, Fonoster rewrites your configs that can move to the replacement. Settings
the replacement does not accept are removed. A config that cannot move (for example a cloned
voice that exists only on the old model) keeps the old id; the platform plays the replacement for
it, and the warning (now "retired") stays until you pick a new model or voice yourself. A call
that used a retired id records `provider.retired_used`.

If a vendor is down, the platform does not switch to another one on its own. The app gets a
`provider_unavailable` error and decides what to do.
