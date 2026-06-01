// ─── Auth & Tenant ───────────────────────────────────────────────────────────

export enum UserRole {
  TENANT_ADMIN = 'TENANT_ADMIN',
  STORE_MANAGER = 'STORE_MANAGER',
  CASHIER = 'CASHIER',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  DRIVER = 'DRIVER',
}

export enum DevicePlatform {
  WEB = 'WEB',
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WINDOWS = 'WINDOWS',
}

// ─── Customer ────────────────────────────────────────────────────────────────

export enum CustomerDiscountType {
  NONE = 'NONE',
  SC = 'SC',
  PWD = 'PWD',
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export enum VatType {
  VATABLE = 'VATABLE',
  VAT_EXEMPT = 'VAT_EXEMPT',
  ZERO_RATED = 'ZERO_RATED',
}

// ─── Procurement ─────────────────────────────────────────────────────────────

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

// ─── Warehouse & Dispatch ────────────────────────────────────────────────────

export enum DispatchStatus {
  PENDING = 'PENDING',
  DISPATCHED = 'DISPATCHED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum ReceivingRecordStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETE = 'COMPLETE',
  DISPUTED = 'DISPUTED',
}

// ─── POS ─────────────────────────────────────────────────────────────────────

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  GCASH = 'GCASH',
  MAYA = 'MAYA',
  QRPH = 'QRPH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum CashRegisterSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
}

export enum CashDrawerEventType {
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

// ─── Compliance ──────────────────────────────────────────────────────────────

export enum ReceiptType {
  OFFICIAL_RECEIPT = 'OFFICIAL_RECEIPT',
  SALES_INVOICE = 'SALES_INVOICE',
  VOID_RECEIPT = 'VOID_RECEIPT',
  RETURN_RECEIPT = 'RETURN_RECEIPT',
}

export enum ZReadingReportType {
  X_READING = 'X_READING',
  Z_READING = 'Z_READING',
}

// ─── Discounts ───────────────────────────────────────────────────────────────

export enum DiscountType {
  SC = 'SC',
  PWD = 'PWD',
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  VOUCHER = 'VOUCHER',
}

// ─── Returns ─────────────────────────────────────────────────────────────────

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

// ─── Stock Audit ─────────────────────────────────────────────────────────────

export enum StockMovementType {
  SALE = 'SALE',
  RETURN = 'RETURN',
  RECEIVE = 'RECEIVE',
  DISPATCH = 'DISPATCH',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  VOID = 'VOID',
}

// ─── Notifications ───────────────────────────────────────────────────────────

export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  CRITICAL_STOCK = 'CRITICAL_STOCK',
  EXPIRY_WARNING = 'EXPIRY_WARNING',
  DISPATCH_UPDATE = 'DISPATCH_UPDATE',
  RETURN_APPROVED = 'RETURN_APPROVED',
  SYSTEM = 'SYSTEM',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export enum Permission {
  MANAGE_DISCOUNTS = 'MANAGE_DISCOUNTS',
  VOID_TRANSACTIONS = 'VOID_TRANSACTIONS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_STOCK = 'MANAGE_STOCK',
  PROCESS_RETURNS = 'PROCESS_RETURNS',
  MANAGE_CUSTOMERS = 'MANAGE_CUSTOMERS',
  MANAGE_SUPPLIERS = 'MANAGE_SUPPLIERS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_STORES = 'MANAGE_STORES',
  ACCESS_ADMIN_PANEL = 'ACCESS_ADMIN_PANEL',
}

// ─── Promo History ───────────────────────────────────────────────────────────

export enum PromoAction {
  CREATED = 'CREATED',
  ACTIVATED = 'ACTIVATED',
  DEACTIVATED = 'DEACTIVATED',
  MODIFIED = 'MODIFIED',
  APPLIED = 'APPLIED',
  EXPIRED = 'EXPIRED',
}

// ─── Physical Inventory (v1.1) ───────────────────────────────────────────────

export enum StockCountStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

// ─── Menu Modifiers ──────────────────────────────────────────────────────────

export enum ModifierSelectionType {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
}
