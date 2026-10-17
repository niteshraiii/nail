const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { requireLogin, redirectAuthenticatedCustomer } = require('../middleware/auth');
const { setFlash } = require('../middleware/flash');
const { GOOGLE_ADMIN_BLOCKED, googleEnabled } = require('../config/passport');

const router = express.Router();

router.get('/login', redirectAuthenticatedCustomer, authController.login);

router.get('/auth/google', (req, res, next) => {
  if (!googleEnabled) {
    return authController.googleDisabled(req, res);
  }

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});

router.get('/auth/google/callback', (req, res, next) => {
  if (!googleEnabled) {
    return authController.googleDisabled(req, res);
  }

  return passport.authenticate('google', (error, user, info) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      const message = info && info.message ? info.message : 'Google login failed.';

      if (info && info.code === GOOGLE_ADMIN_BLOCKED) {
        setFlash(req, 'info', message);
        return res.redirect(info.redirectTo || '/admin/login');
      }

      setFlash(req, 'error', message);
      return res.redirect('/login');
    }

    return req.logIn(user, (loginError) => {
      if (loginError) {
        return next(loginError);
      }

      return authController.googleSuccess(req, res);
    });
  })(req, res, next);
});

router.get('/logout', requireLogin, authController.logout);
router.post('/logout', requireLogin, authController.logout);
router.get('/profile', requireLogin, authController.profile);
router.post('/profile', requireLogin, authController.updateProfile);

module.exports = router;
