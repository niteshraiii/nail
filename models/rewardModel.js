const pool = require('../config/db');

async function listAll() {
  const [rows] = await pool.execute('SELECT * FROM rewards ORDER BY required_visits ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM rewards WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findNextByVisits(visitCount) {
  const [rows] = await pool.execute(
    'SELECT * FROM rewards WHERE required_visits > ? ORDER BY required_visits ASC LIMIT 1',
    [visitCount]
  );
  return rows[0] || null;
}

async function findCurrentTier(visitCount) {
  const [rows] = await pool.execute(
    'SELECT * FROM rewards WHERE required_visits <= ? ORDER BY required_visits DESC LIMIT 1',
    [visitCount]
  );
  return rows[0] || null;
}

async function create({ requiredVisits, rewardName }) {
  const [result] = await pool.execute(
    'INSERT INTO rewards (required_visits, reward_name) VALUES (?, ?)',
    [requiredVisits, rewardName]
  );
  return findById(result.insertId);
}

async function update(id, { requiredVisits, rewardName }) {
  await pool.execute('UPDATE rewards SET required_visits = ?, reward_name = ? WHERE id = ?', [
    requiredVisits,
    rewardName,
    id
  ]);
  return findById(id);
}

async function remove(id) {
  await pool.execute('DELETE FROM rewards WHERE id = ?', [id]);
}

module.exports = {
  listAll,
  findById,
  findNextByVisits,
  findCurrentTier,
  create,
  update,
  remove
};
