const pool = require('../config/db');

const CUSTOMER_MENU_SERVICES = [
  'Gel Manicure',
  'Spa Pedicure',
  'Nail Extensions'
];

async function listActive() {
  const [rows] = await pool.execute(
    'SELECT * FROM services WHERE is_active = 1 ORDER BY service_name ASC'
  );
  return rows;
}

async function listCustomerMenu() {
  const [rows] = await pool.execute(
    `SELECT *
     FROM services
     WHERE is_active = 1
       AND service_name IN (?, ?, ?)
     ORDER BY CASE service_name
       WHEN ? THEN 1
       WHEN ? THEN 2
       WHEN ? THEN 3
       ELSE 4
     END`,
    [...CUSTOMER_MENU_SERVICES, ...CUSTOMER_MENU_SERVICES]
  );
  return rows;
}

async function listAll() {
  const [rows] = await pool.execute('SELECT * FROM services ORDER BY created_at DESC');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM services WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ serviceName, price, description, isActive }) {
  const [result] = await pool.execute(
    'INSERT INTO services (service_name, price, description, is_active) VALUES (?, ?, ?, ?)',
    [serviceName, price, description || null, isActive ? 1 : 0]
  );
  return findById(result.insertId);
}

async function update(id, { serviceName, price, description, isActive }) {
  await pool.execute(
    'UPDATE services SET service_name = ?, price = ?, description = ?, is_active = ? WHERE id = ?',
    [serviceName, price, description || null, isActive ? 1 : 0, id]
  );
  return findById(id);
}

async function toggleActive(id) {
  await pool.execute('UPDATE services SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?', [id]);
  return findById(id);
}

async function remove(id) {
  await pool.execute('DELETE FROM services WHERE id = ?', [id]);
}

async function countActive() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM services WHERE is_active = 1');
  return rows[0].total;
}

module.exports = {
  CUSTOMER_MENU_SERVICES,
  listActive,
  listCustomerMenu,
  listAll,
  findById,
  create,
  update,
  toggleActive,
  remove,
  countActive
};
