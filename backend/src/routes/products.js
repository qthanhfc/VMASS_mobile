const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [], params = [];
    if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR sku ILIKE $${params.length})`); }
    if (category) { params.push(category); where.push(`category = $${params.length}`); }
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    params.push(limit, offset);
    const rows = await db.query(`SELECT * FROM products ${clause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    const count = await db.query(`SELECT COUNT(*) FROM products ${clause}`, params.slice(0, -2));
    res.json({ items: rows.rows, total: Number(count.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/image-search', async (req, res) => {
  res.status(501).json({
    error: 'Image product search is not implemented yet',
    expectedResponse: {
      product: {
        id: 1,
        sku: 'SKU001',
        name: 'Tên sản phẩm',
        confidence: 0.92,
      },
    },
  });
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, sku, price, cost, stock, min_stock, category, image, is_online, allow_oversell, vat_applied } = req.body;
    const { rows } = await db.query(
      `INSERT INTO products (name, sku, price, cost, stock, min_stock, category, image, is_online, allow_oversell, vat_applied) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, sku, price || 0, cost || 0, stock || 0, min_stock || 5, category, image, is_online ?? true, allow_oversell ?? false, vat_applied ?? false]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, sku, price, cost, stock, min_stock, category, image, status, is_online, allow_oversell, vat_applied } = req.body;
    const { rows } = await db.query(
      `UPDATE products SET name=$1, sku=$2, price=$3, cost=$4, stock=$5, min_stock=$6, category=$7, image=$8, status=$9, is_online=$10, allow_oversell=$11, vat_applied=$12, updated_at=NOW() WHERE id=$13 RETURNING *`,
      [name, sku, price, cost, stock, min_stock, category, image, status, is_online, allow_oversell, vat_applied, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
