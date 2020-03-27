FROM fluent/fluentd:v1.6-debian-1
LABEL maintainer="Pedro Sanders <fonosterteam@fonoster.com>"

USER root
RUN ["gem", "install", "fluent-plugin-elasticsearch", "--no-document", "--version", "3.5.2"]
USER fluent
