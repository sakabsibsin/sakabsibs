const express = require('express');
const router = express.Router();
const {
  requestUploadUrl,
  servePublicObject,
  serveObject,
} = require('../controllers/storageController');

router.post('/storage/uploads/request-url', requestUploadUrl);
router.get('/storage/public-objects/*', servePublicObject);
router.get('/storage/objects/*', serveObject);

module.exports = router;
