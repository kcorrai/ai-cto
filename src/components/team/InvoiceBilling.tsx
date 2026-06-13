"use client";

import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, Loader2, Receipt, Check } from "lucide-react";

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  dueDate: number | null;
  created: number;
  pdfUrl: string | null;
  hostedUrl: string | null;
  poNumber: string | null;
  description: string | null;
};

type Props = { plan: string };

export function InvoiceBilling({ plan }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [form, setForm] = useState({ billingEmail: "", poNumber: "", seats: "5", companyName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    void fetch("/api/orgs/billing/invoices")
      .then((r) => (r.ok ? (r.json() as Promise<{ invoices: Invoice[] }>) : null))
      .then((data) => {
        if (data) setInvoices(data.invoices);
        setLoading(false);
      });
  }, []);

  async function submitRequest() {
    setSubmitting(true);
    const res = await fetch("/api/orgs/billing/invoice-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billingEmail: form.billingEmail,
        poNumber: form.poNumber || undefined,
        seats: parseInt(form.seats),
        companyName: form.companyName || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setShowRequestForm(false);
    }
  }

  function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  function statusColor(status: string | null) {
    if (status === "paid") return "text-green-400";
    if (status === "open") return "text-yellow-400";
    if (status === "void" || status === "uncollectible") return "text-[#606060]";
    return "text-[#a0a0a0]";
  }

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f]">
            <Receipt className="h-4 w-4 text-[#3b82f6]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#f0f0f0]">Invoice Billing</h3>
            <p className="text-xs text-[#606060]">Net-30 terms · Wire transfer · PO numbers</p>
          </div>
        </div>
        {plan !== "enterprise" && !submitted && (
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#a0a0a0] hover:border-[#3b82f6]/50 hover:text-[#f0f0f0] transition-colors"
          >
            Request invoice billing
          </button>
        )}
      </div>

      {submitted && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
          <Check className="h-4 w-4 text-green-400" />
          <p className="text-xs text-green-400">
            Invoice billing request submitted. We&apos;ll send your first invoice within 1 business
            day.
          </p>
        </div>
      )}

      {showRequestForm && (
        <div className="mb-4 space-y-3 rounded-lg border border-[#2a2a2a] p-4">
          <p className="text-xs text-[#606060]">
            We&apos;ll create a net-30 invoice. No credit card required.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">
                Billing email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.billingEmail}
                onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                placeholder="billing@company.com"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">Company name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Acme Corp"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">PO number</label>
              <input
                type="text"
                value={form.poNumber}
                onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                placeholder="PO-2026-001"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#404040] focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#a0a0a0]">
                Seats <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-xs text-[#f0f0f0] focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void submitRequest()}
              disabled={submitting || !form.billingEmail || !form.seats}
              className="flex items-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-xs font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-colors"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Submit request
            </button>
            <button
              onClick={() => setShowRequestForm(false)}
              className="rounded-lg px-4 py-2 text-xs text-[#606060] hover:text-[#f0f0f0] transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-[#404040]">
            Payment via wire transfer or ACH. Net-30 terms from invoice date.
          </p>
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-[#606060]" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="mb-2 h-6 w-6 text-[#404040]" />
          <p className="text-xs text-[#606060]">No invoices yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#1a1a1a]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="px-4 py-2.5 text-left font-medium text-[#606060]">Invoice</th>
                <th className="px-4 py-2.5 text-left font-medium text-[#606060]">PO #</th>
                <th className="px-4 py-2.5 text-right font-medium text-[#606060]">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium text-[#606060]">Due</th>
                <th className="px-4 py-2.5 text-left font-medium text-[#606060]">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#141414]">
                  <td className="px-4 py-2.5 font-mono text-[#d0d0d0]">
                    {inv.number ?? inv.id.slice(-8)}
                  </td>
                  <td className="px-4 py-2.5 text-[#a0a0a0]">{inv.poNumber ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right text-[#d0d0d0]">
                    {formatAmount(inv.amount, inv.currency)}
                  </td>
                  <td className="px-4 py-2.5 text-[#a0a0a0]">
                    {inv.dueDate ? new Date(inv.dueDate * 1000).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`capitalize ${statusColor(inv.status)}`}>
                      {inv.status ?? "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#606060] hover:text-[#3b82f6] transition-colors"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {inv.hostedUrl && (
                        <a
                          href={inv.hostedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#606060] hover:text-[#3b82f6] transition-colors"
                          title="View invoice"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
