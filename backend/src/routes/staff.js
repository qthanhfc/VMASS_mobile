const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM staff ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM staff WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, role, branch, salary, commission, can_sell, can_view_revenue, can_manage_inventory, can_manage_customers, can_manage_staff, can_manage_promotions } = req.body;
    const { rows } = await db.query(
      `INSERT INTO staff (name, phone, email, role, branch, salary, commission, can_sell, can_view_revenue, can_manage_inventory, can_manage_customers, can_manage_staff, can_manage_promotions) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, phone, email, role, branch, salary || 0, commission || 0, can_sell ?? true, can_view_revenue ?? false, can_manage_inventory ?? false, can_manage_customers ?? true, can_manage_staff ?? false, can_manage_promotions ?? false]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, role, branch, salary, commission, can_sell, can_view_revenue, can_manage_inventory, can_manage_customers, can_manage_staff, can_manage_promotions, status } = req.body;
    const { rows } = await db.query(
      `UPDATE staff SET name=$1, phone=$2, email=$3, role=$4, branch=$5, salary=$6, commission=$7, can_sell=$8, can_view_revenue=$9, can_manage_inventory=$10, can_manage_customers=$11, can_manage_staff=$12, can_manage_promotions=$13, status=$14 WHERE id=$15 RETURNING *`,
      [name, phone, email, role, branch, salary, commission, can_sell, can_view_revenue, can_manage_inventory, can_manage_customers, can_manage_staff, can_manage_promotions, status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM staff WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
