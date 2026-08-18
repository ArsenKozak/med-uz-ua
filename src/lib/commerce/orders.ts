import type { OrderItemRecord, OrderRecord, OrderStatus } from "../../types/order";

export interface OrderStoreContext {
  readonly env?: {
    readonly DB?: D1Database;
    readonly med_uz_ua_db?: D1Database;
  };
}

function getDb(context?: OrderStoreContext): D1Database {
  const db = context?.env?.med_uz_ua_db ?? context?.env?.DB;
  if (!db) {
    throw new Error("D1 Database binding is missing");
  }
  return db;
}

export function generateOrderNumber(): { id: string; orderNumber: string } {
  const id = crypto.randomUUID();
  const dateSegment = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return { id, orderNumber: `MED-${dateSegment}-${randomSuffix}` };
}

interface RawOrderRow {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  total_minor: number;
  currency: string;
  customer_full_name: string;
  customer_phone: string;
  customer_comment: string | null;
  delivery_provider: "nova-poshta";
  delivery_city_name: string;
  delivery_city_ref: string;
  delivery_warehouse_name: string;
  delivery_warehouse_ref: string;
  items_json: string;
  payment_provider: "liqpay" | null;
  payment_id: string | null;
  paid_notified_at: string | null;
}

function mapRowToRecord(row: RawOrderRow): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    totalMinor: row.total_minor,
    currency: row.currency,
    customer: {
      fullName: row.customer_full_name,
      phone: row.customer_phone,
      comment: row.customer_comment ?? undefined,
    },
    delivery: {
      provider: row.delivery_provider,
      cityName: row.delivery_city_name,
      cityRef: row.delivery_city_ref,
      warehouseName: row.delivery_warehouse_name,
      warehouseRef: row.delivery_warehouse_ref,
    },
    items: JSON.parse(row.items_json) as OrderItemRecord[],
    paymentProvider: row.payment_provider ?? undefined,
    paymentId: row.payment_id ?? undefined,
    paidNotifiedAt: row.paid_notified_at ?? undefined,
  };
}

export async function createOrder(order: OrderRecord, context?: OrderStoreContext): Promise<void> {
  const db = getDb(context);
  const query = `
    INSERT INTO orders (
      id, order_number, created_at, updated_at, status, total_minor, currency,
      customer_full_name, customer_phone, customer_comment,
      delivery_provider, delivery_city_name, delivery_city_ref,
      delivery_warehouse_name, delivery_warehouse_ref,
      items_json, payment_provider, payment_id, paid_notified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db
    .prepare(query)
    .bind(
      order.id,
      order.orderNumber,
      order.createdAt,
      order.updatedAt,
      order.status,
      order.totalMinor,
      order.currency,
      order.customer.fullName,
      order.customer.phone,
      order.customer.comment ?? null,
      order.delivery.provider,
      order.delivery.cityName,
      order.delivery.cityRef,
      order.delivery.warehouseName,
      order.delivery.warehouseRef,
      JSON.stringify(order.items),
      order.paymentProvider ?? null,
      order.paymentId ?? null,
      order.paidNotifiedAt ?? null
    )
    .run();
}

export async function getOrderById(id: string, context?: OrderStoreContext): Promise<OrderRecord | null> {
  const db = getDb(context);
  const row = await db
    .prepare("SELECT * FROM orders WHERE id = ? LIMIT 1")
    .bind(id)
    .first<RawOrderRow>();

  return row ? mapRowToRecord(row) : null;
}

export async function atomicTransitionOrderStatus(
  id: string,
  nextStatus: OrderStatus,
  allowedStatuses: readonly OrderStatus[],
  paymentDetails?: { paymentProvider?: "liqpay"; paymentId?: string },
  context?: OrderStoreContext
): Promise<boolean> {
  const db = getDb(context);
  const now = new Date().toISOString();
  const placeholders = allowedStatuses.map(() => "?").join(", ");

  const query = `
    UPDATE orders
    SET status = ?, updated_at = ?, payment_provider = COALESCE(?, payment_provider), payment_id = COALESCE(?, payment_id)
    WHERE id = ? AND status IN (${placeholders})
  `;

  const result = await db
    .prepare(query)
    .bind(
      nextStatus,
      now,
      paymentDetails?.paymentProvider ?? null,
      paymentDetails?.paymentId ?? null,
      id,
      ...allowedStatuses
    )
    .run();

  return (result.meta?.changes ?? 0) === 1;
}

export async function markOrderPaidNotified(id: string, context?: OrderStoreContext): Promise<void> {
  const db = getDb(context);
  await db
    .prepare("UPDATE orders SET paid_notified_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), id)
    .run();
}
