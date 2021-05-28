FROM fonoster/base
COPY . /scripts
RUN apk add --update git=2.30.2-r0 python2=2.7.18-r1 make=4.3-r0 g++=10.2.1_pre1-r3 sox=14.4.2-r5;
RUN ./install.sh
USER fonos
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "healthcheck" ]