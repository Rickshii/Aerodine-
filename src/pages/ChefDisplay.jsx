import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Clock, Check, AlertTriangle, Play, CheckCircle, ArrowRight, ArrowLeft, RotateCcw, ShieldAlert, ChefHat, Timer, Flame, Coffee, ShoppingBag, Package, X, Eye, VolumeX, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ChefDisplay() {
  const { orders, menuItems, groceryItems, updateOrderStatus, updateMenuStock, cancellations, acknowledgeCancellationAlert, updateBalanceParcelStatus, kitchenAlerts, markAlertSeen, resolveAlert, removeAlert } = useStore();
  const [elapsedTimes, setElapsedTimes] = useState({});
  const [isMuted, setIsMuted] = useState(false);

  // Filter KDS tickets spanning all 4 active pipelines
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'packed' || o.status === 'ready_for_pickup');
  const servedOrders = orders.filter(o => o.status === 'served' || o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const balanceParcelRequests = orders.filter(o => o.balanceParcelStatus && o.balanceParcelStatus !== 'ready_for_pickup');

  // Aggregate active legacy cancellations into generic alerts format for rendering
  const activeCancelledAlerts = (cancellations || []).filter(c => !c.acknowledgedByChef).map(c => ({
    id: `cancel-${c.id}`,
    type: 'Cancelled Order Alert',
    message: `Order ${c.orderNo} cancelled. Reason: "${c.reason || 'Customer changed mind'}"`,
    status: 'active',
    seen: false,
    timestamp: c.timestamp,
    originalId: c.id,
    isLegacyCancel: true,
    meta: { orderType: c.orderType, parcelToken: c.parcelToken, table: c.table, cancelledBy: c.cancelledBy }
  }));

  const combinedAlerts = [...(kitchenAlerts || []), ...activeCancelledAlerts].filter(a => a.status === 'active' || a.status === 'resolved').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const activeAlertsCount = combinedAlerts.filter(a => a.status === 'active').length;
  const unreadAlertsCount = combinedAlerts.filter(a => a.status === 'active' && !a.seen).length;

  // Trigger alert chiming when new tickets hit KDS
  useEffect(() => {
    const totalOrders = pendingOrders.length + preparingOrders.length;
    if (totalOrders > 0) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.15;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }, [pendingOrders.length, preparingOrders.length]);

  // Dynamic cancel alert sound and toast trigger
  useEffect(() => {
    if (unreadAlertsCount > 0 && !isMuted) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav');
        audio.volume = 0.25;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }, [unreadAlertsCount, isMuted]);

  // Dynamic cooking clock tracker updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = {};
      orders.forEach(order => {
        const elapsedSeconds = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 1000);
        updated[order.orderNo] = elapsedSeconds;
      });
      setElapsedTimes(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  const handleStatusTransition = async (orderId, targetStatus) => {
    try {
      await updateOrderStatus(orderId, targetStatus);
      toast.success(`Ticket status updated to ${targetStatus.toUpperCase()}`, {
        icon: '👨‍🍳',
        style: {
          borderRadius: '16px',
          background: '#1C1C1E',
          color: '#F8F7F4',
          border: '1px solid #FF8A3D'
        }
      });
    } catch (err) {
      toast.error('Failed to transition ticket pipeline');
    }
  };

  const getStationLabel = (category) => {
    switch (category) {
      case 'Main Course': return '🔥 Grill & Roast Station';
      case 'Snacks': return '🥗 Pantry & Cold Station';
      case 'Fast Food': return '🍟 Quick Service Station';
      case 'Chats': return '🫕 Chats & Live Counter';
      case 'Street Food': return '🛒 Street Food Station';
      case 'Dessert': return '🎂 Pastry & Bakery';
      case 'Beverage': return '🍹 Liquids & Bar';
      case 'Combo': return '🍱 Combo Assembly';
      default: return '🍽️ General Prep';
    }
  };

  const handleStockToggle = async (itemId, currentStock) => {
    try {
      const nextStock = currentStock === 0 ? 15 : 0;
      await updateMenuStock(itemId, nextStock);
      toast.success(`Inventory stock toggled successfully!`);
    } catch (err) {
      toast.error('Failed to update stock');
    }
  };

  // KDS Analytics
  const activeTickets = pendingOrders.length + preparingOrders.length;
  
  // Kitchen Workload Monitor Stats
  const delayedTicketsCount = orders.filter(o => o.status !== 'served' && o.status !== 'delivered' && o.status !== 'ready' && o.status !== 'ready_for_pickup' && o.status !== 'cancelled' && (elapsedTimes[o.orderNo] || 0) > 240).length;
  const avgPrepTime = activeTickets > 0 ? 12 : 0;
  
  const loadPercentage = Math.min(100, Math.floor((activeTickets / 8) * 100));
  const loadLevel = activeTickets <= 2 ? 'Low Load' : activeTickets <= 5 ? 'Medium Load' : 'High Load';
  const loadColor = activeTickets <= 2 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : activeTickets <= 5 ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse';

  // Dynamic Pantry Alerts & Unavailable Ingredients warnings
  const pantryAlertList = (groceryItems || []).map(grocery => {
    const isCritical = grocery.qty <= 0.5;
    const isLow = grocery.qty <= grocery.stockThreshold;
    const status = isCritical ? 'Red' : isLow ? 'Orange' : 'Green';

    // Map which dishes are affected by this specific ingredient low stock
    let affectedDishes = [];
    const nameLower = grocery.name.toLowerCase();
    if (nameLower.includes('truffle') || nameLower.includes('mushroom')) affectedDishes.push('Truffle Mushroom Risotto');
    if (nameLower.includes('wagyu') || nameLower.includes('steak')) affectedDishes.push('Wagyu Beef Steak');
    if (nameLower.includes('avocado')) affectedDishes.push('Avocado Toast');
    if (nameLower.includes('lobster')) affectedDishes.push('Lobster Thermidor');
    if (nameLower.includes('saffron')) affectedDishes.push('Saffron Risotto');

    const restockSuggestion = isCritical 
      ? `🚨 CRITICAL: Reorder ${grocery.name} immediately from primary distributor!`
      : `⚠️ LOW STOCK: Purchase next batch of ${grocery.name} from local organic market`;

    return {
      name: grocery.name,
      qty: grocery.qty,
      unit: grocery.unit,
      status,
      restockSuggestion,
      affectedDishes
    };
  }).filter(item => item.status !== 'Green');

  const lowStockCount = pantryAlertList.length;

  // Auto-sort active tickets by oldest waiting time (longest elapsed cooking duration)
  const sortedPending = [...pendingOrders].sort((a, b) => (elapsedTimes[b.orderNo] || 0) - (elapsedTimes[a.orderNo] || 0));
  const sortedPreparing = [...preparingOrders].sort((a, b) => (elapsedTimes[b.orderNo] || 0) - (elapsedTimes[a.orderNo] || 0));

  return (
    <div className="h-full flex flex-col gap-6 text-[#F8F7F4] bg-[#111111] p-6 rounded-[32px] border border-orange-500/10 shadow-2xl relative overflow-y-auto">
      
      {/* Real-time Enterprise KDS Analytics Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping"></span>
            AeroDine Enterprise KDS v4.2
          </h1>
          <p className="text-xs text-slate-450 font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
            Michelin Kitchen Command Console • Real-Time Broadcast Enabled
            <button onClick={() => setIsMuted(!isMuted)} className="ml-2 hover:text-white transition-colors">
              {isMuted ? <VolumeX size={14} className="text-red-500"/> : <Volume2 size={14} className="text-emerald-500"/>}
            </button>
          </p>
        </div>

         {/* Live Analytics Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-auto">
          <div className="bg-[#1C1C1E] border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Flame className="text-orange-500 shrink-0" size={20} />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Tickets</span>
              <span className="text-lg font-extrabold text-white">{activeTickets} active</span>
            </div>
          </div>

          <div className={`border px-4 py-3 rounded-2xl flex items-center gap-3 transition-all ${loadColor}`}>
            <ChefHat className="shrink-0 animate-bounce-subtle" size={20} />
            <div>
              <span className="text-[10px] opacity-80 font-bold block uppercase tracking-wider">KDS Load</span>
              <span className="text-lg font-extrabold">{loadLevel} ({loadPercentage}%)</span>
            </div>
          </div>

          <div className="bg-[#1C1C1E] border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Timer className="text-coral-500 shrink-0" size={20} />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Delayed Tickets</span>
              <span className="text-lg font-extrabold text-coral-500">{delayedTicketsCount} tickets</span>
            </div>
          </div>

          <div className="bg-[#1C1C1E] border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle className="text-cyan-500 shrink-0" size={20} />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pass Served</span>
              <span className="text-lg font-extrabold text-white">{servedOrders.length} closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Pantry Alerts & Kitchen Workload Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kitchen workload progress circles */}
        <div className="bg-[#1C1C1E] border border-white/5 p-5 rounded-[24px] flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
              Kitchen workload gauge
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Real-time dynamic station load calibration</p>
          </div>

          <div className="flex items-center gap-6 py-2">
            {/* Visual Gauge Meter */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-white/5 fill-none" strokeWidth="6" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  className={`fill-none transition-all duration-500 ${activeTickets > 5 ? 'stroke-red-500' : activeTickets > 2 ? 'stroke-orange-500' : 'stroke-emerald-500'}`} 
                  strokeWidth="6" 
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - loadPercentage / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-extrabold text-white leading-none">{loadPercentage}%</span>
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Busy</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-extrabold text-white uppercase">{loadLevel} Status</div>
              <div className="text-[10px] text-slate-400 font-semibold leading-normal">
                {activeTickets > 5 
                  ? '⚠️ High ticket density! Stations at maximum expediting speed.' 
                  : activeTickets > 2
                  ? '🍲 Moderate load. Preparing multiple dishes simultaneously.'
                  : '🟢 Optimal throughput. All stations operating smoothly.'}
              </div>
              <div className="text-[10px] font-bold text-orange-500">Avg Cooking Time: {avgPrepTime} mins</div>
            </div>
          </div>
        </div>

        {/* Real-time Pantry alert ledger warning desk */}
        <div className="bg-[#1C1C1E] border border-white/5 p-5 rounded-[24px] lg:col-span-2 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="text-coral-500 animate-pulse" size={15} />
                Pantry Ingredients warning alerts ({lowStockCount})
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Auto-monitored grocery stock levels and catalog impact highlights</p>
            </div>
            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-[#FF8A3D]/25 text-[#FF8A3D] px-2.5 py-0.5 rounded-full">
              Pantry Alerts
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[85px] space-y-2.5 pr-1 scrollbar-thin">
            {pantryAlertList.length === 0 ? (
              <div className="text-[10px] font-bold text-emerald-500 py-4 text-center">🟢 All fresh raw grocery pantry stocks are completely adequate. No dish impacts detected!</div>
            ) : (
              pantryAlertList.map((alert, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-white/5 text-[10px] font-bold gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${alert.status === 'Red' ? 'bg-red-500 animate-ping' : 'bg-orange-500'}`}></span>
                      <span className="text-white font-extrabold">{alert.name}</span>
                      <span className="text-slate-500 font-mono">({alert.qty} {alert.unit} left)</span>
                    </div>
                    <div className="text-[8px] text-[#FF8A3D] uppercase tracking-wider mt-1 truncate">
                      💡 Affected Dishes: {alert.affectedDishes.length > 0 ? alert.affectedDishes.join(', ') : 'None'}
                    </div>
                  </div>
                  <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full font-extrabold text-right shrink-0 ${alert.status === 'Red' ? 'bg-red-500/20 text-red-500' : 'bg-orange-550/20 text-orange-500'}`}>
                    {alert.status === 'Red' ? 'Critical' : 'Low Stock'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Red Glowing KDS Emergency Alert Dashboard */}
      {combinedAlerts.length > 0 && (
        <div className="bg-slate-900/40 border border-white/10 rounded-[24px] p-5 flex flex-col gap-4 relative shadow-lg">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-xs text-red-500 uppercase tracking-widest flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full bg-red-500 shrink-0 ${unreadAlertsCount > 0 ? 'animate-ping' : ''}`}></span>
              🚨 EMERGENCY ALERTS: {activeAlertsCount} Active ({unreadAlertsCount} Unread)
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider border flex items-center gap-1.5 transition-all ${isMuted ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-red-500/20 text-red-400 border-red-500/30 shadow-glow-red'}`}>
                {isMuted ? <><VolumeX size={12}/> Silenced</> : <><Volume2 size={12}/> Mute Alerts</>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1">
            <AnimatePresence>
              {combinedAlerts.map(alert => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                  className={`glass p-4 rounded-2xl flex flex-col justify-between gap-4 shadow-lg transition-all group duration-500 border-2 ${alert.status === 'resolved' ? 'border-emerald-500/50 bg-emerald-500/5' : !alert.seen ? 'border-red-500/50 bg-red-500/10 animate-pulse-subtle' : 'border-orange-500/40 bg-orange-500/10'}`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`font-extrabold text-xs uppercase flex items-center gap-1.5 ${alert.status === 'resolved' ? 'text-emerald-400' : 'text-white'}`}>
                        {alert.type} {alert.status === 'resolved' && <CheckCircle size={12}/>}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${alert.status === 'resolved' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-red-300 bg-red-500/10 border-red-500/20'}`}>
                      {alert.message}
                    </p>

                    {alert.meta?.table && (
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mt-1">
                        <span>Target: {alert.meta.orderType === 'parcel' ? `Parcel ${alert.meta.parcelToken}` : `Table #${alert.meta.table}`}</span>
                      </div>
                    )}
                    {alert.status === 'resolved' && (
                      <div className="text-[9px] text-emerald-500 font-bold">
                        Resolved By: {alert.resolvedBy || 'Chef'}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => {
                          if (alert.isLegacyCancel) acknowledgeCancellationAlert(alert.originalId);
                          else resolveAlert(alert.id, 'Chef');
                          toast.success('Alert marked as resolved!', { icon: '✅' });
                        }}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-glow-emerald"
                      >
                        <Check size={11} /> Resolve
                      </button>
                    )}
                    {!alert.seen && alert.status !== 'resolved' && (
                      <button
                        onClick={() => {
                          if (alert.isLegacyCancel) acknowledgeCancellationAlert(alert.originalId);
                          else markAlertSeen(alert.id);
                        }}
                        className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                      >
                        <Eye size={11} /> Seen
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (alert.isLegacyCancel) acknowledgeCancellationAlert(alert.originalId);
                        else removeAlert(alert.id);
                        toast.success('Alert removed from board', { icon: '🗑️' });
                      }}
                      className="py-1.5 px-3 bg-red-950 hover:bg-red-900 text-red-400 hover:text-white rounded-xl text-[9px] font-bold border border-red-900 transition-all flex items-center gap-1"
                      title="Remove Notification"
                    >
                      <X size={11} /> Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Balance Food Parcel Requests */}
      {balanceParcelRequests.length > 0 && (
        <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-[24px] p-5 flex flex-col gap-4 relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.15)] animate-pulse-subtle">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-xs text-purple-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-500 animate-ping shrink-0"></span>
              📦 PACKING REQUESTS: {balanceParcelRequests.length} Active Balance Parcels
            </span>
            <span className="text-[9px] bg-purple-500/20 text-purple-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-purple-500/30">
              Kitchen Packing Duty
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {balanceParcelRequests.map(o => (
                <motion.div 
                  key={`balance-${o.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-900 border border-purple-500/30 hover:border-purple-500/60 p-4 rounded-2xl flex flex-col justify-between gap-4 shadow-lg transition-all group duration-300"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-white text-xs uppercase flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-purple-400"/>
                        {o.orderType === 'parcel' ? `Parcel ${o.parcelToken}` : `Table #${o.table}`}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">
                        {o.orderNo}
                      </span>
                    </div>

                    <p className="text-[11px] text-purple-300 font-bold bg-purple-500/5 px-2.5 py-1.5 rounded-lg border border-purple-500/10">
                      Balance Food Packing Required
                    </p>

                    <div className="text-[9px] text-slate-400 font-semibold space-y-1 mt-2">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.name} x{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {o.balanceParcelStatus === 'pending' && (
                      <button
                        onClick={() => {
                          updateBalanceParcelStatus(o.id || o.orderNo, 'packing');
                        }}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-glow-purple"
                      >
                        Start Packing
                      </button>
                    )}
                    {o.balanceParcelStatus === 'packing' && (
                      <button
                        onClick={() => {
                          updateBalanceParcelStatus(o.id || o.orderNo, 'packed');
                        }}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-glow-purple"
                      >
                        Mark Packed
                      </button>
                    )}
                    {o.balanceParcelStatus === 'packed' && (
                      <button
                        onClick={() => {
                          updateBalanceParcelStatus(o.id || o.orderNo, 'ready_for_pickup');
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all"
                      >
                        Ready for Pickup
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 4-Column Draggable & Transition KDS Pipelines */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-h-[480px]">
        
        {/* COLUMN 1: PENDING / NEW */}
        <div className="flex flex-col gap-4 bg-slate-950/40 p-4 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-ping"></span>
              1. Pending Tickets ({sortedPending.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[550px] pr-1">
            <AnimatePresence>
              {sortedPending.map(order => (
                <KdsTicketCard 
                  key={order.orderNo || order.id}
                  order={order}
                  elapsedSeconds={elapsedTimes[order.orderNo] || 0}
                  onMoveForward={() => handleStatusTransition(order.id || order.orderNo, 'preparing')}
                  getStationLabel={getStationLabel}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 2: PREPARING / COOKING */}
        <div className="flex flex-col gap-4 bg-slate-950/40 p-4 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-orange-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              2. Cooking / Active ({sortedPreparing.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[550px] pr-1">
            <AnimatePresence>
              {sortedPreparing.map(order => (
                <KdsTicketCard 
                  key={order.orderNo || order.id}
                  order={order}
                  elapsedSeconds={elapsedTimes[order.orderNo] || 0}
                  onMoveForward={() => handleStatusTransition(order.id || order.orderNo, order.orderType === 'parcel' ? 'packed' : 'ready')}
                  onMoveBackward={() => handleStatusTransition(order.id || order.orderNo, 'pending')}
                  getStationLabel={getStationLabel}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 3: READY TO SERVE */}
        <div className="flex flex-col gap-4 bg-slate-950/40 p-4 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-gold-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 shadow-glow-gold animate-pulse"></span>
              3. Ready / At Pass ({readyOrders.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[550px] pr-1">
            <AnimatePresence>
              {readyOrders.map(order => (
                <KdsTicketCard 
                  key={order.orderNo || order.id}
                  order={order}
                  elapsedSeconds={elapsedTimes[order.orderNo] || 0}
                  onMoveForward={() => {
                    if (order.status === 'packed') handleStatusTransition(order.id || order.orderNo, 'ready_for_pickup');
                    else handleStatusTransition(order.id || order.orderNo, order.orderType === 'parcel' ? 'delivered' : 'served');
                  }}
                  onMoveBackward={() => handleStatusTransition(order.id || order.orderNo, 'preparing')}
                  getStationLabel={getStationLabel}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 4: SERVED / HISTORIC */}
        <div className="flex flex-col gap-4 bg-slate-950/40 p-4 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-cyan-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              4. Served / Closed ({servedOrders.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[550px] pr-1 opacity-60">
            <AnimatePresence>
              {servedOrders.map(order => (
                <KdsTicketCard 
                  key={order.orderNo || order.id}
                  order={order}
                  elapsedSeconds={elapsedTimes[order.orderNo] || 0}
                  onMoveBackward={() => handleStatusTransition(order.id || order.orderNo, order.orderType === 'parcel' ? 'ready_for_pickup' : 'ready')}
                  getStationLabel={getStationLabel}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Stock Quick Controller Panel */}
      <div className="glass bg-[#1C1C1E] p-6 border border-orange-500/15 mt-6 rounded-[24px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            Real-time Kitchen Inventory Control
          </h2>
          <span className="text-[10px] text-slate-450 font-mono">Instant synchronization enabled</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuItems.map(item => {
            const isOut = item.stock === 0;
            const isLow = item.stock <= 3;
            return (
              <div key={item.id} className={`bg-[#111111]/80 p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${isOut ? 'border-red-500/30 bg-red-500/5' : isLow ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/5'}`}>
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-extrabold text-xs text-white truncate max-w-[150px]" title={item.name}>{item.name}</span>
                    {isOut ? (
                      <span className="text-[8px] bg-red-550/25 text-red-500 px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">Out</span>
                    ) : isLow ? (
                      <span className="text-[8px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 animate-pulse">Low</span>
                    ) : null}
                  </div>
                  <div className="text-slate-400 text-[10px] font-bold mt-1.5 uppercase flex justify-between">
                    <span>Available:</span>
                    <span className={`font-extrabold font-mono ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-emerald-500'}`}>{item.stock} Servings</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateMenuStock(item.id, (item.stock || 0) + 5)}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-bold transition-all"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => updateMenuStock(item.id, (item.stock || 0) + 10)}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-bold transition-all"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => updateMenuStock(item.id, (item.stock || 0) + 20)}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-bold transition-all"
                    >
                      +20
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateMenuStock(item.id, 50)}
                      className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-450 border border-emerald-500/20 rounded-lg text-[9px] font-bold transition-all"
                    >
                      Restock Full (50)
                    </button>
                    <button
                      onClick={() => updateMenuStock(item.id, 0)}
                      className="py-1 px-2.5 bg-red-500/10 hover:bg-red-500/25 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-bold transition-all"
                    >
                      Set Out
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Sub-component: KdsTicketCard for ticket modularity & timed highlights
function KdsTicketCard({ order, elapsedSeconds, onMoveForward, onMoveBackward, getStationLabel }) {
  const isUrgent = order.urgent || order.total > 50;
  const isDelayed = elapsedSeconds > 240 && !['served', 'delivered', 'ready', 'ready_for_pickup', 'packed'].includes(order.status); // Older than 4 mins
  const isParcel = order.orderType === 'parcel';

  // Formatting elapsed times cleanly
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const displaySeconds = elapsedSeconds % 60;
  const formattedTime = `${elapsedMinutes}:${displaySeconds.toString().padStart(2, '0')}`;

  // Estimate Cooking Progress Bar
  const maxPrepTime = Math.max(...order.items.map(item => item.prepTime || 15), 10);
  const cookingProgress = ['ready', 'packed', 'ready_for_pickup', 'served', 'delivered'].includes(order.status)
    ? 100 
    : order.status === 'pending'
    ? 0
    : Math.min(95, Math.floor((elapsedMinutes / maxPrepTime) * 100));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`glass overflow-hidden flex flex-col border bg-[#1C1C1E]/95 shadow-xl relative transition-all duration-300 ${isDelayed ? 'border-coral-500 shadow-glow-orange border-2' : isUrgent ? 'border-gold-500 border border-t-8 border-t-gold-500' : isParcel ? 'border-purple-500/50 shadow-glow-purple border-l-4 border-l-purple-500' : 'border-slate-850'}`}
    >
      {/* Urgent / Delayed Glow Banner */}
      {isDelayed && (
        <div className="bg-coral-500 text-white font-extrabold text-[9px] px-3 py-1 uppercase text-center animate-pulse tracking-widest">
          ⚠️ DELAYED TICKET • EXPEDITE
        </div>
      )}
      
      {isUrgent && !isDelayed && (
        <div className="bg-gold-500 text-[#111111] font-extrabold text-[9px] px-3 py-0.5 uppercase text-center tracking-widest">
          ★ VIP HIGH PRIORITY TICKET
        </div>
      )}

      {/* Ticket Header */}
      <div className="p-4 border-b border-white/5 flex justify-between items-start">
        <div>
          <h3 className={`font-extrabold text-sm flex items-center gap-1.5 ${isParcel ? 'text-purple-400' : 'text-white'}`}>
            {isParcel ? <><ShoppingBag size={14} /> Parcel {order.parcelToken}</> : `Table #${order.table}`}
          </h3>
          <span className="text-[9px] text-slate-400 block font-mono font-bold tracking-wider mt-0.5">{order.orderNo}</span>
          {isParcel && <div className="text-[10px] text-purple-300/70 mt-1 uppercase">Pickup: {order.pickupTime}</div>}
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${isDelayed ? 'bg-coral-500/20 text-coral-500 animate-pulse' : 'bg-slate-800 text-slate-300'}`}>
          <Clock size={10} />
          {formattedTime}
        </div>
      </div>

      {/* Item Pipeline & Station Categorization */}
      <div className="p-4 flex-1 space-y-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1 pb-2 border-b border-white/5 last:border-0">
            <div className="flex justify-between items-start">
              <div className="font-extrabold text-white text-xs flex items-center gap-2">
                <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono">{item.qty}x</span>
                {item.name}
              </div>
            </div>
            {/* Real-time kitchen prep station tagger */}
            <span className="text-[9px] font-bold text-[#C8A97E] uppercase block">{getStationLabel(item.category || 'Main Course')}</span>
          </div>
        ))}

        {/* Special instructions */}
        {order.notes && (
          <div className="bg-coral-500/5 border border-coral-500/15 rounded-xl p-3 text-[10px] text-coral-500 font-bold leading-normal">
            NOTE: "{order.notes}"
          </div>
        )}

        {/* Preparation progress bars */}
        {!['served', 'delivered'].includes(order.status) && (
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Cooking progress</span>
              <span>{cookingProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${isDelayed ? 'bg-coral-500' : 'bg-orange-500'}`}
                style={{ width: `${cookingProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* KDS Columns quick transition flow buttons */}
      <div className="p-3 bg-slate-950/40 border-t border-white/5 flex gap-2 justify-between">
        {onMoveBackward ? (
          <button 
            onClick={onMoveBackward}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
            title="Move back"
          >
            <ArrowLeft size={12} />
          </button>
        ) : (
          <div className="w-6"></div>
        )}

        {onMoveForward ? (
          <button 
            onClick={onMoveForward}
            className={`flex-1 btn-premium ${isParcel ? 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-glow-purple' : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-glow-orange'} text-white rounded-xl py-2 flex items-center justify-center gap-1.5 text-[10px] font-bold`}
          >
            {order.status === 'pending' ? (
              <>
                <Flame size={12} />
                Accept Ticket
              </>
            ) : order.status === 'preparing' ? (
              <>
                {isParcel ? <Package size={12} /> : <Check size={12} />}
                {isParcel ? 'Mark Packed' : 'Ready to Serve'}
              </>
            ) : order.status === 'packed' ? (
              <>
                <ShoppingBag size={12} />
                Ready for Pickup
              </>
            ) : (
              <>
                <CheckCircle size={12} />
                {isParcel ? 'Delivered' : 'Served Pass'}
              </>
            )}
            <ArrowRight size={10} className="ml-1" />
          </button>
        ) : (
          <div className="text-[10px] text-cyan-500 font-extrabold uppercase flex items-center gap-1">
            <CheckCircle size={12} /> {isParcel ? 'Delivered' : 'Completed'}
          </div>
        )}
      </div>
    </motion.div>
  );
}
