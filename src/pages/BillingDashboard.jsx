import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Printer, CreditCard, Banknote, Sparkles, QrCode, Award, Check, History, Search, Download, X, Eye, XCircle, AlertTriangle, Package, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const cancellationPresetReasons = [
 'Customer changed mind',
 'Wrong item selected',
 'Duplicate order',
 'Long waiting time',
 'Item unavailable',
 'Other'
];

export default function BillingDashboard() {
 const { orders, bills, processBill, cancelOrder, approveOrderCancellation, rejectOrderCancellation, requestBalanceParcel, menuItems } = useStore();
 const [selectedOrder, setSelectedOrder] = useState(null);
 const [discount, setDiscount] = useState(0);
 const [paymentMethod, setPaymentMethod] = useState('cash');
 const [membershipTier, setMembershipTier] = useState('none');
 const [showQR, setShowQR] = useState(false);
 const [billingTab, setBillingTab] = useState('active'); // 'active' | 'history'

 // Cancellation Modal States for Unpaid ready orders
 const [cancellingOrder, setCancellingOrder] = useState(null);
 const [selectedReason, setSelectedReason] = useState('Customer changed mind');
 const [customReason, setCustomReason] = useState('');

 // Refunded invoice ID state persistent cache
 const [refundedBillIds, setRefundedBillIds] = useState([]);

 // History search & filter states
 const [historySearch, setHistorySearch] = useState('');
 const [historyFilterMethod, setHistoryFilterMethod] = useState('All');
 const [historyFilterDate, setHistoryFilterDate] = useState('');
 const [viewingPastInvoice, setViewingPastInvoice] = useState(null);
 const [isExporting, setIsExporting] = useState(false);

 // Sync selectedOrder with live orders to avoid stale state issues (e.g. balance parcel status changes)
 useEffect(() => {
 if (selectedOrder) {
 const live = orders.find(o => o.orderNo === selectedOrder.orderNo || o.id === selectedOrder.id);
 if (live) {
 setSelectedOrder(live);
 }
 }
 }, [orders, selectedOrder?.orderNo, selectedOrder?.id]);

 const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'ready_for_pickup');

 // Dynamic Physical Table layout
 const mockTables = [
 { num: 1, status: readyOrders.some(o => o.table === 1 && o.orderType !== 'parcel') ? 'ready' : 'free' },
 { num: 2, status: 'occupied' },
 { num: 3, status: readyOrders.some(o => o.table === 3 && o.orderType !== 'parcel') ? 'ready' : 'free' },
 { num: 4, status: readyOrders.some(o => o.table === 4 && o.orderType !== 'parcel') ? 'ready' : 'free' },
 { num: 5, status: 'occupied' },
 { num: 6, status: readyOrders.some(o => o.table === 6 && o.orderType !== 'parcel') ? 'ready' : 'free' },
 { num: 7, status: 'free' },
 { num: 8, status: 'free' }
 ];

 const handleSelectOrder = (order) => {
 setSelectedOrder(order);
 setShowQR(false);
 };

 const getTierDiscount = () => {
 if (membershipTier === 'silver') return 5;
 if (membershipTier === 'gold') return 10;
 if (membershipTier === 'platinum') return 15;
 return 0;
 };

 const calculateInvoiceTotal = () => {
 if (!selectedOrder) return { subtotal: 0, tax: 0, discountAmount: 0, loyaltyDiscount: 0, total: 0 };
 const subtotal = selectedOrder.subtotal || 0;
 const tax = selectedOrder.tax || (subtotal * 0.05);
 const packagingCharge = selectedOrder.packagingCharge || 0;
 const primaryDiscount = subtotal * (discount / 100);
 const loyaltyDiscount = subtotal * (getTierDiscount() / 100);
 const total = Math.max(0, subtotal + tax + packagingCharge - primaryDiscount - loyaltyDiscount);
 return { subtotal, tax, packagingCharge, discountAmount: primaryDiscount, loyaltyDiscount, total };
 };

 const { subtotal, tax, packagingCharge, discountAmount, loyaltyDiscount, total } = calculateInvoiceTotal();

 const handleProcessPayment = async () => {
 if (!selectedOrder) return;
 try {
 await processBill({
 orderNo: selectedOrder.orderNo,
 orderType: selectedOrder.orderType,
 parcelToken: selectedOrder.parcelToken,
 customerName: selectedOrder.customerName,
 pickupTime: selectedOrder.pickupTime,
 phoneNumber: selectedOrder.phoneNumber,
 balanceParcelStatus: selectedOrder.balanceParcelStatus,
 table: selectedOrder.table,
 items: selectedOrder.items,
 subtotal,
 tax,
 packagingCharge,
 discount: discountAmount + loyaltyDiscount,
 total,
 paymentMethod
 });

 // Play success cash register bell sound
 try {
 const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
 audio.volume = 0.3;
 audio.play().catch(() => {});
 } catch (e) {}

 toast.success(`Transaction Completed! ${selectedOrder.orderType === 'parcel' ? `Parcel ${selectedOrder.parcelToken} closed` : `Table #${selectedOrder.table} is now free`}.`);
 setSelectedOrder(null);
 setShowQR(false);
 } catch (err) {
 toast.error('Payment processing failed');
 }
 };

 const handleTriggerCancel = () => {
 if (!selectedOrder) return;
 setCancellingOrder(selectedOrder);
 setSelectedReason('Customer changed mind');
 setCustomReason('');
 };

 const handleConfirmCancel = async () => {
 if (!cancellingOrder) return;
 const finalReason = selectedReason === 'Other' ? customReason || 'Other (unspecified)' : selectedReason;
 try {
 await cancelOrder(cancellingOrder.id || cancellingOrder.orderNo, finalReason, 'Cashier');
 toast.success(`Bill Cancelled Successfully`, { icon: '❌' });
 toast.success('Kitchen notified & stock returned!');
 setCancellingOrder(null);
 setSelectedOrder(null);
 } catch (err) {
 toast.error('Failed to cancel unpaid bill');
 }
 };

 const handleRefundBill = (bill) => {
 if (refundedBillIds.includes(bill.orderNo)) {
 toast.error('This transaction has already been refunded.');
 return;
 }
 const nextRefunded = [...refundedBillIds, bill.orderNo];
 setRefundedBillIds(nextRefunded);
 
 toast.success('Refund Initiated Successfully', { icon: '💳' });
 toast.success(`$${bill.total.toFixed(2)} credited back to customer account`);
 setViewingPastInvoice(null);
 };

 // CSV Export — full enterprise-grade export
 const handleExportCSV = () => {
 const source = filteredBills.length > 0 ? filteredBills : bills;
 if (source.length === 0) {
 toast.error('No billing records found to export.');
 return;
 }
 setIsExporting(true);
 const BOM = '\uFEFF';
 const headers = [
 'Invoice ID','Order ID','Customer','Table','Order Type',
 'Items','Total Qty','Subtotal','Tax','Packaging','Discount',
 'Grand Total','Payment Method','Status','Date','Time'
 ].join(',');
 const rows = source.map(bill => {
 const isRefunded = refundedBillIds.includes(bill.orderNo);
 const tableOrParcel = bill.orderType === 'parcel' ? `Parcel ${bill.parcelToken || ''}` : `Table #${bill.table}`;
 const customer = bill.customerName || (bill.orderType === 'parcel' ? bill.customerName || 'Walk-in' : `Table #${bill.table}`);
 const itemsSummary = (bill.items || []).map(i => `${i.name}x${i.qty}`).join(' | ');
 const totalQty = (bill.items || []).reduce((s, i) => s + (i.qty || 0), 0);
 const ts = new Date(bill.timestamp);
 const date = ts.toLocaleDateString('en-IN');
 const time = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
 const status = isRefunded ? 'Refunded' : (bill.status || 'Settled');
 const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
 return [
 escape(bill.orderNo), escape(bill.orderNo), escape(customer),
 escape(tableOrParcel), escape(bill.orderType || 'dine-in'),
 escape(itemsSummary), escape(totalQty),
 escape((bill.subtotal || 0).toFixed(2)),
 escape((bill.tax || 0).toFixed(2)),
 escape((bill.packagingCharge || 0).toFixed(2)),
 escape((bill.discount || 0).toFixed(2)),
 escape((bill.total || 0).toFixed(2)),
 escape(bill.paymentMethod || 'cash'),
 escape(status), escape(date), escape(time)
 ].join(',');
 });
 const csvContent = BOM + [headers, ...rows].join('\n');
 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `AeroDine_Billing_${new Date().toISOString().slice(0,10)}.csv`;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 setTimeout(() => {
 setIsExporting(false);
 toast.success(`✅ CSV exported — ${source.length} transactions`, { duration: 3000 });
 }, 800);
 };

 // Filter settled bills by search, payment method, and date
 const filteredBills = bills.filter(bill => {
 const term = historySearch.toLowerCase();
 const matchesSearch =
 (bill.orderNo || '').toLowerCase().includes(term) ||
 String(bill.table || '').includes(term) ||
 (bill.customerName || '').toLowerCase().includes(term) ||
 (bill.parcelToken || '').toLowerCase().includes(term) ||
 (bill.items || []).some(i => (i.name || '').toLowerCase().includes(term));
 const matchesMethod = historyFilterMethod === 'All' ||
 (bill.paymentMethod || '').toLowerCase() === historyFilterMethod.toLowerCase();
 const matchesDate = !historyFilterDate ||
 new Date(bill.timestamp).toISOString().slice(0, 10) === historyFilterDate;
 return matchesSearch && matchesMethod && matchesDate;
 });

 return (
 <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-8 relative overflow-hidden text-[var(--color-text-main)] ">
 <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 pr-0 lg:pr-2">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6 overflow-x-auto scrollbar-none">
 <div className="flex border-b border-[var(--border-color)] pb-px gap-4 lg:gap-6 min-w-max">
 <button 
 onClick={() => setBillingTab('active')}
 className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all ${billingTab === 'active' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-slate-555'}`}
 >
 Active Checkouts ({readyOrders.length})
 </button>
 <button 
 onClick={() => setBillingTab('history')}
 className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all ${billingTab === 'history' ? 'border-[var(--color-secondary)] text-rose-500' : 'border-transparent text-slate-555'}`}
 >
 Settled Billing History ({bills.length})
 </button>
 </div>
 </div>

 {billingTab === 'active' ? (
 <>
 {/* Table Occupancy Status System */}
 <div className="glass p-6 border border-[var(--border-color)] ">
 <h2 className="text-base font-extrabold mb-4 flex items-center gap-2 text-gray-100 uppercase tracking-wider">
 <Sparkles size={18} className="text-[var(--color-primary)]" />
 Dining Hall Table Occupancy Grid
 </h2>
 <div className="flex sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
 {mockTables.map(t => {
 let statusColor = "bg-cyan-500/10 text-cyan-600 border border-cyan-500/25";
 if (t.status === 'occupied') statusColor = "bg-[var(--color-primary)]/10 text-coral-655 border border-[var(--color-primary)]/25 animate-pulse";
 if (t.status === 'ready') statusColor = "bg-[var(--color-primary)]/20 text-orange-655 border border-[var(--color-primary)]/50 shadow-glow-primary font-extrabold";
 
 const activeOrder = readyOrders.find(o => o.table === t.num);
 
 return (
 <button
 key={t.num}
 disabled={t.status !== 'ready'}
 onClick={() => activeOrder && handleSelectOrder(activeOrder)}
 className={`py-3 sm:py-4 px-4 sm:px-0 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-[10px] sm:text-xs font-extrabold shrink-0 snap-center min-w-[70px] sm:min-w-0 ${statusColor} ${t.status === 'ready' ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-75'}`}
 >
 <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">T #{t.num}</span>
 <span className="capitalize">{t.status === 'free' ? 'Available' : t.status}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Parcel Orders Ready Grid (if any) */}
 {readyOrders.some(o => o.orderType === 'parcel') && (
 <div className="glass p-6 border border-[var(--color-primary)]/20 mt-6 shadow-glow-secondary bg-[var(--color-primary)]/5">
 <h2 className="text-base font-extrabold mb-4 flex items-center gap-2 text-[var(--color-primary)] uppercase tracking-wider">
 <Package size={18} />
 Ready Parcels
 </h2>
 <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
 {readyOrders.filter(o => o.orderType === 'parcel').map(order => (
 <button
 key={order.id || order.orderNo}
 onClick={() => handleSelectOrder(order)}
 className={`py-4 px-6 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-extrabold cursor-pointer hover:scale-105 active:scale-95 shrink-0 bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/50 shadow-glow-secondary`}
 >
 <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Parcel</span>
 <span className="capitalize">{order.parcelToken}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* PENDING CANCELLATIONS REQUEST ALERT DECK */}
 {(() => {
 const pendingCancellations = orders.filter(o => o.status === 'cancel_requested');
 if (pendingCancellations.length === 0) return null;
 return (
 <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-[20px] p-5 mt-6 flex flex-col gap-4 animate-pulse">
 <span className="font-extrabold text-xs text-orange-550 uppercase tracking-widest flex items-center gap-2">
 <AlertTriangle size={16} />
 ⚠️ ACTION REQUIRED: {pendingCancellations.length} Pending Cancellation Requests
 </span>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {pendingCancellations.map(o => (
 <div key={o.orderNo} className="glass-card [#121212] border border-[var(--color-primary)]/25 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-md">
 <div className="flex justify-between items-start">
 <div>
 <span className="font-extrabold text-gray-100 text-xs">
 {o.orderType === 'parcel' ? `Parcel ${o.parcelToken}` : `Table #${o.table}`} ({o.orderNo})
 </span>
 <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-bold">Reason: "{o.cancelReason || 'Customer changed mind'}"</p>
 </div>
 <span className="text-[9px] uppercase tracking-wider font-extrabold bg-[var(--color-primary)] text-[var(--color-text-main)] px-2 py-0.5 rounded-full shrink-0">
 Cancel Req
 </span>
 </div>
 <div className="flex gap-2.5">
 <button
 onClick={(e) => {
 e.stopPropagation();
 approveOrderCancellation(o.orderNo || o.id, 'Cashier');
 toast.success(`Cancellation request for Table #${o.table} approved!`);
 }}
 className="flex-1 py-1.5 bg-red-500 text-[var(--color-text-main)] rounded-xl text-[10px] font-extrabold uppercase hover:bg-red-650 transition-all cursor-pointer"
 >
 Approve Cancel
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 rejectOrderCancellation(o.orderNo || o.id, 'Cashier');
 toast.success(`Cancellation request for Table #${o.table} rejected!`);
 }}
 className="flex-1 py-1.5 glass-card text-[var(--color-text-muted)] rounded-xl text-[10px] font-extrabold uppercase hover:bg-[var(--bg-glass)] transition-all border border-[var(--border-color)] cursor-pointer"
 >
 Reject Request
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 })()}

 <div className="flex-1 flex flex-col overflow-hidden mt-6">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h2 className="text-lg font-extrabold tracking-tight text-gray-100 uppercase">Active Bills Feed</h2>
 <p className="text-xs text-[var(--color-text-muted)] font-bold">Incoming kitchen-cleared tables ready for payment processing</p>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto pb-12 pr-1 space-y-4">
 <AnimatePresence>
 {readyOrders.length === 0 ? (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-3 py-16"
 >
 <Check className="stroke-[1.5] text-slate-350 " size={40} />
 <p className="text-sm font-semibold">No ready tables to bill</p>
 </motion.div>
 ) : (
 readyOrders.map(order => (
 <motion.div
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 key={order.id || order.orderNo}
 onClick={() => handleSelectOrder(order)}
 className={`glass p-5 flex items-center justify-between cursor-pointer border transition-all duration-300 hover:shadow-lg ${selectedOrder?.orderNo === order.orderNo ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ' : 'border-[var(--border-color)] '}`}
 >
 <div className="flex items-center gap-5">
 <div className={`w-14 h-14 font-extrabold rounded-2xl flex items-center justify-center text-lg ${order.orderType === 'parcel' ? 'bg-[var(--color-primary)]/10 text-purple-550 ' : 'bg-[var(--color-primary)]/10 text-orange-550 '}`}>
 {order.orderType === 'parcel' ? `P#${order.parcelToken}` : `T#${order.table}`}
 </div>
 <div>
 <h3 className="font-extrabold text-gray-100 text-base">{order.orderNo}</h3>
 <p className="text-xs text-[var(--color-text-muted)] mt-1 font-bold">{order.items.length} items • Ready for Billing</p>
 </div>
 </div>
 <div className="flex items-center gap-6">
 <span className="text-xl font-extrabold text-gray-100 ">${order.total.toFixed(2)}</span>
 <button className="btn-premium bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-text-main)] rounded-xl py-2 px-4 text-xs font-bold shadow-glow-primary">
 Generate Invoice
 </button>
 </div>
 </motion.div>
 ))
 )}
 </AnimatePresence>
 </div>
 </div>
 </>
 ) : (
 /* BILLING HISTORY LOG VIEW */
 <div className="flex-1 flex flex-col overflow-hidden gap-4 mt-2">
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="relative w-full sm:w-80">
 <Search className="absolute left-3 top-3.5 text-[var(--color-text-muted)]" size={16} />
 <input 
 type="text" 
 placeholder="Search invoice order ID or Table..."
 value={historySearch}
 onChange={e => setHistorySearch(e.target.value)}
 className="w-full glass-card border border-[var(--border-color)] rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[var(--color-primary)] font-semibold"
 />
 </div>

 <div className="flex flex-wrap gap-2 self-end sm:self-center items-center">
 {/* Date Filter */}
 <input
 type="date"
 value={historyFilterDate}
 onChange={e => setHistoryFilterDate(e.target.value)}
 className="glass-card border border-[var(--border-color)] rounded-full px-3 py-2 text-xs font-bold text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
 />
 {historyFilterDate && (
 <button onClick={() => setHistoryFilterDate('')} className="text-xs text-[var(--color-text-muted)] hover:text-red-500 font-bold px-1">✕</button>
 )}
 {/* Payment Method Filter */}
 {['All', 'Cash', 'Card', 'UPI'].map(method => (
 <button
 key={method}
 onClick={() => setHistoryFilterMethod(method)}
 className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${historyFilterMethod === method ? 'bg-[var(--color-primary)] text-[var(--color-text-main)] shadow-md' : 'glass-card border border-[var(--border-color)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]'}`}
 >
 {method}
 </button>
 ))}
 {/* Export Button */}
 <button
 onClick={handleExportCSV}
 disabled={isExporting}
 className={`flex items-center justify-center gap-2 font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-md ${
 isExporting
 ? 'bg-rose-400 text-[var(--color-text-main)] animate-pulse cursor-wait'
 : 'bg-[var(--bg-panel)] text-[var(--color-text-main)] hover:shadow-lg hover:scale-105 active:scale-95'
 }`}
 >
 <Download size={14} className={isExporting ? 'animate-bounce' : ''} />
 {isExporting ? 'Exporting...' : `Export CSV (${filteredBills.length})`}
 </button>
 </div>
 </div>

 {/* History Table */}
 <div className="glass overflow-hidden border border-[var(--border-color)] flex-1 overflow-y-auto">
 <table className="w-full text-left text-xs font-semibold text-[var(--color-text-muted)] ">
 <thead className="sticky top-0 z-10">
 <tr className="border-b border-[var(--border-color)] bg-[var(--bg-panel)]/90 backdrop-blur-sm">
 <th className="py-4 px-6 uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] text-[10px]">Order ID</th>
 <th className="py-4 px-6 uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] text-[10px]">Table / Parcel</th>
 <th className="py-4 px-6 uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] text-[10px]">Items</th>
 <th className="py-4 px-6 uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] text-[10px]">Grand Total</th>
 <th className="py-4 px-6 uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] text-[10px]">Status</th>
 <th className="py-4 px-6 uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] text-[10px]">Method</th>
 <th className="py-4 px-6 uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] text-[10px]">Date & Time</th>
 <th className="py-4 px-6 uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] text-[10px] text-right">Invoice</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 ">
 {filteredBills.length === 0 ? (
 <tr>
 <td colSpan="7" className="py-12 text-center text-[var(--color-text-muted)] font-medium">No settled accounts recorded.</td>
 </tr>
 ) : (
 filteredBills.map(bill => {
 const isRefunded = refundedBillIds.includes(bill.orderNo);
 const ts = new Date(bill.timestamp);
 const itemsSummary = (bill.items || []).slice(0, 2).map(i => `${i.name} ×${i.qty}`).join(', ');
 const moreCount = (bill.items || []).length - 2;
 return (
 <tr key={bill.orderNo} className="hover:bg-[var(--bg-panel)]/50/10 transition-colors">
 <td className="py-4 px-6 font-extrabold text-gray-50 ">{bill.orderNo}</td>
 <td className={`py-4 px-6 font-extrabold ${bill.orderType === 'parcel' ? 'text-[var(--color-primary)] ' : 'text-[var(--color-primary)] '}`}>
 {bill.orderType === 'parcel' ? `Parcel ${bill.parcelToken}` : `Table #${bill.table}`}
 </td>
 <td className="py-4 px-6 text-[var(--color-text-muted)] max-w-[180px]">
 <span className="truncate block text-[10px] font-semibold">{itemsSummary}{moreCount > 0 ? ` +${moreCount} more` : ''}</span>
 </td>
 <td className="py-4 px-6 font-extrabold text-gray-50 ">₹{(bill.total || 0).toFixed(2)}</td>
 <td className="py-4 px-6">
 <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${isRefunded ? 'bg-red-500/20 text-red-550' : 'bg-rose-400/20 text-green-600'}`}>
 {isRefunded ? 'Refunded' : 'Settled'}
 </span>
 </td>
 <td className="py-4 px-6 uppercase text-[10px] font-bold text-[var(--color-text-muted)]">{bill.paymentMethod}</td>
 <td className="py-4 px-6 font-semibold text-[var(--color-text-muted)] text-[10px]">
 <div>{ts.toLocaleDateString('en-IN')}</div>
 <div>{ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
 </td>
 <td className="py-4 px-6 text-right">
 <button
 onClick={() => setViewingPastInvoice(bill)}
 className="p-2 glass-card hover:bg-[var(--bg-glass)] hover:text-[var(--color-primary)] rounded-xl text-slate-650 flex items-center justify-center gap-1.5 ml-auto text-[10px] font-extrabold transition-colors"
 >
 <Eye size={12} />
 View
 </button>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>

 {/* POS invoice & QR Code System panel */}
 <div className={`glass flex flex-col p-4 lg:p-6 border border-[var(--border-color)] transition-all z-40 ${selectedOrder ? 'fixed inset-0 w-full h-[100dvh] lg:static lg:w-96 lg:h-full shrink-0 glass-card/95 /95 lg:bg-transparent lg: backdrop-blur-xl lg:backdrop-blur-md overflow-hidden' : 'hidden lg:flex lg:w-96 h-full shrink-0'}`}>
 <div className="flex justify-between items-center pb-4 border-b border-[var(--border-color)] shrink-0">
 <h2 className="font-extrabold text-lg text-gray-100 uppercase tracking-wider">POS Checkout</h2>
 {selectedOrder && (
 <button onClick={() => { setSelectedOrder(null); setShowQR(false); }} className="lg:hidden p-2 glass-card rounded-full text-[var(--color-text-muted)] hover:text-gray-100">
 <X size={20} />
 </button>
 )}
 </div>

 <div className="flex-1 overflow-y-auto py-6 space-y-6">
 {selectedOrder ? (
 <div className="space-y-6">
 
 {/* Thermal Invoice preview strip */}
 <div className="glass-card text-black p-6 border-t-8 border-gray-300 font-mono text-[11px] space-y-4 shadow-xl relative overflow-hidden rounded-b-xl border border-[var(--border-color)]">
 <div className="text-center space-y-1">
 <h3 className="font-bold text-sm tracking-widest text-[var(--bg-main)]">AERODINE CAFE</h3>
 <p>123 Luxury Avenue, Downtown</p>
 <p>TEL: (555) 0199-8822</p>
 <p className="pt-2 border-b border-dashed border-slate-450 pb-2">INVOICE PREVIEW</p>
 </div>

 <div className="flex justify-between font-bold">
 <span>ORDER: {selectedOrder.orderNo}</span>
 <span className="flex items-center gap-1">
 {selectedOrder.balanceParcelStatus ? <ShoppingBag size={12}/> : null}
 {selectedOrder.orderType === 'parcel' ? `PARCEL: ${selectedOrder.parcelToken}` : `TABLE: #${selectedOrder.table}`}
 </span>
 </div>
 {selectedOrder.orderType === 'parcel' && (
 <div className="text-[10px] text-[var(--color-text-muted)] space-y-0.5">
 <p>Name: {selectedOrder.customerName}</p>
 <p>Phone: {selectedOrder.phoneNumber}</p>
 <p>Pickup: {selectedOrder.pickupTime}</p>
 </div>
 )}

 <div className="border-b border-dashed border-slate-450 pb-3 space-y-2">
 {selectedOrder.items.map((item, idx) => {
 const liveItem = menuItems.find(mi => mi.id === item.id || mi.name === item.name);
 const isLow = liveItem ? liveItem.stock <= 3 : false;
 const stockDisplay = liveItem 
 ? ` (${liveItem.stock} avail)` 
 : '';
 return (
 <div key={idx} className="flex justify-between">
 <span>
 {item.name} x{item.qty}
 <span className={`text-[9px] font-bold ml-1 ${isLow ? 'text-red-500 font-mono animate-pulse' : 'text-[var(--color-text-muted)] font-mono'}`}>
 {stockDisplay}
 </span>
 </span>
 <span>${(item.price * item.qty).toFixed(2)}</span>
 </div>
 );
 })}
 </div>

 <div className="space-y-1.5 text-right font-medium">
 <div className="flex justify-between">
 <span>Subtotal</span>
 <span>${subtotal.toFixed(2)}</span>
 </div>
 {packagingCharge > 0 && (
 <div className="flex justify-between text-[var(--color-primary)] font-bold">
 <span>Packaging Charge</span>
 <span>${packagingCharge.toFixed(2)}</span>
 </div>
 )}
 <div className="flex justify-between">
 <span>GST Tax (5.0%)</span>
 <span>${tax.toFixed(2)}</span>
 </div>
 {discountAmount > 0 && (
 <div className="flex justify-between text-red-500 font-bold">
 <span>Promo Discount ({discount}%)</span>
 <span>-${discountAmount.toFixed(2)}</span>
 </div>
 )}
 {loyaltyDiscount > 0 && (
 <div className="flex justify-between text-orange-550 font-bold">
 <span>Loyalty Reward ({membershipTier})</span>
 <span>-${loyaltyDiscount.toFixed(2)}</span>
 </div>
 )}
 </div>

 <div className="border-t-2 border-dashed border-slate-450 pt-3 flex justify-between font-extrabold text-sm">
 <span>GRAND TOTAL</span>
 <span>${total.toFixed(2)}</span>
 </div>

 <div className="text-center pt-4 text-[9px] opacity-70">
 <p>Thank you for dining with us!</p>
 <p>Powered by AeroDine OS</p>
 </div>
 </div>

 {/* Balance Food Parcel Option */}
 {selectedOrder.orderType !== 'parcel' && (
 <div className={`p-4 rounded-2xl border transition-all ${selectedOrder.balanceParcelStatus ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30' : 'bg-[var(--bg-panel)] border-[var(--border-color)] '}`}>
 <label className="flex items-center justify-between cursor-pointer group relative overflow-hidden">
 <div className="flex items-center gap-3 relative z-10">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedOrder.balanceParcelStatus ? 'bg-[var(--color-primary)] text-[var(--color-text-main)] shadow-glow-secondary' : 'bg-[var(--bg-glass)] text-[var(--color-text-muted)]'}`}>
 {selectedOrder.balanceParcelStatus === 'packed' || selectedOrder.balanceParcelStatus === 'ready_for_pickup' ? <ShoppingBag size={20} /> : <Package size={20} />}
 </div>
 <div>
 <h4 className={`font-extrabold text-sm ${selectedOrder.balanceParcelStatus ? 'text-[var(--color-primary)] ' : 'text-[var(--color-text-muted)] '}`}>
 Pack Remaining Food
 </h4>
 {selectedOrder.balanceParcelStatus ? (
 <span className="text-[10px] uppercase font-bold text-[var(--color-primary)] tracking-wider">
 Status: {selectedOrder.balanceParcelStatus.replace(/_/g, ' ')} • $5.00 Charge
 </span>
 ) : (
 <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
 Convert remaining dine-in to parcel
 </span>
 )}
 </div>
 </div>
 <div className="relative z-10">
 <input 
 type="checkbox" 
 className="sr-only"
 checked={!!selectedOrder.balanceParcelStatus}
 onChange={(e) => {
 if (e.target.checked && !selectedOrder.balanceParcelStatus) {
 requestBalanceParcel(selectedOrder.id || selectedOrder.orderNo);
 toast.success('Packing request sent to kitchen! 📦');
 }
 }}
 disabled={!!selectedOrder.balanceParcelStatus}
 />
 <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 ${selectedOrder.balanceParcelStatus ? 'bg-[var(--color-primary)]' : 'bg-gray-300 '}`}>
 <div className={`w-4 h-4 glass-card rounded-full transition-transform transform ${selectedOrder.balanceParcelStatus ? 'translate-x-6' : 'translate-x-0'}`}></div>
 </div>
 </div>
 </label>
 </div>
 )}

 {/* Loyalty Reward Selector */}
 <div className="space-y-2 bg-[var(--bg-panel)] p-4 rounded-2xl border border-[var(--border-color)] ">
 <label className="text-[10px] font-bold text-slate-455 uppercase flex items-center gap-1.5">
 <Award size={14} className="text-[var(--color-primary)]" />
 Apply Loyalty Tier
 </label>
 <div className="grid grid-cols-3 gap-2">
 {['silver', 'gold', 'platinum'].map(tier => (
 <button
 key={tier}
 onClick={() => setMembershipTier(membershipTier === tier ? 'none' : tier)}
 className={`py-2 rounded-xl text-[10px] font-bold border transition-all uppercase ${membershipTier === tier ? 'bg-[var(--color-primary)]/20 text-orange-555 border-[var(--color-primary)]' : 'glass-card border-[var(--border-color)] text-[var(--color-text-muted)]'}`}
 >
 {tier}
 </button>
 ))}
 </div>
 </div>
 </div>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-3 py-16">
 <Printer className="stroke-[1.5] text-slate-350 " size={40} />
 <p className="text-sm font-bold text-center text-[var(--color-text-muted)]">Select an active ready table from the grid to checkout</p>
 </div>
 )}
 </div>

 {selectedOrder && (
 <div className="pt-4 border-t border-[var(--border-color)] space-y-4 shrink-0 pb-4 lg:pb-0">
 <div>
 <label className="text-xs font-bold text-slate-455 block mb-2">Payment Method</label>
 <div className="grid grid-cols-3 gap-3">
 <button 
 onClick={() => { setPaymentMethod('cash'); setShowQR(false); }}
 className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 justify-center ${paymentMethod === 'cash' && !showQR ? 'bg-[var(--color-primary)]/10 text-orange-555 border-[var(--color-primary)]' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--color-text-muted)]'}`}
 >
 <Banknote size={16} />
 Cash
 </button>
 <button 
 onClick={() => { setPaymentMethod('card'); setShowQR(false); }}
 className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 justify-center ${paymentMethod === 'card' && !showQR ? 'bg-[var(--color-primary)]/10 text-orange-555 border-[var(--color-primary)]' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--color-text-muted)]'}`}
 >
 <CreditCard size={16} />
 Card
 </button>
 <button 
 onClick={() => { setShowQR(true); setPaymentMethod('upi'); }}
 className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 justify-center ${showQR ? 'bg-[var(--color-primary)]/10 text-orange-555 border-[var(--color-primary)] shadow-glow-primary' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--color-text-muted)]'}`}
 >
 <QrCode size={16} />
 UPI Scan
 </button>
 </div>
 </div>

 {showQR && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-[var(--border-color)] shadow-lg"
 >
 <img 
 src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=aerodine@upi&am=${total.toFixed(2)}&tn=Table${selectedOrder.table}`} 
 alt="UPI Payment QR Code"
 className="w-36 h-36"
 />
 <span className="text-[10px] text-[var(--color-text-muted)] font-mono font-bold">Scan to Pay: ${total.toFixed(2)}</span>
 </motion.div>
 )}

 {/* Split Action Container for Settle vs Unpaid Cancellation */}
 <div className="flex gap-3">
 <button 
 onClick={handleTriggerCancel}
 className="flex-1 py-3.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-[var(--color-text-main)] text-red-500 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
 >
 <XCircle size={14} />
 Cancel Bill
 </button>
 <button 
 onClick={handleProcessPayment}
 className="flex-[2] btn-premium bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-text-main)] rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-glow-primary font-bold"
 >
 <Printer size={16} />
 Settle & Print
 </button>
 </div>
 </div>
 )}
 </div>

 {/* DYNAMIC HISTORIC INVOICE MODAL */}
 <AnimatePresence>
 {viewingPastInvoice && (
 <div className="fixed inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 20 }}
 className="glass max-w-sm w-full p-6 border border-[var(--border-color)] relative flex flex-col gap-6"
 >
 <button 
 onClick={() => setViewingPastInvoice(null)}
 className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
 >
 <X size={20} />
 </button>

 <h2 className="font-extrabold text-sm text-[var(--color-text-muted)] uppercase tracking-widest text-center">Settled Invoice Summary</h2>

 {/* Receipt Styling */}
 <div className="glass-card text-black p-6 font-mono text-[11px] space-y-4 shadow-inner rounded-2xl border border-[var(--border-color)]">
 <div className="text-center space-y-1">
 <h3 className="font-bold text-sm tracking-widest">AERODINE CAFE</h3>
 <p>123 Luxury Avenue, Downtown</p>
 <p className="pt-2 border-b border-dashed border-gray-300 pb-2">DUPLICATE RECEIPT</p>
 </div>

 <div className="flex justify-between font-bold">
 <span>ORDER: {viewingPastInvoice.orderNo}</span>
 <span>{viewingPastInvoice.orderType === 'parcel' ? `PARCEL: ${viewingPastInvoice.parcelToken}` : `TABLE: #${viewingPastInvoice.table}`}</span>
 </div>
 {viewingPastInvoice.orderType === 'parcel' && (
 <div className="text-[10px] text-[var(--color-text-muted)] space-y-0.5">
 <p>Name: {viewingPastInvoice.customerName}</p>
 <p>Phone: {viewingPastInvoice.phoneNumber}</p>
 <p>Pickup: {viewingPastInvoice.pickupTime}</p>
 </div>
 )}

 <div className="border-b border-dashed border-gray-300 pb-3 space-y-2">
 {viewingPastInvoice.items.map((item, idx) => (
 <div key={idx} className="flex justify-between">
 <span>{item.name} x{item.qty}</span>
 <span>${(item.price * item.qty).toFixed(2)}</span>
 </div>
 ))}
 </div>

 <div className="space-y-1.5 text-right font-medium">
 <div className="flex justify-between">
 <span>Subtotal</span>
 <span>${viewingPastInvoice.subtotal.toFixed(2)}</span>
 </div>
 {viewingPastInvoice.packagingCharge > 0 && (
 <div className="flex justify-between text-[var(--color-primary)] font-bold">
 <span>Packaging Charge</span>
 <span>${viewingPastInvoice.packagingCharge.toFixed(2)}</span>
 </div>
 )}
 <div className="flex justify-between">
 <span>GST Tax (5%)</span>
 <span>${viewingPastInvoice.tax.toFixed(2)}</span>
 </div>
 {viewingPastInvoice.discount > 0 && (
 <div className="flex justify-between text-red-500">
 <span>Applied Discounts</span>
 <span>-${viewingPastInvoice.discount.toFixed(2)}</span>
 </div>
 )}
 </div>

 <div className="border-t-2 border-dashed border-slate-350 pt-3 flex justify-between font-extrabold text-sm">
 <span>TOTAL PAID</span>
 <span>${viewingPastInvoice.total.toFixed(2)}</span>
 </div>

 <div className="text-center pt-2 text-[9px] opacity-70">
 <p>PAYMENT METHOD: {viewingPastInvoice.paymentMethod.toUpperCase()}</p>
 <p>{new Date(viewingPastInvoice.timestamp).toLocaleString()}</p>
 <p className="mt-2 font-extrabold text-orange-550 tracking-wider">
 {refundedBillIds.includes(viewingPastInvoice.orderNo) ? '⚠️ REFUNDED TRANSACTION' : 'STATUS: PAID'}
 </p>
 </div>
 </div>

 {/* Action Buttons: reprint or refund */}
 <div className="flex flex-col gap-2">
 {!refundedBillIds.includes(viewingPastInvoice.orderNo) && (
 <button
 onClick={() => handleRefundBill(viewingPastInvoice)}
 className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-[var(--color-text-main)] rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
 >
 <XCircle size={14} />
 Issue Order Refund
 </button>
 )}
 
 <div className="flex gap-3">
 <button
 onClick={() => {
 toast.success('Reprint command sent to thermal receipt stack.');
 setViewingPastInvoice(null);
 }}
 className="flex-1 btn-premium bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-text-main)] rounded-xl py-3 text-xs font-bold shadow-glow-primary"
 >
 Reprint Invoice
 </button>
 <button
 onClick={() => setViewingPastInvoice(null)}
 className="btn-premium bg-[var(--bg-panel)] text-[var(--color-text-main)] hover:bg-[var(--bg-panel)] rounded-xl py-3 text-xs font-bold px-4"
 >
 Close
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* CASHIER CANCELLATION CONFIRMATION MODAL */}
 <AnimatePresence>
 {cancellingOrder && (
 <div className="fixed inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 20 }}
 className="glass max-w-md w-full p-6 border border-[var(--border-color)] relative flex flex-col gap-5 text-gray-100 "
 >
 <div className="text-center space-y-2">
 <AlertTriangle className="text-red-500 mx-auto" size={40} />
 <h3 className="text-lg font-extrabold uppercase tracking-wide">Confirm Billing Cancellation</h3>
 <p className="text-xs text-slate-455 font-bold">Unpaid Checkout • Order {cancellingOrder.orderNo}</p>
 </div>

 <div className="space-y-3">
 <label className="text-xs font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider block">Reason for cancellation</label>
 <div className="grid grid-cols-2 gap-2">
 {cancellationPresetReasons.map(reason => (
 <button
 type="button"
 key={reason}
 onClick={() => setSelectedReason(reason)}
 className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all truncate text-left ${selectedReason === reason ? 'bg-[var(--color-primary)] text-[var(--color-text-main)] border-transparent' : 'bg-[var(--bg-panel)] text-[var(--color-text-muted)] border-[var(--border-color)] '}`}
 >
 {reason}
 </button>
 ))}
 </div>

 {selectedReason === 'Other' && (
 <textarea
 value={customReason}
 onChange={e => setCustomReason(e.target.value)}
 placeholder="Enter custom cancellation reason..."
 rows={2}
 className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
 />
 )}
 </div>

 <div className="flex gap-3 mt-2">
 <button
 onClick={handleConfirmCancel}
 className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-[var(--color-text-main)] rounded-xl text-xs font-extrabold shadow-lg transition-all"
 >
 Confirm Cancellation
 </button>
 <button
 onClick={() => setCancellingOrder(null)}
 className="px-5 py-3 border border-[var(--border-color)] text-[var(--color-text-muted)] rounded-xl text-xs font-bold hover:glass-card transition-all"
 >
 Cancel
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
