{{- define "fonoster-rebuild.labels" -}}
app.kubernetes.io/part-of: fonoster
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}
