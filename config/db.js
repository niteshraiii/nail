const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nailchemist',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  namedPlaceholders: true
});
pool.config.ssl = {
  minVersion: 'TLSv1.2',
  rejectUnauthorized: true,
};

function normalizeValues(values) {
  if (values === undefined) {
    return [];
  }

  if (Array.isArray(values)) {
    return values;
  }

  if (values && typeof values === 'object') {
    return values;
  }

  return [values];
}

function countPlaceholders(sql) {
  const matches = String(sql).match(/\?/g);
  return matches ? matches.length : 0;
}

function assertValidExecution(sql, values) {
  const normalizedValues = normalizeValues(values);
  const placeholderCount = countPlaceholders(sql);

  if (Array.isArray(normalizedValues)) {
    const undefinedIndex = normalizedValues.findIndex((value) => value === undefined);
    if (undefinedIndex !== -1) {
      throw new Error(`Database value at index ${undefinedIndex} is undefined.`);
    }

    if (placeholderCount !== normalizedValues.length) {
      throw new Error(
        `Database placeholder mismatch: SQL has ${placeholderCount} placeholders, values has ${normalizedValues.length}.`
      );
    }
  }

  return normalizedValues;
}

const originalExecute = pool.execute.bind(pool);
const originalQuery = pool.query.bind(pool);
const originalGetConnection = pool.getConnection.bind(pool);

pool.execute = function loggedExecute(sql, values) {
  const normalizedValues = assertValidExecution(sql, values);
  return originalExecute(sql, normalizedValues);
};

pool.query = function loggedQuery(sql, values) {
  const normalizedValues = assertValidExecution(sql, values);
  return originalQuery(sql, normalizedValues);
};

pool.getConnection = async function loggedGetConnection() {
  const connection = await originalGetConnection();
  const connectionExecute = connection.execute.bind(connection);
  const connectionQuery = connection.query.bind(connection);

  connection.execute = function loggedConnectionExecute(sql, values) {
    const normalizedValues = assertValidExecution(sql, values);
    return connectionExecute(sql, normalizedValues);
  };

  connection.query = function loggedConnectionQuery(sql, values) {
    const normalizedValues = assertValidExecution(sql, values);
    return connectionQuery(sql, normalizedValues);
  };

  return connection;
};

module.exports = pool;
