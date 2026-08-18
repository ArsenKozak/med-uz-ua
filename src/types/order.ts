export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "PAID"
  | "PAYMENT_FAILED"
  | "REVERSED"
  | "PROCESSING"
  | "SHIPPED"
  | "CANCELLED";

export interface OrderItemRecord {
  readonly productId: string;
  readonly title: string;
  readonly unitPriceMinor: number;
  readonly quantity: number;
  readonly lineTotalMinor: number;
  readonly currency: string;
}

export interface OrderDeliveryRecord {
  readonly provider: "nova-poshta";
  readonly cityName: string;
  readonly cityRef: string;
  readonly warehouseName: string;
  readonly warehouseRef: string;
}

export interface OrderCustomerRecord {
  readonly fullName: string;
  readonly phone: string;
  readonly comment?: string;
}

export interface OrderRecord {
  readonly id: string;
  readonly orderNumber: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly status: OrderStatus;
  readonly totalMinor: number;
  readonly currency: string;
  readonly customer: OrderCustomerRecord;
  readonly delivery: OrderDeliveryRecord;
  readonly items: readonly OrderItemRecord[];
  readonly paymentProvider?: "liqpay";
  readonly paymentId?: string;
  readonly paidNotifiedAt?: string;
}
