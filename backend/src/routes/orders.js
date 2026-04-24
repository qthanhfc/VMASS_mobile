const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { status, channel, search, page = 1, limit = 20 } = req.query;
    let where = [], params = [];
    if (status) { params.push(status); where.push(`o.status = $${params.length}`); }
    if (channel) { params.push(channel); where.push(`o.channel = $${params.length}`); }
    if (search) { params.push(`%${search}%`); where.push(`(o.order_number ILIKE $${params.length} OR o.customer_name ILIKE $${params.length})`); }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    params.push(limit, (page - 1) * limit);
    const rows = await db.query(`SELECT o.* FROM orders o ${clause} ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    const count = await db.query(`SELECT COUNT(*) FROM orders o ${clause}`, params.slice(0, -2));
    res.json({ items: rows.rows, total: Number(count.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const items = await db.query('SELECT * FROM order_items WHERE order_id=$1', [req.params.id]);
    res.json({ ...rows[0], items: items.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    await client.query('BEGIN');
    const { customer_id, customer_name, channel, items, discount, shipping, notes } = req.body;
    const orderNum = 'DH' + Date.now().toString().slice(-8);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const total = subtotal - (discount || 0) + (shipping || 0);
    const { rows } = await client.query(
      `INSERT INTO orders (order_number, customer_id, customer_name, channel, subtotal, discount, shipping, total, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [orderNum, customer_id, customer_name, channel || 'pos', subtotal, discount || 0, shipping || 0, total, notes]
    );
    for (const item of items) {
      await client.query(`INSERT INTO order_items (order_id, product_id, product_name, sku, qty, price, total) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [rows[0].id, item.product_id, item.product_name, item.sku, item.qty, item.price, item.price * item.qty]);
      await client.query(`UPDATE products SET stock=stock-$1, updated_at=NOW() WHERE id=$2`, [item.qty, item.product_id]);
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { rows } = await db.query(`UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`, [status, req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
