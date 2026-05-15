const express = require('express');
const router = express.Router();
const db = require('../db');
const { emitRealtimeEvent } = require('../realtime');

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
    emitRealtimeEvent('messages', 'read', { id: Number(req.params.id) });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { channel, sender_name, preview, customer_id } = req.body;
    const { rows } = await db.query(
      `INSERT INTO messages (channel, sender_name, preview, customer_id, unread_count, last_message_at)
       VALUES ($1, $2, $3, $4, 1, NOW())
       RETURNING *`,
      [channel || 'internal', sender_name, preview, customer_id || null]
    );
    emitRealtimeEvent('messages', 'new_message', { id: rows[0].id });
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/reply', async (req, res) => {
  try {
    const { preview } = req.body;
    await db.query(
      `UPDATE messages SET preview=$1, reply_status='replied', last_message_at=NOW() WHERE id=$2`,
      [preview, req.params.id]
    );
    emitRealtimeEvent('messages', 'replied', { id: Number(req.params.id) });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
