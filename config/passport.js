const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

const GOOGLE_ADMIN_BLOCKED = 'google-admin-blocked';
const GOOGLE_CALLBACK_PATH = '/auth/google/callback';
const DEFAULT_APP_URL = 'http://localhost:3000';

function readEnv(name) {
  return String(process.env[name] || '').trim();
}

function normalizeBaseUrl(value) {
  const baseUrl = String(value || '').trim().replace(/\/+$/, '');
  if (!baseUrl) {
    return '';
  }

  try {
    return new URL(baseUrl).origin;
  } catch (error) {
    return '';
  }
}

function buildGoogleCallbackUrl(baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!normalizedBaseUrl) {
    return '';
  }

  return new URL(GOOGLE_CALLBACK_PATH, `${normalizedBaseUrl}/`).toString();
}

function resolveAppBaseUrl(...candidates) {
  for (const candidate of candidates) {
    const normalizedBaseUrl = normalizeBaseUrl(candidate);
    if (normalizedBaseUrl) {
      return normalizedBaseUrl;
    }
  }

  return '';
}

const googleClientId = readEnv('GOOGLE_CLIENT_ID');
const googleClientSecret = readEnv('GOOGLE_CLIENT_SECRET');
const appBaseUrl = resolveAppBaseUrl(readEnv('APP_BASE_URL'), DEFAULT_APP_URL);
const googleCallbackUrl = buildGoogleCallbackUrl(appBaseUrl);
const googleEnabled =
  Boolean(googleClientId) &&
  Boolean(googleClientSecret) &&
  Boolean(googleCallbackUrl);

const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@nailchemist.local').trim().toLowerCase();

function blockAdminGoogleLogin(done) {
  return done(null, false, {
    code: GOOGLE_ADMIN_BLOCKED,
    message: 'Use the admin email and password on the admin login portal.',
    redirectTo: '/admin/login'
  });
}

function configurePassport(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  if (!googleEnabled) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          if (!email) {
            return done(null, false, { message: 'Google account has no verified email.' });
          }

          const normalizedEmail = email.trim().toLowerCase();
          if (normalizedEmail === adminEmail) {
            return blockAdminGoogleLogin(done);
          }

          const existingEmailUser = await User.findByEmail(normalizedEmail);
          if (existingEmailUser && existingEmailUser.role !== 'customer') {
            return blockAdminGoogleLogin(done);
          }

          const user = await User.findOrCreateGoogleUser({
            googleId: profile.id,
            name: profile.displayName || normalizedEmail.split('@')[0],
            email: normalizedEmail
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

module.exports = {
  configurePassport,
  GOOGLE_ADMIN_BLOCKED,
  GOOGLE_CALLBACK_PATH,
  buildGoogleCallbackUrl,
  appBaseUrl,
  googleCallbackUrl,
  googleEnabled
};
