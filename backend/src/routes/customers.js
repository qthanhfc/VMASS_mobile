const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { search, tier, page = 1, limit = 20 } = req.query;
    let where = [], params = [];
    if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR phone ILIKE $${params.length})`); }
    if (tier) { params.push(tier); where.push(`tier = $${params.length}`); }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    params.push(limit, (page - 1) * limit);
    const rows = await db.query(`SELECT * FROM customers ${clause} ORDER BY total_spent DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    const count = await db.query(`SELECT COUNT(*) FROM customers ${clause}`, params.slice(0, -2));
    res.json({ items: rows.rows, total: Number(count.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM customers WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const orders = await db.query('SELECT * FROM orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 10', [req.params.id]);
    res.json({ ...rows[0], orders: orders.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const { rows } = await db.query(
      `INSERT INTO customers (name, phone, email, address, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, phone, email, address, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address, notes, tier, points } = req.body;
    const { rows } = await db.query(
      `UPDATE customers SET name=$1, phone=$2, email=$3, address=$4, notes=$5, tier=$6, points=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [name, phone, email, address, notes, tier, points, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
