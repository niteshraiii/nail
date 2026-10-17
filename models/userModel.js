const pool = require('../config/db');

async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findByGoogleId(googleId) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);
  return rows[0] || null;
}

async function findOrCreateGoogleUser({ googleId, name, email }) {
  const existingGoogleUser = await findByGoogleId(googleId);
  if (existingGoogleUser) {
    return existingGoogleUser;
  }

  const existingEmailUser = await findByEmail(email);
  if (existingEmailUser) {
    await pool.execute('UPDATE users SET google_id = ? WHERE id = ?', [googleId, existingEmailUser.id]);
    return findById(existingEmailUser.id);
  }

  const [result] = await pool.execute(
    'INSERT INTO users (name, email, google_id, role) VALUES (?, ?, ?, ?)',
    [name, email, googleId, 'customer']
  );

  return findById(result.insertId);
}

async function updateProfile(id, { name, phone }) {
  await pool.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, id]);
  return findById(id);
}

async function listCustomers() {
  const [rows] = await pool.execute(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.created_at,
      COUNT(v.id) AS visit_count
    FROM users u
    LEFT JOIN visits v ON v.customer_id = u.id
    WHERE u.role = 'customer'
    GROUP BY u.id
    ORDER BY u.created_at DESC`
  );

  return rows;
}

async function countCustomers() {
  const [rows] = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
  return rows[0].total;
}

module.exports = {
  findById,
  findByEmail,
  findByGoogleId,
  findOrCreateGoogleUser,
  updateProfile,
  listCustomers,
  countCustomers
};
