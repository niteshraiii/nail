const Appointment = require('../models/appointmentModel');
const Reward = require('../models/rewardModel');
const Service = require('../models/serviceModel');
const Visit = require('../models/visitModel');
const { setFlash } = require('../middleware/flash');

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isFutureOrToday(dateString) {
  const requested = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return requested >= today;
}

async function buildLoyaltyState(customerId) {
  const [visitCount, rewards] = await Promise.all([
    Visit.countByCustomer(customerId),
    Reward.listAll()
  ]);
  const nextReward = rewards.find((reward) => reward.required_visits > visitCount) || null;
  const currentReward =
    rewards
      .slice()
      .reverse()
      .find((reward) => reward.required_visits <= visitCount) || null;
  const targetVisits = nextReward
    ? nextReward.required_visits
    : currentReward
      ? currentReward.required_visits
      : 10;
  const progress = targetVisits > 0 ? Math.min(100, Math.round((visitCount / targetVisits) * 100)) : 0;

  return {
    visitCount,
    targetVisits,
    progress,
    nextReward,
    currentReward,
    remainingVisits: nextReward ? Math.max(nextReward.required_visits - visitCount, 0) : 0
  };
}

async function landing(req, res, next) {
  try {
    const services = await Service.listCustomerMenu();
    res.render('customer/landing', {
      title: 'Nailchemist',
      activePage: 'home',
      services: services || [],
      scripts: []
    });
  } catch (error) {
    next(error);
  }
}

async function dashboard(req, res, next) {
  try {
    const [upcoming, loyalty] = await Promise.all([
      Appointment.getUpcomingByCustomer(req.user.id),
      buildLoyaltyState(req.user.id)
    ]);

    res.render('customer/dashboard', {
      title: 'Dashboard',
      activePage: 'dashboard',
      upcoming,
      loyalty,
      scripts: []
    });
  } catch (error) {
    next(error);
  }
}

async function booking(req, res, next) {
  try {
    const services = await Service.listCustomerMenu();
    res.render('customer/booking', {
      title: 'Book Appointment',
      activePage: 'booking',
      services: services || [],
      minDate: todayISO(),
      defaultSlots: Appointment.DEFAULT_SLOTS,
      scripts: ['/js/booking.js']
    });
  } catch (error) {
    next(error);
  }
}

async function slots(req, res, next) {
  try {
    const { date } = req.query;
    if (!date || !isFutureOrToday(date)) {
      return res.status(400).json({ message: 'Choose a valid upcoming date.' });
    }

    const availableSlots = await Appointment.getAvailableSlots(date);
    return res.json({ slots: availableSlots });
  } catch (error) {
    return next(error);
  }
}

async function startBooking(req, res, next) {
  try {
    const { service_id: serviceId, appointment_date: appointmentDate, appointment_time: appointmentTime } = req.body;
    const normalizedTime = String(appointmentTime || '').slice(0, 5);

    if (!serviceId || !appointmentDate || !normalizedTime) {
      setFlash(req, 'error', 'Please choose a service, date, and time.');
      return res.redirect('/booking');
    }

    if (!isFutureOrToday(appointmentDate)) {
      setFlash(req, 'error', 'Please choose today or a future date.');
      return res.redirect('/booking');
    }

    if (!Appointment.DEFAULT_SLOTS.includes(normalizedTime)) {
      setFlash(req, 'error', 'Please choose an available salon slot.');
      return res.redirect('/booking');
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.is_active) {
      setFlash(req, 'error', 'That service is no longer available.');
      return res.redirect('/booking');
    }

    const availableSlots = await Appointment.getAvailableSlots(appointmentDate);
    if (!availableSlots.includes(normalizedTime)) {
      setFlash(req, 'error', 'That time has already been booked.');
      return res.redirect('/booking');
    }

    req.session.pendingBooking = {
      serviceId: Number(serviceId),
      appointmentDate,
      appointmentTime: normalizedTime
    };

    return res.redirect('/payment');
  } catch (error) {
    return next(error);
  }
}

async function loyalty(req, res, next) {
  try {
    const loyaltyState = await buildLoyaltyState(req.user.id);
    res.render('customer/loyalty', {
      title: 'Loyalty',
      activePage: 'loyalty',
      loyalty: loyaltyState,
      scripts: []
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  buildLoyaltyState,
  landing,
  dashboard,
  booking,
  slots,
  startBooking,
  loyalty
};
