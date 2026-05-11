const express = require('express');
const router = express.Router();
const db = require('../db');
const { emitRealtimeEvent } = require('../realtime');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tax_declarations ORDER BY due_date DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/declarations', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tax_declarations ORDER BY due_date DESC LIMIT 10');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, period, revenue, tax_amount, due_date } = req.body;
    const { rows } = await db.query(
      `INSERT INTO tax_declarations (type, period, revenue, tax_amount, due_date) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [type, period, revenue, tax_amount, due_date]
    );
    emitRealtimeEvent('tax', 'created', { id: rows[0].id });
    emitRealtimeEvent('dashboard', 'updated', { source: 'tax' });
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
