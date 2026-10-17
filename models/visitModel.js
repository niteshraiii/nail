const pool = require('../config/db');

async function countByCustomer(customerId) {
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM visits WHERE customer_id = ?', [
    customerId
  ]);
  return rows[0].total;
}

async function listCustomerProgress() {
  const [rows] = await pool.execute(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      COUNT(v.id) AS visit_count
    FROM users u
    LEFT JOIN visits v ON v.customer_id = u.id
    WHERE u.role = 'customer'
    GROUP BY u.id
    ORDER BY visit_count DESC, u.name ASC`
  );
  return rows;
}

async function addVisitFromAppointment(appointmentId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [appointments] = await connection.execute(
      `SELECT id, customer_id, completed
       FROM appointments
       WHERE id = ?
       FOR UPDATE`,
      [appointmentId]
    );

    const appointment = appointments[0];
    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    if (appointment.completed) {
      throw new Error('Visit already recorded for this appointment.');
    }

    await connection.execute('INSERT INTO visits (customer_id, appointment_id) VALUES (?, ?)', [
      appointment.customer_id,
      appointment.id
    ]);
    await connection.execute('UPDATE appointments SET completed = 1 WHERE id = ?', [appointment.id]);

    await connection.commit();
    return appointment;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  countByCustomer,
  listCustomerProgress,
  addVisitFromAppointment
};
