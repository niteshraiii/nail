require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const methodOverride = require('method-override');

const createSessionConfig = require('./config/session');
const { configurePassport } = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

configurePassport(passport);

if (isProduction) {
  app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
        connectSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
        frameSrc: ['https://api.razorpay.com', 'https://checkout.razorpay.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    }
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProduction ? '1d' : 0
}));
app.use('/gsap', express.static(path.join(__dirname, 'node_modules', 'gsap', 'dist'), {
  maxAge: isProduction ? '1d' : 0
}));

app.use(session(createSessionConfig()));
app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res, next) => {
  const flash = req.session.flash || null;
  if (flash && typeof flash.message === 'string') {
    const staleAdminGoogleMessage =
      flash.message.includes('Admin access now uses Google sign-in') ||
      flash.message.includes('configured admin email');

    if (staleAdminGoogleMessage) {
      flash.type = 'info';
      flash.message = 'Admin access uses email and password only.';
    }
  }

  res.locals.currentUser = req.user || null;
  res.locals.adminUser = req.session.adminUser || null;
  res.locals.flash = flash;
  res.locals.appName = 'Nailchemist';
  delete req.session.flash;
  next();
});

app.use(authRoutes);
app.use(customerRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('customer/404', {
    title: 'Page not found',
    activePage: ''
  });
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error({
    message: err.message,
    code: err.code,
    status: err.status,
    stack: isProduction ? undefined : err.stack
  });
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).render('customer/error', {
    title: 'Something went wrong',
    activePage: '',
    message: process.env.NODE_ENV === 'production' ? 'Please try again shortly.' : err.message
  });
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Nailchemist is running on ${HOST}:${PORT}`);
});
