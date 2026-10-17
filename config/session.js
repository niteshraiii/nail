const MySQLStoreFactory = require('express-mysql-session');
const session = require('express-session');

function readEnv(name) {
  return String(process.env[name] || '').trim();
}

function createSessionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = readEnv('SESSION_SECRET');
  const sessionStore = readEnv('SESSION_STORE').toLowerCase();

  if (isProduction && !sessionSecret) {
    throw new Error('SESSION_SECRET is required when NODE_ENV=production.');
  }

  if (isProduction && sessionSecret === 'replace-with-a-long-random-secret') {
    throw new Error('SESSION_SECRET must be changed before running in production.');
  }

  if (isProduction && sessionStore !== 'mysql') {
    // eslint-disable-next-line no-console
    console.warn('SESSION_STORE=mysql is recommended in production so sessions survive restarts.');
  }

  const config = {
    name: 'nailchemist.sid',
    secret: sessionSecret || 'replace-this-session-secret',
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24
    }
  };

  if (sessionStore === 'mysql') {
    const MySQLStore = MySQLStoreFactory(session);
    config.store = new MySQLStore({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nailchemist',
      clearExpired: true,
      checkExpirationInterval: 1000 * 60 * 15,
      expiration: 1000 * 60 * 60 * 24
    });
  }

  return config;
}

module.exports = createSessionConfig;
