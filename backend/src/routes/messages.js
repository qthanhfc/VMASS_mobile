const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { channel } = req.query;
    let where = [], params = [];
    if (channel && channel !== 'all') { params.push(channel); where.push(`channel = $${params.length}`); }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows } = await db.query(`SELECT * FROM messages ${clause} ORDER BY is_pinned DESC, last_message_at DESC`, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    await db.query(`UPDATE messages SET unread_count=0 WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
