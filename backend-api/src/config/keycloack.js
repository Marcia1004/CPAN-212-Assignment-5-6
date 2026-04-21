import { AppError } from "../utils/appError.js";

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new AppError(`Missing required Keycloak environment variable: ${name}`, 500);
  }
  return value;
}

const internalBaseUrl = required("KEYCLOAK_BASE_URL").replace(/\/$/, "");
const publicBaseUrl = required("KEYCLOAK_PUBLIC_BASE_URL").replace(/\/$/, "");
const realm = required("KEYCLOAK_REALM").trim();

const internalIssuer = `${internalBaseUrl}/realms/${realm}`;
const publicIssuer = `${publicBaseUrl}/realms/${realm}`;

export const keycloakConfig = Object.freeze({
  baseUrl: internalBaseUrl,
  publicBaseUrl,
  realm,

  // Token issuer in browser-facing tokens
  issuer: publicIssuer,

  // Backend must fetch JWKS through nginx, not localhost
  jwksUrl: `${internalIssuer}/protocol/openid-connect/certs`,

  clientId: required("KEYCLOAK_CLIENT_ID"),
  clientSecret: required("KEYCLOAK_CLIENT_SECRET"),
  backendCallbackUrl: required("KEYCLOAK_BACKEND_CALLBACK_URL"),
  frontendSuccessRedirectUrl: required("KEYCLOAK_FRONTEND_SUCCESS_REDIRECT_URL"),
  frontendFailureRedirectUrl: required("KEYCLOAK_FRONTEND_FAILURE_REDIRECT_URL"),

  // Browser redirect
  publicAuthorizationEndpoint: `${publicIssuer}/protocol/openid-connect/auth`,

  // Backend-to-Keycloak through nginx
  tokenEndpoint: `${internalIssuer}/protocol/openid-connect/token`,
  logoutEndpoint: `${internalIssuer}/protocol/openid-connect/logout`,
  userInfoEndpoint: `${internalIssuer}/protocol/openid-connect/userinfo`
});

export function validateKeycloakConfig() {
  const requiredKeys = [
    "baseUrl",
    "publicBaseUrl",
    "realm",
    "issuer",
    "jwksUrl",
    "clientId",
    "clientSecret",
    "backendCallbackUrl",
    "frontendSuccessRedirectUrl",
    "frontendFailureRedirectUrl",
    "publicAuthorizationEndpoint",
    "tokenEndpoint",
    "logoutEndpoint",
    "userInfoEndpoint"
  ];

  const missing = requiredKeys.filter((key) => !keycloakConfig[key]);

  if (missing.length > 0) {
    throw new AppError(`Invalid Keycloak configuration: ${missing.join(", ")}`, 500);
  }
}