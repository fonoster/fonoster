# voice-audio-filters

## ADDED Requirements

### Requirement: Applications request audio filters for a session

A voice application SHALL be able to declare, per session, an ordered list of audio filters to run
on the caller's audio, and SHALL never be required to declare any.

#### Scenario: An application asks for filtering before answering

- WHEN an application sends `SetAudioFilters` with `[{ name: "aiCoustics", options: { enhancementLevel: 0.8 } }]`
- THEN the media server builds that chain for the session and waits for it to be ready
- AND answers the verb with success
- AND every subsequent frame of caller audio passes through the chain before it is used

#### Scenario: No filters requested

- WHEN an application never sends `SetAudioFilters`
- THEN no chain is created for the session
- AND the caller's audio reaches the speech engine and the application's media stream unchanged

#### Scenario: Replacing filters mid-call

- WHEN an application sends `SetAudioFilters` again during the same session
- THEN the media server builds the new chain, swaps it in, and closes the previous one
- AND frames already being processed complete on the previous chain

#### Scenario: Clearing filters

- WHEN an application sends `SetAudioFilters` with an empty list
- THEN the existing chain is closed and audio flows unfiltered for the rest of the session

### Requirement: Filtered audio reaches every consumer of caller audio

The media server SHALL apply the session's chain at the point where caller audio forks, so that
all consumers of that audio observe the same filtered signal.

#### Scenario: Speech-to-text and the media stream agree

- WHEN a session has an active chain
- THEN the audio sent to the speech engine is the filtered audio
- AND the audio delivered to the application's media stream is the same filtered audio
- AND an autopilot's voice activity detection, which reads that stream, sees filtered audio

#### Scenario: Playback and recordings are untouched

- WHEN a session has an active chain
- THEN audio played to the caller is unaffected
- AND recordings made by the media server are unaffected

### Requirement: Filtering never fails a call

Filtering SHALL degrade to unfiltered audio rather than interrupt a call, and the media server
SHALL report the failure instead of hiding it.

#### Scenario: A filter cannot be created

- WHEN the requested filter name is unknown, or its options fail validation
- THEN the verb is answered with an error naming the filter and the reason
- AND the call continues with unfiltered audio

#### Scenario: The vendor SDK or license is missing

- WHEN a filter needs an SDK that is not installed, or a license key that is not configured
- THEN the verb is answered with an error that names the missing piece
- AND the call continues with unfiltered audio

#### Scenario: A filter fails while the call is in progress

- WHEN a filter throws, rejects, or returns a frame of a different length
- THEN that filter is disabled for the rest of the session and its input is passed through
- AND the reason is logged once
- AND the remaining filters continue to run

#### Scenario: A model is still loading when audio arrives

- WHEN audio arrives before a filter's model has finished loading
- THEN that audio passes through unfiltered rather than being delayed or dropped

### Requirement: Filter credentials never leave the media server

Filter configuration SHALL carry no secrets, and credentials SHALL be read only from the media
server's environment.

#### Scenario: Options carry no credentials

- WHEN an application declares filter options
- THEN those options contain model and tuning values only
- AND the vendor license key is read from the media server's environment
- AND the key appears in no request, no Application record, and no log line

### Requirement: The autopilot declares filters in its assistant configuration

The autopilot SHALL read an optional `audioFilters` list from its assistant configuration and
request it for each call, whether the assistant is loaded from a file or from an Application.

#### Scenario: An assistant file declares filters

- WHEN an assistant file contains `audioFilters: [{ name: aiCoustics, options: { enhancementLevel: 0.8 } }]`
- THEN the autopilot requests those filters before answering each call

#### Scenario: An assistant created through the API declares filters

- WHEN an Application's `intelligence.config` contains the same `audioFilters` list
- THEN an autopilot serving that Application requests those filters before answering each call

#### Scenario: Assistant configuration in YAML

- WHEN the assistant file has a `.yaml` or `.yml` extension
- THEN it is parsed as YAML and validated against the same schema as a JSON assistant file

#### Scenario: No audioFilters in the assistant

- WHEN the assistant configuration has no `audioFilters`
- THEN the autopilot requests no filters and the call behaves as it does today
