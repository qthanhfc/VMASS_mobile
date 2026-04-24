const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [revenueToday, revenueYesterday, ordersToday, newCustomers, weeklyRev, topProducts, lowStock, recentOrders] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(total), 0) as v FROM orders WHERE created_at::date = $1 AND status != 'cancelled'`, [today]),
      db.query(`SELECT COALESCE(SUM(total), 0) as v FROM orders WHERE created_at::date = $1 AND status != 'cancelled'`, [yesterday]),
      db.query(`SELECT COUNT(*) as v FROM orders WHERE created_at::date = $1`, [today]),
      db.query(`SELECT COUNT(*) as v FROM customers WHERE created_at::date = $1`, [today]),
      db.query(`SELECT TO_CHAR(created_at::date, 'Dy') as day, COALESCE(SUM(total),0) as rev FROM orders WHERE created_at >= NOW()-INTERVAL '7 days' AND status != 'cancelled' GROUP BY 1 ORDER BY MIN(created_at)`),
      db.query(`SELECT p.id, p.name, COALESCE(SUM(oi.qty),0) as sold, COALESCE(SUM(oi.total),0) as revenue FROM products p LEFT JOIN order_items oi ON p.id=oi.product_id LEFT JOIN orders o ON oi.order_id=o.id AND o.status!='cancelled' GROUP BY p.id ORDER BY sold DESC LIMIT 5`),
      db.query(`SELECT id, name, stock, min_stock FROM products WHERE stock <= min_stock AND status='active' ORDER BY stock ASC LIMIT 5`),
      db.query(`SELECT o.id, o.order_number, o.customer_name, o.total, o.status, o.channel, o.created_at FROM orders o ORDER BY created_at DESC LIMIT 8`),
    ]);

    const monthStart = new Date(); monthStart.setDate(1);
    const monthRev = await db.query(`SELECT COALESCE(SUM(total),0) as v FROM orders WHERE created_at >= $1 AND status!='cancelled'`, [monthStart.toISOString()]);

    res.json({
      revenueToday: Number(revenueToday.rows[0].v),
      revenueYesterday: Number(revenueYesterday.rows[0].v),
      ordersToday: Number(ordersToday.rows[0].v),
      newCustomers: Number(newCustomers.rows[0].v),
      monthlyRevenue: Number(monthRev.rows[0].v),
      monthlyGoal: 100000000,
      weeklyRevenue: weeklyRev.rows.map(r => ({ day: r.day, rev: Number(r.rev) })),
      topProducts: topProducts.rows.map(r => ({ ...r, sold: Number(r.sold), revenue: Number(r.revenue) })),
      lowStockProducts: lowStock.rows,
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
