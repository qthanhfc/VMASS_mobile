const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM promotions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM promotions WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, value, code, usage_limit, start_date, end_date, status } = req.body;
    const { rows } = await db.query(
      `INSERT INTO promotions (name, type, value, code, usage_limit, start_date, end_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, type, value, code, usage_limit || 0, start_date, end_date, status || 'active']
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, value, code, usage_limit, start_date, end_date, status } = req.body;
    const { rows } = await db.query(
      `UPDATE promotions SET name=$1, type=$2, value=$3, code=$4, usage_limit=$5, start_date=$6, end_date=$7, status=$8 WHERE id=$9 RETURNING *`,
      [name, type, value, code, usage_limit, start_date, end_date, status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
