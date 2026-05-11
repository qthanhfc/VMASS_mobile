require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initRealtime } = require('./realtime');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/bookkeeping', require('./routes/bookkeeping'));
app.use('/api/tax', require('./routes/tax'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/feedback', require('./routes/feedback'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initRealtime(server);

server.listen(PORT, () => console.log(`VMASS API running on port ${PORT}`));

module.exports = app;
