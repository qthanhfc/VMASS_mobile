const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let where = [], params = [];
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows } = await db.query(`SELECT * FROM returns ${clause} ORDER BY created_at DESC`, params);
    for (const r of rows) {
      const items = await db.query('SELECT * FROM return_items WHERE return_id=$1', [r.id]);
      r.items = items.rows;
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    await client.query('BEGIN');
    const { order_number, customer_name, reason, items, refund_amount, refund_method } = req.body;
    const { rows } = await client.query(
      `INSERT INTO returns (order_number, customer_name, reason, refund_amount, refund_method) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [order_number, customer_name, reason, refund_amount, refund_method]
    );
    for (const item of (items || [])) {
      await client.query(`INSERT INTO return_items (return_id, product_name, qty, price) VALUES ($1,$2,$3,$4)`, [rows[0].id, item.product_name, item.qty, item.price]);
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const { rows } = await db.query(`UPDATE returns SET status='approved', updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const { rows } = await db.query(`UPDATE returns SET status='rejected', updated_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
