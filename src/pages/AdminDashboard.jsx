import React from 'react';
import { useStore } from '../context/StoreContext';
import { Building2, Landmark, TrendingUp, Sparkles, Activity, ShieldCheck, MapPin, BrainCircuit, BarChart3, PieChart, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
 const { bills, menuItems } = useStore();

 const mockBranchRevenue = 33770;
 const currentBranchRevenue = bills.reduce((sum, b) => sum + b.total, 0);
 const totalGlobalRevenue = currentBranchRevenue + mockBranchRevenue;

 const branches = [
 { name: 'Downtown Branch', revenue: mockBranchRevenue * 0.45 + currentBranchRevenue, status: 'Excellent', rating: '4.8', icon: MapPin, color: 'text-[var(--color-primary)]' },
 { name: 'Westside Mall', revenue: mockBranchRevenue * 0.25, status: 'Good', rating: '4.5', icon: MapPin, color: 'text-pink-400' },
 { name: 'Airport Terminal', revenue: mockBranchRevenue * 0.30, status: 'Excellent', rating: '4.9', icon: MapPin, color: 'text-cyan-500' }
 ];

 const handleExportCSV = () => {
 if (bills.length === 0) {
 toast('No invoices compiled today yet to export.', { icon: 'ℹ️' });
 return;
 }

 // Header
 let csvContent = "data:text/csv;charset=utf-8,Order ID,Table,Subtotal,Tax,Discount,Total,Payment Method,Timestamp\n";

 // Rows
 bills.forEach(bill => {
 csvContent += `"${bill.orderNo}","Table #${bill.table}","${bill.subtotal.toFixed(2)}","${bill.tax.toFixed(2)}","${bill.discount.toFixed(2)}","${bill.total.toFixed(2)}","${bill.paymentMethod}","${bill.timestamp}"\n`;
 });

 // Download Trigger
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement("a");
 link.setAttribute("href", encodedUri);
 link.setAttribute("download", `AeroDine_Daily_Financials_${new Date().toISOString().slice(0, 10)}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 toast.success('Master CSV database ledger exported successfully!');
 };

 // AI Smart Insights
 const topBranch = branches.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current);

 return (
 <div className="h-full flex flex-col gap-8 overflow-y-auto pb-12 pr-1">

 {/* Title Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-main)] uppercase">AeroDine Super Admin Console</h1>
 <p className="text-xs text-slate-450 font-bold">Multi-branch catalog parameters, global ledger audits and AI predictions</p>
 </div>

 <div className="flex gap-3">
 <button className="btn-premium border border-[var(--border-color)] glass-card text-gray-300 py-2.5 px-5 text-xs font-extrabold rounded-full transition-all">
 System Normal (32ms)
 </button>
 <button
 onClick={handleExportCSV}
 className="btn-premium bg-[#111111] text-[var(--color-text-main)] py-2.5 px-5 text-xs font-extrabold rounded-full shadow-md hover:scale-105 transition-all"
 >
 Export Global Ledgers
 </button>
 </div>
 </div>

 {/* AI Smart Insights Board */}
 <div className="glass p-6 border border-[var(--color-secondary)]/30 bg-gradient-to-r from-rose-400/5 to-[#FF8A3D]/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 rounded-3xl">
 <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/5 rounded-full blur-3xl"></div>
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-2xl bg-rose-400/10 text-rose-400 flex items-center justify-center animate-pulse">
 <BrainCircuit size={24} />
 </div>
 <div>
 <h3 className="font-extrabold text-sm text-rose-400 uppercase tracking-wider">Super Admin AI Smart Insights Deck</h3>
 <p className="text-xs text-[var(--color-text-muted)] max-w-3xl mt-1 leading-normal font-semibold">
 📈 Global revenues hit **${totalGlobalRevenue.toLocaleString()}** today, showing a robust **+14.8% growth trend** week-over-week.
 🏆 **{topBranch.name}** remains the top revenue contributor.
 💡 Peak customer flow forecasted between **19:00 - 21:00** tonight. Staff schedules at all branches have been optimized automatically.
 </p>
 </div>
 </div>
 <span className="text-[10px] bg-rose-400/25 text-rose-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
 AI Active
 </span>
 </div>

 {/* Multi-Branch Tableau Overview */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {branches.map((b, i) => (
 <div key={i} className="glass p-6 flex justify-between items-center border border-white/20 hover:shadow-lg transition-all duration-300 rounded-3xl">
 <div className="flex items-center gap-4">
 <div className={`w-12 h-12 rounded-full glass-card ${b.color} flex items-center justify-center`}>
 <b.icon size={22} />
 </div>
 <div>
 <h3 className="font-extrabold text-base text-[var(--color-text-main)] leading-none">{b.name}</h3>
 <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-2 block">Rating: {b.rating} ★</span>
 </div>
 </div>
 <div className="text-right">
 <span className="text-lg font-extrabold text-[var(--color-text-main)] block">${b.revenue.toLocaleString()}</span>
 <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">{b.status}</span>
 </div>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Global master income streams line waveform */}
 <div className="glass p-6 border border-white/20 lg:col-span-2 flex flex-col gap-6 rounded-3xl relative">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-base font-extrabold text-[var(--color-text-main)] uppercase tracking-wider">Global Master Income Streams</h2>
 <p className="text-[10px] text-[var(--color-text-muted)] font-bold">Consolidated revenue contribution trends across all regional hubs</p>
 </div>
 <div className="text-right">
 <span className="text-2xl font-extrabold text-[var(--color-text-main)] block">${totalGlobalRevenue.toLocaleString()}</span>
 <span className="text-[10px] text-[#FF8A3D] font-extrabold flex items-center gap-1"><TrendingUp size={12} /> +12.4% last month</span>
 </div>
 </div>

 {/* Luxury SVG Waveform Chart */}
 <div className="h-64 w-full relative bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl overflow-hidden flex items-end p-5">
 <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
 <path d="M0,80 Q15,70 30,55 T60,65 T85,35 T100,20 L100,100 L0,100 Z" fill="rgba(200, 169, 126, 0.05)" />
 <path d="M0,80 Q15,70 30,55 T60,65 T85,35 T100,20" fill="none" stroke="#C8A97E" strokeWidth="2.5" className="stroke-dash-animation" />
 </svg>
 <div className="absolute inset-x-0 bottom-2 px-6 flex justify-between text-[9px] font-bold text-[var(--color-text-muted)]">
 <span>Downtown</span>
 <span>Westside</span>
 <span>Airport</span>
 <span>Global Average</span>
 </div>
 </div>
 </div>

 {/* Global Status Log */}
 <div className="glass p-6 border border-white/20 flex flex-col gap-6 rounded-3xl">
 <div>
 <h2 className="text-base font-extrabold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-2">
 <Activity className="text-[var(--color-primary)] animate-pulse" size={16} />
 Downtown Inventory Telemetry
 </h2>
 <p className="text-[10px] text-[var(--color-text-muted)] font-bold">Real-time branch menu servings status</p>
 </div>

 {/* Live low stock warning list */}
 <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
 {menuItems && menuItems.filter(item => item.stock <= 3).length === 0 ? (
 <div className="text-[10px] text-rose-400 font-bold bg-rose-400/10 p-2.5 rounded-xl border border-[var(--color-secondary)]/20 text-center">
 🟢 Downtown stock levels fully operational.
 </div>
 ) : (
 menuItems && menuItems.filter(item => item.stock <= 3).map(item => (
 <div key={item.id} className="flex justify-between items-center bg-[var(--bg-panel)] p-2.5 rounded-xl border border-[var(--border-color)] text-[10px] font-bold">
 <span className="text-[var(--color-text-main)] truncate max-w-[135px]" title={item.name}>{item.name}</span>
 <span className={`px-2 py-0.5 rounded font-extrabold uppercase shrink-0 ${item.stock === 0 ? 'bg-red-500/20 text-red-550' : 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] animate-pulse'}`}>
 {item.stock === 0 ? 'OUT OF STOCK' : `${item.stock} left`}
 </span>
 </div>
 ))
 )}
 </div>

 <div className="border-t border-[var(--border-color)] pt-4">
 <h2 className="text-xs font-extrabold text-[var(--color-text-main)] uppercase tracking-wider mb-3">Super Admin logs</h2>
 <div className="overflow-y-auto space-y-4 max-h-[140px] scrollbar-thin">
 {[
 { text: 'Downtown branch stock synchronized live with Chef KDS', time: 'Just now' },
 { text: 'Master schema verified for Downtown and Airport branches', time: '10m ago' },
 { text: 'Dynamic stock estimators compiled and synchronized', time: '1h ago' },
 { text: 'Firebase database read/write telemetry normal: latency 32ms', time: '2h ago' }
 ].map((log, idx) => (
 <div key={idx} className="flex gap-3 pb-3 border-b border-[var(--border-color)] last:border-0">
 <ShieldCheck size={16} className="text-rose-400 mt-0.5 shrink-0" />
 <div>
 <p className="text-xs font-bold text-[var(--color-text-main)] leading-normal">{log.text}</p>
 <span className="text-[9px] text-[var(--color-text-muted)] mt-1 block font-bold">{log.time}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
