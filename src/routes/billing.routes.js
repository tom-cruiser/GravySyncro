const express = require('express');
const billingController = require('../controllers/billingController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/invoices', billingController.listInvoices);
router.get('/invoices/:id', billingController.getInvoice);
router.get('/invoices/:id/pdf', billingController.downloadInvoicePdf);

// Convenience for support/admin use — the real trigger is the monthly
// cron in jobs/invoiceBiller.js.
router.post('/invoices/generate', restrictTo('Admin'), billingController.generateInvoiceNow);

module.exports = router;
