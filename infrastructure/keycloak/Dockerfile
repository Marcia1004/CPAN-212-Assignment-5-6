FROM quay.io/keycloak/keycloak:26.1

WORKDIR /opt/keycloak

COPY realm-export /opt/keycloak/data/import

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]