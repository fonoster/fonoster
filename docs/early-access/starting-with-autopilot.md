# Getting started with Fonoster Autopilot

This guide shows how to quickly set up and run a voice-based AI Agent with Fonoster Autopilot, configure your assistant, run it in a Docker container, and expose it to external callers with Ngrok.

## What Autopilot Does

Fonoster Autopilot creates voice-driven AI applications using large language models. It can greet callers, guide them through services, integrate external data, and handle conversational flows over the phone.

## The Configuration File

Your `assistant.json` defines how the AI agent behaves:

- **conversationSettings**: Defines greeting messages, error handling, transfer options, and idle timeouts
- **languageModel**: Specifies the language model provider, model type, and parameters (temperature, max tokens, etc.)
- **knowledgeBase / tools**: Optional external sources and actions the assistant can use

**Example:**

```json
{
  "conversationSettings": {
    "firstMessage": "Hi, this is Enmma your Pizza expert. How can I help you today?",
    "systemTemplate": "You are an expert on all things Pizza",
    "goodbyeMessage": "Goodbye! Have a great day!",
    "systemErrorMessage": "I'm sorry, but I seem to be having trouble. Please try again later.",
    "maxSpeechWaitTimeout": 10000,
    "idleOptions": {
      "message": "Are you still there?",
      "timeout": 15000,
      "maxTimeoutCount": 2
    },
    "vad": {
      "activationThreshold": 0.30,
      "deactivationThreshold": 0.15,
      "debounceFrames": 1
    }
  },
  "languageModel": {
    "provider": "groq",
    "apiKey": "your-api-key",
    "model": "llama3-groq-70b-8192-tool-use-preview",
    "temperature": 0.4,
    "maxTokens": 200,
    "knowledgeBase": [],
    "tools": []
  }
}
```

## Requirements

Prepare the following before running Autopilot:

- Docker: Ensure Docker is installed and running
- Ngrok: To expose your local instance to the outside world
- Environment Variables (optional for knowledge base features): If using knowledge bases, set `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET`, `ACCESS_KEY`, `AWS_S3_REGION`, `AWS_S3_ENDPOINT`, `UNSTRUCTURED_API_KEY`, `UNSTRUCTURED_API_URL`, and `KNOWLEDGE_BASE_ENABLED`

# Running Autopilot with Docker

```bash
docker run \
  -p 50061:50061 \
  -e LOGS_LEVEL="verbose" \
  -v $(pwd)/assistant.json:/home/appuser/autopilot/config/assistant.json:ro \
  fonoster/autopilot:latest
```

Check logs with `docker logs <container-id>` to confirm it's running:

```bash
2024-12-08 11:32:16.584 [info]: (voice) started voice server @ 0.0.0.0, port=50061
```

## Exposing Autopilot with Ngrok

```bash
ngrok tcp 50061
```

Use the generated Ngrok address in Fonoster to connect external callers to your Autopilot instance.

## Adding Knowledge Later

To add a knowledge base, update assistant.json and environment variables. For example:

```yaml
"knowledgeBase": [{
  "type": "s3",
  "title": "Menu PDF",
  "document": "sample.pdf"
}]
```

> Remember to set the corresponding environment variables.

Restart the container after changes.

## What's Next

Future updates will add more language models, improved integration with external data, and enhanced flexibility.
