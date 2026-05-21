import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isFirebaseMock } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, deleteDoc } from 'firebase/firestore';
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

  // Real-time synchronization fallback layer
  useEffect(() => {
    if (!isFirebaseMock && db) {
      const ordersQuery = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const loadedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(loadedOrders);
      });

      const menuUnsubscribe = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
        if (!snapshot.empty) {
          setMenuItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          // auto seed initial items if menu collection is empty
          setMenuItems(initialFoods);
        }
      });

      const billsUnsubscribe = onSnapshot(collection(db, 'bills'), (snapshot) => {
        setBills(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const groceryUnsubscribe = onSnapshot(collection(db, 'groceryItems'), (snapshot) => {
        if (!snapshot.empty) {
          setGroceryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          setGroceryItems(initialGrocery);
        }
      });

      const notifyUnsubscribe = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')), (snapshot) => {
        setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const cancelUnsubscribe = onSnapshot(query(collection(db, 'cancellations'), orderBy('timestamp', 'desc')), (snapshot) => {
        setCancellations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const alertsUnsubscribe = onSnapshot(query(collection(db, 'kitchenAlerts'), orderBy('timestamp', 'desc')), (snapshot) => {
        setKitchenAlerts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => {
        unsubscribeOrders();
        menuUnsubscribe();
        billsUnsubscribe();
        groceryUnsubscribe();
        notifyUnsubscribe();
        cancelUnsubscribe();
        alertsUnsubscribe();
      };
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
  }, []);

  const triggerSync = (updatedOrders, updatedMenu, updatedBills, updatedLogs, updatedGrocery, updatedNotifications, updatedCancellations, updatedAlerts) => {
    if (updatedOrders !== undefined && updatedOrders !== null) localStorage.setItem('rms_orders', JSON.stringify(updatedOrders));
    if (updatedMenu !== undefined && updatedMenu !== null) localStorage.setItem('rms_menu', JSON.stringify(updatedMenu));
    if (updatedGrocery !== undefined && updatedGrocery !== null) localStorage.setItem('rms_grocery', JSON.stringify(updatedGrocery));
    if (updatedBills !== undefined && updatedBills !== null) localStorage.setItem('rms_bills', JSON.stringify(updatedBills));
    if (updatedLogs !== undefined && updatedLogs !== null) localStorage.setItem('rms_logs', JSON.stringify(updatedLogs));
    if (updatedNotifications !== undefined && updatedNotifications !== null) localStorage.setItem('rms_notifications', JSON.stringify(updatedNotifications));
    if (updatedCancellations !== undefined && updatedCancellations !== null) localStorage.setItem('rms_cancellations', JSON.stringify(updatedCancellations));
    if (updatedAlerts !== undefined && updatedAlerts !== null) localStorage.setItem('rms_kitchen_alerts', JSON.stringify(updatedAlerts));
    
    // Dispatch local event for same-tab cross-view updates
    window.dispatchEvent(new Event('rms_sync'));
  };

  const createOrder = async (orderData) => {
    const newOrder = {
      ...orderData,
      orderNo: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending', // Starts in KDS Pending column
      timestamp: new Date().toISOString(),
      urgent: Math.random() > 0.6
    };

    if (orderData.orderType === 'parcel') {
      newOrder.parcelToken = `P${Math.floor(100 + Math.random() * 900)}`;
    }

    if (!isFirebaseMock && db) {
      await addDoc(collection(db, 'orders'), newOrder);
    } else {
      const nextOrders = [newOrder, ...orders];
      const newlyLowStockItems = [];
      // Deduct stock portions and raw ingredients
      const nextMenu = menuItems.map(item => {
        let totalDeductedQty = 0;
        
        // Find if this item itself was ordered directly
        const directOrdered = orderData.items.find(i => i.id === item.id);
        if (directOrdered) {
          totalDeductedQty += directOrdered.qty;
        }

        // Find if this item is part of a combo that was ordered
        orderData.items.forEach(orderedItem => {
          if (orderedItem.isCombo && orderedItem.comboItems) {
            const hasItem = orderedItem.comboItems.some(ci => 
              (typeof ci === 'string' && ci === item.id) || 
              (typeof ci === 'object' && ci?.id === item.id)
            );
            if (hasItem) {
              totalDeductedQty += orderedItem.qty;
            }
          }
        });

        if (totalDeductedQty > 0) {
          const newStock = Math.max(0, item.stock - totalDeductedQty);
          if (item.stock > 3 && newStock <= 3) {
            newlyLowStockItems.push({ ...item, stock: newStock });
          }
          return { ...item, stock: newStock };
        }
        return item;
      });

      // Pantry-Linked Ingredient Deduction (automatically resolves dish ingredients to grocery inventory with unit conversion)
      const nextGrocery = groceryItems.map(grocery => {
        let totalDeduction = 0;
        
        orderData.items.forEach(orderedItem => {
          // If it's a combo, compile all items in the combo
          const itemsToCheck = orderedItem.isCombo 
            ? (orderedItem.comboItems || [])
            : [orderedItem];

          itemsToCheck.forEach(subItem => {
            const resolvedItem = typeof subItem === 'string'
              ? menuItems.find(mi => mi.id === subItem)
              : subItem;
            
            if (resolvedItem && resolvedItem.ingredients && Array.isArray(resolvedItem.ingredients)) {
              resolvedItem.ingredients.forEach(ing => {
                // Link match: either via pantryLinkId or case-insensitive matching name/sub-strings
                const isMatch = (ing.pantryLinkId && ing.pantryLinkId === grocery.id) || 
                                (!ing.pantryLinkId && (
                                  grocery.name.toLowerCase() === ing.name.toLowerCase() ||
                                  grocery.name.toLowerCase().includes(ing.name.toLowerCase()) ||
                                  ing.name.toLowerCase().includes(grocery.name.toLowerCase())
                                ));
                
                if (isMatch) {
                  const qtyMultiplier = orderedItem.qty; // Scale with combo quantity ordered
                  let factor = 1;
                  
                  // Unit conversions
                  const ingUnit = (ing.unit || '').toLowerCase();
                  const grocUnit = (grocery.unit || '').toLowerCase();
                  
                  if (ingUnit === 'g' && grocUnit === 'kg') {
                    factor = 0.001;
                  } else if (ingUnit === 'ml' && (grocUnit === 'liters' || grocUnit === 'l' || grocUnit === 'liter')) {
                    factor = 0.001;
                  } else if (ingUnit === 'kg' && grocUnit === 'g') {
                    factor = 1000;
                  } else if ((ingUnit === 'liters' || ingUnit === 'l' || ingUnit === 'liter') && grocUnit === 'ml') {
                    factor = 1000;
                  }
                  
                  totalDeduction += (ing.qty * factor) * qtyMultiplier;
                }
              });
            }
          });
        });
        
        return totalDeduction > 0 ? { ...grocery, qty: Math.max(0, grocery.qty - totalDeduction) } : grocery;
      });

      const orderRefText = newOrder.orderType === 'parcel' ? `Parcel ${newOrder.parcelToken}` : `Table ${newOrder.table}`;
      const newLog = { id: Math.random().toString(), log: `New order ${newOrder.orderNo} sent for ${orderRefText}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];

      const newNotify = {
        id: Math.random().toString(),
        message: `🔔 ${orderRefText} - New order placed (${newOrder.orderNo})`,
        timestamp: new Date().toISOString(),
        read: false
      };
      const nextNotifications = [newNotify, ...notifications];

      let finalNotifications = [...nextNotifications];
      let nextAlerts = [...kitchenAlerts];
      let finalLogs = [...nextLogs];

      if (newlyLowStockItems.length > 0) {
        newlyLowStockItems.forEach(item => {
          finalNotifications.unshift({
            id: Math.random().toString(),
            message: `⚠️ Low Stock Alert: ${item.name} is running low (${item.stock} left)`,
            timestamp: new Date().toISOString(),
            read: false
          });
          nextAlerts.unshift({
            id: Math.random().toString(),
            type: 'low_stock',
            message: `${item.name} stock is critically low (${item.stock} left)`,
            status: 'active',
            timestamp: new Date().toISOString()
          });
          finalLogs.unshift({
            id: Math.random().toString(),
            log: `Low stock detected for ${item.name} (${item.stock} left)`,
            time: 'Just now'
          });
        });
      }

      triggerSync(nextOrders, nextMenu, null, finalLogs, nextGrocery, finalNotifications, null, nextAlerts);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (!isFirebaseMock && db) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
    } else {
      const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { ...o, status } : o);
      const targetOrder = orders.find(o => o.orderNo === orderId || o.id === orderId);
      
      const newLog = { id: Math.random().toString(), log: `Order ${targetOrder?.orderNo || orderId} marked as ${status}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];

      let nextNotifications = [...notifications];
      if (status === 'ready' && targetOrder) {
        const orderRefText = targetOrder.orderType === 'parcel' ? `Parcel ${targetOrder.parcelToken}` : `Table #${targetOrder.table}`;
        nextNotifications = [{
          id: Math.random().toString(),
          message: `📢 ${orderRefText} - Food items are READY!`,
          timestamp: new Date().toISOString(),
          read: false
        }, ...nextNotifications];
      } else if (status === 'ready_for_pickup' && targetOrder) {
        nextNotifications = [{
          id: Math.random().toString(),
          message: `📦 Parcel ${targetOrder.parcelToken} is Ready for Pickup!`,
          timestamp: new Date().toISOString(),
          read: false
        }, ...nextNotifications];

        // MOCK SMS NOTIFICATION
        if (targetOrder.phoneNumber) {
          setTimeout(() => {
            toast.success(`📱 SMS Sent to ${targetOrder.customerName} (${targetOrder.phoneNumber}): Your order ${targetOrder.parcelToken} is ready for pickup!`, { 
              icon: '📱', 
              duration: 5000,
              style: { border: '1px solid #a855f7', background: '#f3e8ff', color: '#7e22ce' }
            });
          }, 1000);
        }
      }

      triggerSync(nextOrders, null, null, nextLogs, null, nextNotifications);
    }
  };

  const requestBalanceParcel = async (orderId) => {
    if (!isFirebaseMock && db) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { balanceParcelStatus: 'pending', packagingCharge: 5.0 });
    } else {
      const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { ...o, balanceParcelStatus: 'pending', packagingCharge: 5.0 } : o);
      
      const newLog = { id: Math.random().toString(), log: `Balance parcel requested for Order ${orderId}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];

      const newNotify = {
        id: Math.random().toString(),
        message: `📦 Kitchen Alert - Balance Parcel requested for Order ${orderId}!`,
        timestamp: new Date().toISOString(),
        read: false
      };
      const nextNotifications = [newNotify, ...notifications];

      triggerSync(nextOrders, null, null, nextLogs, null, nextNotifications);
    }
  };

  const updateBalanceParcelStatus = async (orderId, status) => {
    if (!isFirebaseMock && db) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { balanceParcelStatus: status });
    } else {
      const nextOrders = orders.map(o => o.orderNo === orderId || o.id === orderId ? { ...o, balanceParcelStatus: status } : o);
      const targetOrder = orders.find(o => o.orderNo === orderId || o.id === orderId);
      
      const newLog = { id: Math.random().toString(), log: `Balance Parcel for ${orderId} marked as ${status}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];
      
      let nextNotifications = [...notifications];
      if (status === 'ready_for_pickup') {
        const orderRefText = targetOrder.orderType === 'parcel' ? `Parcel ${targetOrder.parcelToken}` : `Table #${targetOrder.table}`;
        nextNotifications = [{
          id: Math.random().toString(),
          message: `🛍️ ${orderRefText} - Balance Parcel is Packed & Ready!`,
          timestamp: new Date().toISOString(),
          read: false
        }, ...nextNotifications];
      }

      triggerSync(nextOrders, null, null, nextLogs, null, nextNotifications);
    }
  };

  const processBill = async (billData) => {
    const newBill = {
      ...billData,
      timestamp: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      await addDoc(collection(db, 'bills'), newBill);
    } else {
      const nextBills = [newBill, ...bills];
      const nextOrders = orders.filter(o => o.orderNo !== billData.orderNo);
      const newLog = { id: Math.random().toString(), log: `Bill generated for ${billData.orderNo} - Total: $${billData.total}`, time: 'Just now' };
      const nextLogs = [newLog, ...activityLogs];

      triggerSync(nextOrders, null, nextBills, nextLogs);
    }
  };

  const updateMenuStock = async (itemId, stock) => {
    if (!isFirebaseMock && db) {
      const itemRef = doc(db, 'menuItems', itemId);
      await updateDoc(itemRef, { stock, lastRestockedAt: new Date().toISOString() });
    } else {
      const nextMenu = menuItems.map(item => item.id === itemId ? { ...item, stock, lastRestockedAt: new Date().toISOString() } : item);
      triggerSync(null, nextMenu, null, null);
    }
  };

  const addMenuItem = async (item) => {
    const newItem = {
      ...item,
      stock: parseInt(item.stock) || 10,
      price: parseFloat(item.price) || 0,
      veg: item.veg !== undefined ? item.veg : true,
      chefSpecial: item.chefSpecial !== undefined ? item.chefSpecial : false,
      prepTime: parseInt(item.prepTime) || 15,
      timeRange: item.timeRange || 'Lunch',
      description: item.description || '',
      createdTimestamp: new Date().toISOString()
    };
    if (!isFirebaseMock && db) {
      await addDoc(collection(db, 'menuItems'), newItem);
    } else {
      newItem.id = Math.random().toString();
      const nextMenu = [...menuItems, newItem];
      triggerSync(null, nextMenu, null, null);
    }
  };

  const editMenuItem = async (itemId, updatedProps) => {
    if (!isFirebaseMock && db) {
      const itemRef = doc(db, 'menuItems', itemId);
      await updateDoc(itemRef, updatedProps);
    } else {
      const nextMenu = menuItems.map(item => item.id === itemId ? { ...item, ...updatedProps } : item);
      triggerSync(null, nextMenu, null, null);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!isFirebaseMock && db) {
      const itemRef = doc(db, 'menuItems', itemId);
      await deleteDoc(itemRef);
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
    if (!isFirebaseMock && db) {
      await addDoc(collection(db, 'groceryItems'), newItem);
    } else {
      newItem.id = Math.random().toString();
      const nextGrocery = [...groceryItems, newItem];
      triggerSync(null, null, null, null, nextGrocery);
    }
  };

  const updateGroceryStock = async (groceryId, qty) => {
    if (!isFirebaseMock && db) {
      const itemRef = doc(db, 'groceryItems', groceryId);
      await updateDoc(itemRef, { qty: parseFloat(qty) || 0 });
    } else {
      const nextGrocery = groceryItems.map(item => item.id === groceryId ? { ...item, qty: parseFloat(qty) || 0 } : item);
      triggerSync(null, null, null, null, nextGrocery);
    }
  };

  const deleteGroceryItem = async (groceryId) => {
    if (!isFirebaseMock && db) {
      const itemRef = doc(db, 'groceryItems', groceryId);
      await deleteDoc(itemRef);
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

    if (!isFirebaseMock && db) {
      const orderRef = doc(db, 'orders', targetOrder.id);
      await updateDoc(orderRef, {
        status: 'cancel_requested',
        cancelReason: reason,
        cancelledBy: requestedByRole,
        requestedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'notifications'), newNotify);
      await addDoc(collection(db, 'cancellations'), newCancelAlert);
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

    const storedLogs = localStorage.getItem('rms_cancellation_logs');
    const logsList = storedLogs ? JSON.parse(storedLogs) : [];
    const newCancelEntry = {
      id: Math.random().toString(),
      orderNo: targetOrder.orderNo,
      table: targetOrder.table,
      cancelledBy: targetOrder.cancelledBy || 'Waiter',
      reason: targetOrder.cancelReason || 'Customer changed mind',
      timestamp: new Date().toISOString(),
      items: targetOrder.items,
      total: targetOrder.total
    };
    localStorage.setItem('rms_cancellation_logs', JSON.stringify([newCancelEntry, ...logsList]));

    if (!isFirebaseMock && db) {
      const orderRef = doc(db, 'orders', targetOrder.id);
      await updateDoc(orderRef, {
        status: 'cancelled',
        approvedBy: approvedByRole,
        cancelledAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'notifications'), newNotify);
      for (const item of nextMenu) {
        const itemRef = doc(db, 'menuItems', item.id);
        await updateDoc(itemRef, { stock: item.stock });
      }
      for (const grocery of nextGrocery) {
        const groceryRef = doc(db, 'groceryItems', grocery.id);
        await updateDoc(groceryRef, { qty: grocery.qty });
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

    if (!isFirebaseMock && db) {
      const orderRef = doc(db, 'orders', targetOrder.id);
      await updateDoc(orderRef, {
        status: 'pending',
        rejectedBy: rejectedByRole,
        rejectedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'notifications'), newNotify);
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

    const storedLogs = localStorage.getItem('rms_cancellation_logs');
    const logsList = storedLogs ? JSON.parse(storedLogs) : [];
    const newCancelEntry = {
      id: Math.random().toString(),
      orderNo: targetOrder.orderNo,
      table: targetOrder.table,
      cancelledBy: cancelledByRole,
      reason,
      timestamp: new Date().toISOString(),
      items: targetOrder.items,
      total: targetOrder.total
    };
    localStorage.setItem('rms_cancellation_logs', JSON.stringify([newCancelEntry, ...logsList]));

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

    if (!isFirebaseMock && db) {
      const orderRef = doc(db, 'orders', targetOrder.id);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelReason: reason,
        cancelledBy: cancelledByRole,
        cancelledAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'notifications'), newNotify);
      await addDoc(collection(db, 'cancellations'), newCancelAlert);
      for (const item of nextMenu) {
        const itemRef = doc(db, 'menuItems', item.id);
        await updateDoc(itemRef, { stock: item.stock });
      }
      for (const grocery of nextGrocery) {
        const groceryRef = doc(db, 'groceryItems', grocery.id);
        await updateDoc(groceryRef, { qty: grocery.qty });
      }
    } else {
      const nextCancellations = [newCancelAlert, ...cancellations];
      setCancellations(nextCancellations);
      triggerSync(nextOrders, nextMenu, null, nextLogs, nextGrocery, nextNotifications, nextCancellations);
    }
  };

  const acknowledgeCancellationAlert = async (cancelId) => {
    if (!isFirebaseMock && db) {
      const cancelRef = doc(db, 'cancellations', cancelId);
      await updateDoc(cancelRef, { acknowledgedByChef: true });
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
    if (!isFirebaseMock && db) {
      await addDoc(collection(db, 'kitchenAlerts'), newAlert);
    } else {
      const nextAlerts = [newAlert, ...kitchenAlerts];
      setKitchenAlerts(nextAlerts);
      triggerSync(null, null, null, null, null, null, null, nextAlerts);
    }
  };

  const markAlertSeen = async (alertId) => {
    if (!isFirebaseMock && db) {
      const alertRef = doc(db, 'kitchenAlerts', alertId);
      await updateDoc(alertRef, { seen: true });
    } else {
      const nextAlerts = kitchenAlerts.map(a => a.id === alertId ? { ...a, seen: true } : a);
      setKitchenAlerts(nextAlerts);
      triggerSync(null, null, null, null, null, null, null, nextAlerts);
    }
  };

  const resolveAlert = async (alertId, resolvedBy) => {
    if (!isFirebaseMock && db) {
      const alertRef = doc(db, 'kitchenAlerts', alertId);
      await updateDoc(alertRef, { status: 'resolved', resolvedBy, resolvedAt: new Date().toISOString() });
    } else {
      const nextAlerts = kitchenAlerts.map(a => a.id === alertId ? { ...a, status: 'resolved', resolvedBy, resolvedAt: new Date().toISOString() } : a);
      setKitchenAlerts(nextAlerts);
      triggerSync(null, null, null, null, null, null, null, nextAlerts);
    }
  };

  const removeAlert = async (alertId) => {
    if (!isFirebaseMock && db) {
      const alertRef = doc(db, 'kitchenAlerts', alertId);
      await updateDoc(alertRef, { status: 'removed' });
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
      bills,
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
