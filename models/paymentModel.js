const pool = require('../config/db');

async function getPaidRevenueTotal() {
  const [rows] = await pool.execute(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'paid'"
  );
  return rows[0].total;
}

async function listRecent(limit = 5) {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 5, 1), 50);
  const [rows] = await pool.execute(
    `SELECT
      p.*,
      u.name AS customer_name,
      u.email AS customer_email
    FROM payments p
    INNER JOIN users u ON u.id = p.customer_id
    ORDER BY p.created_at DESC
    LIMIT ${safeLimit}`
  );
  return rows;
}

module.exports = {
  getPaidRevenueTotal,
  listRecent
};
