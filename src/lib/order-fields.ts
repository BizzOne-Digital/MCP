export function extractOrderTotal(doc: Record<string, unknown>): number {
  if (typeof doc.total === "number" && !Number.isNaN(doc.total)) return doc.total;
  if (typeof doc.grandTotal === "number") return doc.grandTotal;
  if (typeof doc.amount === "number") return doc.amount;
  if (typeof doc.subtotal === "number") return doc.subtotal;
  return 0;
}

export function extractCustomerName(doc: Record<string, unknown>): string | undefined {
  if (typeof doc.customerName === "string" && doc.customerName) return doc.customerName;
  if (typeof doc.name === "string" && doc.name) return doc.name;
  if (typeof doc.customer === "object" && doc.customer) {
    const c = doc.customer as Record<string, unknown>;
    if (typeof c.name === "string") return c.name;
  }
  return undefined;
}

export function extractCustomerPhone(doc: Record<string, unknown>): string | undefined {
  if (typeof doc.customerPhone === "string" && doc.customerPhone) return doc.customerPhone;
  if (typeof doc.phone === "string" && doc.phone) return doc.phone;
  return undefined;
}

export function extractOrderDate(
  doc: Record<string, unknown>,
  dateField: string
): Date {
  const created = doc[dateField] ?? doc.createdAt ?? doc.created_at;
  if (created instanceof Date) return created;
  if (typeof created === "string" || typeof created === "number") {
    const d = new Date(created);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
