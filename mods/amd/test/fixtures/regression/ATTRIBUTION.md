# Attribution

Third-party audio in this directory, converted to raw 16 kHz mono PCM for use
as classifier regression fixtures. Full provenance, including the exact
license URL and the current classifier baseline for each file, is in
`manifest.json` — this file exists to satisfy the attribution clause of the
CC BY / CC BY-SA entries below.

- **human-1.pcm** — derived from `demo-congrats.wav`, part of Asterisk's
  `asterisk-core-sounds-en` package, voiced by Allison Smith.
  © Digium/Sangoma. Licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
  Source: https://downloads.asterisk.org/pub/telephony/sounds/releases/asterisk-core-sounds-en-wav-1.6.1.tar.gz

- **human-2.pcm** through **human-11.pcm** — derived from the
  [PolyAI/MINDS-14](https://huggingface.co/datasets/PolyAI/minds14) dataset
  (en-US split), real e-banking customer-service call recordings.
  Licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

- **voicemail-2.pcm** — derived from a recording by Freesound user
  **lyd4tuna**. Licensed [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
  (public domain; attribution not required, credited here as courtesy).
  Source: https://freesound.org/people/lyd4tuna/sounds/453261/

- **voicemail-3.pcm** — derived from a recording by Freesound user
  **Danrules213**. Licensed [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
  (public domain; credited as courtesy).
  Source: https://freesound.org/people/Danrules213/sounds/341394/

- **voicemail-4.pcm** — derived from a recording by Freesound user
  **lyd4tuna**. Licensed [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
  (public domain; credited as courtesy).
  Source: https://freesound.org/people/lyd4tuna/sounds/453271/

- **machine-1.pcm** — derived from a recording by Freesound user
  **DiArchangeli**. Licensed [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
  (public domain; credited as courtesy).
  Source: https://freesound.org/people/DiArchangeli/sounds/116390/

- **machine-2.pcm**, **machine-3.pcm**, **ivr-1.pcm** through **ivr-4.pcm** —
  synthesized for this project using macOS's built-in `say` (Samantha/Fred
  voices); no third-party source, no license restrictions. Used because no
  real-world recording with an unambiguous open license turned up for these
  two categories in a reasonable search — see each entry's `note` in
  `manifest.json`.

All third-party clips above were trimmed and downsampled from the original;
see `manifest.json`'s `trimmedTo` field for exact durations.
