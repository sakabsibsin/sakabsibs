const express = require('express');
const router = express.Router();

router.use(require('./productRoutes'));
router.use(require('./categoryRoutes'));
router.use(require('./settingRoutes'));
router.use(require('./authRoutes'));
router.use(require('./storageRoutes'));

router.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

module.exports = router;
