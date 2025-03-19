##
# Build stage
##
FROM node:20-slim AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work
COPY . .

RUN npm install && npm run build

##
# Run stage
##
FROM node:20-slim

ENV ASSISTANT=/opt/fonoster/assistant.json

RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

COPY --from=builder --chown=appuser:appuser /work/mods/autopilot/dist /home/appuser/autopilot/dist
COPY --from=builder --chown=appuser:appuser /work/mods/autopilot/package.json /home/appuser/autopilot/package.json
COPY --from=builder --chown=appuser:appuser /work/mods/autopilot/node_modules /home/appuser/autopilot/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/autopilot/silero_vad_v5.onnx /home/appuser/autopilot/silero_vad_v5.onnx
COPY --from=builder --chown=appuser:appuser /work/mods/autopilot/silero_vad_v5_16k_op15.onnx /home/appuser/autopilot/silero_vad_v5_16k_op15.onnx

WORKDIR /home/appuser/autopilot

# Workaround for missing voice module
RUN npm install @fonoster/voice

USER appuser

CMD ["node", "/home/appuser/autopilot/dist/server.js"]
