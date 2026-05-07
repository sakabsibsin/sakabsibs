const Setting = require('../models/Setting');

const DEFAULT_PASSWORD = 'aurum2024';

const login = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const setting = await Setting.findOne({ key: 'admin_password' });
    const correctPassword = setting?.value || DEFAULT_PASSWORD;

    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ success: true, token: 'aurum-admin-authenticated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login };
