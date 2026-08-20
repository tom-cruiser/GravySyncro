import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FileText, Download, Loader2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import axios from 'axios';
import api from '../config/api';
import './Invoices.css';

const STATUS_LABELS = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
  void: 'Void',
};

const formatMoney = (cents, currency = 'usd') => {
  const amount = Number(cents || 0) / 100;
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatPeriod = (start, end) => `${formatDate(start)} – ${formatDate(end)}`;

const Invoices = () => {
  const { token } = useSelector((state) => state.auth);

  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  const loadInvoices = useCallback(async (targetPage) => {
    if (!token) return;
    setLoading(true);
    setLoadError('');

    try {
      const response = await axios.get(
        api.endpoints.billing.invoices(`?page=${targetPage}&limit=15`),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response?.data?.data;
      setInvoices(data?.invoices || []);
      setPages(data?.pages || 1);
      setTotal(data?.total || 0);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setLoadError(
        error?.response?.data?.message || 'Could not load your billing history. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvoices(page);
  }, [loadInvoices, page]);

  const handleDownload = async (invoice) => {
    setDownloadError('');
    setDownloadingId(invoice._id);

    try {
      const response = await axios.get(api.endpoints.billing.invoicePdf(invoice._id), {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download invoice PDF:', error);
      setDownloadError(`Could not download ${invoice.invoiceNumber}. Please try again.`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="invoices-page">
      <div className="invoices-header">
        <div>
          <h1>Invoices</h1>
          <p className="subtitle">Your organization's billing history, one row per billing cycle.</p>
        </div>
        <Link to="/billing" className="btn-secondary invoices-manage-link">Manage subscription</Link>
      </div>

      {downloadError && (
        <div className="invoices-banner invoices-banner-error">{downloadError}</div>
      )}

      {loading ? (
        <div className="invoices-loading">
          <Loader2 className="spin" size={24} />
          <span>Loading invoices…</span>
        </div>
      ) : loadError ? (
        <div className="invoices-banner invoices-banner-error">{loadError}</div>
      ) : invoices.length === 0 ? (
        <div className="invoices-empty">
          <Receipt size={40} style={{ opacity: 0.3 }} />
          <p>No invoices yet.</p>
          <span>Your first billing cycle will show up here once it's generated.</span>
        </div>
      ) : (
        <>
          <div className="invoices-table">
            <div className="invoices-row invoices-row-head">
              <span>Invoice</span>
              <span>Billing period</span>
              <span>Issued</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="invoices-col-action">PDF</span>
            </div>

            {invoices.map((invoice) => (
              <div className="invoices-row" key={invoice._id}>
                <span className="invoices-cell-number">
                  <FileText size={16} className="invoices-cell-icon" />
                  {invoice.invoiceNumber}
                </span>
                <span className="invoices-cell-period">{formatPeriod(invoice.periodStart, invoice.periodEnd)}</span>
                <span>{formatDate(invoice.issuedAt)}</span>
                <span className="invoices-cell-amount">{formatMoney(invoice.totalCents, invoice.currency)}</span>
                <span className={`invoice-status invoice-status-${invoice.status}`}>
                  {STATUS_LABELS[invoice.status] || invoice.status}
                </span>
                <span className="invoices-col-action">
                  <button
                    type="button"
                    className="invoices-download-btn"
                    onClick={() => handleDownload(invoice)}
                    disabled={downloadingId === invoice._id}
                    aria-label={`Download ${invoice.invoiceNumber} as PDF`}
                  >
                    {downloadingId === invoice._id ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    <span className="invoices-download-label">Download</span>
                  </button>
                </span>
              </div>
            ))}
          </div>

          <div className="invoices-pagination">
            <span className="invoices-pagination-summary">
              Page {page} of {pages} · {total} invoice{total === 1 ? '' : 's'}
            </span>
            <div className="invoices-pagination-controls">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPage((p) => Math.min(p + 1, pages))}
                disabled={page >= pages}
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Invoices;
