"use client";
import React from "react";

export interface InvoiceData {
  invoiceNumber: string;
  refNumber: string;
  date: string;
  dueDate?: string;
  customerName: string;
  customerEmail?: string;
  venueName: string;
  venueAddress?: string;
  venuePhone?: string;
  items: { name: string; quantity: number; price: number; staffName?: string }[];
  subtotal: number;
  taxAmount?: number;
  taxPercentage?: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: "paid" | "pending";
  logoUrl?: string;
}

export function generateAndDownloadInvoicePDF(data: InvoiceData) {
  const taxAmount = data.taxAmount ?? (data.taxPercentage ? (data.subtotal * data.taxPercentage) / 100 : 0);
  const taxLabel = data.taxPercentage ? `Tax (${data.taxPercentage}%)` : "Tax";
  const formattedDate = data.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice ${data.invoiceNumber} - REZERVAME</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; }
  .page { width: 794px; min-height: 1123px; margin: 0 auto; padding: 0; background: #fff; position: relative; }
  
  /* Header */
  .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 48px 56px; position: relative; overflow: hidden; }
  .header::before { content: ''; position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; background: rgba(255, 87, 87,0.15); border-radius: 50%; }
  .header::after { content: ''; position: absolute; bottom: -40px; left: 200px; width: 140px; height: 140px; background: rgba(255, 87, 87,0.08); border-radius: 50%; }
  .header-inner { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-icon { width: 44px; height: 44px; background: #ff5757; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .brand-icon svg { width: 22px; height: 22px; fill: white; }
  .brand-name { font-size: 22px; font-weight: 900; color: white; letter-spacing: 2px; text-transform: uppercase; }
  .brand-tagline { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 500; letter-spacing: 1px; margin-top: 2px; }
  .invoice-badge { text-align: right; }
  .invoice-label { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
  .invoice-num { font-size: 28px; font-weight: 900; color: white; letter-spacing: -1px; margin-top: 4px; }
  .status-pill { display: inline-block; margin-top: 8px; padding: 4px 14px; border-radius: 100px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  .status-paid { background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
  .status-pending { background: rgba(251,191,36,0.2); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }

  /* Body */
  .body { padding: 48px 56px; }
  
  /* Meta row */
  .meta-row { display: flex; gap: 24px; margin-bottom: 40px; }
  .meta-card { flex: 1; background: #f8fafc; border-radius: 16px; padding: 20px 24px; border: 1px solid #e2e8f0; }
  .meta-card-label { font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
  .meta-card-value { font-size: 14px; font-weight: 700; color: #1e293b; line-height: 1.4; }
  .meta-card-sub { font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px; }

  /* Divider */
  .section-divider { height: 1px; background: linear-gradient(90deg, #ff575722, #e2e8f0, transparent); margin: 32px 0; }
  
  /* Table */
  .services-heading { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
  .table { width: 100%; border-collapse: collapse; }
  .table thead tr { background: #0f172a; }
  .table thead th { padding: 14px 20px; font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; text-align: left; }
  .table thead th:last-child { text-align: right; }
  .table thead th:first-child { border-radius: 12px 0 0 12px; }
  .table thead th:last-child { border-radius: 0 12px 12px 0; }
  .table tbody tr { border-bottom: 1px solid #f1f5f9; }
  .table tbody tr:last-child { border-bottom: none; }
  .table tbody td { padding: 16px 20px; font-size: 13px; }
  .service-name { font-weight: 700; color: #1e293b; }
  .service-staff { font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 2px; }
  .qty { color: #64748b; font-weight: 600; }
  .price { font-weight: 700; color: #1e293b; text-align: right; }

  /* Totals */
  .totals { margin-top: 24px; display: flex; justify-content: flex-end; }
  .totals-box { width: 280px; background: #f8fafc; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
  .total-label { font-size: 12px; color: #64748b; font-weight: 600; }
  .total-value { font-size: 13px; color: #1e293b; font-weight: 700; }
  .total-divider { height: 1px; background: #e2e8f0; margin: 12px 0; }
  .grand-label { font-size: 13px; font-weight: 900; color: #1e293b; }
  .grand-value { font-size: 20px; font-weight: 900; color: #ff5757; }

  /* Payment badge */
  .payment-info { margin-top: 32px; display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 16px; padding: 16px 20px; }
  .payment-info.pending { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fde68a; }
  .payment-icon { width: 36px; height: 36px; background: #22c55e; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; flex-shrink: 0; }
  .payment-icon.pending { background: #f59e0b; }
  .payment-text-label { font-size: 9px; font-weight: 800; color: #16a34a; text-transform: uppercase; letter-spacing: 1px; }
  .payment-text-label.pending { color: #b45309; }
  .payment-text-value { font-size: 13px; font-weight: 700; color: #15803d; margin-top: 2px; }
  .payment-text-value.pending { color: #92400e; }

  /* Footer */
  .footer { margin-top: 48px; padding: 32px 56px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-size: 12px; font-weight: 800; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; }
  .footer-note { font-size: 11px; color: #cbd5e1; font-weight: 500; }
  .footer-ref { font-size: 10px; font-weight: 700; color: #cbd5e1; letter-spacing: 1px; }

  @media print {
    body { margin: 0; }
    .page { width: 100%; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-inner">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
        </div>
        <div>
          <div class="brand-name">REZERVAME</div>
          <div class="brand-tagline">Beauty &amp; Wellness Platform</div>
        </div>
      </div>
      <div class="invoice-badge">
        <div class="invoice-label">Invoice</div>
        <div class="invoice-num">${data.invoiceNumber}</div>
        <div class="status-pill ${data.paymentStatus === "paid" ? "status-paid" : "status-pending"}">
          ${data.paymentStatus === "paid" ? "✓ Paid" : "⏳ Pending"}
        </div>
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="body">

    <!-- Meta cards -->
    <div class="meta-row">
      <div class="meta-card">
        <div class="meta-card-label">Bill To</div>
        <div class="meta-card-value">${data.customerName}</div>
        ${data.customerEmail ? `<div class="meta-card-sub">${data.customerEmail}</div>` : ""}
      </div>
      <div class="meta-card">
        <div class="meta-card-label">Service Provider</div>
        <div class="meta-card-value">${data.venueName}</div>
        ${data.venueAddress ? `<div class="meta-card-sub">${data.venueAddress}</div>` : ""}
        ${data.venuePhone ? `<div class="meta-card-sub">${data.venuePhone}</div>` : ""}
      </div>
      <div class="meta-card">
        <div class="meta-card-label">Date</div>
        <div class="meta-card-value">${formattedDate}</div>
        <div class="meta-card-sub">Ref: #${data.refNumber}</div>
      </div>
    </div>

    <div class="section-divider"></div>

    <!-- Services table -->
    <div class="services-heading">Services Rendered</div>
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Professional</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item) => `
          <tr>
            <td><div class="service-name">${item.name}</div></td>
            <td><div class="service-staff">${item.staffName || "—"}</div></td>
            <td class="qty">${item.quantity}</td>
            <td class="price">$${item.price.toFixed(2)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-box">
        <div class="total-row">
          <span class="total-label">Subtotal</span>
          <span class="total-value">$${data.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span class="total-label">${taxLabel}</span>
          <span class="total-value">$${taxAmount.toFixed(2)}</span>
        </div>
        <div class="total-divider"></div>
        <div class="total-row">
          <span class="grand-label">Total</span>
          <span class="grand-value">$${data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Payment info -->
    <div class="payment-info ${data.paymentStatus === "pending" ? "pending" : ""}">
      <div class="payment-icon ${data.paymentStatus === "pending" ? "pending" : ""}">
        ${data.paymentStatus === "paid" ? "✓" : "⏳"}
      </div>
      <div>
        <div class="payment-text-label ${data.paymentStatus === "pending" ? "pending" : ""}">
          Payment Status
        </div>
        <div class="payment-text-value ${data.paymentStatus === "pending" ? "pending" : ""}">
          ${data.paymentStatus === "paid" ? `Payment received — ${data.paymentMethod || "Cash"}` : "Payment pending — due at venue"}
        </div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <div class="footer-brand">REZERVAME</div>
      <div class="footer-note">Thank you for choosing us!</div>
    </div>
    <div style="text-align:right">
      <div class="footer-ref">Invoice ${data.invoiceNumber}</div>
      <div class="footer-note">Generated ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 600);
}
