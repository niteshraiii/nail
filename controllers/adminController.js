const bcrypt = require('bcryptjs');
const Appointment = require('../models/appointmentModel');
const Payment = require('../models/paymentModel');
const Reward = require('../models/rewardModel');
const Service = require('../models/serviceModel');
const User = require('../models/userModel');
const Visit = require('../models/visitModel');
const { setFlash } = require('../middleware/flash');

const DEFAULT_ADMIN_EMAIL = 'admin@nailchemist.local';
const DEFAULT_ADMIN_PASSWORD = 'Admin@12345';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function parseMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function getAdminEmail() {
  const configuredEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return configuredEmail || (isProduction() ? '' : DEFAULT_ADMIN_EMAIL);
}

function getAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || (isProduction() ? '' : DEFAULT_ADMIN_PASSWORD));
}

function getAdminPasswordHash() {
  return String(process.env.ADMIN_PASSWORD_HASH || '').trim();
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function verifyAdminPassword(password) {
  const passwordHash = getAdminPasswordHash();

  if (passwordHash) {
    try {
      return await bcrypt.compare(password, passwordHash);
    } catch (error) {
      return false;
    }
  }

  if (isProduction()) {
    return false;
  }

  return password === getAdminPassword();
}

function login(req, res) {
  if (req.session.adminUser) {
    return res.redirect('/admin/dashboard');
  }

  return res.render('admin/login', {
    title: 'Admin Login',
    activePage: 'admin-login',
    scripts: ['/js/animations/auth.js']
  });
}

async function authenticate(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const adminEmail = getAdminEmail();

    if (!adminEmail || (!getAdminPasswordHash() && isProduction())) {
      setFlash(req, 'error', 'Admin login is not configured.');
      return res.redirect('/admin/login');
    }

    if (email !== adminEmail || !(await verifyAdminPassword(password))) {
      setFlash(req, 'error', 'Invalid admin credentials.');
      return res.redirect('/admin/login');
    }

    await regenerateSession(req);

    req.session.adminUser = {
      email: adminEmail,
      role: 'admin'
    };

    setFlash(req, 'success', 'Admin signed in.');
    return res.redirect('/admin/dashboard');
  } catch (error) {
    return next(error);
  }
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('nailchemist.sid');
    return res.redirect('/admin/login');
  });
}

async function dashboard(req, res, next) {
  try {
    const [customerCount, activeServiceCount, upcomingCount, revenueTotal, recentPayments, customers] =
      await Promise.all([
        User.countCustomers(),
        Service.countActive(),
        Appointment.countUpcoming(),
        Payment.getPaidRevenueTotal(),
        Payment.listRecent(5),
        User.listCustomers()
      ]);

      res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      activePage: 'admin-dashboard',
      stats: {
        customerCount: customerCount || 0,
        activeServiceCount: activeServiceCount || 0,
        upcomingCount: upcomingCount || 0,
        revenueTotal: revenueTotal || 0
      },
      recentPayments: recentPayments || [],
      customers: customers || [],
      scripts: []
    });
  } catch (error) {
    next(error);
  }
}

async function services(req, res, next) {
  try {
    const [servicesList, editService] = await Promise.all([
      Service.listAll(),
      req.query.edit ? Service.findById(req.query.edit) : Promise.resolve(null)
    ]);

    res.render('admin/services', {
      title: 'Services',
      activePage: 'admin-services',
      services: servicesList || [],
      editService,
      scripts: ['/js/admin.js']
    });
  } catch (error) {
    next(error);
  }
}

async function createService(req, res, next) {
  try {
    const serviceName = String(req.body.service_name || '').trim();
    const price = parseMoney(req.body.price);
    const description = String(req.body.description || '').trim();
    const isActive = req.body.is_active === 'on';

    if (!serviceName || price === null) {
      setFlash(req, 'error', 'Service name and valid price are required.');
      return res.redirect('/admin/services');
    }

    await Service.create({ serviceName, price, description, isActive });
    setFlash(req, 'success', 'Service added.');
    return res.redirect('/admin/services');
  } catch (error) {
    return next(error);
  }
}

async function updateService(req, res, next) {
  try {
    const serviceName = String(req.body.service_name || '').trim();
    const price = parseMoney(req.body.price);
    const description = String(req.body.description || '').trim();
    const isActive = req.body.is_active === 'on';

    if (!serviceName || price === null) {
      setFlash(req, 'error', 'Service name and valid price are required.');
      return res.redirect(`/admin/services?edit=${req.params.id}`);
    }

    await Service.update(req.params.id, { serviceName, price, description, isActive });
    setFlash(req, 'success', 'Service updated.');
    return res.redirect('/admin/services');
  } catch (error) {
    return next(error);
  }
}

async function toggleService(req, res, next) {
  try {
    await Service.toggleActive(req.params.id);
    setFlash(req, 'success', 'Service status changed.');
    return res.redirect('/admin/services');
  } catch (error) {
    return next(error);
  }
}

async function deleteService(req, res, next) {
  try {
    await Service.remove(req.params.id);
    setFlash(req, 'success', 'Service deleted.');
    return res.redirect('/admin/services');
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      setFlash(req, 'error', 'This service has appointments. Disable it instead.');
      return res.redirect('/admin/services');
    }
    return next(error);
  }
}

async function appointments(req, res, next) {
  try {
    const appointmentsList = await Appointment.listAll();
    res.render('admin/appointments', {
      title: 'Appointments',
      activePage: 'admin-appointments',
      appointments: appointmentsList || [],
      scripts: []
    });
  } catch (error) {
    next(error);
  }
}

async function visits(req, res, next) {
  try {
    const [pendingVisits, customerProgress, rewards] = await Promise.all([
      Appointment.listPendingVisits(),
      Visit.listCustomerProgress(),
      Reward.listAll()
    ]);

    res.render('admin/visits', {
      title: 'Visits',
      activePage: 'admin-visits',
      pendingVisits: pendingVisits || [],
      customerProgress: customerProgress || [],
      rewards: rewards || [],
      scripts: ['/js/admin.js']
    });
  } catch (error) {
    next(error);
  }
}

async function recordVisit(req, res, next) {
  try {
    await Visit.addVisitFromAppointment(req.params.appointmentId);
    setFlash(req, 'success', 'Visit recorded.');
    return res.redirect('/admin/visits');
  } catch (error) {
    setFlash(req, 'error', error.message || 'Could not record visit.');
    return res.redirect('/admin/visits');
  }
}

async function createReward(req, res, next) {
  try {
    const requiredVisits = Number(req.body.required_visits);
    const rewardName = String(req.body.reward_name || '').trim();

    if (!Number.isInteger(requiredVisits) || requiredVisits <= 0 || !rewardName) {
      setFlash(req, 'error', 'Reward name and required visits are required.');
      return res.redirect('/admin/visits');
    }

    await Reward.create({ requiredVisits, rewardName });
    setFlash(req, 'success', 'Reward added.');
    return res.redirect('/admin/visits');
  } catch (error) {
    return next(error);
  }
}

async function updateReward(req, res, next) {
  try {
    const requiredVisits = Number(req.body.required_visits);
    const rewardName = String(req.body.reward_name || '').trim();

    if (!Number.isInteger(requiredVisits) || requiredVisits <= 0 || !rewardName) {
      setFlash(req, 'error', 'Reward name and required visits are required.');
      return res.redirect('/admin/visits');
    }

    await Reward.update(req.params.id, { requiredVisits, rewardName });
    setFlash(req, 'success', 'Reward updated.');
    return res.redirect('/admin/visits');
  } catch (error) {
    return next(error);
  }
}

async function deleteReward(req, res, next) {
  try {
    await Reward.remove(req.params.id);
    setFlash(req, 'success', 'Reward deleted.');
    return res.redirect('/admin/visits');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  authenticate,
  logout,
  dashboard,
  services,
  createService,
  updateService,
  toggleService,
  deleteService,
  appointments,
  visits,
  recordVisit,
  createReward,
  updateReward,
  deleteReward
};
