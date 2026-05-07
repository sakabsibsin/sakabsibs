const Setting = require('../models/Setting');

const listSettings = async (_req, res) => {
  try {
    const settings = await Setting.find();
    const map = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const upsertSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'Value is required' });

    const setting = await Setting.findOneAndUpdate(
      { key },
      { key, value },
      { new: true, upsert: true }
    );
    res.json({ key: setting.key, value: setting.value });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { listSettings, upsertSetting };
