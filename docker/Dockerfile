FROM eclipse-temurin:17-jre

ARG CANTON_VERSION=3.5.1

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fL --retry 3 \
    -o /tmp/canton-open-source-${CANTON_VERSION}.tar.gz \
    https://github.com/digital-asset/canton/releases/download/v${CANTON_VERSION}/canton-open-source-${CANTON_VERSION}.tar.gz \
  && tar -xzf /tmp/canton-open-source-${CANTON_VERSION}.tar.gz -C /opt \
  && mv /opt/canton-open-source-${CANTON_VERSION} /canton \
  && rm /tmp/canton-open-source-${CANTON_VERSION}.tar.gz

WORKDIR /canton

COPY entrypoint.sh /usr/local/bin/canton-entrypoint
RUN chmod +x /usr/local/bin/canton-entrypoint

EXPOSE 5001 5002 5011 5012 5202

ENTRYPOINT ["canton-entrypoint"]
CMD ["daemon"]
