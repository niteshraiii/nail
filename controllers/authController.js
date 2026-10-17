const User = require('../models/userModel');
const { googleEnabled } = require('../config/passport');
const { setFlash } = require('../middleware/flash');

function login(req, res) {
  res.render('customer/login', {
    title: 'Login',
    activePage: 'login',
    googleEnabled,
    scripts: ['/js/animations/auth.js']
  });
}

function googleDisabled(req, res) {
  setFlash(req, 'error', 'Google login is not configured yet.');
  res.redirect('/login');
}

function googleSuccess(req, res) {
  setFlash(req, 'success', 'Welcome to Nailchemist.');
  res.redirect('/dashboard');
}

function logout(req, res, next) {
  req.logout((error) => {
    if (error) {
      return next(error);
    }
    setFlash(req, 'success', 'Signed out successfully.');
    return res.redirect('/');
  });
}

function profile(req, res) {
  res.render('customer/profile', {
    title: 'Profile',
    activePage: 'profile',
    scripts: []
  });
}

async function updateProfile(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();

    if (!name) {
      setFlash(req, 'error', 'Name is required.');
      return res.redirect('/profile');
    }

    await User.updateProfile(req.user.id, { name, phone });
    setFlash(req, 'success', 'Profile updated.');
    return res.redirect('/profile');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  googleDisabled,
  googleSuccess,
  logout,
  profile,
  updateProfile
};
