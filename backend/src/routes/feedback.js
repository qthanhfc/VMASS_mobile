const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendFeedbackEmail } = require('../services/feedbackEmail');

const VALID_CATEGORIES = new Set(['feature', 'improvement', 'bug', 'other']);
const FEEDBACK_SAVE_TIMEOUT_MS = Number(process.env.FEEDBACK_SAVE_TIMEOUT_MS || 2500);

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

async function ensureFeedbackTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS feature_feedback (
      id SERIAL PRIMARY KEY,
      category VARCHAR(30) NOT NULL DEFAULT 'feature',
      title VARCHAR(255),
      content TEXT NOT NULL,
      contact_name VARCHAR(255),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      company_name VARCHAR(255),
      source VARCHAR(80),
      status VARCHAR(30) NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

router.post('/', async (req, res) => {
  try {
    const {
      category = 'feature',
      title = '',
      content = '',
      contactName = '',
      contactEmail = '',
      contactPhone = '',
      companyName = '',
      source = 'mobile',
    } = req.body || {};

    const trimmedContent = String(content || '').trim();
    if (!trimmedContent) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung góp ý.' });
    }

    if (trimmedContent.length < 10) {
      return res.status(400).json({ message: 'Nội dung góp ý quá ngắn.' });
    }

    const normalizedCategory = VALID_CATEGORIES.has(category) ? category : 'other';
    const feedback = {
      category: normalizedCategory,
      title: String(title || '').trim(),
      content: trimmedContent,
      contactName: String(contactName || '').trim(),
      contactEmail: String(contactEmail || '').trim(),
      contactPhone: String(contactPhone || '').trim(),
      companyName: String(companyName || '').trim(),
      source: String(source || '').trim() || 'mobile',
    };

    let savedFeedback = null;
    let saveError = null;
    try {
      await withTimeout(
        ensureFeedbackTable(),
        FEEDBACK_SAVE_TIMEOUT_MS,
        'Timed out while preparing feedback table.'
      );

      const { rows } = await withTimeout(
        db.query(
          `INSERT INTO feature_feedback (
            category,
            title,
            content,
            contact_name,
            contact_email,
            contact_phone,
            company_name,
            source
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          RETURNING id, created_at`,
          [
            feedback.category,
            feedback.title || null,
            feedback.content,
            feedback.contactName || null,
            feedback.contactEmail || null,
            feedback.contactPhone || null,
            feedback.companyName || null,
            feedback.source,
          ]
        ),
        FEEDBACK_SAVE_TIMEOUT_MS,
        'Timed out while saving feedback.'
      );
      savedFeedback = rows[0];
    } catch (err) {
      saveError = err;
      console.error('Feedback save failed:', err.message);
    }

    const emailResult = await sendFeedbackEmail(feedback);

    res.status(201).json({
      success: true,
      responseText: emailResult.sent
        ? 'Cảm ơn bạn đã gửi góp ý. VMASS đã nhận được phản hồi này.'
        : 'Cảm ơn bạn đã gửi góp ý. VMASS sẽ xem xét phản hồi này.',
      data: savedFeedback,
      email: emailResult,
      warning: saveError ? 'Không thể lưu góp ý vào database, nhưng request đã được xử lý.' : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
