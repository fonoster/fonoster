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
    "firstMessage": "Hello, this is Olivia from Dr. Green's Family Medicine. How can I assist you today?",
    "systemTemplate": "You are a Customer Service Representative. You are here to help the caller with their needs.",
    "systemErrorMessage": "I'm sorry, but I seem to be having trouble. Please try again later.",
    "initialDtmf": "6589",
    "transferOptions": {
      "phoneNumber": "+15555555555",
      "message": "Please hold while I transfer you.",
      "timeout": 30000
    },
    "idleOptions": {
      "message": "Are you still there?",
      "timeout": 10000,
      "maxTimeoutCount": 3
    }
  },
  "languageModel": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "maxTokens": 250,
    "temperature": 0.7,
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
docker run -d \
  -p 50061:50061 \
  -e SKIP_IDENTITY="true" \
  -e KNOWLEDGE_BASE_ENABLED="false" \
  -e OPENAI_API_KEY="sk-proj-xxx" \
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
