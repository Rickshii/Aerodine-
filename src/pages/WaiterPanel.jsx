import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Star, Plus, Minus, ShoppingCart, Send, XCircle, AlertTriangle, RefreshCw, ShoppingBag, User, Phone, Clock, Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const filterTabs = [
 'All', 'Veg', 'Vegan', 'Non-Veg', 'Egg', 'Seafood', 'Beverage', 'Starter', 'Chats', 'Snacks', 'Combo', 'Dessert', 'Chef Special', 'Restaurant Special', 'Today Special', 'Bestseller', 'Hot Selling', 'Recommended', 'New Arrival'
];
const cancellationPresetReasons = [
 'Customer changed mind',
 'Wrong item selected',
 'Duplicate order',
 'Long waiting time',
 'Item unavailable',
 'Other'
];

export default function WaiterPanel() {
 const { menuItems, createOrder, orders, requestOrderCancellation } = useStore();
 const [activeCategory, setActiveCategory] = useState('All');
 const [searchQuery, setSearchQuery] = useState('');
 const [cart, setCart] = useState([]);
 const [tableNo, setTableNo] = useState(1);
 const [notes, setNotes] = useState('');
 const [sending, setSending] = useState(false);
 const [showMobileCart, setShowMobileCart] = useState(false);

 // Parcel Fields
 const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'parcel'
 const [customerName, setCustomerName] = useState('');
 const [customerPhone, setCustomerPhone] = useState('');
 const [pickupTime, setPickupTime] = useState('');

 // Tab state between placing order and active order tracker
 const [panelTab, setPanelTab] = useState('new'); // 'new' | 'active'

 // Cancellation Modal State
 const [selectedDish, setSelectedDish] = useState(null);
 const [showDishModal, setShowDishModal] = useState(false);

 const openDishDetails = (dish) => {
 setSelectedDish(dish);
 setShowDishModal(true);
 };

 const closeDishDetails = () => {
 setSelectedDish(null);
 setShowDishModal(false);
 };
 const [selectedReason, setSelectedReason] = useState('Customer changed mind');
 const [customReason, setCustomReason] = useState('');
const [cancellingOrder, setCancellingOrder] = useState(null);


 // Combo Customization Modal States
 const [customizingCombo, setCustomizingCombo] = useState(null);
 const [selectedDrinkId, setSelectedDrinkId] = useState('');
 const [selectedSpice, setSelectedSpice] = useState('Medium');
 const [selectedSize, setSelectedSize] = useState('Regular'); // 'Regular' | 'Large' | 'Share Pack'
 const [selectedToppings, setSelectedToppings] = useState([]); // array of strings

 const getCustomizedComboPrice = (combo) => {
 let basePrice = combo.price;
 if (selectedSize === 'Large') basePrice += 3.50;
 if (selectedSize === 'Share Pack') basePrice += 7.00;
 
 selectedToppings.forEach(topping => {
 if (topping === 'Extra Truffle Oil') basePrice += 2.50;
 if (topping === 'Extra Toppings') basePrice += 1.50;
 if (topping === 'Cheese Upgrade') basePrice += 1.00;
 });
 
 return basePrice;
 };

 const confirmComboCustomization = () => {
 if (!customizingCombo) return;
 
 const finalPrice = getCustomizedComboPrice(customizingCombo);
 
 // Resolve final items by replacing drink ID
 const resolvedComboItems = customizingCombo.comboItems.map(itemId => {
 const item = menuItems.find(m => m.id === itemId);
 if (item && item.category === 'Beverage' && selectedDrinkId) {
 return selectedDrinkId;
 }
 return itemId;
 });

 const toppingsStr = selectedToppings.join('-');
 const customHash = `${selectedSize}_${selectedSpice}_${selectedDrinkId}_${toppingsStr}`;
 const cartItemId = `${customizingCombo.id}_${customHash}`;

 const swappedDrinkName = selectedDrinkId 
 ? menuItems.find(m => m.id === selectedDrinkId)?.name 
 : '';
 
 const customDetails = [];
 customDetails.push(selectedSize);
 customDetails.push(`${selectedSpice} Spice`);
 if (swappedDrinkName) customDetails.push(`with ${swappedDrinkName}`);
 if (selectedToppings.length > 0) customDetails.push(`+ ${selectedToppings.join(', ')}`);
 
 const displayName = `${customizingCombo.name} (${customDetails.join(', ')})`;

 // Check stock for all resolved combo items
 let minAvailableStock = customizingCombo.stock || 10;
 resolvedComboItems.forEach(itemId => {
 const item = menuItems.find(m => m.id === itemId);
 if (item && item.stock < minAvailableStock) {
 minAvailableStock = item.stock;
 }
 });

 setCart(prev => {
 const existing = prev.find(item => item.id === cartItemId);
 if (existing) {
 if (existing.qty >= minAvailableStock) {
 toast.error(`Cannot add more. Components in combo are limited by stock level (${minAvailableStock}).`);
 return prev;
 }
 return prev.map(item => item.id === cartItemId ? { ...item, qty: item.qty + 1 } : item);
 }
 return [...prev, {
 id: cartItemId,
 originalId: customizingCombo.id,
 name: displayName,
 price: finalPrice,
 qty: 1,
 isCombo: true,
 comboItems: resolvedComboItems,
 customizations: {
 drinkId: selectedDrinkId,
 spice: selectedSpice,
 size: selectedSize,
 toppings: selectedToppings
 }
 }];
 });

 toast.success(`Customized ${customizingCombo.name} added to cart!`);
 setCustomizingCombo(null);
 };

 const addToCart = (food) => {
 if (food.stock === 0) {
 toast.error(`${food.name} is currently out of stock!`);
 return;
 }

 if (food.isCombo) {
 const drinkItem = (food.comboItems || []).map(id => menuItems.find(m => m.id === id)).find(m => m && m.category === 'Beverage');
 setSelectedDrinkId(drinkItem ? drinkItem.id : '');
 setSelectedSpice('Medium');
 setSelectedSize('Regular');
 setSelectedToppings([]);
 setCustomizingCombo(food);
 return;
 }

 setCart(prev => {
 const existing = prev.find(item => item.id === food.id);
 if (existing) {
 if (existing.qty >= food.stock) {
 toast.error(`Cannot add more. Only ${food.stock} items in stock.`);
 return prev;
 }
 return prev.map(item => item.id === food.id ? { ...item, qty: item.qty + 1 } : item);
 }
 return [...prev, { ...food, qty: 1 }];
 });
 };

 const updateQty = (id, delta) => {
 setCart(prev => prev.map(item => {
 if (item.id === id) {
 const itemMenuObj = menuItems.find(m => m.id === id);
 const newQty = item.qty + delta;
 if (newQty > (itemMenuObj?.stock || 0)) {
 toast.error(`Only ${itemMenuObj?.stock} items in stock.`);
 return item;
 }
 return { ...item, qty: Math.max(0, newQty) };
 }
 return item;
 }).filter(item => item.qty > 0));
 };

 const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
 const tax = subtotal * 0.05;
 const total = subtotal + tax;
 const filteredFoods = menuItems.filter(f => {
 // 1. Search Query
 if (searchQuery.trim() !== '') {
 if (!f.name.toLowerCase().includes(searchQuery.toLowerCase())) {
 return false;
 }
 }

 // 2. Main Filter Tab (All-in-one row)
 if (activeCategory === 'All') return true;

 const dietaryMap = {
 'Veg': 'Veg',
 'Vegan': 'Vegan',
 'Non-Veg': 'Non Veg',
 'Egg': 'Egg',
 'Seafood': 'Seafood'
 };
 
 // Check Dietary
 if (dietaryMap[activeCategory]) {
 return f.dietary === dietaryMap[activeCategory];
 } 
 
 // Check Special Badges
 const specialBadgesList = ['Chef Special', 'Restaurant Special', 'Today Special', 'Bestseller', 'Hot Selling', 'Recommended', 'New Arrival'];
 if (specialBadgesList.includes(activeCategory)) {
 return (f.specialBadges || []).includes(activeCategory);
 }
 
 // Check Stock Status (if they were to be added, but not in our list currently, just in case)
 if (activeCategory === 'Available') return f.stock > 0;
 if (activeCategory === 'Out of Stock') return f.stock === 0;

 // Check Categories
 if (activeCategory === 'Starter') {
 return f.category === 'Starter' || f.category === 'Starters' || f.category === 'Snacks' || f.category === 'Main Course';
 }
 
 return f.category === activeCategory;
 });

 const handleSendOrder = async () => {
 if (cart.length === 0) return;
 setSending(true);
 try {
 const orderPayload = {
 orderType,
 items: cart,
 subtotal,
 tax,
 total,
 notes
 };
 if (orderType === 'dine-in') {
 orderPayload.table = parseInt(tableNo);
 } else {
 orderPayload.customerName = customerName;
 orderPayload.customerPhone = customerPhone;
 orderPayload.pickupTime = pickupTime;
 }

 await createOrder(orderPayload);
 toast.success(`Order successfully sent to Chef!`);
 setCart([]);
 setNotes('');
 if (orderType === 'parcel') {
 setCustomerName('');
 setCustomerPhone('');
 setPickupTime('');
 }
 } catch (_) {
 toast.error('Failed to submit order');
 } finally {
 setSending(false);
 }
 };

 const handleTriggerCancel = (order) => {
 setCancellingOrder(order);
 setSelectedReason('Customer changed mind');
 setCustomReason('');
 };

 const handleConfirmCancel = async () => {
 if (!cancellingOrder) return;
 const finalReason = selectedReason === 'Other' ? customReason || 'Other (unspecified)' : selectedReason;
 try {
 await requestOrderCancellation(cancellingOrder.id || cancellingOrder.orderNo, finalReason, 'Waiter');
 toast.success(`Cancellation requested for Order ${cancellingOrder.orderNo}`, { icon: '⚠️' });
 toast.success('Cashier/Manager notified for approval.');
 setCancellingOrder(null);
 } catch (_) {
 toast.error('Failed to request cancellation');
 }
 };

 // Filter active and past orders placed by table
 const activeWaiterOrders = orders.filter(o => o.status !== 'completed');

 return (
 <div className="h-full flex flex-col gap-6 relative overflow-hidden">
 
 {/* Tab Switcher Headers */}
 <div className="flex border-b border-[var(--border-color)] pb-px gap-6">
 <button 
 onClick={() => setPanelTab('new')}
 className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all ${panelTab === 'new' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-muted)]'}`}
 >
 New Table Order
 </button>
 <button 
 onClick={() => setPanelTab('active')}
 className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all ${panelTab === 'active' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-muted)]'}`}
 >
 Track Active Tables ({activeWaiterOrders.length})
 </button>
 </div>

 {panelTab === 'new' ? (
 <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
 <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 pr-2">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
 <div className="flex flex-col md:flex-row items-start md:items-center gap-4 glass-card border border-[var(--border-color)] rounded-2xl px-5 py-3 shadow-sm w-full md:max-w-md">
 <div className="flex gap-2">
 <button 
 onClick={() => setOrderType('dine-in')}
 className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${orderType === 'dine-in' ? 'bg-[var(--color-primary)] text-[var(--color-text-main)] shadow-md' : 'glass-card text-[var(--color-text-muted)] hover:bg-[var(--bg-glass)]'}`}
 >
 Dine-In
 </button>
 <button 
 onClick={() => setOrderType('parcel')}
 className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${orderType === 'parcel' ? 'bg-[var(--color-primary)] text-[var(--color-text-main)] shadow-md' : 'glass-card text-[var(--color-text-muted)] hover:bg-[var(--bg-glass)]'}`}
 >
 <ShoppingBag size={14} /> Parcel
 </button>
 </div>

 <div className="h-6 w-px bg-[var(--bg-glass)] hidden md:block"></div>

 {orderType === 'dine-in' ? (
 <div className="flex items-center gap-2">
 <span className="text-[var(--color-text-muted)] font-extrabold text-sm">Table:</span>
 <select 
 value={tableNo}
 onChange={e => setTableNo(e.target.value)}
 className="bg-transparent border-none font-extrabold text-[var(--color-primary)] focus:outline-none cursor-pointer text-sm"
 >
 {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
 <option key={n} value={n} className=" font-extrabold">#{n}</option>
 ))}
 </select>
 </div>
 ) : (
 <div className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-2">
 Takeaway Order
 </div>
 )}
 </div>

 {/* Search Bar placed alongside Dine-In / Parcel */}
 <div className="relative w-full md:w-80">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
 </div>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search dishes (e.g. Burger)..."
 className="w-full glass-card border border-[var(--border-color)] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-600/50 focus:border-[var(--color-primary)] transition-all shadow-sm"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto pb-12 pr-1 pt-2 relative">
 {/* Premium Sticky Category/Dietary Filter Row */}
 <div className="sticky top-0 z-40 bg-[var(--bg-panel)]/90 backdrop-blur-xl pb-4 pt-1 mb-2 -mx-2 px-2">
 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
 {filterTabs.map(c => (
 <button 
 key={c}
 onClick={() => setActiveCategory(c)}
 className={`snap-start relative px-6 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition-all duration-300 transform whitespace-nowrap overflow-hidden group flex-shrink-0 ${
 activeCategory === c 
 ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-text-main)] shadow-glow-primary scale-[1.02]' 
 : 'glass-card/60 backdrop-blur-md text-[var(--color-text-muted)] border border-[var(--border-color)] hover:border-[var(--color-secondary)] hover:bg-[var(--bg-glass)] hover:scale-[1.02]'
 }`}
 >
 {activeCategory === c && (
 <motion.div
 layoutId="activeTabUnderline"
 className="absolute bottom-0 left-0 right-0 h-1 glass-card/40 rounded-b-full"
 initial={false}
 transition={{ type: "spring", stiffness: 300, damping: 30 }}
 />
 )}
 <span className="relative z-10">{c}</span>
 </button>
 ))}
 </div>
 </div>

 <motion.div 
 layout 
 className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
 >
 <AnimatePresence mode="popLayout">
 {filteredFoods.map(food => {
 const isOutOfStock = food.stock === 0;
 const isLowStock = food.stock <= 3 && food.stock > 0;
 
 if (food.isCombo) {
 const resolvedItems = (food.comboItems || []).map(id => menuItems.find(m => m.id === id)).filter(Boolean);
 const originalSum = resolvedItems.reduce((s, item) => s + item.price, 0);
 const savings = originalSum - food.price;
 return (
 <motion.div
 layout
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 whileHover={!isOutOfStock ? { y: -8, scale: 1.01 } : {}}
 key={food.id}
 className={`glass overflow-hidden flex flex-col group relative transition-all duration-300 border-2 ${
 isOutOfStock 
 ? 'border-red-500/40 bg-red-500/5'
 : 'border-[var(--color-primary)]/40 hover:border-[var(--color-primary)] shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-2xl'
 }`}
 onClick={() => !isOutOfStock && openDishDetails(food)}
 >
 {/* Ribbon */}
 {food.comboStatus && (
 <div className="absolute top-0 right-0 z-10 overflow-hidden w-20 h-20 sm:w-28 sm:h-28 pointer-events-none">
 <div className="absolute top-2 -right-8 sm:top-4 bg-gradient-to-r from-rose-700 to-rose-600 text-[var(--color-text-main)] font-extrabold text-[7px] sm:text-[8px] uppercase tracking-widest py-0.5 sm:py-1 w-24 sm:w-32 text-center rotate-45 shadow-md">
 {food.comboStatus}
 </div>
 </div>
 )}

 <div className={`relative h-36 sm:h-56 w-full overflow-hidden ${isOutOfStock ? 'filter blur-[2px] opacity-40' : ''}`}>
 <img src={food.image} alt={food.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
 
 {/* Savings Badge */}
 {savings > 0 && (
 <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-text-main)] font-extrabold text-[8px] sm:text-[10px] px-2 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-1">
 🔥 Save ${savings.toFixed(2)}
 </div>
 )}

 <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-[var(--bg-main)]/80 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-bold text-[var(--color-text-main)] uppercase tracking-wider">
 🍱 Combo
 </div>
 </div>

 <div className={`p-3 sm:p-5 flex-1 flex flex-col justify-between ${isOutOfStock ? 'filter blur-[2px] opacity-40' : ''}`}>
 <div>
 <h3 className="font-extrabold text-xs sm:text-base text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors duration-300 line-clamp-1 sm:line-clamp-none">{food.name}</h3>
 
 {/* Bundle Preview */}
 <div className="mt-2 bg-[var(--bg-panel)] rounded-xl p-2 sm:p-3 border border-[var(--border-color)] hidden sm:block">
 <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">Included in bundle:</span>
 <div className="space-y-1">
 {resolvedItems.map(item => (
 <div key={item.id} className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] ">
 <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
 <span className="truncate flex-1">{item.name}</span>
 </div>
 ))}
 </div>
 </div>

 <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2.5 font-bold ${isLowStock ? 'text-[var(--color-primary)] animate-pulse' : 'text-slate-455'}`}>
 {isOutOfStock ? 'Out of Stock' : isLowStock ? `⚠️ Only ${food.stock} left!` : `${food.stock} available`}
 </p>
 </div>

 <div className="flex items-center justify-between mt-3 sm:mt-5">
 <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
 <span className="text-sm sm:text-xl font-extrabold text-[var(--color-primary)] ">${food.price.toFixed(2)}</span>
 {originalSum > food.price && (
 <span className="text-[9px] sm:text-xs font-bold text-[var(--color-text-muted)] line-through">${originalSum.toFixed(2)}</span>
 )}
 </div>
 {!isOutOfStock && (
 <button 
 className="p-1.5 sm:p-2.5 btn-premium rounded-full transition-all duration-300 shadow-md shadow-rose-600/20"
 onClick={(e) => { e.stopPropagation(); addToCart(food); }}
 >
 <Plus size={14} />
 </button>
 )}
 </div>
 </div>
 </motion.div>
 );
 }

 return (
 <motion.div
 layout
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 whileHover={!isOutOfStock ? { y: -6 } : {}}
 key={food.id} 
 className={`glass overflow-hidden flex flex-col group relative transition-all duration-300 ${
 isOutOfStock 
 ? 'border-red-500/40 bg-red-500/5' 
 : isLowStock 
 ? 'border-[var(--color-primary)]/50 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-2 ring-rose-600/30' 
 : 'hover:shadow-xl'
 }`}
 onClick={() => !isOutOfStock && openDishDetails(food)}
 >
 <div className={`relative h-36 sm:h-56 w-full overflow-hidden transition-all duration-300 ${isOutOfStock ? 'filter blur-[2px] opacity-40' : ''}`}>
 <img src={food.image} alt={food.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
 <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[var(--bg-main)]/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold text-[var(--color-text-main)] uppercase tracking-wider max-w-[80px] sm:max-w-none truncate">
 {food.category}
 </div>
 {isLowStock && (
 <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[var(--color-primary)] text-[var(--color-text-main)] font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md animate-pulse">
 ⚠️ Low Stock
 </div>
 )}
 </div>
 <div className={`p-3 sm:p-5 flex-1 flex flex-col justify-between transition-all duration-300 ${isOutOfStock ? 'filter blur-[2px] opacity-40' : ''}`}>
 <div>
 <h3 className="font-extrabold text-xs sm:text-base text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors duration-300 line-clamp-1 sm:line-clamp-none">{food.name}</h3>
 <div className="flex flex-wrap gap-1 mt-1 sm:mt-1.5">
 {food.dietary && food.dietary !== 'None' && (
 <span className={`px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-extrabold uppercase border flex items-center gap-0.5 shadow-sm ${
 food.dietary === 'Veg' ? 'bg-rose-500/10 text-rose-500 border-[var(--color-secondary)]/20' :
 food.dietary === 'Vegan' ? 'bg-rose-500/10 text-rose-500 border-[var(--color-secondary)]/20' :
 food.dietary === 'Non Veg' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
 food.dietary === 'Egg' ? 'bg-pink-400/10 text-amber-550 border-pink-400/20' :
 food.dietary === 'Seafood' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
 'bg-[var(--color-text-main)]/10 text-[var(--color-text-muted)] border-gray-500/20'
 }`}>
 {food.dietary === 'Veg' ? '🥬 Veg' : 
 food.dietary === 'Vegan' ? '🌱 Vegan' : 
 food.dietary === 'Non Veg' ? '🍗 Non-Veg' : 
 food.dietary === 'Egg' ? '🥚 Egg' : 
 food.dietary === 'Seafood' ? '🦐 Seafood' : food.dietary}
 </span>
 )}
 </div>
 <p className={`text-[10px] sm:text-xs mt-1.5 font-bold ${isLowStock ? 'text-[var(--color-primary)] animate-pulse' : 'text-slate-455'}`}>
 {isOutOfStock ? 'Out of Stock' : isLowStock ? `⚠️ Only ${food.stock} left!` : `${food.stock} servings`}
 </p>
 </div>
 <div className="flex items-center justify-between mt-3 sm:mt-5">
 <span className="text-sm sm:text-lg font-extrabold text-[var(--color-primary)]">${food.price.toFixed(2)}</span>
 {!isOutOfStock && (
 <button 
 className="p-1.5 sm:p-2.5 glass-card hover:bg-[var(--color-primary)] hover:text-[var(--color-text-main)] text-slate-650 rounded-full transition-all duration-300 "
 onClick={(e) => { e.stopPropagation(); addToCart(food); }}
 >
 <Plus size={14} />
 </button>
 )}
 </div>
 </div>

 {/* Out of Stock Overlay */}
 {isOutOfStock && (
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10">
 <div className="bg-red-500/90 text-[var(--color-text-main)] font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
 <span>❌ Out of Stock</span>
 </div>
 </div>
 )}
 </motion.div>
 );
 })}
 </AnimatePresence>
 </motion.div>
 </div>
 </div>

 {/* Floating Checkout Summary Panel */}
 <div className="glass w-96 flex flex-col p-6 h-full shrink-0 border border-[var(--border-color)] hidden lg:flex">
 <div className="flex justify-between items-center pb-4 border-b border-[var(--border-color)] ">
 <h2 className="font-extrabold text-lg flex items-center gap-2 text-[var(--color-text-main)] ">
 <ShoppingCart className={orderType === 'parcel' ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]'} size={20} />
 {orderType === 'parcel' ? 'Parcel Cart' : `Table ${tableNo} Cart`}
 </h2>
 </div>

 {orderType === 'parcel' && (
 <div className="py-3 border-b border-[var(--border-color)] space-y-3">
 <div className="flex items-center gap-2 bg-[var(--bg-panel)] rounded-xl px-3 py-2 border border-[var(--border-color)] ">
 <User size={14} className="text-[var(--color-text-muted)]" />
 <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs font-bold w-full" required />
 </div>
 <div className="flex items-center gap-2 bg-[var(--bg-panel)] rounded-xl px-3 py-2 border border-[var(--border-color)] ">
 <Phone size={14} className="text-[var(--color-text-muted)]" />
 <input type="tel" placeholder="Phone Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs font-bold w-full" required />
 </div>
 <div className="flex items-center gap-2 bg-[var(--bg-panel)] rounded-xl px-3 py-2 border border-[var(--border-color)] ">
 <Clock size={14} className="text-[var(--color-text-muted)]" />
 <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs font-bold w-full" required />
 </div>
 </div>
 )}

 <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
 <AnimatePresence>
 {cart.length === 0 ? (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-3"
 >
 <ShoppingCart className="stroke-[1.5] text-slate-350 " size={40} />
 <p className="text-sm font-semibold">Cart is currently empty</p>
 </motion.div>
 ) : (
 cart.map(item => (
 <motion.div 
 layout
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 key={item.id} 
 className="flex items-center justify-between gap-4 p-3 rounded-2xl glass-card/40 border border-[var(--border-color)]"
 >
 <div className="flex-1 min-w-0">
 <h4 className="font-extrabold text-xs truncate text-[var(--color-text-main)] ">{item.name}</h4>
 <span className="text-xs font-bold text-[var(--color-primary)] mt-1 block">${(item.price * item.qty).toFixed(2)}</span>
 </div>
 <div className="flex items-center gap-2.5 glass-card border border-slate-150 px-2.5 py-1.5 rounded-full">
 <button onClick={() => updateQty(item.id, -1)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"><Minus size={12} /></button>
 <span className="text-xs font-extrabold w-4 text-center">{item.qty}</span>
 <button onClick={() => updateQty(item.id, 1)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"><Plus size={12} /></button>
 </div>
 </motion.div>
 ))
 )}
 </AnimatePresence>
 </div>

 <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
 <div>
 <label className="text-xs font-extrabold text-[var(--color-text-muted)] block mb-1.5">Special Chef Instructions</label>
 <textarea 
 value={notes}
 onChange={e => setNotes(e.target.value)}
 placeholder="E.g., Medium rare, allergy warning..."
 rows={2}
 className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-rose-600/20"
 />
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-bold">
 <span>Subtotal</span>
 <span>${subtotal.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-bold">
 <span>GST (5%)</span>
 <span>${tax.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-base font-extrabold border-t border-dashed border-[var(--border-color)] pt-2.5">
 <span>Total Amount</span>
 <span className="text-[var(--color-primary)]">${total.toFixed(2)}</span>
 </div>
 </div>

 <button 
 onClick={handleSendOrder}
 disabled={cart.length === 0 || sending || (orderType === 'parcel' && (!customerName || !customerPhone))}
 className={`w-full btn-premium ${orderType === 'parcel' ? 'bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 shadow-glow-secondary' : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] shadow-glow-primary'} hover:opacity-90 text-[var(--color-text-main)] rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:pointer-events-none`}
 >
 {sending ? (
 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 ) : (
 <>
 <Send size={16} />
 Send Order to Kitchen
 </>
 )}
 </button>
 </div>
 </div>

 {/* Mobile Floating Cart Trigger */}
 {cart.length > 0 && (
 <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
 <button
 onClick={() => setShowMobileCart(true)}
 className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:from-orange-650 hover:to-amber-650 text-[var(--color-text-main)] font-bold py-3.5 px-5 rounded-2xl shadow-lg flex items-center justify-between transition-transform transform active:scale-95 shadow-rose-600/30"
 >
 <div className="flex items-center gap-2">
 <div className="glass-card/25 px-2.5 py-1 rounded-full text-xs font-extrabold">
 {cart.reduce((sum, item) => sum + item.qty, 0)}
 </div>
 <span className="text-[10px] uppercase tracking-wider">View Order Cart</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="text-sm font-extrabold">${total.toFixed(2)}</span>
 <ShoppingCart size={14} />
 </div>
 </button>
 </div>
 )}

 {/* Mobile Drawer */}
 <AnimatePresence>
 {showMobileCart && (
 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end">
 <motion.div
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
 className="w-full sm:w-[450px] bg-[var(--bg-panel)] h-full flex flex-col p-6 shadow-2xl relative"
 >
 <div className="flex justify-between items-center pb-4 border-b border-[var(--border-color)] ">
 <h2 className="font-extrabold text-base flex items-center gap-2 text-[var(--color-text-main)] ">
 <ShoppingCart className={orderType === 'parcel' ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]'} size={18} />
 {orderType === 'parcel' ? 'Parcel Cart' : `Table ${tableNo} Cart`}
 </h2>
 <button
 onClick={() => setShowMobileCart(false)}
 className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
 aria-label="Close cart drawer"
 >
 <XCircle size={22} />
 </button>
 </div>

 {orderType === 'parcel' && (
 <div className="py-3 border-b border-[var(--border-color)] space-y-3">
 <div className="flex items-center gap-2 bg-[var(--bg-panel)] rounded-xl px-3 py-2 border border-[var(--border-color)] ">
 <User size={14} className="text-[var(--color-text-muted)]" />
 <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs font-bold w-full" required />
 </div>
 <div className="flex items-center gap-2 bg-[var(--bg-panel)] rounded-xl px-3 py-2 border border-[var(--border-color)] ">
 <Phone size={14} className="text-[var(--color-text-muted)]" />
 <input type="tel" placeholder="Phone Number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs font-bold w-full" required />
 </div>
 <div className="flex items-center gap-2 bg-[var(--bg-panel)] rounded-xl px-3 py-2 border border-[var(--border-color)] ">
 <Clock size={14} className="text-[var(--color-text-muted)]" />
 <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs font-bold w-full" required />
 </div>
 </div>
 )}

 <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
 {cart.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-3">
 <ShoppingCart className="stroke-[1.5] text-slate-350 " size={40} />
 <p className="text-sm font-semibold">Cart is currently empty</p>
 </div>
 ) : (
 cart.map(item => (
 <div key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-2xl glass-card border border-[var(--border-color)] ">
 <div className="flex-1 min-w-0">
 <h4 className="font-extrabold text-xs truncate text-[var(--color-text-main)] ">{item.name}</h4>
 <span className="text-xs font-bold text-[var(--color-primary)] mt-1 block">${(item.price * item.qty).toFixed(2)}</span>
 </div>
 <div className="flex items-center gap-2.5 bg-[var(--bg-panel)] border border-slate-150 px-2.5 py-1.5 rounded-full">
 <button onClick={() => updateQty(item.id, -1)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"><Minus size={12} /></button>
 <span className="text-xs font-extrabold w-4 text-center">{item.qty}</span>
 <button onClick={() => updateQty(item.id, 1)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"><Plus size={12} /></button>
 </div>
 </div>
 ))
 )}
 </div>

 <div className="pt-4 border-t border-slate-205 space-y-4 mt-auto">
 <div>
 <label className="text-xs font-extrabold text-[var(--color-text-muted)] block mb-1.5">Special Chef Instructions</label>
 <textarea 
 value={notes}
 onChange={e => setNotes(e.target.value)}
 placeholder="E.g., Medium rare, allergy warning..."
 rows={2}
 className="w-full glass-card border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
 />
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-bold">
 <span>Subtotal</span>
 <span>${subtotal.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-bold">
 <span>GST (5%)</span>
 <span>${tax.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-base font-extrabold border-t border-dashed border-[var(--border-color)] pt-2.5">
 <span>Total Amount</span>
 <span className="text-[var(--color-primary)]">${total.toFixed(2)}</span>
 </div>
 </div>

 <button 
 onClick={() => {
 handleSendOrder();
 setShowMobileCart(false);
 }}
 disabled={cart.length === 0 || sending || (orderType === 'parcel' && (!customerName || !customerPhone))}
 className={`w-full btn-premium ${orderType === 'parcel' ? 'bg-gradient-to-r from-[var(--color-primary)] to-cyan-500 shadow-glow-secondary' : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] shadow-glow-primary'} hover:opacity-90 text-[var(--color-text-main)] rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:pointer-events-none`}
 >
 {sending ? (
 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 ) : (
 <>
 <Send size={16} />
 Send Order ({cart.reduce((sum, item) => sum + item.qty, 0)} Items)
 </>
 )}
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 ) : (
 /* ACTIVE & PENDING ORDER STATUS MONITOR */
 <div className="flex-1 overflow-y-auto pb-12">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {activeWaiterOrders.length === 0 ? (
 <div className="col-span-full py-16 flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-2">
 <RefreshCw className="animate-spin text-slate-350 " size={36} />
 <p className="font-extrabold text-sm">No active dining tables under preparation</p>
 </div>
 ) : (
 activeWaiterOrders.map(order => {
 const isCancelled = order.status === 'cancelled';
 const isRequested = order.status === 'cancel_requested';
 const isRejected = order.status === 'rejected';
 
 // Allow cancellation request before food is delivered/served
 const canCancel = order.status !== 'served' && order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'cancel_requested';
 
 const isParcel = order.orderType === 'parcel';
 
 return (
 <div key={order.id || order.orderNo} className={`glass p-6 border transition-all ${isCancelled ? 'border-red-500/20 bg-red-500/5 opacity-70' : isRequested ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5' : isParcel ? 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5' : 'border-[var(--border-color)]'}`}>
 <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-3 mb-4">
 <div>
 <h4 className={`font-extrabold text-sm ${isParcel ? 'text-[var(--color-primary)] flex items-center gap-1.5' : 'text-[var(--color-text-main)] '}`}>
 {isParcel ? <><ShoppingBag size={14}/> {order.parcelToken}</> : `Table #${order.table}`}
 </h4>
 <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase font-bold">{order.orderNo}</span>
 {isParcel && order.customerName && <div className="text-xs text-[var(--color-text-muted)] mt-1">{order.customerName} - {order.pickupTime}</div>}
 </div>
 
 {/* Status Badges */}
 <span className={`text-[9px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full ${
 order.status === 'pending' ? 'glass-card text-[var(--color-text-muted)] ' :
 order.status === 'preparing' ? 'bg-[var(--color-primary)]/10 text-orange-655 animate-pulse' :
 order.status === 'packed' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-glow-secondary' :
 (order.status === 'ready' || order.status === 'ready_for_pickup') ? 'bg-rose-400/20 text-gold-655 shadow-glow-secondary' :
 order.status === 'cancel_requested' ? 'bg-orange-550/20 text-[var(--color-primary)] font-extrabold animate-pulse' :
 order.status === 'cancelled' ? 'bg-red-500/20 text-red-550' :
 order.status === 'rejected' ? 'glass-card text-[var(--color-text-muted)] border border-[var(--border-color)]' :
 'bg-cyan-500/20 text-cyan-600'
 }`}>
 {order.status === 'pending' ? 'Pending Acceptance' : 
 order.status === 'cancel_requested' ? 'Cancel Requested' :
 order.status === 'ready' ? 'Ready at Pass' :
 order.status === 'ready_for_pickup' ? 'Ready for Pickup' :
 order.status}
 </span>
 </div>

 <div className="space-y-2 mb-6">
 {order.items.map((item, idx) => (
 <div key={idx} className="flex justify-between text-xs text-slate-655 font-bold">
 <span>{item.name} x{item.qty}</span>
 <span>${(item.price * item.qty).toFixed(2)}</span>
 </div>
 ))}
 </div>

 {isCancelled && (
 <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3 text-[10px] font-bold mb-4">
 ❌ CANCELLED: Approved by Manager<br/>
 REASON: "{order.cancelReason || 'Unknown'}"
 </div>
 )}

 {isRequested && (
 <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-xl p-3 text-[10px] font-bold mb-4 animate-pulse">
 ⚠️ CANCEL REQUESTED<br/>
 Waiting for Cashier/Manager approval...
 </div>
 )}

 {isRejected && (
 <div className="glass-card border border-[var(--border-color)] text-[var(--color-text-muted)] rounded-xl p-3 text-[10px] font-bold mb-4">
 🛡️ CANCEL REJECTED<br/>
 Ticket returned to active queue.
 </div>
 )}

 {canCancel && (
 <button 
 onClick={() => handleTriggerCancel(order)}
 className="w-full py-2.5 rounded-xl border border-red-550/20 bg-red-550/5 text-red-550 hover:bg-red-550 hover:text-[var(--color-text-main)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
 >
 <XCircle size={14} />
 Cancel Order Ticket
 </button>
 )}
 </div>
 );
 })
 )}
 </div>
 </div>
 )}

 {/* CANCELLATION MODAL FORM */}
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
 <h3 className="text-lg font-extrabold uppercase tracking-wide">Confirm Order Cancellation</h3>
 <p className="text-xs text-[var(--color-text-muted)] font-bold">
 {cancellingOrder.orderType === 'parcel' ? `Parcel ${cancellingOrder.parcelToken}` : `Table #${cancellingOrder.table}`} • Order {cancellingOrder.orderNo}
 </p>
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
 Cancel Order Now
 </button>
 <button
 onClick={() => setCancellingOrder(null)}
 className="px-5 py-3 border border-[var(--border-color)] text-[var(--color-text-muted)] rounded-xl text-xs font-bold hover:glass-card transition-all"
 >
 Go Back
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Combo Customization Modal */}
 {customizingCombo && (
 <div className="fixed inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
 <motion.div
 initial={{ scale: 0.9, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.9, y: 20 }}
 className="glass max-w-lg w-full p-6 border border-[var(--border-color)] rounded-2xl relative flex flex-col gap-4 text-gray-100 max-h-[90vh] overflow-y-auto scrollbar-thin"
 >
 <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)] ">
 <h3 className="font-extrabold text-lg text-[var(--color-text-main)] flex items-center gap-2">
 <Sparkles className="text-[var(--color-primary)]" size={20} />
 Customize {customizingCombo.name}
 </h3>
 <button 
 onClick={() => setCustomizingCombo(null)} 
 className="w-8 h-8 flex items-center justify-center glass-card hover:bg-[var(--bg-glass)] text-[var(--color-text-muted)] rounded-full transition-all"
 >
 <XCircle size={20} />
 </button>
 </div>

 <div className="flex gap-4 items-center">
 <img src={customizingCombo.image} alt={customizingCombo.name} className="w-24 h-24 object-cover rounded-xl border border-[var(--border-color)] " />
 <div className="text-left flex-1">
 <span className="text-[10px] bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Premium Bundle</span>
 <p className="text-xs text-[var(--color-text-muted)] font-medium mt-1">{customizingCombo.description}</p>
 </div>
 </div>

 {/* 1. Size Selection */}
 <div className="space-y-1.5 text-left">
 <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Select Size Upgrade</label>
 <div className="grid grid-cols-3 gap-2">
 {[
 { name: 'Regular', desc: 'No charge', extra: 0 },
 { name: 'Large', desc: '+$3.50', extra: 3.50 },
 { name: 'Share Pack', desc: '+$7.00', extra: 7.00 }
 ].map(sz => (
 <button
 key={sz.name}
 type="button"
 onClick={() => setSelectedSize(sz.name)}
 className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
 selectedSize === sz.name 
 ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/50 shadow-glow-secondary' 
 : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30'
 }`}
 >
 <div>{sz.name}</div>
 <div className="text-[9px] font-normal text-[var(--color-text-muted)] mt-0.5">{sz.desc}</div>
 </button>
 ))}
 </div>
 </div>

 {/* 2. Spice Level */}
 <div className="space-y-1.5 text-left">
 <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Spice Level</label>
 <div className="grid grid-cols-3 gap-2">
 {['Mild', 'Medium', 'Spicy'].map(sp => (
 <button
 key={sp}
 type="button"
 onClick={() => setSelectedSpice(sp)}
 className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
 selectedSpice === sp 
 ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/50 shadow-glow-secondary' 
 : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--color-text-muted)]'
 }`}
 >
 {sp}
 </button>
 ))}
 </div>
 </div>

 {/* 3. Drink Customization (Dynamic Swap) */}
 {menuItems.filter(m => m.category === 'Beverage' && !m.isCombo).length > 0 && (
 <div className="space-y-1.5 text-left">
 <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Select Drink Swaps</label>
 <select
 value={selectedDrinkId}
 onChange={e => setSelectedDrinkId(e.target.value)}
 className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[var(--color-primary)]"
 >
 <option value="">-- No Drink Swap (Keep Default) --</option>
 {menuItems.filter(m => m.category === 'Beverage' && !m.isCombo).map(drink => (
 <option key={drink.id} value={drink.id}>
 {drink.name} {drink.stock <= 3 ? `(Low Stock: ${drink.stock})` : ''} - ${drink.price.toFixed(2)}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* 4. Extra Premium Toppings */}
 <div className="space-y-1.5 text-left">
 <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Extra Premium Toppings</label>
 <div className="grid grid-cols-3 gap-2">
 {[
 { name: 'Extra Truffle Oil', price: '+$2.50' },
 { name: 'Extra Toppings', price: '+$1.50' },
 { name: 'Cheese Upgrade', price: '+$1.00' }
 ].map(top => {
 const isSelected = selectedToppings.includes(top.name);
 return (
 <button
 key={top.name}
 type="button"
 onClick={() => {
 if (isSelected) {
 setSelectedToppings(selectedToppings.filter(t => t !== top.name));
 } else {
 setSelectedToppings([...selectedToppings, top.name]);
 }
 }}
 className={`py-2 px-1 text-[10px] font-bold rounded-xl border text-center transition-all ${
 isSelected 
 ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/50 shadow-glow-secondary' 
 : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--color-text-muted)]'
 }`}
 >
 <div>{top.name}</div>
 <div className="text-[8px] font-normal text-[var(--color-text-muted)] mt-0.5">{top.price}</div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Pricing Summary */}
 <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 p-3.5 rounded-xl text-left text-xs font-bold text-[var(--color-primary)] space-y-1 mt-2">
 <div className="flex justify-between">
 <span>Base Bundle Price:</span>
 <span>${customizingCombo.price.toFixed(2)}</span>
 </div>
 {selectedSize !== 'Regular' && (
 <div className="flex justify-between">
 <span>Size Upgrade ({selectedSize}):</span>
 <span>+{selectedSize === 'Large' ? '$3.50' : '$7.00'}</span>
 </div>
 )}
 {selectedToppings.length > 0 && (
 <div className="flex justify-between">
 <span>Toppings Addons:</span>
 <span>
 +${selectedToppings.reduce((sum, topping) => {
 if (topping === 'Extra Truffle Oil') return sum + 2.50;
 if (topping === 'Extra Toppings') return sum + 1.50;
 if (topping === 'Cheese Upgrade') return sum + 1.00;
 return sum;
 }, 0).toFixed(2)}
 </span>
 </div>
 )}
 <div className="flex justify-between border-t border-[var(--color-primary)]/15 pt-1.5 text-sm font-extrabold uppercase mt-1">
 <span>Final Bundle Price:</span>
 <span>${getCustomizedComboPrice(customizingCombo).toFixed(2)}</span>
 </div>
 </div>

 {/* Footer Buttons */}
 <div className="flex gap-3 mt-2">
 <button
 onClick={confirmComboCustomization}
 className="flex-1 py-3 bg-gradient-to-r from-rose-700 to-rose-600 text-[var(--color-text-main)] rounded-xl text-xs font-extrabold shadow-lg hover:shadow-rose-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
 >
 <ShoppingCart size={16} />
 <span>Confirm & Add to Cart</span>
 </button>
 <button
 onClick={() => setCustomizingCombo(null)}
 className="px-5 py-3 border border-[var(--border-color)] text-[var(--color-text-muted)] rounded-xl text-xs font-bold hover:glass-card transition-all"
 >
 Cancel
 </button>
 </div>
 </motion.div>
 </div>
 )}

 {/* Dish Details Modal */}
 {showDishModal && selectedDish && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md flex items-center justify-center z-50"
 >
 <motion.div
 initial={{ scale: 0.9, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.9, y: 20 }}
 className="glass max-w-lg w-full p-6 border border-[var(--border-color)] rounded-xl overflow-auto max-h-[90vh]"
 >
 <div className="flex justify-between items-start mb-4">
 <h3 className="font-extrabold text-xl text-[var(--color-text-main)] ">{selectedDish.name}</h3>
 <button onClick={closeDishDetails} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
 <XCircle size={24} />
 </button>
 </div>
 <img src={selectedDish.image} alt={selectedDish.name} className="w-full h-48 object-cover rounded-lg mb-4" />
 <p className="text-sm text-[var(--color-text-muted)] mb-3"><strong>Description:</strong> {selectedDish.description}</p>
 <p className="text-sm text-[var(--color-text-muted)] mb-2"><strong>Ingredients:</strong> {selectedDish.ingredients?.join(', ')}</p>
 <p className="text-sm text-[var(--color-text-muted)] mb-2"><strong>Preparation Time:</strong> {selectedDish.prepTime || 'N/A'} mins</p>
 <p className="text-sm text-[var(--color-text-muted)] mb-2"><strong>Spice Level:</strong> {selectedDish.spiceLevel || 'Mild'}</p>
 <p className="text-sm text-[var(--color-text-muted)] mb-2"><strong>Category:</strong> {selectedDish.category}</p>
 <p className="text-sm text-[var(--color-text-muted)] mb-2"><strong>Food Type:</strong> {selectedDish.dietary || 'None'}</p>
 <div className="flex flex-wrap gap-2 my-2">
 {(selectedDish.specialBadges || []).map(badge => (
 <span key={badge} className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded text-xs font-bold">{badge}</span>
 ))}
 </div>
 <div className="flex items-center gap-2 mt-3">
 {selectedDish.rating && (<span className="flex items-center gap-1 text-yellow-400"><Star size={16} />{selectedDish.rating}</span>)}
 {selectedDish.calories && (<span className="text-sm text-[var(--color-text-muted)] ">{selectedDish.calories} kcal</span>)}
 </div>
 <div className="flex justify-between items-center mt-6">
 <span className="text-2xl font-extrabold text-[var(--color-primary)]">${selectedDish.price.toFixed(2)}</span>
 <button onClick={() => { addToCart(selectedDish); closeDishDetails(); }} className="px-4 py-2 btn-premium rounded-lg font-bold flex items-center gap-2">
 <ShoppingCart size={18} /> Add to Cart
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </div>
 );
}
