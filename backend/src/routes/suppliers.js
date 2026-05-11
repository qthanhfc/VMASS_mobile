const express = require('express');
const router = express.Router();
const db = require('../db');
const { emitRealtimeEvent } = require('../realtime');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM suppliers WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, contact_person, payment_terms, credit_limit, category } = req.body;
    const { rows } = await db.query(
      `INSERT INTO suppliers (name, phone, email, address, contact_person, payment_terms, credit_limit, category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, phone, email, address, contact_person, payment_terms, credit_limit || 0, category]
    );
    emitRealtimeEvent('suppliers', 'created', { id: rows[0].id });
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address, contact_person, payment_terms, credit_limit, category, status } = req.body;
    const { rows } = await db.query(
      `UPDATE suppliers SET name=$1, phone=$2, email=$3, address=$4, contact_person=$5, payment_terms=$6, credit_limit=$7, category=$8, status=$9 WHERE id=$10 RETURNING *`,
      [name, phone, email, address, contact_person, payment_terms, credit_limit, category, status, req.params.id]
    );
    emitRealtimeEvent('suppliers', 'updated', { id: rows[0]?.id || Number(req.params.id) });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
