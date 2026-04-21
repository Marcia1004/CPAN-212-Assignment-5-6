import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  generateState,
  verifyKeycloakAccessToken
} from "../services/keycloackService.js";
import { findOrProvisionUserFromKeycloak } from "../services/userProvisioningService.js";
import { tokenService } from "../services/tokenService.js";
import { keycloakConfig } from "../config/keycloack.js";

const STATE_COOKIE_NAME = "kc_state";
const APP_TOKEN_COOKIE_NAME = "token";

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  };
}

function buildFailureRedirect(reason) {
  const url = new URL(keycloakConfig.frontendFailureRedirectUrl);
  url.searchParams.set("error", "keycloak");
  url.searchParams.set("reason", reason);
  return url.toString();
}

export const keycloakController = {
  login(req, res, next) {
    try {
      const state = generateState();
      const redirectUrl = buildAuthorizationUrl(state);

      res.cookie(STATE_COOKIE_NAME, state, {
        ...buildCookieOptions(),
        maxAge: 10 * 60 * 1000
      });

      return res.redirect(redirectUrl);
    } catch (error) {
      return next(error);
    }
  },

  async callback(req, res, next) {
    try {
      const { code, state, error } = req.query;
      const expectedState = req.cookies?.[STATE_COOKIE_NAME];

      if (error && typeof error === "string") {
        res.clearCookie(STATE_COOKIE_NAME, { path: "/" });
        return res.redirect(buildFailureRedirect(error));
      }

      if (!code || typeof code !== "string") {
        res.clearCookie(STATE_COOKIE_NAME, { path: "/" });
        return res.redirect(buildFailureRedirect("missing_code"));
      }

      if (
        !state ||
        typeof state !== "string" ||
        !expectedState ||
        state !== expectedState
      ) {
        res.clearCookie(STATE_COOKIE_NAME, { path: "/" });
        return res.redirect(buildFailureRedirect("invalid_state"));
      }

      const tokenSet = await exchangeAuthorizationCode(code);
      const identity = await verifyKeycloakAccessToken(tokenSet.access_token);
      const delegatedUser = await findOrProvisionUserFromKeycloak(identity);
      const appToken = tokenService.generateAccessToken(delegatedUser);

      res.clearCookie(STATE_COOKIE_NAME, { path: "/" });

      res.cookie(APP_TOKEN_COOKIE_NAME, appToken, {
        ...buildCookieOptions(),
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.redirect(keycloakConfig.frontendSuccessRedirectUrl);
    } catch (error) {
      console.error("Keycloak callback failed:", error);
      res.clearCookie(STATE_COOKIE_NAME, { path: "/" });
      return res.redirect(buildFailureRedirect("keycloak_callback_failed"));
    }
  },

  logout(req, res) {
    res.clearCookie(APP_TOKEN_COOKIE_NAME, { path: "/" });
    res.clearCookie(STATE_COOKIE_NAME, { path: "/" });
    return res.redirect(keycloakConfig.frontendFailureRedirectUrl);
  }
};