const express = require('express');
const router = express.Router();
const db = require('../db');
const { emitRealtimeEvent } = require('../realtime');

router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const end = `${y}-${String(m).padStart(2, '0')}-31`;
    const income = await db.query(`SELECT COALESCE(SUM(amount),0) as v FROM bookkeeping WHERE type='income' AND date BETWEEN $1 AND $2`, [start, end]);
    const expense = await db.query(`SELECT COALESCE(SUM(amount),0) as v FROM bookkeeping WHERE type='expense' AND date BETWEEN $1 AND $2`, [start, end]);
    const categories = await db.query(`SELECT category, type, SUM(amount) as total FROM bookkeeping WHERE date BETWEEN $1 AND $2 GROUP BY category, type ORDER BY total DESC`, [start, end]);
    res.json({
      income: Number(income.rows[0].v),
      expense: Number(expense.rows[0].v),
      profit: Number(income.rows[0].v) - Number(expense.rows[0].v),
      categories: categories.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    let where = [], params = [];
    if (type) { params.push(type); where.push(`type = $${params.length}`); }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    params.push(limit, (page - 1) * limit);
    const { rows } = await db.query(`SELECT * FROM bookkeeping ${clause} ORDER BY date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, category, amount, description, date, party, account, invoice_number } = req.body;
    const { rows } = await db.query(
      `INSERT INTO bookkeeping (type, category, amount, description, date, party, account, invoice_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [type, category, amount, description, date || new Date().toISOString().split('T')[0], party, account, invoice_number]
    );
    emitRealtimeEvent('bookkeeping', 'created', { id: rows[0].id });
    emitRealtimeEvent('dashboard', 'updated', { source: 'bookkeeping' });
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
