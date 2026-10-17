function ensureCustomer(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'customer') {
    return next();
  }

  req.session.flash = {
    type: 'info',
    message: 'Please sign in to continue.'
  };
  return res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.session.adminUser) {
    return next();
  }

  req.session.flash = {
    type: 'info',
    message: 'Admin access required.'
  };
  return res.redirect('/admin/login');
}

const requireLogin = ensureCustomer;
const requireAdmin = ensureAdmin;

function redirectAuthenticatedCustomer(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'customer') {
    return res.redirect('/dashboard');
  }
  return next();
}

module.exports = {
  ensureCustomer,
  ensureAdmin,
  requireLogin,
  requireAdmin,
  redirectAuthenticatedCustomer
};
