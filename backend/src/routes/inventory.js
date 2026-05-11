const express = require('express');
const router = express.Router();
const db = require('../db');
const { emitRealtimeEvent } = require('../realtime');

router.get('/', async (req, res) => {
  try {
    const { branch, search } = req.query;
    let where = [], params = [];
    if (branch) { params.push(branch); where.push(`i.branch = $${params.length}`); }
    if (search) { params.push(`%${search}%`); where.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`); }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows } = await db.query(`SELECT p.id, p.name, p.sku, p.min_stock, p.price, p.cost, COALESCE(i.stock, p.stock) as stock, COALESCE(i.branch, 'Cửa hàng chính') as branch FROM products p LEFT JOIN inventory i ON p.id=i.product_id ${clause} ORDER BY p.name`, params);
    const total = rows.reduce((s, r) => s + Number(r.stock) * Number(r.cost), 0);
    const lowCount = rows.filter(r => Number(r.stock) <= Number(r.min_stock)).length;
    res.json({ items: rows, totalValue: total, lowStockCount: lowCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/adjust', async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    await client.query('BEGIN');
    const { product_id, qty, type, branch, note } = req.body;
    await client.query(`INSERT INTO inventory_transactions (product_id, type, qty, branch_to, note) VALUES ($1,$2,$3,$4,$5)`, [product_id, type, qty, branch, note]);
    await client.query(`UPDATE products SET stock=stock+$1, updated_at=NOW() WHERE id=$2`, [qty, product_id]);
    await client.query('COMMIT');
    emitRealtimeEvent('inventory', 'adjusted', { productId: product_id });
    emitRealtimeEvent('products', 'stock_updated', { id: product_id });
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

router.post('/transfer', async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    await client.query('BEGIN');
    const { product_id, qty, branch_from, branch_to, note } = req.body;
    await client.query(`INSERT INTO inventory_transactions (product_id, type, qty, branch_from, branch_to, note) VALUES ($1,'transfer',$2,$3,$4,$5)`, [product_id, qty, branch_from, branch_to, note]);
    await client.query('COMMIT');
    emitRealtimeEvent('inventory', 'transferred', { productId: product_id });
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

module.exports = router;
