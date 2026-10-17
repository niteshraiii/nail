const express = require('express');
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin login attempts. Please try again later.'
});

router.get('/login', adminController.login);
router.post('/login', adminLoginLimiter, adminController.authenticate);
router.post('/logout', requireAdmin, adminController.logout);

router.get('/dashboard', requireAdmin, adminController.dashboard);
router.get('/services', requireAdmin, adminController.services);
router.post('/services', requireAdmin, adminController.createService);
router.post('/services/:id', requireAdmin, adminController.updateService);
router.post('/services/:id/toggle', requireAdmin, adminController.toggleService);
router.post('/services/:id/delete', requireAdmin, adminController.deleteService);

router.get('/appointments', requireAdmin, adminController.appointments);
router.get('/visits', requireAdmin, adminController.visits);
router.post('/visits/:appointmentId', requireAdmin, adminController.recordVisit);

router.post('/rewards', requireAdmin, adminController.createReward);
router.post('/rewards/:id', requireAdmin, adminController.updateReward);
router.post('/rewards/:id/delete', requireAdmin, adminController.deleteReward);

router.get('/', requireAdmin, (req, res) => {
  res.redirect('/admin/dashboard');
});

module.exports = router;
