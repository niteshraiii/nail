const crypto = require('crypto');
const Appointment = require('../models/appointmentModel');
const Service = require('../models/serviceModel');
const { getRazorpayClient, hasRazorpayConfig } = require('../config/razorpay');
const { setFlash } = require('../middleware/flash');

function safeCompare(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function paymentPage(req, res, next) {
  try {
    const pendingBooking = req.session.pendingBooking;
    if (!pendingBooking) {
      setFlash(req, 'info', 'Choose an appointment before payment.');
      return res.redirect('/booking');
    }

    const service = await Service.findById(pendingBooking.serviceId);
    if (!service || !service.is_active) {
      req.session.pendingBooking = null;
      setFlash(req, 'error', 'That service is no longer available.');
      return res.redirect('/booking');
    }

    return res.render('customer/payment', {
      title: 'Payment',
      activePage: 'payment',
      service,
      pendingBooking,
      hasRazorpayConfig: hasRazorpayConfig(),
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      currency: process.env.RAZORPAY_CURRENCY || 'INR',
      scripts: ['https://checkout.razorpay.com/v1/checkout.js', '/js/payment.js']
    });
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const pendingBooking = req.session.pendingBooking;
    if (!pendingBooking) {
      return res.status(400).json({ message: 'No booking is ready for payment.' });
    }

    const service = await Service.findById(pendingBooking.serviceId);
    if (!service || !service.is_active) {
      return res.status(400).json({ message: 'Selected service is unavailable.' });
    }

    const availableSlots = await Appointment.getAvailableSlots(pendingBooking.appointmentDate);
    if (!availableSlots.includes(pendingBooking.appointmentTime)) {
      return res.status(409).json({ message: 'This slot has just been booked.' });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({ message: 'Razorpay keys are not configured.' });
    }

    const amount = Number(service.price);
    const currency = process.env.RAZORPAY_CURRENCY || 'INR';
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `nail_${req.user.id}_${Date.now()}`,
      notes: {
        customer_id: String(req.user.id),
        service_id: String(service.id),
        appointment_date: pendingBooking.appointmentDate,
        appointment_time: pendingBooking.appointmentTime
      }
    });

    req.session.pendingBooking = {
      ...pendingBooking,
      amount
    };
    req.session.pendingRazorpayOrderId = order.id;

    return res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      salonName: 'Nailchemist',
      serviceName: service.service_name,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone || ''
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyPayment(req, res, next) {
  try {
    if (!hasRazorpayConfig()) {
      return res.status(503).json({ message: 'Razorpay keys are not configured.' });
    }

    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    } = req.body;

    const pendingBooking = req.session.pendingBooking;
    if (!pendingBooking || !req.session.pendingRazorpayOrderId) {
      return res.status(400).json({ message: 'Payment session expired.' });
    }

    if (razorpayOrderId !== req.session.pendingRazorpayOrderId) {
      return res.status(400).json({ message: 'Payment order mismatch.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (!safeCompare(expectedSignature, razorpaySignature)) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    await Appointment.createPaidAppointment({
      customerId: req.user.id,
      serviceId: pendingBooking.serviceId,
      appointmentDate: pendingBooking.appointmentDate,
      appointmentTime: pendingBooking.appointmentTime,
      amount: pendingBooking.amount,
      transactionId: razorpayPaymentId
    });

    req.session.pendingBooking = null;
    req.session.pendingRazorpayOrderId = null;

    setFlash(req, 'success', 'Appointment booked and payment confirmed.');
    return res.json({ redirectUrl: '/dashboard' });
  } catch (error) {
    if (error.code === 'SLOT_UNAVAILABLE') {
      return res.status(409).json({ message: error.message });
    }

    return next(error);
  }
}

module.exports = {
  paymentPage,
  createOrder,
  verifyPayment
};
