{{- define "fonoster-rebuild.labels" -}}
app.kubernetes.io/part-of: fonoster
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/* Selector labels of one component: (dict "root" $ "name" "apiserver"). */}}
{{- define "fonoster-rebuild.selector" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
{{- end }}

{{/* NATS URL: the chart's own NATS when nats.deploy, else nats.url. */}}
{{- define "fonoster-rebuild.natsUrl" -}}
{{- if .Values.nats.deploy -}}
nats://{{ .Release.Name }}-nats:4222
{{- else -}}
{{ .Values.nats.url }}
{{- end -}}
{{- end }}

{{/* OTLP endpoint: otel.endpoint, else the chart's collector when observability.enabled. */}}
{{- define "fonoster-rebuild.otlpEndpoint" -}}
{{- if .Values.otel.endpoint -}}
{{ .Values.otel.endpoint }}
{{- else if .Values.observability.enabled -}}
http://{{ .Release.Name }}-otel-collector:4318
{{- end -}}
{{- end }}

{{/*
Env every Fonoster service gets: OTLP endpoint and service name, and what `secret://k8s/...`
references need (the pod's namespace and where Secrets are mounted). (dict "root" $ "service" "x")
*/}}
{{- define "fonoster-rebuild.commonEnv" -}}
- name: OTEL_EXPORTER_OTLP_ENDPOINT
  value: {{ include "fonoster-rebuild.otlpEndpoint" .root | quote }}
- name: OTEL_SERVICE_NAME
  value: {{ printf "fonoster-%s" .service | quote }}
- name: POD_NAMESPACE
  valueFrom: { fieldRef: { fieldPath: metadata.namespace } }
- name: FONOSTER_SECRETS_DIR
  value: {{ .root.Values.secrets.mountDir | quote }}
{{- if .nats }}
{{- include "fonoster-rebuild.natsPasswordEnv" (dict "root" .root "user" .nats) }}
{{- end }}
{{- end }}

{{/*
A service's NATS password (nats.auth, add-platform 4.1) as NATS_<USER>_PASSWORD, from the
nats.auth.secret key named after the user. (dict "root" $ "user" "gateway")
*/}}
{{- define "fonoster-rebuild.natsPasswordEnv" -}}
{{- if .root.Values.nats.auth.enabled }}
- name: {{ printf "NATS_%s_PASSWORD" (.user | upper | replace "-" "_") }}
  valueFrom: { secretKeyRef: { name: {{ .root.Values.nats.auth.secret | quote }}, key: {{ .user | quote }} } }
{{- end }}
{{- end }}

{{/*
A service's `nats` config: the URL and, with nats.auth, its user and a secret:// reference to the
password env above. (dict "root" $ "user" "gateway") → YAML map
*/}}
{{- define "fonoster-rebuild.natsConfig" -}}
url: {{ include "fonoster-rebuild.natsUrl" .root | quote }}
{{- if .root.Values.nats.auth.enabled }}
user: {{ .user | quote }}
password: {{ printf "secret://env/NATS_%s_PASSWORD" (.user | upper | replace "-" "_") | quote }}
{{- end }}
{{- end }}

{{/*
Secrets mounted for `secret://k8s/<secret>#<key>` (D8): each at <secrets.mountDir>/<secret>.
(dict "root" $ "names" list)
*/}}
{{- define "fonoster-rebuild.secretMounts" -}}
{{- range $name := .names }}
- name: {{ printf "sref-%s" $name | trunc 63 | trimSuffix "-" }}
  mountPath: {{ printf "%s/%s" $.root.Values.secrets.mountDir $name }}
  readOnly: true
{{- end }}
{{- end }}

{{- define "fonoster-rebuild.secretVolumes" -}}
{{- range $name := .names }}
- name: {{ printf "sref-%s" $name | trunc 63 | trimSuffix "-" }}
  secret: { secretName: {{ $name | quote }} }
{{- end }}
{{- end }}
