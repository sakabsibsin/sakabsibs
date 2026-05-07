const express = require('express');
const router = express.Router();
const { listSettings, upsertSetting } = require('../controllers/settingController');

router.get('/settings', listSettings);
router.put('/settings/:key', upsertSetting);

module.exports = router;
