-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  price NUMERIC(15,0) NOT NULL DEFAULT 0,
  cost NUMERIC(15,0) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  category VARCHAR(100),
  image TEXT,
  status VARCHAR(20) DEFAULT 'active',
  is_online BOOLEAN DEFAULT true,
  allow_oversell BOOLEAN DEFAULT false,
  vat_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  total_spent NUMERIC(15,0) DEFAULT 0,
  order_count INT DEFAULT 0,
  points INT DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'Normal',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  role VARCHAR(100),
  branch VARCHAR(100),
  salary NUMERIC(15,0) DEFAULT 0,
  commission NUMERIC(5,2) DEFAULT 0,
  can_sell BOOLEAN DEFAULT true,
  can_view_revenue BOOLEAN DEFAULT false,
  can_manage_inventory BOOLEAN DEFAULT false,
  can_manage_customers BOOLEAN DEFAULT true,
  can_manage_staff BOOLEAN DEFAULT false,
  can_manage_promotions BOOLEAN DEFAULT false,
  avatar TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  contact_person VARCHAR(255),
  payment_terms VARCHAR(100),
  credit_limit NUMERIC(15,0) DEFAULT 0,
  current_debt NUMERIC(15,0) DEFAULT 0,
  total_orders INT DEFAULT 0,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  customer_id INT REFERENCES customers(id),
  customer_name VARCHAR(255),
  status VARCHAR(30) DEFAULT 'pending',
  channel VARCHAR(30) DEFAULT 'pos',
  subtotal NUMERIC(15,0) DEFAULT 0,
  discount NUMERIC(15,0) DEFAULT 0,
  shipping NUMERIC(15,0) DEFAULT 0,
  total NUMERIC(15,0) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  product_name VARCHAR(255),
  sku VARCHAR(100),
  qty INT NOT NULL DEFAULT 1,
  price NUMERIC(15,0) NOT NULL,
  total NUMERIC(15,0) NOT NULL
);

-- Inventory (per branch)
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  branch VARCHAR(100) DEFAULT 'Cửa hàng chính',
  stock INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  type VARCHAR(30) NOT NULL, -- receive, issue, transfer, adjust
  qty INT NOT NULL,
  branch_from VARCHAR(100),
  branch_to VARCHAR(100),
  reference VARCHAR(100),
  note TEXT,
  created_by INT REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Returns
CREATE TABLE IF NOT EXISTS returns (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  order_number VARCHAR(50),
  customer_name VARCHAR(255),
  reason VARCHAR(255),
  refund_amount NUMERIC(15,0) DEFAULT 0,
  refund_method VARCHAR(50),
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Return Items
CREATE TABLE IF NOT EXISTS return_items (
  id SERIAL PRIMARY KEY,
  return_id INT REFERENCES returns(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  qty INT,
  price NUMERIC(15,0)
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(30) NOT NULL, -- percent, flat, bogo, combo
  value NUMERIC(10,2) DEFAULT 0,
  code VARCHAR(50),
  usage_limit INT DEFAULT 0,
  usage_count INT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookkeeping
CREATE TABLE IF NOT EXISTS bookkeeping (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL, -- income, expense
  category VARCHAR(100),
  amount NUMERIC(15,0) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  party VARCHAR(255),
  account VARCHAR(100),
  invoice_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Declarations
CREATE TABLE IF NOT EXISTS tax_declarations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- vat, personal_income
  period VARCHAR(20),
  revenue NUMERIC(15,0) DEFAULT 0,
  tax_amount NUMERIC(15,0) DEFAULT 0,
  due_date DATE,
  paid_date DATE,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  channel VARCHAR(30) NOT NULL, -- facebook, zalo, instagram, sms, internal, system
  sender_name VARCHAR(255),
  sender_id VARCHAR(255),
  preview TEXT,
  unread_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert seed data
INSERT INTO products (name, sku, price, cost, stock, min_stock, category, status) VALUES
  ('Áo thun nam basic', 'AT001', 199000, 90000, 45, 10, 'Thời trang', 'active'),
  ('Quần jean slim fit', 'QJ002', 450000, 200000, 12, 5, 'Thời trang', 'active'),
  ('Giày thể thao', 'GT003', 890000, 400000, 8, 3, 'Giày dép', 'active'),
  ('Cà phê hòa tan', 'CF004', 85000, 40000, 150, 20, 'Thực phẩm', 'active'),
  ('Bánh quy xốp', 'BQ005', 35000, 15000, 3, 10, 'Thực phẩm', 'active'),
  ('Nước hoa hồng', 'NH006', 320000, 140000, 25, 8, 'Mỹ phẩm', 'active'),
  ('Kem dưỡng da', 'KD007', 550000, 230000, 18, 5, 'Mỹ phẩm', 'active'),
  ('Tai nghe không dây', 'TN008', 1200000, 600000, 6, 2, 'Điện tử', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO customers (name, phone, total_spent, order_count, points, tier) VALUES
  ('Nguyễn Thị Lan', '0901234567', 4500000, 12, 450, 'Gold'),
  ('Trần Văn Nam', '0912345678', 12000000, 28, 1200, 'VIP'),
  ('Lê Thu Hương', '0923456789', 890000, 3, 89, 'Normal'),
  ('Phạm Đức Minh', '0934567890', 3200000, 8, 320, 'Silver'),
  ('Hoàng Thị Mai', '0945678901', 780000, 5, 78, 'Normal')
ON CONFLICT DO NOTHING;

INSERT INTO staff (name, phone, role, branch, salary, can_sell, can_view_revenue) VALUES
  ('Nguyễn Minh Tú', '0901111111', 'Nhân viên bán hàng', 'CN Quận 1', 8000000, true, false),
  ('Trần Thị Bích', '0902222222', 'Thu ngân', 'CN Quận 1', 7500000, true, false),
  ('Lê Văn Đức', '0903333333', 'Quản lý kho', 'Kho trung tâm', 9000000, false, false),
  ('Admin', '0900000000', 'Chủ cửa hàng', 'Tất cả', 0, true, true)
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (name, phone, contact_person, category, current_debt, payment_terms) VALUES
  ('Công ty CP Thời Trang Việt', '02812345678', 'Anh Hùng', 'Thời trang', 15000000, 'Net 30'),
  ('NCC Thực Phẩm Sạch', '02823456789', 'Chị Lan', 'Thực phẩm', 0, 'Thanh toán ngay'),
  ('Mỹ Phẩm Hàn Quốc', '02834567890', 'Anh Tuấn', 'Mỹ phẩm', 8500000, 'Net 15')
ON CONFLICT DO NOTHING;

INSERT INTO promotions (name, type, value, code, usage_limit, usage_count, start_date, end_date, status) VALUES
  ('Giảm 10% cuối tuần', 'percent', 10, 'WEEKEND10', 200, 127, '2026-04-20', '2026-04-30', 'active'),
  ('Giảm 50k đơn từ 500k', 'flat', 50000, 'SAVE50', 100, 43, '2026-04-01', '2026-04-30', 'active'),
  ('Tháng 5 - Mua 2 tặng 1', 'bogo', 0, NULL, 0, 0, '2026-05-01', '2026-05-31', 'scheduled')
ON CONFLICT DO NOTHING;

INSERT INTO messages (channel, sender_name, preview, unread_count, is_pinned) VALUES
  ('facebook', 'Trần Thị Bích', 'Cho hỏi áo size M còn không ạ?', 3, false),
  ('zalo', 'Nguyễn Văn An', 'Đơn hàng của mình đã giao chưa?', 1, false),
  ('system', 'Hệ thống', 'Cảnh báo: 3 sản phẩm sắp hết hàng', 1, true),
  ('instagram', 'user_abc123', 'Tag mình vào ảnh áo này nha shop', 0, false),
  ('internal', 'Lê Văn Đức', 'Đã nhập 50 áo thun từ NCC', 0, false)
ON CONFLICT DO NOTHING;
