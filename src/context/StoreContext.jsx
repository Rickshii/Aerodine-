import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import toast from 'react-hot-toast';

const StoreContext = createContext();

const initialFoods = [
  { id: '1', name: 'Truffle Mushroom Risotto', price: 24.00, category: 'Main Course', image: 'https://images.unsplash.com/photo-1476124369491-e5addf5fff71?auto=format&fit=crop&w=500&q=80', stock: 10, dietary: 'Veg', specialBadges: ['Chef Special', 'Bestseller'], prepTime: 20, timeRange: 'Dinner', description: 'Creamy Arborio rice with premium white truffle oil and wild mushrooms.', ingredients: [{ name: 'Truffle Oil Extra', qty: 200, unit: 'ml', pantryLinkId: 'g1' }] },
  { id: '2', name: 'Wagyu Beef Steak', price: 65.00, category: 'Main Course', image: 'https://images.unsplash.com/photo-1544025162-8316773229b4?auto=format&fit=crop&w=500&q=80', stock: 5, dietary: 'Non Veg', specialBadges: ['Chef Special', 'Restaurant Special'], prepTime: 25, timeRange: 'Dinner', description: 'Grade A5 Japanese Wagyu steak served with charred asparagus.', ingredients: [{ name: 'Wagyu Sirloin Strips', qty: 300, unit: 'g', pantryLinkId: 'g2' }] },
  { id: '3', name: 'Avocado Toast', price: 14.00, category: 'Snacks', image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=500&q=80', stock: 15, dietary: 'Vegan', specialBadges: ['Recommended'], prepTime: 10, timeRange: 'Breakfast', description: 'Toasted sourdough with mashed avocado, cherry tomatoes, and microgreens.', ingredients: [{ name: 'Avocado Fresh Organic', qty: 1, unit: 'pcs', pantryLinkId: 'g3' }] },
  { id: '4', name: 'Matcha Tiramisu', price: 12.00, category: 'Dessert', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=500&q=80', stock: 2, dietary: 'Veg', specialBadges: ['New Arrival'], prepTime: 15, timeRange: 'Lunch', description: 'Elegant dessert dessert layer flavored with organic matcha.', ingredients: [{ name: 'Ceremonial Matcha Green', qty: 50, unit: 'g', pantryLinkId: 'g4' }] },
  { id: '5', name: 'Signature Mojito', price: 9.00, category: 'Beverage', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=500&q=80', stock: 20, dietary: 'Veg', specialBadges: ['Hot Selling'], prepTime: 5, timeRange: 'Lunch', description: 'Refreshing blend of lime, fresh mint, sugar, soda, and crushed ice.', ingredients: [{ name: 'Fresh Mint Herbs', qty: 1, unit: 'pcs', pantryLinkId: 'g5' }] },
  { id: '6', name: 'Crispy Calamari', price: 16.00, category: 'Snacks', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=80', stock: 8, dietary: 'Seafood', specialBadges: [], prepTime: 12, timeRange: 'Lunch', description: 'Tender squid ring strips lightly battered and seasoned with sea salt.', ingredients: [{ name: 'Calamari Cleaned', qty: 250, unit: 'g', pantryLinkId: 'g6' }] },
  {
    id: 'combo_1',
    name: 'AeroDine Signature Combo',
    price: 36.00,
    category: 'Combo',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
    stock: 5,
    dietary: 'Veg',
    specialBadges: ['Bestseller'],
    prepTime: 25,
    timeRange: 'Lunch',
    description: 'Truffle Mushroom Risotto + Signature Mojito + Dessert Combo.',
    isCombo: true,
    comboItems: ['1', '5', '4'],
    comboDiscount: 20,
    comboStatus: 'Bestseller'
  },
  {
    id: 'combo_2',
    name: 'Gourmet Steak Feast Combo',
    price: 68.00,
    category: 'Combo',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80',
    stock: 3,
    dietary: 'Non Veg',
    specialBadges: ['Today Special'],
    prepTime: 30,
    timeRange: 'Dinner',
    description: 'Wagyu Beef Steak + Signature Mojito combo.',
    isCombo: true,
    comboItems: ['2', '5'],
    comboDiscount: 10,
    comboStatus: 'Today Special'
  }
];

const initialGrocery = [
  { id: 'g1', name: 'Truffle Oil Extra', qty: 4.5, unit: 'liters', stockThreshold: 2.0, category: 'Oils' },
  { id: 'g2', name: 'Wagyu Sirloin Strips', qty: 12.0, unit: 'kg', stockThreshold: 5.0, category: 'Meat' },
  { id: 'g3', name: 'Avocado Fresh Organic', qty: 25.0, unit: 'units', stockThreshold: 10.0, category: 'Produce' },
  { id: 'g4', name: 'Ceremonial Matcha Green', qty: 1.5, unit: 'kg', stockThreshold: 0.5, category: 'Powders' },
  { id: 'g5', name: 'Fresh Mint Herbs', qty: 8.0, unit: 'bunches', stockThreshold: 3.0, category: 'Herbs' },
  { id: 'g6', name: 'Calamari Cleaned', qty: 15.0, unit: 'kg', stockThreshold: 4.0, category: 'Seafood' }
];

export function StoreProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState(initialFoods);
  const [groceryItems, setGroceryItems] = useState(initialGrocery);
  const [bills, setBills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [kitchenAlerts, setKitchenAlerts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([
    { log: 'System initialized', time: '10m ago', id: '1' }
  ]);

  // Supabase Real-time synchronization layer
  useEffect(() => {
    let activeChannel = null;

    const fetchInitialData = async () => {
      try {
        const [ordersRes, menuRes, inventoryRes, notificationsRes, cancellationsRes] = await Promise.all([
          supabase.from('orders').select('*').order('timestamp', { ascending: false }),
          supabase.from('menu_items').select('*'),
          supabase.from('inventory').select('*'),
          supabase.from('notifications').select('*').order('timestamp', { ascending: false }),
          supabase.from('cancellations').select('*').order('timestamp', { ascending: false })
        ]);

        if (ordersRes.data) setOrders(ordersRes.data);
        if (menuRes.data && menuRes.data.length > 0) setMenuItems(menuRes.data);
        if (inventoryRes.data && inventoryRes.data.length > 0) setGroceryItems(inventoryRes.data);
        if (notificationsRes.data) setKitchenAlerts(notificationsRes.data);
        if (cancellationsRes.data) setCancellations(cancellationsRes.data);
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      }
    };

    if (isSupabaseConfigured) {
      fetchInitialData();

      // Subscribe to all relevant tables
      activeChannel = supabase.channel('public:rms_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          setOrders(current => {
            if (payload.eventType === 'INSERT') return [payload.new, ...current];
            if (payload.eventType === 'UPDATE') return current.map(o => o.id === payload.new.id ? payload.new : o);
            if (payload.eventType === 'DELETE') return current.filter(o => o.id !== payload.old.id);
            return current;
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (payload) => {
          setMenuItems(current => {
            if (payload.eventType === 'INSERT') return [...current, payload.new];
            if (payload.eventType === 'UPDATE') return current.map(m => m.id === payload.new.id ? payload.new : m);
            if (payload.eventType === 'DELETE') return current.filter(m => m.id !== payload.old.id);
            return current;
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
          setGroceryItems(current => {
            if (payload.eventType === 'INSERT') return [...current, payload.new];
            if (payload.eventType === 'UPDATE') return current.map(i => i.id === payload.new.id ? payload.new : i);
            if (payload.eventType === 'DELETE') return current.filter(i => i.id !== payload.old.id);
            return current;
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
          setKitchenAlerts(current => {
            if (payload.eventType === 'INSERT') {
              toast.error(payload.new.message, { icon: '🚨' });
              return [payload.new, ...current];
            }
            if (payload.eventType === 'UPDATE') return current.map(n => n.id === payload.new.id ? payload.new : n);
            if (payload.eventType === 'DELETE') return current.filter(n => n.id !== payload.old.id);
            return current;
          });
        })
        .subscribe();
    } else {
      // Mock Real-time Updates using Window Custom Events
      const handleStorageOrEvent = () => {
        const storedOrders = localStorage.getItem('rms_orders');
        const storedMenu = localStorage.getItem('rms_menu');
        const storedGrocery = localStorage.getItem('rms_grocery');
        const storedBills = localStorage.getItem('rms_bills');
        const storedLogs = localStorage.getItem('rms_logs');
        const storedNotifications = localStorage.getItem('rms_notifications');
        const storedCancellations = localStorage.getItem('rms_cancellations');
        const storedAlerts = localStorage.getItem('rms_kitchen_alerts');

        if (storedOrders) setOrders(JSON.parse(storedOrders));
        if (storedMenu) setMenuItems(JSON.parse(storedMenu));
        if (storedGrocery) setGroceryItems(JSON.parse(storedGrocery));
        if (storedBills) setBills(JSON.parse(storedBills));
        if (storedLogs) setActivityLogs(JSON.parse(storedLogs));
        if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
        if (storedCancellations) setCancellations(JSON.parse(storedCancellations));
        if (storedAlerts) setKitchenAlerts(JSON.parse(storedAlerts));
      };

      window.addEventListener('rms_sync', handleStorageOrEvent);
      handleStorageOrEvent(); // Init first load
      return () => window.removeEventListener('rms_sync', handleStorageOrEvent);
    }

    return () => {
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, []);

  const triggerSync = (updatedOrders, updatedMenu, updatedBills, updatedLogs, updatedGrocery, updatedNotifications, updatedCancellations, updatedAlerts) => {
    // Fallback localStorage sync for when Supabase is not configured
    if (updatedOrders !== undefined && updatedOrders !== null) { localStorage.setItem('rms_orders', JSON.stringify(updatedOrders)); setOrders(updatedOrders); }
    if (updatedMenu !== undefined && updatedMenu !== null) { localStorage.setItem('rms_menu', JSON.stringify(updatedMenu)); setMenuItems(updatedMenu); }
    if (updatedGrocery !== undefined && updatedGrocery !== null) { localStorage.setItem('rms_grocery', JSON.stringify(updatedGrocery)); setGroceryItems(updatedGrocery); }
    if (updatedBills !== undefined && updatedBills !== null) { localStorage.setItem('rms_bills', JSON.stringify(updatedBills)); setBills(updatedBills); }
    if (updatedLogs !== undefined && updatedLogs !== null) { localStorage.setItem('rms_logs', JSON.stringify(updatedLogs)); setActivityLogs(updatedLogs); }
    if (updatedNotifications !== undefined && updatedNotifications !== null) { localStorage.setItem('rms_notifications', JSON.stringify(updatedNotifications)); setNotifications(updatedNotifications); }
    if (updatedCancellations !== undefined && updatedCancellations !== null) { localStorage.setItem('rms_cancellations', JSON.stringify(updatedCancellations)); setCancellations(updatedCancellations); }
    if (updatedAlerts !== undefined && updatedAlerts !== null) { localStorage.setItem('rms_kitchen_alerts', JSON.stringify(updatedAlerts)); setKitchenAlerts(updatedAlerts); }
    window.dispatchEvent(new Event('rms_sync'));
  };

  // Helper: deduct stock from menu items, returns { nextMenu, lowStockItems }
  const deductMenuStock = (orderItems) => {
    const lowStockItems = [];
    const nextMenu = menuItems.map(item => {
      let totalDeductedQty = 0;
      const directOrdered = orderItems.find(i => i.id === item.id);
      if (directOrdered) totalDeductedQty += directOrdered.qty;
      orderItems.forEach(orderedItem => {
        if (orderedItem.isCombo && orderedItem.comboItems) {
          const hasItem = orderedItem.comboItems.some(ci =>
            (typeof ci === 'string' && ci === item.id) || (typeof ci === 'object' && ci?.id === item.id)
          );
          if (hasItem) totalDeductedQty += orderedItem.qty;
        }
      });
      if (totalDeductedQty > 0) {
        const newStock = Math.max(0, item.stock - totalDeductedQty);
        if (item.stock > 3 && newStock <= 3) lowStockItems.push({ ...item, stock: newStock });
        return { ...item, stock: newStock };
      }
      return item;
    });
    return { nextMenu, lowStockItems };
  };

  // Helper: deduct pantry ingredients, returns nextGrocery
  const deductPantryIngredients = (orderItems) => {
    return groceryItems.map(grocery => {
      let totalDeduction = 0;
      orderItems.forEach(orderedItem => {
        const itemsToCheck = orderedItem.isCombo ? (orderedItem.comboItems || []) : [orderedItem];
        itemsToCheck.forEach(subItem => {
          const resolvedItem = typeof subItem === 'string' ? menuItems.find(mi => mi.id === subItem) : subItem;
          if (resolvedItem?.ingredients && Array.isArray(resolvedItem.ingredients)) {
            resolvedItem.ingredients.forEach(ing => {
              const isMatch = (ing.pantryLinkId && ing.pantryLinkId === grocery.id) ||
                (!ing.pantryLinkId && (grocery.name.toLowerCase() === ing.name.toLowerCase() ||
                  grocery.name.toLowerCase().includes(ing.name.toLowerCase()) ||
                  ing.name.toLowerCase().includes(grocery.name.toLowerCase())));
              if (isMatch) {
                const qtyMultiplier = orderedItem.qty;
                let factor = 1;
                const ingUnit = (ing.unit || '').toLowerCase();
                const grocUnit = (grocery.unit || '').toLowerCase();
                if (ingUnit === 'g' && grocUnit === 'kg') factor = 0.001;
                else if (ingUnit === 'ml' && (grocUnit === 'liters' || grocUnit === 'l' || grocUnit === 'liter')) factor = 0.001;
                else if (ingUnit === 'kg' && grocUnit === 'g') factor = 1000;
                else if ((ingUnit === 'liters' || ingUnit === 'l' || ingUnit === 'liter') && grocUnit === 'ml') factor = 1000;
                totalDeduction += (ing.qty * factor) * qtyMultiplier;
              }
            });
          }
        });
      });
      return totalDeduction > 0 ? { ...grocery, qty: Math.max(0, grocery.qty - totalDeduction) } : grocery;
    });
  };

  const createOrder = async (orderData) => {
    const newOrder = {
      order_no: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      table_no: orderData.table || null,
      order_type: orderData.orderType || 'dine-in',
      customer_name: orderData.customerName || null,
      status: 'pending',
      subtotal: orderData.subtotal || 0,
      tax: orderData.tax || 0,
      total: orderData.total || 0,
      items: orderData.items || [],
      timestamp: new Date().toISOString()
    };

    if (orderData.orderType === 'parcel') {
      newOrder.customer_name = orderData.customerName || 'Walk-in';
    }

    if (isSupabaseConfigured) {
      try {
        // Insert order into Supabase
        const { error } = await supabase.from('orders').insert([newOrder]);
        if (error) throw error;

        // Deduct menu stock
        const { nextMenu, lowStockItems } = deductMenuStock(orderData.items);
        for (const item of nextMenu) {
          const original = menuItems.find(m => m.id === item.id);
          if (original && original.stock !== item.stock) {
            await supabase.from('menu_items').update({ stock: item.stock }).eq('id', item.id);
          }
        }

        // Deduct pantry ingredients
        const nextGrocery = deductPantryIngredients(orderData.items);
        for (const g of nextGrocery) {
          const original = groceryItems.find(og => og.id === g.id);
          if (original && original.qty !== g.qty) {
            await supabase.from('inventory').update({ qty: g.qty }).eq('id', g.id);
          }
        }

        // Low stock alerts
        for (const item of lowStockItems) {
          await supabase.from('notifications').insert([{
            type: 'low_stock',
            message: `${item.name} stock is critically low (${item.stock} left)`,
            status: 'active'
          }]);
        }
      } catch (err) {
        console.error('Error creating order in Supabase:', err);
        toast.error('Failed to create order.');
      }
    } else {
      // Fallback localStorage mode
      newOrder.orderNo = newOrder.order_no;
      newOrder.table = newOrder.table_no;
      if (orderData.orderType === 'parcel') newOrder.parcelToken = `P${Math.floor(100 + Math.random() * 900)}`;
      const nextOrders = [newOrder, ...orders];
      const { nextMenu, lowStockItems } = deductMenuStock(orderData.items);
      const nextGrocery = deductPantryIngredients(orderData.items);
      const orderRefText = newOrder.order_type === 'parcel' ? `Parcel ${newOrder.parcelToken}` : `Table ${newOrder.table}`;
      const newLog = { id: Math.random().toString(), log: `New order ${newOrder.orderNo} sent for ${orderRefText}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];
      const newNotify = { id: Math.random().toString(), message: `🔔 ${orderRefText} - New order placed (${newOrder.orderNo})`, timestamp: new Date().toISOString(), read: false };
      let finalNotifications = [newNotify, ...notifications];
      let nextAlerts = [...kitchenAlerts];
      if (lowStockItems.length > 0) {
        lowStockItems.forEach(item => {
          finalNotifications.unshift({ id: Math.random().toString(), message: `⚠️ Low Stock Alert: ${item.name} is running low (${item.stock} left)`, timestamp: new Date().toISOString(), read: false });
          nextAlerts.unshift({ id: Math.random().toString(), type: 'low_stock', message: `${item.name} stock is critically low (${item.stock} left)`, status: 'active', timestamp: new Date().toISOString() });
        });
      }
      triggerSync(nextOrders, nextMenu, null, nextLogs, nextGrocery, finalNotifications, null, nextAlerts);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (isSupabaseConfigured) {
      try {
        // Find by order_no or id
        const target = orders.find(o => o.order_no === orderId || o.orderNo === orderId || o.id === orderId);
        if (target) {
          await supabase.from('orders').update({ status }).eq('id', target.id);
        }
      } catch (err) { console.error('Error updating order status:', err); }
    } else {
      const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { ...o, status } : o);
      const targetOrder = orders.find(o => o.orderNo === orderId || o.id === orderId);
      const newLog = { id: Math.random().toString(), log: `Order ${targetOrder?.orderNo || orderId} marked as ${status}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];
      let nextNotifications = [...notifications];
      if (status === 'ready' && targetOrder) {
        const orderRefText = targetOrder.orderType === 'parcel' ? `Parcel ${targetOrder.parcelToken}` : `Table #${targetOrder.table}`;
        nextNotifications = [{ id: Math.random().toString(), message: `📢 ${orderRefText} - Food items are READY!`, timestamp: new Date().toISOString(), read: false }, ...nextNotifications];
      } else if (status === 'ready_for_pickup' && targetOrder) {
        nextNotifications = [{ id: Math.random().toString(), message: `📦 Parcel ${targetOrder.parcelToken} is Ready for Pickup!`, timestamp: new Date().toISOString(), read: false }, ...nextNotifications];
        if (targetOrder.phoneNumber) {
          setTimeout(() => { toast.success(`📱 SMS Sent to ${targetOrder.customerName} (${targetOrder.phoneNumber}): Your order ${targetOrder.parcelToken} is ready for pickup!`, { icon: '📱', duration: 5000 }); }, 1000);
        }
      }
      triggerSync(nextOrders, null, null, nextLogs, null, nextNotifications);
    }
  };

  const requestBalanceParcel = async (orderId) => {
    if (isSupabaseConfigured) {
      const target = orders.find(o => o.order_no === orderId || o.orderNo === orderId || o.id === orderId);
      if (target) await supabase.from('orders').update({ status: 'balance_parcel_pending' }).eq('id', target.id);
    } else {
      const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { ...o, balanceParcelStatus: 'pending', packagingCharge: 5.0 } : o);
      const newLog = { id: Math.random().toString(), log: `Balance parcel requested for Order ${orderId}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];
      const newNotify = { id: Math.random().toString(), message: `📦 Kitchen Alert - Balance Parcel requested for Order ${orderId}!`, timestamp: new Date().toISOString(), read: false };
      const nextNotifications = [newNotify, ...notifications];
      triggerSync(nextOrders, null, null, nextLogs, null, nextNotifications);
    }
  };

  const updateBalanceParcelStatus = async (orderId, status) => {
    if (isSupabaseConfigured) {
      const target = orders.find(o => o.order_no === orderId || o.orderNo === orderId || o.id === orderId);
      if (target) await supabase.from('orders').update({ status: `balance_parcel_${status}` }).eq('id', target.id);
    } else {
      const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { ...o, balanceParcelStatus: status } : o);
      const targetOrder = orders.find(o => o.orderNo === orderId || o.id === orderId);
      const newLog = { id: Math.random().toString(), log: `Balance Parcel for ${orderId} marked as ${status}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];
      let nextNotifications = [...notifications];
      if (status === 'ready_for_pickup') {
        const orderRefText = targetOrder?.orderType === 'parcel' ? `Parcel ${targetOrder.parcelToken}` : `Table #${targetOrder?.table}`;
        nextNotifications = [{ id: Math.random().toString(), message: `🛍️ ${orderRefText} - Balance Parcel is Packed & Ready!`, timestamp: new Date().toISOString(), read: false }, ...nextNotifications];
      }
      triggerSync(nextOrders, null, null, nextLogs, null, nextNotifications);
    }
  };

  const processBill = async (billData) => {
    if (isSupabaseConfigured) {
      try {
        // Update order status to 'billed' and store payment info
        const target = orders.find(o => o.order_no === billData.orderNo || o.orderNo === billData.orderNo || o.id === billData.orderNo);
        if (target) {
          await supabase.from('orders').update({
            status: 'billed',
            payment_method: billData.paymentMethod,
            subtotal: billData.subtotal,
            tax: billData.tax,
            total: billData.total
          }).eq('id', target.id);
        }
      } catch (err) { console.error('Error processing bill:', err); }
    } else {
      const newBill = { ...billData, timestamp: new Date().toISOString() };
      const nextBills = [newBill, ...bills];
      const nextOrders = orders.filter(o => o.orderNo !== billData.orderNo);
      const newLog = { id: Math.random().toString(), log: `Bill generated for ${billData.orderNo} - Total: $${billData.total}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];
      triggerSync(nextOrders, null, nextBills, nextLogs);
    }
  };

  const updateMenuStock = async (itemId, stock) => {
    if (isSupabaseConfigured) {
      await supabase.from('menu_items').update({ stock }).eq('id', itemId);
    } else {
      const nextMenu = menuItems.map(item => item.id === itemId ? { ...item, stock, lastRestockedAt: new Date().toISOString() } : item);
      triggerSync(null, nextMenu, null, null);
    }
  };

  const addMenuItem = async (item) => {
    const newItem = {
      name: item.name,
      price: parseFloat(item.price) || 0,
      category: item.category || 'Main Course',
      stock: parseInt(item.stock) || 10,
      image: item.image || '',
      description: item.description || '',
      special_badges: item.specialBadges || [],
      prep_time: parseInt(item.prepTime) || 15,
      time_range: item.timeRange || 'Lunch',
      dietary: item.dietary || 'None',
      ingredients: item.ingredients || [],
      is_combo: item.isCombo || false,
      combo_items: item.comboItems || []
    };
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('menu_items').insert([newItem]);
      if (error) console.error('Error adding menu item:', error);
    } else {
      newItem.id = Math.random().toString();
      newItem.specialBadges = newItem.special_badges;
      newItem.prepTime = newItem.prep_time;
      newItem.timeRange = newItem.time_range;
      const nextMenu = [...menuItems, newItem];
      triggerSync(null, nextMenu, null, null);
    }
  };

  const editMenuItem = async (itemId, updatedProps) => {
    if (isSupabaseConfigured) {
      // Map camelCase props to snake_case for Supabase columns
      const mapped = {};
      if (updatedProps.name !== undefined) mapped.name = updatedProps.name;
      if (updatedProps.price !== undefined) mapped.price = updatedProps.price;
      if (updatedProps.category !== undefined) mapped.category = updatedProps.category;
      if (updatedProps.stock !== undefined) mapped.stock = updatedProps.stock;
      if (updatedProps.image !== undefined) mapped.image = updatedProps.image;
      if (updatedProps.description !== undefined) mapped.description = updatedProps.description;
      if (updatedProps.specialBadges !== undefined) mapped.special_badges = updatedProps.specialBadges;
      if (updatedProps.prepTime !== undefined) mapped.prep_time = updatedProps.prepTime;
      if (updatedProps.timeRange !== undefined) mapped.time_range = updatedProps.timeRange;
      if (updatedProps.dietary !== undefined) mapped.dietary = updatedProps.dietary;
      if (updatedProps.ingredients !== undefined) mapped.ingredients = updatedProps.ingredients;
      if (updatedProps.isCombo !== undefined) mapped.is_combo = updatedProps.isCombo;
      if (updatedProps.comboItems !== undefined) mapped.combo_items = updatedProps.comboItems;
      // Pass through any snake_case props directly
      Object.keys(updatedProps).forEach(k => { if (k.includes('_')) mapped[k] = updatedProps[k]; });
      await supabase.from('menu_items').update(mapped).eq('id', itemId);
    } else {
      const nextMenu = menuItems.map(item => item.id === itemId ? { ...item, ...updatedProps } : item);
      triggerSync(null, nextMenu, null, null);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (isSupabaseConfigured) {
      await supabase.from('menu_items').delete().eq('id', itemId);
    } else {
      const nextMenu = menuItems.filter(item => item.id !== itemId);
      triggerSync(null, nextMenu, null, null);
    }
  };

  // Grocery Ingredient CRUD & Restock Logs
  const addGroceryItem = async (grocery) => {
    const newItem = {
      ...grocery,
      qty: parseFloat(grocery.qty) || 0,
      stockThreshold: parseFloat(grocery.stockThreshold) || 1
    };
    if (isSupabaseConfigured) {
      await supabase.from('inventory').insert([newItem]);
    } else {
      newItem.id = Math.random().toString();
      const nextGrocery = [...groceryItems, newItem];
      triggerSync(null, null, null, null, nextGrocery);
    }
  };

  const updateGroceryStock = async (groceryId, qty) => {
    if (isSupabaseConfigured) {
      await supabase.from('inventory').update({ qty: parseFloat(qty) || 0 }).eq('id', groceryId);
    } else {
      const nextGrocery = groceryItems.map(item => item.id === groceryId ? { ...item, qty: parseFloat(qty) || 0 } : item);
      triggerSync(null, null, null, null, nextGrocery);
    }
  };

  const deleteGroceryItem = async (groceryId) => {
    if (isSupabaseConfigured) {
      await supabase.from('inventory').delete().eq('id', groceryId);
    } else {
      const nextGrocery = groceryItems.filter(item => item.id !== groceryId);
      triggerSync(null, null, null, null, nextGrocery);
    }
  };

  const requestOrderCancellation = async (orderId, reason, requestedByRole) => {
    const targetOrder = orders.find(o => o.orderNo === orderId || o.id === orderId);
    if (!targetOrder) return;

    const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { 
      ...o, 
      status: 'cancel_requested',
      cancelReason: reason,
      cancelledBy: requestedByRole,
      requestedAt: new Date().toISOString()
    } : o);

    const newLog = { 
      id: Math.random().toString(), 
      log: `⚠️ Table #${targetOrder.table} - Cancellation REQUESTED by ${requestedByRole} (${reason})`, 
      time: 'Just now' 
    };
    const nextLogs = [newLog, ...activityLogs];

    const newNotify = {
      id: Math.random().toString(),
      message: `🚨 Table #${targetOrder.table} - Cancellation Requested by ${requestedByRole} (${reason})`,
      timestamp: new Date().toISOString(),
      read: false
    };
    const nextNotifications = [newNotify, ...notifications];

    const newCancelAlert = {
      id: Math.random().toString(),
      orderNo: targetOrder.orderNo,
      table: targetOrder.table,
      cancelledBy: requestedByRole,
      reason: reason,
      timestamp: new Date().toISOString(),
      items: targetOrder.items,
      total: targetOrder.total,
      acknowledgedByChef: false
    };

    if (isSupabaseConfigured) {
      await supabase.from('orders').update({
        status: 'cancel_requested',
        cancel_reason: reason,
        cancelled_by: requestedByRole,
        requested_at: new Date().toISOString()
      }).eq('id', targetOrder.id);
      await supabase.from('notifications').insert([newNotify]);
      await supabase.from('cancellations').insert([newCancelAlert]);
    } else {
      const nextCancellations = [newCancelAlert, ...cancellations];
      setCancellations(nextCancellations);
      triggerSync(nextOrders, null, null, nextLogs, null, nextNotifications, nextCancellations);
    }
  };

  const approveOrderCancellation = async (orderId, approvedByRole = 'Manager') => {
    const targetOrder = orders.find(o => o.orderNo === orderId || o.id === orderId);
    if (!targetOrder) return;

    const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { 
      ...o, 
      status: 'cancelled',
      approvedBy: approvedByRole,
      cancelledAt: new Date().toISOString()
    } : o);

    const nextMenu = menuItems.map(item => {
      const orderedItem = targetOrder.items.find(i => i.id === item.id);
      if (orderedItem) {
        return { ...item, stock: item.stock + orderedItem.qty };
      }
      return item;
    });

    const nextGrocery = groceryItems.map(grocery => {
      let add = 0;
      targetOrder.items.forEach(orderedItem => {
        if (orderedItem.name.toLowerCase().includes('truffle') && grocery.name.toLowerCase().includes('truffle')) add += 0.2 * orderedItem.qty;
        if (orderedItem.name.toLowerCase().includes('wagyu') && grocery.name.toLowerCase().includes('wagyu')) add += 0.3 * orderedItem.qty;
        if (orderedItem.name.toLowerCase().includes('avocado') && grocery.name.toLowerCase().includes('avocado')) add += 1.0 * orderedItem.qty;
      });
      return add > 0 ? { ...grocery, qty: grocery.qty + add } : grocery;
    });

    const newLog = { 
      id: Math.random().toString(), 
      log: `❌ Order ${targetOrder.orderNo} Cancellation APPROVED by ${approvedByRole}`, 
      time: 'Just now' 
    };
    const nextLogs = [newLog, ...activityLogs];

    const newNotify = {
      id: Math.random().toString(),
      message: `❌ Table #${targetOrder.table} - Cancellation APPROVED by ${approvedByRole}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    const nextNotifications = [newNotify, ...notifications];



    if (isSupabaseConfigured) {
      await supabase.from('orders').update({
        status: 'cancelled',
        approved_by: approvedByRole,
        cancelled_at: new Date().toISOString()
      }).eq('id', targetOrder.id);
      await supabase.from('notifications').insert([newNotify]);
      for (const item of nextMenu) {
        await supabase.from('menu_items').update({ stock: item.stock }).eq('id', item.id);
      }
      for (const grocery of nextGrocery) {
        await supabase.from('inventory').update({ qty: grocery.qty }).eq('id', grocery.id);
      }
    } else {
      triggerSync(nextOrders, nextMenu, null, nextLogs, nextGrocery, nextNotifications);
    }
  };

  const rejectOrderCancellation = async (orderId, rejectedByRole = 'Manager') => {
    const targetOrder = orders.find(o => o.orderNo === orderId || o.id === orderId);
    if (!targetOrder) return;

    const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { 
      ...o, 
      status: 'rejected',
      rejectedBy: rejectedByRole,
      rejectedAt: new Date().toISOString()
    } : o);

    const newLog = { 
      id: Math.random().toString(), 
      log: `🛡️ Order ${targetOrder.orderNo} Cancellation REJECTED by ${rejectedByRole}`, 
      time: 'Just now' 
    };
    const nextLogs = [newLog, ...activityLogs];

    const newNotify = {
      id: Math.random().toString(),
      message: `🛡️ Table #${targetOrder.table} - Cancellation REJECTED by ${rejectedByRole}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    const nextNotifications = [newNotify, ...notifications];

    if (isSupabaseConfigured) {
      await supabase.from('orders').update({
        status: 'pending',
        rejected_by: rejectedByRole,
        rejected_at: new Date().toISOString()
      }).eq('id', targetOrder.id);
      await supabase.from('notifications').insert([newNotify]);
    } else {
      triggerSync(nextOrders, null, null, nextLogs, null, nextNotifications);
    }
  };

  const cancelOrder = async (orderId, reason, cancelledByRole) => {
    const targetOrder = orders.find(o => o.orderNo === orderId || o.id === orderId);
    if (!targetOrder) return;

    const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { 
      ...o, 
      status: 'cancelled',
      cancelReason: reason,
      cancelledBy: cancelledByRole,
      cancelledAt: new Date().toISOString()
    } : o);

    const nextMenu = menuItems.map(item => {
      const orderedItem = targetOrder.items.find(i => i.id === item.id);
      if (orderedItem) return { ...item, stock: item.stock + orderedItem.qty };
      return item;
    });

    const nextGrocery = groceryItems.map(grocery => {
      let add = 0;
      targetOrder.items.forEach(orderedItem => {
        if (orderedItem.name.toLowerCase().includes('truffle') && grocery.name.toLowerCase().includes('truffle')) add += 0.2 * orderedItem.qty;
        if (orderedItem.name.toLowerCase().includes('wagyu') && grocery.name.toLowerCase().includes('wagyu')) add += 0.3 * orderedItem.qty;
        if (orderedItem.name.toLowerCase().includes('avocado') && grocery.name.toLowerCase().includes('avocado')) add += 1.0 * orderedItem.qty;
      });
      return add > 0 ? { ...grocery, qty: grocery.qty + add } : grocery;
    });

    const newLog = { 
      id: Math.random().toString(), 
      log: `❌ Order ${targetOrder.orderNo} for Table ${targetOrder.table} CANCELLED by ${cancelledByRole} (${reason})`, 
      time: 'Just now' 
    };
    const nextLogs = [newLog, ...activityLogs];

    const newNotify = {
      id: Math.random().toString(),
      message: `❌ Table #${targetOrder.table} - Order ${targetOrder.orderNo} was CANCELLED by ${cancelledByRole} (${reason})`,
      timestamp: new Date().toISOString(),
      read: false
    };
    const nextNotifications = [newNotify, ...notifications];



    const newCancelAlert = {
      id: Math.random().toString(),
      orderNo: targetOrder.orderNo,
      table: targetOrder.table,
      cancelledBy: cancelledByRole,
      reason: reason,
      timestamp: new Date().toISOString(),
      items: targetOrder.items,
      total: targetOrder.total,
      acknowledgedByChef: false
    };

    if (isSupabaseConfigured) {
      await supabase.from('orders').update({
        status: 'cancelled',
        cancel_reason: reason,
        cancelled_by: cancelledByRole,
        cancelled_at: new Date().toISOString()
      }).eq('id', targetOrder.id);
      await supabase.from('notifications').insert([newNotify]);
      await supabase.from('cancellations').insert([newCancelAlert]);
      for (const item of nextMenu) {
        await supabase.from('menu_items').update({ stock: item.stock }).eq('id', item.id);
      }
      for (const grocery of nextGrocery) {
        await supabase.from('inventory').update({ qty: grocery.qty }).eq('id', grocery.id);
      }
    } else {
      const nextCancellations = [newCancelAlert, ...cancellations];
      setCancellations(nextCancellations);
      triggerSync(nextOrders, nextMenu, null, nextLogs, nextGrocery, nextNotifications, nextCancellations);
    }
  };

  const acknowledgeCancellationAlert = async (cancelId) => {
    if (isSupabaseConfigured) {
      await supabase.from('cancellations').update({ acknowledged_by_chef: true }).eq('id', cancelId);
    } else {
      const nextCancellations = cancellations.map(c => c.id === cancelId ? { ...c, acknowledgedByChef: true } : c);
      setCancellations(nextCancellations);
      triggerSync(null, null, null, null, null, null, nextCancellations);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    triggerSync(null, null, null, null, null, []);
  };

  const addKitchenAlert = async (alert) => {
    const newAlert = { ...alert, id: Math.random().toString(), timestamp: new Date().toISOString(), status: 'active', seen: false };
    if (isSupabaseConfigured) {
      await supabase.from('notifications').insert([newAlert]);
    } else {
      const nextAlerts = [newAlert, ...kitchenAlerts];
      setKitchenAlerts(nextAlerts);
      triggerSync(null, null, null, null, null, null, null, nextAlerts);
    }
  };

  const markAlertSeen = async (alertId) => {
    if (isSupabaseConfigured) {
      await supabase.from('notifications').update({ seen: true }).eq('id', alertId);
    } else {
      const nextAlerts = kitchenAlerts.map(a => a.id === alertId ? { ...a, seen: true } : a);
      setKitchenAlerts(nextAlerts);
      triggerSync(null, null, null, null, null, null, null, nextAlerts);
    }
  };

  const resolveAlert = async (alertId, resolvedBy) => {
    if (isSupabaseConfigured) {
      await supabase.from('notifications').update({ status: 'resolved', resolved_by: resolvedBy, resolved_at: new Date().toISOString() }).eq('id', alertId);
    } else {
      const nextAlerts = kitchenAlerts.map(a => a.id === alertId ? { ...a, status: 'resolved', resolvedBy, resolvedAt: new Date().toISOString() } : a);
      setKitchenAlerts(nextAlerts);
      triggerSync(null, null, null, null, null, null, null, nextAlerts);
    }
  };

  const removeAlert = async (alertId) => {
    if (isSupabaseConfigured) {
      await supabase.from('notifications').update({ status: 'removed' }).eq('id', alertId);
    } else {
      const nextAlerts = kitchenAlerts.map(a => a.id === alertId ? { ...a, status: 'removed' } : a);
      setKitchenAlerts(nextAlerts);
      triggerSync(null, null, null, null, null, null, null, nextAlerts);
    }
  };

  return (
    <StoreContext.Provider value={{
      orders,
      menuItems,
      groceryItems,
      bills: isSupabaseConfigured ? orders.filter(o => o.status === 'billed') : bills,
      notifications,
      cancellations,
      activityLogs,
      createOrder,
      updateOrderStatus,
      processBill,
      updateMenuStock,
      addMenuItem,
      editMenuItem,
      deleteMenuItem,
      addGroceryItem,
      updateGroceryStock,
      deleteGroceryItem,
      cancelOrder,
      requestOrderCancellation,
      approveOrderCancellation,
      rejectOrderCancellation,
      acknowledgeCancellationAlert,
      clearNotifications,
      requestBalanceParcel,
      updateBalanceParcelStatus,
      kitchenAlerts,
      addKitchenAlert,
      markAlertSeen,
      resolveAlert,
      removeAlert
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
