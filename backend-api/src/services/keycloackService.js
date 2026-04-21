import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { AppError } from "../utils/appError.js";
import { keycloakConfig } from "../config/keycloack.js";

const jwks = createRemoteJWKSet(new URL(keycloakConfig.jwksUrl));

function normalizeKeycloakRoles(payload) {
  const realmRoles = Array.isArray(payload?.realm_access?.roles)
    ? payload.realm_access.roles
    : [];

  const clientRoles = Array.isArray(
    payload?.resource_access?.[keycloakConfig.clientId]?.roles
  )
    ? payload.resource_access[keycloakConfig.clientId].roles
    : [];

  return [...new Set([...realmRoles, ...clientRoles])];
}

function mapVerifiedPayload(payload) {
  return {
    sub: String(payload?.sub || ""),
    username: payload?.preferred_username || "",
    email: payload?.email || "",
    givenName: payload?.given_name || "",
    familyName: payload?.family_name || "",
    fullName: payload?.name || "",
    roles: normalizeKeycloakRoles(payload)
  };
}

export function generateState() {
  return crypto.randomBytes(24).toString("hex");
}

export function buildAuthorizationUrl(state) {
  const url = new URL(keycloakConfig.publicAuthorizationEndpoint);

  url.searchParams.set("client_id", keycloakConfig.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid");
  url.searchParams.set("redirect_uri", keycloakConfig.backendCallbackUrl);
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeAuthorizationCode(code) {
  if (!code || typeof code !== "string") {
    throw new AppError("Missing authorization code", 401);
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: keycloakConfig.clientId,
    client_secret: keycloakConfig.clientSecret,
    redirect_uri: keycloakConfig.backendCallbackUrl
  });

  let response;

  try {
    response = await fetch(keycloakConfig.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });
  } catch {
    throw new AppError("Failed to connect to Keycloak token endpoint", 502);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError(
      `Failed to exchange authorization code: ${errorText}`,
      401
    );
  }

  const tokenResponse = await response.json();

  if (!tokenResponse?.access_token) {
    throw new AppError("Keycloak did not return an access token", 401);
  }

  return tokenResponse;
}

export async function verifyKeycloakAccessToken(accessToken) {
  if (!accessToken || typeof accessToken !== "string") {
    throw new AppError("Missing Keycloak access token", 401);
  }

  try {
    const { payload } = await jwtVerify(accessToken, jwks, {
      issuer: keycloakConfig.issuer,
      audience: keycloakConfig.clientId
    });

    return mapVerifiedPayload(payload);
  } catch {
    try {
      const { payload } = await jwtVerify(accessToken, jwks, {
        issuer: keycloakConfig.issuer
      });

      const audienceClaim = payload?.aud;
      const azpClaim = payload?.azp;

      const hasMatchingAudience = Array.isArray(audienceClaim)
        ? audienceClaim.includes(keycloakConfig.clientId)
        : audienceClaim === keycloakConfig.clientId;

      const hasMatchingAzp = azpClaim === keycloakConfig.clientId;

      if (!hasMatchingAudience && !hasMatchingAzp) {
        throw new AppError("Invalid Keycloak token audience", 401);
      }

      return mapVerifiedPayload(payload);
    } catch {
      throw new AppError("Invalid Keycloak access token", 401);
    }
  }
}