FROM alpine:3.8
LABEL Pedro Sanders <fonosterteam@fonoster.com>

ARG S3FS_VERSION=v1.86

COPY yaps /yaps
COPY run.sh /

RUN apk --update add nodejs npm sox python make g++ fuse libcurl libxml2 libstdc++ \
  libgcc alpine-sdk automake autoconf libxml2-dev fuse-dev curl-dev git; \
  git clone https://github.com/s3fs-fuse/s3fs-fuse.git; \
  cd s3fs-fuse; \
  git checkout tags/${S3FS_VERSION}; \
  ./autogen.sh; \
  ./configure --prefix=/usr; \
  make; \
  make install; \
  rm -rf /var/cache/apk/*; \
  cd /yaps; \
  npm install; \
  chmod +x /run.sh; \
  apk del alpine-sdk automake autoconf libxml2-dev fuse-dev curl-dev git;

CMD ["/bin/sh", "-c", "/run.sh"]
