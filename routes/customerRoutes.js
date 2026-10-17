const express = require('express');
const customerController = require('../controllers/customerController');
const paymentController = require('../controllers/paymentController');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.get('/', customerController.landing);
router.get('/dashboard', requireLogin, customerController.dashboard);
router.get('/booking', requireLogin, customerController.booking);
router.get('/booking/slots', requireLogin, customerController.slots);
router.post('/booking', requireLogin, customerController.startBooking);
router.get('/payment', requireLogin, paymentController.paymentPage);
router.post('/payment/create-order', requireLogin, paymentController.createOrder);
router.post('/payment/verify', requireLogin, paymentController.verifyPayment);
router.get('/loyalty', requireLogin, customerController.loyalty);

module.exports = router;
