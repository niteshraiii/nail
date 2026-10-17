const pool = require('../config/db');

const DEFAULT_SLOTS = [
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00'
];

function normalizeSlot(slot) {
  return String(slot || '').slice(0, 5);
}

function createSlotUnavailableError() {
  const error = new Error('That slot has just been booked. Please choose another time.');
  error.code = 'SLOT_UNAVAILABLE';
  return error;
}

async function getBookedSlots(date) {
  const [rows] = await pool.execute(
    'SELECT appointment_time FROM appointments WHERE appointment_date = ?',
    [date]
  );
  return rows.map((row) => normalizeSlot(row.appointment_time));
}

async function getAvailableSlots(date) {
  const booked = new Set(await getBookedSlots(date));
  return DEFAULT_SLOTS.filter((slot) => !booked.has(slot));
}

async function getUpcomingByCustomer(customerId) {
  const [rows] = await pool.execute(
    `SELECT
      a.*,
      s.service_name,
      s.price
    FROM appointments a
    INNER JOIN services s ON s.id = a.service_id
    WHERE a.customer_id = ?
      AND TIMESTAMP(a.appointment_date, a.appointment_time) >= NOW()
    ORDER BY a.appointment_date ASC, a.appointment_time ASC
    LIMIT 1`,
    [customerId]
  );
  return rows[0] || null;
}

async function listAll() {
  const [rows] = await pool.execute(
    `SELECT
      a.*,
      u.name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      s.service_name,
      s.price,
      p.status AS payment_status,
      p.transaction_id
    FROM appointments a
    INNER JOIN users u ON u.id = a.customer_id
    INNER JOIN services s ON s.id = a.service_id
    LEFT JOIN payments p ON p.id = a.payment_id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC`
  );
  return rows;
}

async function listPendingVisits() {
  const [rows] = await pool.execute(
    `SELECT
      a.*,
      u.name AS customer_name,
      u.email AS customer_email,
      s.service_name
    FROM appointments a
    INNER JOIN users u ON u.id = a.customer_id
    INNER JOIN services s ON s.id = a.service_id
    WHERE a.completed = 0
      AND TIMESTAMP(a.appointment_date, a.appointment_time) <= NOW()
    ORDER BY a.appointment_date DESC, a.appointment_time DESC`
  );
  return rows;
}

async function countUpcoming() {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM appointments
     WHERE TIMESTAMP(appointment_date, appointment_time) >= NOW()`
  );
  return rows[0].total;
}

async function createPaidAppointment({ customerId, serviceId, appointmentDate, appointmentTime, amount, transactionId }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      `SELECT id
       FROM appointments
       WHERE appointment_date = ? AND appointment_time = ?
       FOR UPDATE`,
      [appointmentDate, appointmentTime]
    );

    if (existing.length > 0) {
      throw createSlotUnavailableError();
    }

    const [paymentResult] = await connection.execute(
      'INSERT INTO payments (customer_id, amount, status, transaction_id) VALUES (?, ?, ?, ?)',
      [customerId, amount, 'paid', transactionId]
    );

    const [appointmentResult] = await connection.execute(
      `INSERT INTO appointments
        (customer_id, service_id, appointment_date, appointment_time, payment_id, completed)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [customerId, serviceId, appointmentDate, appointmentTime, paymentResult.insertId]
    );

    await connection.commit();
    return {
      appointmentId: appointmentResult.insertId,
      paymentId: paymentResult.insertId
    };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw createSlotUnavailableError();
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  DEFAULT_SLOTS,
  getBookedSlots,
  getAvailableSlots,
  getUpcomingByCustomer,
  listAll,
  listPendingVisits,
  countUpcoming,
  createPaidAppointment
};
