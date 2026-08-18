CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL,
  total_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UAH',
  customer_full_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_comment TEXT,
  delivery_provider TEXT NOT NULL,
  delivery_city_name TEXT NOT NULL,
  delivery_city_ref TEXT NOT NULL,
  delivery_warehouse_name TEXT NOT NULL,
  delivery_warehouse_ref TEXT NOT NULL,
  items_json TEXT NOT NULL,
  payment_provider TEXT,
  payment_id TEXT,
  paid_notified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
