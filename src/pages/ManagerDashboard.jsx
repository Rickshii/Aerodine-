import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase, isSupabaseConfigured } from '../supabase';
import { DollarSign, Activity, Users, Package, Plus, Trash2, Edit3, Search, Tag, Sparkles, BrainCircuit, X, RefreshCw, XCircle, AlertTriangle, AlertCircle, UploadCloud, FileImage, ImagePlus, ShoppingBag, Clock, CheckCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const {
    menuItems,
    groceryItems,
    bills,
    orders,
    activityLogs,
    updateMenuStock,
    addMenuItem,
    editMenuItem,
    deleteMenuItem,
    addGroceryItem,
    updateGroceryStock,
    deleteGroceryItem,
    kitchenAlerts,
    resolveAlert,
    removeAlert
  } = useStore();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'inventory'
  const [navHistory, setNavHistory] = useState([]);
  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [cancellationLogs, setCancellationLogs] = useState([]);

  // Device Photo Upload state parameters
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDeviceUpload = (e, targetType = 'menu') => {
    let file;
    if (e.target && e.target.files) {
      file = e.target.files[0];
    } else if (e.dataTransfer && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP formats are supported');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const setImageResult = (url) => {
      if (targetType === 'combo') {
        setComboImage(url);
      } else {
        setMenuImage(url);
      }
    };

    const runFallbackUpload = () => {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 25;
        });
      }, 120);

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setImageResult(uploadEvent.target.result);
          setIsUploading(false);
          setUploadProgress(0);
          toast.success(`${targetType === 'combo' ? 'Combo' : 'Food'} photo successfully uploaded locally!`, { icon: '📸' });
        }, 250);
      };
      reader.readAsDataURL(file);
    };

    if (isSupabaseConfigured) {
      const storagePath = `${targetType === 'combo' ? 'combo' : 'menu'}_images/${Date.now()}_${file.name}`;

      const uploadProcess = async () => {
        try {
          const { data, error } = await supabase.storage
            .from('rms_images')
            .upload(storagePath, file, { upsert: true });

          if (error) throw error;

          const { data: publicUrlData } = supabase.storage
            .from('rms_images')
            .getPublicUrl(storagePath);

          setImageResult(publicUrlData.publicUrl);
          setIsUploading(false);
          setUploadProgress(0);
          toast.success(`${targetType === 'combo' ? 'Combo' : 'Food'} photo successfully uploaded to cloud!`, { icon: '☁️' });
        } catch (error) {
          console.warn('Image upload to cloud failed, falling back to local base64:', error);
          runFallbackUpload();
        }
      };

      uploadProcess();
    } else {
      runFallbackUpload();
    }
  };

  // Edit / Add modal state
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showEditMenuModal, setShowEditMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form inputs for Menu items
  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuCategory, setMenuCategory] = useState('Main Course');
  const [menuStock, setMenuStock] = useState('10');
  const [menuImage, setMenuImage] = useState('');
  const [specialBadges, setSpecialBadges] = useState([]);
  const [menuPrepTime, setMenuPrepTime] = useState('15');
  const [menuTimeRange, setMenuTimeRange] = useState('Lunch');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuDietary, setMenuDietary] = useState('None');
  const [filterDietary, setFilterDietary] = useState('All');

  // Ingredient Form States
  const [menuIngredients, setMenuIngredients] = useState([]);
  const [newIngName, setNewIngName] = useState('');
  const [newIngQty, setNewIngQty] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('g');
  const [newIngPantryId, setNewIngPantryId] = useState('');

  const [specials, setSpecials] = useState([
    { id: '1', name: 'Wagyu Beef Steak', tag: 'Chef Choice', discount: '10% OFF', scheduledFor: 'Dinner' },
    { id: '2', name: 'Truffle Mushroom Risotto', tag: 'Best Seller', discount: 'Chef Special', scheduledFor: 'Lunch' }
  ]);
  const [specialDishName, setSpecialDishName] = useState('Wagyu Beef Steak');
  const [specialTag, setSpecialTag] = useState('Chef Choice');
  const [specialPromo, setSpecialPromo] = useState('10% OFF');
  const [specialSchedule, setSpecialSchedule] = useState('Dinner');

  // Combo Offer Creator states
  const [showAddComboModal, setShowAddComboModal] = useState(false);
  const [showEditComboModal, setShowEditComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);

  const [comboName, setComboName] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [comboDiscount, setComboDiscount] = useState('15');
  const [comboImage, setComboImage] = useState('');
  const [comboDescription, setComboDescription] = useState('');
  const [comboStatus, setComboStatus] = useState('Bestseller'); // 'Bestseller' | 'Today Special' | 'Restaurant Special'
  const [comboSelectedItems, setComboSelectedItems] = useState([]); // array of item IDs
  const [comboStock, setComboStock] = useState('10');

  const totalOriginalPrice = comboSelectedItems.reduce((sum, id) => {
    const item = menuItems.find(mi => mi.id === id);
    return sum + (item ? item.price : 0);
  }, 0);

  const resetComboForm = () => {
    setEditingCombo(null);
    setComboName('');
    setComboPrice('');
    setComboDiscount('15');
    setComboImage('');
    setComboDescription('');
    setComboStatus('Bestseller');
    setComboSelectedItems([]);
    setComboStock('10');
  };

  const handleOpenEditCombo = (combo) => {
    setEditingCombo(combo);
    setComboName(combo.name);
    setComboPrice((combo.price || 0).toString());
    setComboDiscount((combo.comboDiscount || 15).toString());
    setComboImage(combo.image || '');
    setComboDescription(combo.description || '');
    setComboStatus(combo.comboStatus || 'Bestseller');
    setComboSelectedItems(combo.comboItems || []);
    setComboStock((combo.stock || 10).toString());
    setShowEditComboModal(true);
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!comboName || !comboPrice) {
      toast.error('Combo name and price are required');
      return;
    }
    if (comboSelectedItems.length === 0) {
      toast.error('Please select at least one item for the combo');
      return;
    }

    const payload = {
      name: comboName,
      price: parseFloat(comboPrice),
      category: 'Combo',
      stock: parseInt(comboStock) || 10,
      image: comboImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
      description: comboDescription,
      isCombo: true,
      comboItems: comboSelectedItems,
      comboDiscount: parseInt(comboDiscount) || 0,
      comboStatus: comboStatus,
      specialBadges: [comboStatus],
      prepTime: 25,
      timeRange: 'Lunch',
      dietary: 'Veg'
    };

    try {
      if (editingCombo) {
        await editMenuItem(editingCombo.id, payload);
        toast.success('Combo offer updated!');
        setShowEditComboModal(false);
      } else {
        await addMenuItem(payload);
        toast.success('New Combo Meal added to catalog!');
        setShowAddComboModal(false);
      }
      resetComboForm();
    } catch (err) {
      toast.error('Failed to save combo meal parameters');
    }
  };

  // Grocery Form inputs
  const [groceryName, setGroceryName] = useState('');
  const [groceryQty, setGroceryQty] = useState('');
  const [groceryUnit, setGroceryUnit] = useState('kg');
  const [groceryCategory, setGroceryCategory] = useState('Produce');
  const [groceryThreshold, setGroceryThreshold] = useState('5.0');
  const [showAddGroceryModal, setShowAddGroceryModal] = useState(false);

  // Analytics calculators
  const todayRevenue = bills.reduce((sum, b) => sum + b.total, 0);
  const lowStockGroceries = groceryItems.filter(g => g.qty <= g.stockThreshold);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setMenuName(item.name);
    setMenuPrice(item.price.toString());
    setMenuCategory(item.category);
    setMenuStock(item.stock.toString());
    setMenuImage(item.image || '');
    setSpecialBadges(item.specialBadges || []);
    setMenuPrepTime((item.prepTime || 15).toString());
    setMenuTimeRange(item.timeRange || 'Lunch');
    setMenuDescription(item.description || '');
    setMenuDietary(item.dietary || 'None');
    setMenuIngredients(item.ingredients || []);
    setShowEditMenuModal(true);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!menuName || !menuPrice) {
      toast.error('Name and price are required');
      return;
    }
    const payload = {
      name: menuName,
      price: parseFloat(menuPrice),
      category: menuCategory,
      stock: parseInt(menuStock) || 0,
      image: menuImage,
      specialBadges: specialBadges,
      prepTime: parseInt(menuPrepTime) || 15,
      timeRange: menuTimeRange,
      description: menuDescription,
      dietary: menuDietary,
      ingredients: menuIngredients
    };

    try {
      if (editingItem) {
        await editMenuItem(editingItem.id, payload);
        toast.success('Dish catalog updated!');
        setShowEditMenuModal(false);
      } else {
        await addMenuItem(payload);
        toast.success('New dish added to catalog!');
        setShowAddMenuModal(false);
      }
      resetMenuForm();
    } catch (err) {
      toast.error('Failed to save menu parameters');
    }
  };

  const resetMenuForm = () => {
    setEditingItem(null);
    setMenuName('');
    setMenuPrice('');
    setMenuStock('10');
    setMenuImage('');
    setSpecialBadges([]);
    setMenuPrepTime('15');
    setMenuTimeRange('Lunch');
    setMenuDescription('');
    setMenuDietary('None');
    setMenuIngredients([]);
    setNewIngName('');
    setNewIngQty('');
    setNewIngUnit('g');
    setNewIngPantryId('');
  };

  const handleAddGrocery = async (e) => {
    e.preventDefault();
    if (!groceryName || !groceryQty) {
      toast.error('Name and quantity are required');
      return;
    }
    try {
      await addGroceryItem({
        name: groceryName,
        qty: parseFloat(groceryQty),
        unit: groceryUnit,
        category: groceryCategory,
        stockThreshold: parseFloat(groceryThreshold) || 5.0
      });
      toast.success('Raw ingredient stocked!');
      setGroceryName('');
      setGroceryQty('');
      setShowAddGroceryModal(false);
    } catch (err) {
      toast.error('Failed to log grocery stock');
    }
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.dietary || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesDietary = filterDietary === 'All' || item.dietary === filterDietary;
    return matchesSearch && matchesCategory && matchesDietary;
  });
  const menuAnalytics = {
    all: menuItems.map(item => ({ ...item, count: Math.floor(Math.random() * 50), growth: 5, timeSlot: 'Dinner' })),
    mostOrdered: menuItems.slice(0, 3).map(item => ({ ...item, count: 45, growth: 12 })),
    topRevenue: menuItems.slice(0, 3).map(item => ({ ...item, revenue: 350 })),
    leastOrdered: menuItems.slice(-3).map(item => ({ ...item, count: 2 })),
    lowPerforming: menuItems.slice(-2)
  };

  // Parcel Analytics Calculations
  const parcelOrders = orders.filter(o => o.orderType === 'parcel' || o.balanceParcelStatus);
  const activeParcelOrders = parcelOrders.filter(o => (!['served', 'delivered', 'cancelled'].includes(o.status) && o.orderType === 'parcel') || (o.balanceParcelStatus && !['ready_for_pickup'].includes(o.balanceParcelStatus)));
  const totalParcelOrders = parcelOrders.length;
  const parcelRevenue = parcelOrders.reduce((sum, o) => sum + (o.orderType === 'parcel' ? (o.total || 0) : 0), 0);
  const packagingRevenue = orders.reduce((sum, o) => sum + (o.packagingCharge || 0), 0);

  // Quick Peak hours logic
  const hourCounts = parcelOrders.reduce((acc, o) => {
    const hour = new Date(o.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  const peakHour = Object.keys(hourCounts).sort((a, b) => hourCounts[b] - hourCounts[a])[0];
  const peakParcelHours = peakHour ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : 'N/A';

  // Navigation Logic
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setNavHistory(prev => [...prev, {
      activeTab,
      searchTerm,
      filterCategory,
      scrollTop: scrollRef.current ? scrollRef.current.scrollTop : 0
    }]);
    setActiveTab(newTab);
  };

  const goBack = () => {
    // Close modals first
    if (showAddMenuModal || showEditMenuModal) {
      setShowAddMenuModal(false); setShowEditMenuModal(false); resetMenuForm(); return;
    }
    if (showAddComboModal || showEditComboModal) {
      setShowAddComboModal(false); setShowEditComboModal(false); resetComboForm(); return;
    }
    if (showAddGroceryModal) {
      setShowAddGroceryModal(false); return;
    }

    if (navHistory.length === 0) return;
    const lastState = navHistory[navHistory.length - 1];
    setNavHistory(prev => prev.slice(0, -1));
    setActiveTab(lastState.activeTab);
    setSearchTerm(lastState.searchTerm);
    setFilterCategory(lastState.filterCategory);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = lastState.scrollTop;
    }, 50);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        goBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navHistory, showAddMenuModal, showEditMenuModal, showAddComboModal, showEditComboModal, showAddGroceryModal, activeTab, searchTerm, filterCategory]);

  const isModalOpen = showAddMenuModal || showEditMenuModal || showAddComboModal || showEditComboModal || showAddGroceryModal;

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-12 pr-1 relative" ref={scrollRef}>

      {/* Title Header with Sticky Navigation */}
      <div className="sticky top-0 z-40 bg-[var(--bg-panel)]/90 [#0B0F19]/90 backdrop-blur-xl pb-4 pt-2 mb-2 border-b border-[var(--border-color)]/500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            disabled={navHistory.length === 0 && !isModalOpen}
            className="p-2.5 glass-card border border-[var(--border-color)] rounded-full hover:glass-card :bg-[var(--bg-glass)] transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed group flex-shrink-0"
            title="Go Back (Esc)"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)] group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[9px] font-extrabold uppercase text-[var(--color-text-muted)] tracking-wider">Manager</span>
              <ChevronRight className="w-3 h-3 text-[var(--color-text-muted)]" />
              <span className="text-[9px] font-extrabold uppercase text-[var(--color-primary)] tracking-wider">{activeTab}</span>
              {isModalOpen && (
                <>
                  <ChevronRight className="w-3 h-3 text-[var(--color-text-muted)]" />
                  <span className="text-[9px] font-extrabold uppercase text-[var(--color-primary)] tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Editor
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-main)] uppercase flex items-center gap-3">
              Catalog & Stock Hub
            </h1>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          {activeTab === 'catalog' ? (
            <div className="flex gap-2">
              <button
                onClick={() => { resetMenuForm(); setShowAddMenuModal(true); }}
                className="btn-premium bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-text-main)] rounded-full py-2.5 px-5 text-xs font-bold shadow-glow-primary flex items-center gap-2"
              >
                <Plus size={16} />
                Add Menu Dish
              </button>
              <button
                onClick={() => { resetComboForm(); setShowAddComboModal(true); }}
                className="btn-premium bg-gradient-to-r from-rose-700 to-rose-600 text-[var(--color-text-main)] rounded-full py-2.5 px-5 text-xs font-bold shadow-glow-secondary flex items-center gap-2"
              >
                <Plus size={16} />
                Create Combo Meal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddGroceryModal(true)}
              className="btn-premium bg-[var(--bg-panel)] [#F8F5F0] text-[var(--color-text-main)] [#111111] rounded-full py-2.5 px-6 text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Plus size={16} />
              Log Grocery Stock
            </button>
          )}
        </div>
      </div>

      {/* AI Insights predictive module */}
      <div className="glass p-5 border border-[var(--color-primary)]/25 bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-primary)]/5 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center animate-pulse">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[var(--color-primary)]">AeroDine Intelligence Predictions</h3>
            <p className="text-xs text-[var(--color-text-muted)] max-w-2xl mt-1 leading-normal font-semibold">
              Predictive models show a **14% Starter demand surge** tonight. Recommend restocking {lowStockGroceries.length > 0 ? lowStockGroceries.map(g => g.name).join(', ') : 'avocado and herbs'} immediately.
            </p>
          </div>
        </div>
        <span className="text-[9px] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Active</span>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[var(--border-color)] pb-px gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabChange('catalog')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'catalog' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-slate-555 hover:text-[var(--color-text-muted)]'}`}
        >
          Master Menu Catalog ({menuItems.length})
        </button>
        <button
          onClick={() => handleTabChange('inventory')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'inventory' ? 'border-[var(--color-secondary)] text-rose-500' : 'border-transparent text-slate-555 hover:text-[var(--color-text-muted)]'}`}
        >
          Raw Ingredients Inventory ({groceryItems.length})
        </button>
        <button
          onClick={() => handleTabChange('specials')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'specials' ? 'border-pink-400 text-pink-400' : 'border-transparent text-slate-555 hover:text-[var(--color-text-muted)]'}`}
        >
          Restaurant Specials ({specials.length})
        </button>
        <button
          onClick={() => handleTabChange('analytics')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'analytics' ? 'border-cyan-555 text-cyan-550' : 'border-transparent text-slate-555 hover:text-[var(--color-text-muted)]'}`}
        >
          Menu & Sales Analytics
        </button>
        <button
          onClick={() => handleTabChange('alerts')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'alerts' ? 'border-red-500 text-red-500 animate-pulse' : 'border-transparent text-slate-555 hover:text-[var(--color-text-muted)]'}`}
        >
          Alert Center ({kitchenAlerts?.filter(a => a.status === 'active' || a.status === 'resolved').length || 0})
        </button>
        <button
          onClick={() => handleTabChange('parcel')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'parcel' ? 'border-[var(--color-primary)] text-[var(--color-primary)] shadow-glow-secondary' : 'border-transparent text-slate-555 hover:text-[var(--color-text-muted)]'}`}
        >
          Parcel Operations ({activeParcelOrders.length})
        </button>
      </div>

      {/* MASTER MENU CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3.5 text-[var(--color-text-muted)]" size={16} />
                <input
                  type="text"
                  placeholder="Search dish names or dietary tags..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
                {['All', 'Chats', 'Snacks', 'Combo', 'Fast Food', 'Main Course', 'Street Food', 'Beverage', 'Dessert'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${filterCategory === cat ? 'bg-[var(--color-primary)] text-[var(--color-text-main)] shadow-md' : 'bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--color-text-muted)]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Sub-Filters */}
            <div className="flex flex-wrap gap-2 items-center border-t border-[var(--border-color)] pt-3">
              <span className="text-[10px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-widest mr-2">Dietary:</span>
              {['All', 'Veg', 'Non Veg', 'Vegan', 'Egg', 'Seafood', 'Beverages', 'Desserts', 'None'].map(diet => (
                <button
                  key={diet}
                  onClick={() => setFilterDietary(diet)}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-all border ${filterDietary === diet ? 'bg-[var(--color-primary)] text-[var(--color-text-main)] border-transparent shadow-sm' : 'bg-transparent border-[var(--border-color)] text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)] :text-[var(--color-text-main)]'}`}
                >
                  {diet === 'None' ? 'Other' : diet}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Notion table */}
          <div className="glass overflow-hidden border border-[var(--border-color)] ">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-[var(--color-text-muted)]">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-panel)]/50">
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Dish Detail</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Category</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Price</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Prep time</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Portions</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Status Badges</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 ">
                  {filteredMenu.map(item => (
                    <tr key={item.id} className="hover:bg-[var(--bg-panel)]/50 :bg-[var(--bg-panel)]/10">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="font-extrabold text-gray-50 text-sm">{item.name}</div>
                          <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block truncate max-w-xs">{item.description}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="glass-card px-2.5 py-1 rounded-full text-[10px] font-bold text-[var(--color-text-muted)]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-gray-50 ">${item.price.toFixed(2)}</td>
                      <td className="py-4 px-6 font-bold text-[var(--color-text-muted)]">{item.prepTime || 15} mins</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 min-w-[130px]">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={item.stock}
                              onChange={e => updateMenuStock(item.id, parseInt(e.target.value) || 0)}
                              className={`w-12 text-center bg-[var(--bg-panel)] border rounded-lg py-1 font-bold focus:outline-none ${item.stock <= 3 ? 'border-[var(--color-primary)]/50 text-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--border-color)] '}`}
                            />
                            <span className="text-[10px] text-[var(--color-text-muted)]">portions</span>
                            {item.stock <= 3 && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] animate-pulse flex items-center gap-0.5 border border-[var(--color-primary)]/20">
                                ⚠️ Low
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            <button
                              onClick={() => updateMenuStock(item.id, (item.stock || 0) + 5)}
                              className="px-1.5 py-0.5 glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[8px] font-bold rounded"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => updateMenuStock(item.id, (item.stock || 0) + 10)}
                              className="px-1.5 py-0.5 glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[8px] font-bold rounded"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => updateMenuStock(item.id, (item.stock || 0) + 20)}
                              className="px-1.5 py-0.5 glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[8px] font-bold rounded"
                            >
                              +20
                            </button>
                            <button
                              onClick={() => updateMenuStock(item.id, 50)}
                              className="px-1.5 py-0.5 bg-[var(--color-primary)]/15 hover:bg-[var(--color-primary)]/25 text-[var(--color-primary)] text-[8px] font-bold rounded border border-[var(--color-primary)]/20"
                            >
                              Full
                            </button>
                          </div>
                          {item.lastRestockedAt && (
                            <span className="text-[8px] text-[var(--color-text-muted)] block font-mono">
                              Restocked: {new Date(item.lastRestockedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                          {item.dietary && item.dietary !== 'None' && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${item.dietary === 'Veg' ? 'bg-rose-500/10 text-rose-500 border-[var(--color-secondary)]/20' :
                                item.dietary === 'Non Veg' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  item.dietary === 'Vegan' ? 'bg-rose-500/10 text-[var(--color-secondary)] border-[var(--color-secondary)]/20' :
                                    item.dietary === 'Egg' ? 'bg-pink-400/10 text-pink-400 border-pink-400/20' :
                                      item.dietary === 'Seafood' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                                        item.dietary === 'Beverage' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                                          item.dietary === 'Dessert' ? 'bg-[var(--color-primary)]/10 text-coral-400 border-[var(--color-primary)]/20' :
                                            'bg-[var(--color-text-main)]/10 text-[var(--color-text-muted)] border-gray-500/20'
                              }`}>
                              {item.dietary}
                            </span>
                          )}
                          {(item.specialBadges || []).map(badge => (
                            <span key={badge} className="bg-[var(--color-primary)]/10 text-coral-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-[var(--color-primary)]/20">
                              ★ {badge}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            if (item.isCombo) {
                              handleOpenEditCombo(item);
                            } else {
                              handleOpenEdit(item);
                            }
                          }}
                          className="p-2 glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] rounded-xl text-[var(--color-text-muted)] "
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 :bg-red-950/40 rounded-xl text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESTAURANT SPECIALS SCHEDULER VIEW */}
      {activeTab === 'specials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Specials card planner form */}
            <div className="glass p-5 border border-[var(--border-color)] flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-[var(--color-text-main)] uppercase tracking-wider">Schedule Featured Special</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] font-bold mt-0.5">Highlight premium creations on customer headers</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Select Catalog Item</label>
                  <select
                    value={specialDishName}
                    onChange={e => setSpecialDishName(e.target.value)}
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    {menuItems.map(item => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase">Promo Tag</label>
                    <input
                      type="text"
                      value={specialTag}
                      onChange={e => setSpecialTag(e.target.value)}
                      placeholder="Chef Choice"
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase">Discount / Text</label>
                    <input
                      type="text"
                      value={specialPromo}
                      onChange={e => setSpecialPromo(e.target.value)}
                      placeholder="10% OFF"
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Schedule Timing</label>
                  <select
                    value={specialSchedule}
                    onChange={e => setSpecialSchedule(e.target.value)}
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    {['Breakfast', 'Lunch', 'Dinner'].map(timing => (
                      <option key={timing} value={timing}>{timing}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    const newSpecial = {
                      id: Date.now().toString(),
                      name: specialDishName,
                      tag: specialTag || 'Featured Special',
                      discount: specialPromo || 'Chef Special',
                      scheduledFor: specialSchedule
                    };
                    const updated = [...specials, newSpecial];
                    setSpecials(updated);
                    window.dispatchEvent(new Event('rms_sync'));
                    toast.success(`${specialDishName} added to today's specials!`, { icon: '★' });
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-text-main)] rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-glow-primary transition-all mt-2"
                >
                  Confirm Special Schedule
                </button>
              </div>
            </div>

            {/* Active specials list grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-xs text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="text-pink-400 animate-spin-slow" size={15} />
                Today's Active Scheduled Specials ({specials.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {specials.map(spec => {
                  const matchedDish = menuItems.find(item => item.name === spec.name);
                  return (
                    <div
                      key={spec.id}
                      className="glass overflow-hidden border border-amber-550/20 bg-[var(--bg-panel)] rounded-3xl relative flex flex-col justify-between"
                    >
                      {/* Image header with overlay */}
                      <div className="h-28 relative">
                        <img
                          src={matchedDish?.image || 'https://images.unsplash.com/photo-1544025162-8316773229b4?auto=format&fit=crop&w=500&q=80'}
                          alt={spec.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent"></div>
                        <span className="absolute top-3 left-3 bg-[var(--color-primary)] text-[var(--color-text-main)] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {spec.scheduledFor}
                        </span>
                        <span className="absolute top-3 right-3 bg-pink-400 text-[var(--bg-main)] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {spec.discount}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="font-extrabold text-[var(--color-text-main)] text-sm">{spec.name}</h4>
                          <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block mt-0.5">
                            ★ {spec.tag}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            const updated = specials.filter(s => s.id !== spec.id);
                            setSpecials(updated);
                            window.dispatchEvent(new Event('rms_sync'));
                            toast.success(`Removed ${spec.name} from specials`);
                          }}
                          className="w-full py-2 bg-[var(--bg-panel)]/60 hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border border-[var(--border-color)] hover:border-red-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 size={12} />
                          Cancel Specials Schedule
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARCEL OPERATIONS VIEW */}
      {activeTab === 'parcel' && (
        <div className="space-y-6">
          <div className="glass p-5 border border-[var(--color-primary)]/25 bg-gradient-to-r from-[var(--color-primary)]/5 to-cyan-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[var(--color-primary)]">Parcel & Takeaway Analytics</h3>
                <p className="text-xs text-[var(--color-text-muted)] max-w-2xl mt-1 leading-normal font-bold">
                  Track live parcel orders, revenue generation, and peak pickup timings.
                </p>
              </div>
            </div>
            <span className="text-[9px] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Live Tracker</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="glass p-6 border border-[var(--border-color)] flex flex-col justify-between">
              <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Total Parcel Requests</span>
              <h3 className="text-3xl font-extrabold mt-3 text-[var(--color-primary)]">{totalParcelOrders}</h3>
            </div>
            <div className="glass p-6 border border-[var(--border-color)] flex flex-col justify-between">
              <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Parcel Revenue</span>
              <h3 className="text-3xl font-extrabold mt-3 text-rose-500">${parcelRevenue.toFixed(2)}</h3>
            </div>
            <div className="glass p-6 border border-[var(--border-color)] flex flex-col justify-between">
              <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Packaging Revenue</span>
              <h3 className="text-3xl font-extrabold mt-3 text-emerald-400">${packagingRevenue.toFixed(2)}</h3>
            </div>
            <div className="glass p-6 border border-[var(--border-color)] flex flex-col justify-between">
              <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Peak Parcel Hours</span>
              <h3 className="text-xl font-extrabold mt-3 text-[var(--color-text-main)] flex items-center gap-2"><Clock size={16} /> {peakParcelHours}</h3>
            </div>
            <div className="glass p-6 border border-[var(--border-color)] flex flex-col justify-between">
              <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Active Parcels</span>
              <h3 className="text-3xl font-extrabold mt-3 text-[var(--color-primary)]">{activeParcelOrders.length}</h3>
            </div>
          </div>

          <div className="glass overflow-hidden border border-[var(--border-color)] mt-6">
            <div className="p-4 border-b border-[var(--border-color)] ">
              <h3 className="font-extrabold text-sm text-[var(--color-text-main)] uppercase tracking-wider">Recent Parcel Orders Tracker</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-[var(--color-text-muted)]">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-panel)]/50">
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Token Number</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Customer Name</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Pickup Time</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Amount</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 ">
                  {parcelOrders.map(order => (
                    <tr key={order.id || order.orderNo} className="hover:bg-[var(--bg-panel)]/50 :bg-[var(--bg-panel)]/10">
                      <td className="py-4 px-6 font-extrabold text-[var(--color-primary)]">{order.orderType === 'parcel' ? (order.parcelToken || 'N/A') : `Table #${order.table}`}</td>
                      <td className="py-4 px-6 font-bold text-gray-50 ">{order.orderType === 'parcel' ? (order.customerName || 'N/A') : 'Balance Parcel'}</td>
                      <td className="py-4 px-6 font-bold text-[var(--color-text-muted)]">{order.orderType === 'parcel' ? (order.pickupTime || 'N/A') : 'N/A'}</td>
                      <td className="py-4 px-6 font-extrabold text-gray-50 ">${order.orderType === 'parcel' ? (order.total?.toFixed(2) || '0.00') : (order.packagingCharge?.toFixed(2) || '0.00')}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${(order.status === 'pending' || order.balanceParcelStatus === 'pending') ? 'glass-card text-[var(--color-text-muted)]' :
                            (order.status === 'preparing' || order.balanceParcelStatus === 'packing') ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' :
                              (order.status === 'packed' || order.balanceParcelStatus === 'packed') ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' :
                                (order.status === 'ready_for_pickup' || order.balanceParcelStatus === 'ready_for_pickup') ? 'bg-rose-400/20 text-rose-500' :
                                  order.status === 'delivered' ? 'bg-rose-500/10 text-rose-500' :
                                    'glass-card text-[var(--color-text-muted)]'
                          }`}>
                          {order.orderType === 'parcel' ? order.status.replace(/_/g, ' ') : `Packing: ${order.balanceParcelStatus.replace(/_/g, ' ')}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SALES PERFORMANCE ANALYTICS VIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Smart AI-like intelligence board */}
          <div className="glass p-5 border border-cyan-500/25 bg-gradient-to-r from-cyan-500/5 to-cyan-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center animate-pulse">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-cyan-500">AI Sales Intelligence & Peak Demand Deck</h3>
                <p className="text-xs text-[var(--color-text-muted)] max-w-2xl mt-1 leading-normal font-bold">
                  🍔 {menuAnalytics.mostOrdered[0]?.name || 'Wagyu Beef Steak'} demand surged by 22% during peak dinner hours. Recommend preparing extra prep portions.
                  🍕 {menuAnalytics.topRevenue[0]?.name || 'Truffle Mushroom Risotto'} generated the highest revenue share.
                  📉 Underperforming dish warnings: {menuAnalytics.lowPerforming.map(d => d.name).slice(0, 2).join(', ') || 'Beverage'}.
                </p>
              </div>
            </div>
            <span className="text-[9px] bg-cyan-500/20 text-cyan-500 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">SaaS Enabled</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Recharts Category Bar Chart */}
            <div className="glass p-5 border border-[var(--border-color)] flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-xs text-[var(--color-text-main)] uppercase tracking-wider">Category Sales Volume Share</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] font-bold">Total orders volume mapped by food categories</p>
              </div>

              {/* Responsive Bar Chart */}
              <div className="h-56 w-full pt-4">
                {(() => {
                  const categoryChartData = [
                    { name: 'Main Course', orders: menuAnalytics.all.filter(item => item.category === 'Main Course').reduce((sum, item) => sum + item.count, 0) },
                    { name: 'Snacks', orders: menuAnalytics.all.filter(item => item.category === 'Snacks').reduce((sum, item) => sum + item.count, 0) },
                    { name: 'Dessert', orders: menuAnalytics.all.filter(item => item.category === 'Dessert').reduce((sum, item) => sum + item.count, 0) },
                    { name: 'Beverage', orders: menuAnalytics.all.filter(item => item.category === 'Beverage').reduce((sum, item) => sum + item.count, 0) },
                    { name: 'Combo', orders: menuAnalytics.all.filter(item => item.category === 'Combo').reduce((sum, item) => sum + item.count, 0) },
                    { name: 'Fast Food', orders: menuAnalytics.all.filter(item => item.category === 'Fast Food').reduce((sum, item) => sum + item.count, 0) },
                    { name: 'Chats', orders: menuAnalytics.all.filter(item => item.category === 'Chats').reduce((sum, item) => sum + item.count, 0) },
                    { name: 'Street Food', orders: menuAnalytics.all.filter(item => item.category === 'Street Food').reduce((sum, item) => sum + item.count, 0) }
                  ];

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="url(#colorCyan)" />
                          ))}
                        </Bar>
                        <defs>
                          <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Visual Recharts Dietary Pie Chart */}
            <div className="glass p-5 border border-[var(--border-color)] flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-xs text-[var(--color-text-main)] uppercase tracking-wider">Dietary Revenue Contribution</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] font-bold">Aggregate revenue breakdown by food dietary badges</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 px-2 sm:px-4 h-auto sm:h-56">
                {/* Recharts Pie Chart */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0">
                  {(() => {
                    const dietaryChartData = [
                      { name: 'Veg', value: 35, color: '#10b981' },
                      { name: 'Non-Veg', value: 45, color: '#f43f5e' },
                      { name: 'Other', value: 20, color: '#94a3b8' }
                    ];

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dietaryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {dietaryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff', fontWeight: 'bold' }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    );
                  })()}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs sm:text-sm font-extrabold text-[var(--color-text-main)] ">${todayRevenue.toFixed(0)}</span>
                    <span className="text-[8px] text-[var(--color-text-muted)] font-bold uppercase mt-0.5">Today</span>
                  </div>
                </div>

                <div className="space-y-3 text-[10px] font-bold w-full sm:w-auto flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                      <span className="text-[var(--color-text-main)] ">Veg</span>
                    </div>
                    <span className="text-[var(--color-text-muted)]">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-[var(--color-text-main)] ">Non-Veg</span>
                    </div>
                    <span className="text-[var(--color-text-muted)]">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                      <span className="text-[var(--color-text-muted)]">Other</span>
                    </div>
                    <span className="text-[var(--color-text-muted)]">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Lists Deck */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Most Ordered */}
            <div className="glass p-5 border border-[var(--border-color)] flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  🔥 Most Ordered Dishes
                </h4>
                <div className="space-y-3 mt-4">
                  {menuAnalytics.mostOrdered.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[var(--color-text-main)] max-w-[110px] truncate">{item.name}</span>
                      <span className="text-[var(--color-text-muted)] font-mono">{item.count} orders (+{item.growth}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Top Revenue */}
            <div className="glass p-5 border border-[var(--border-color)] flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-cyan-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  💰 Top Revenue Contributors
                </h4>
                <div className="space-y-3 mt-4">
                  {menuAnalytics.topRevenue.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[var(--color-text-main)] max-w-[110px] truncate">{item.name}</span>
                      <span className="text-cyan-500 font-mono">${item.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Peak Selling Times */}
            <div className="glass p-5 border border-[var(--border-color)] flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-pink-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  🕒 Peak Demand Slot Tracker
                </h4>
                <div className="space-y-3 mt-4">
                  {menuAnalytics.all.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[var(--color-text-main)] max-w-[110px] truncate">{item.name}</span>
                      <span className="text-pink-400 uppercase tracking-wider text-[8px] bg-pink-400/10 px-1.5 py-0.5 rounded">
                        {item.timeSlot} Peak
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Underperforming Dishes */}
            <div className="glass p-5 border border-[var(--border-color)] flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  📉 Underperforming Warning
                </h4>
                <div className="space-y-3 mt-4">
                  {menuAnalytics.leastOrdered.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[var(--color-text-main)] max-w-[110px] truncate">{item.name}</span>
                      <span className="text-red-500 uppercase text-[8px] bg-red-500/10 px-1.5 py-0.5 rounded">
                        Action Needed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAW INGREDIENTS INVENTORY VIEW */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Grocery stock cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 border border-[var(--border-color)] flex flex-col justify-between">
              <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Total Raw Volume</span>
              <h3 className="text-3xl font-extrabold mt-3">{groceryItems.reduce((acc, g) => acc + g.qty, 0).toFixed(1)} items</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-2 font-bold">Standard pantry density healthy</p>
            </div>

            <div className="glass p-6 border border-[var(--border-color)] flex flex-col justify-between">
              <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Low Stock Warnings</span>
              <h3 className={`text-3xl font-extrabold mt-3 ${lowStockGroceries.length > 0 ? 'text-red-500 animate-pulse' : 'text-[var(--color-text-muted)]'}`}>
                {lowStockGroceries.length} alert(s)
              </h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-2 font-bold">Autogenerated ordering queue recommendation</p>
            </div>

            <div className="glass p-6 border border-[var(--border-color)] flex flex-col justify-between">
              <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Pantry Status</span>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[var(--color-primary)] rounded-full animate-ping"></span>
                <span className="text-lg font-bold text-[var(--color-primary)]">Live & Synced</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-2 font-bold">Linked to active recipe estimators</p>
            </div>
          </div>

          {/* Grocery interactive table */}
          <div className="glass overflow-hidden border border-[var(--border-color)] ">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-[var(--color-text-muted)]">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-panel)]/50">
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Ingredient Name</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Category</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Current Qty</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Threshold</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Status</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 ">
                  {groceryItems.map(item => {
                    const isLow = item.qty <= item.stockThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-[var(--bg-panel)]/50 :bg-[var(--bg-panel)]/10">
                        <td className="py-4 px-6 font-extrabold text-gray-50 ">{item.name}</td>
                        <td className="py-4 px-6">
                          <span className="glass-card px-2.5 py-1 rounded-full text-[10px] font-bold text-[var(--color-text-muted)]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={item.qty}
                              onChange={e => updateGroceryStock(item.id, e.target.value)}
                              className="w-14 text-center bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg py-1 font-bold focus:outline-none"
                            />
                            <span className="text-[10px] text-[var(--color-text-muted)] font-bold">{item.unit}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[var(--color-text-muted)]">{item.stockThreshold.toFixed(1)} {item.unit}</td>
                        <td className="py-4 px-6">
                          {isLow ? (
                            <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-500/20 animate-pulse-red">Low Stock</span>
                          ) : (
                            <span className="bg-rose-500/10 text-rose-500 px-2.5 py-1 rounded-full text-[10px] font-bold border border-[var(--color-secondary)]/20">Adequate</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => deleteGroceryItem(item.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 :bg-red-950/40 rounded-xl text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-3 p-4">
              {groceryItems.map(item => {
                const isLow = item.qty <= item.stockThreshold;
                return (
                  <div key={item.id} className="glass-card border border-[var(--border-color)] rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-gray-50 text-sm">{item.name}</h4>
                        <span className="glass-card px-2 py-0.5 mt-1 inline-block rounded text-[9px] font-bold text-[var(--color-text-muted)]">
                          {item.category}
                        </span>
                      </div>
                      {isLow ? (
                        <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[9px] font-bold border border-red-500/20 animate-pulse-red">Low Stock</span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded text-[9px] font-bold border border-[var(--color-secondary)]/20">Adequate</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center bg-[var(--bg-panel)] p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={item.qty}
                          onChange={e => updateGroceryStock(item.id, e.target.value)}
                          className="w-16 text-center glass-card border border-[var(--border-color)] rounded-lg py-1.5 font-bold focus:outline-none focus:border-[var(--color-primary)]"
                        />
                        <span className="text-[10px] text-[var(--color-text-muted)] font-bold">{item.unit}</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">Min: {item.stockThreshold.toFixed(1)}</span>
                    </div>

                    <button
                      onClick={() => deleteGroceryItem(item.id)}
                      className="w-full py-2 bg-red-50 hover:bg-red-100 :bg-red-950/40 rounded-xl text-red-500 flex items-center justify-center gap-1.5 text-[10px] font-extrabold"
                    >
                      <Trash2 size={12} /> Remove Item
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED ALERT CENTER VIEW */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Alerts Analytics Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-5 border border-red-500/10 bg-red-500/5">
              <span className="text-[10px] text-[var(--color-text-muted)] font-bold block uppercase tracking-wider">Active Alerts</span>
              <span className="text-2xl font-extrabold text-red-550 block mt-2">{(kitchenAlerts || []).filter(a => a.status === 'active').length} unresolved</span>
              <span className="text-[10px] text-[var(--color-text-muted)] block mt-1 font-bold">Instantly synced across KDS</span>
            </div>

            <div className="glass p-5 border border-[var(--border-color)] ">
              <span className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider">Resolved Alerts</span>
              <span className="text-2xl font-extrabold text-rose-500 block mt-2">
                {(kitchenAlerts || []).filter(a => a.status === 'resolved').length}
              </span>
              <span className="text-[10px] text-slate-455 block mt-1 font-bold">Actioned by management/kitchen</span>
            </div>

            <div className="glass p-5 border border-[var(--border-color)] ">
              <span className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider">Top Alert Trigger</span>
              <span className="text-2xl font-extrabold text-[var(--color-primary)] block mt-2 truncate">
                {(() => {
                  const reasonCounts = (kitchenAlerts || []).reduce((acc, log) => {
                    acc[log.type] = (acc[log.type] || 0) + 1;
                    return acc;
                  }, {});
                  const sorted = Object.keys(reasonCounts).sort((a, b) => reasonCounts[b] - reasonCounts[a]);
                  return sorted[0] || 'None';
                })()}
              </span>
              <span className="text-[10px] text-slate-455 block mt-1 font-bold">Most frequent kitchen issue</span>
            </div>
          </div>

          {/* Alert History Table */}
          <div className="glass overflow-hidden border border-[var(--border-color)] ">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-gray-100 text-sm uppercase">Real-Time Alert History</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] font-bold">Centralized hub for all kitchen exceptions and operational issues</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-[var(--color-text-muted)]">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-panel)]/50">
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Status</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Alert Type</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Message</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Date & Time</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Resolved By</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-[var(--color-text-muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 ">
                  {(!kitchenAlerts || kitchenAlerts.length === 0) ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-[var(--color-text-muted)] font-bold">No kitchen alerts logged. Operations are smooth!</td>
                    </tr>
                  ) : (
                    kitchenAlerts.map(log => (
                      <tr key={log.id} className="hover:bg-[var(--bg-panel)]/50 :bg-[var(--bg-panel)]/10">
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${log.status === 'active' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                              log.status === 'resolved' ? 'bg-rose-500/10 text-rose-500 border border-[var(--color-secondary)]/20' :
                                'bg-[var(--color-text-main)]/10 text-[var(--color-text-muted)]'
                            }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-extrabold text-gray-50 ">{log.type}</td>
                        <td className="py-4 px-6 text-gray-100 max-w-[200px] truncate">{log.message}</td>
                        <td className="py-4 px-6 text-[var(--color-text-muted)] font-semibold">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          {log.resolvedBy ? (
                            <span className="bg-slate-105 px-2.5 py-1 rounded-full text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                              {log.resolvedBy}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-6 text-right flex gap-2 justify-end">
                          {log.status === 'active' && (
                            <button
                              onClick={() => {
                                resolveAlert(log.id, 'Manager');
                                toast.success('Alert resolved centrally.');
                              }}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 :bg-emerald-950/40 rounded-xl text-rose-500"
                              title="Mark as Resolved"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {log.status !== 'removed' && (
                            <button
                              onClick={() => {
                                removeAlert(log.id);
                                toast.success('Alert removed from active board.');
                              }}
                              className="p-2 bg-red-50 hover:bg-red-100 :bg-red-950/40 rounded-xl text-red-500"
                              title="Remove Alert"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DISH ADD/EDIT MODAL FORM */}
      {(showAddMenuModal || showEditMenuModal) && (
        <div className="fixed inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass w-full max-w-lg border border-[var(--border-color)] relative flex flex-col shadow-2xl rounded-2xl max-h-[85vh] sm:max-h-[90vh]">

            {/* Header - Sticky */}
            <div className="p-5 sm:p-6 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--color-text-main)] ">
                <Sparkles className="text-[var(--color-primary)]" size={20} />
                {editingItem ? 'Edit Catalog Dish' : 'Create Catalog Dish'}
              </h2>
              <button
                onClick={() => { setShowAddMenuModal(false); setShowEditMenuModal(false); resetMenuForm(); }}
                className="w-8 h-8 flex items-center justify-center glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[var(--color-text-muted)] rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-5 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-10">
              <form id="menu-form" onSubmit={handleSaveMenu} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Dish Name</label>
                  <input
                    type="text"
                    value={menuName}
                    onChange={e => setMenuName(e.target.value)}
                    placeholder="E.g., Lobster Thermidor"
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={menuPrice}
                      onChange={e => setMenuPrice(e.target.value)}
                      placeholder="24.99"
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Stock Portions</label>
                    <input
                      type="number"
                      value={menuStock}
                      onChange={e => setMenuStock(e.target.value)}
                      placeholder="15"
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Category</label>
                    <select
                      value={menuCategory}
                      onChange={e => setMenuCategory(e.target.value)}
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      {['Chats', 'Snacks', 'Combo', 'Fast Food', 'Main Course', 'Street Food', 'Beverage', 'Dessert'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Dietary</label>
                    <select
                      value={menuDietary}
                      onChange={e => setMenuDietary(e.target.value)}
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      {['Veg', 'Non Veg', 'Vegan', 'Egg', 'Seafood', 'Beverages', 'Desserts', 'None'].map(diet => (
                        <option key={diet} value={diet}>{diet === 'None' ? 'Other' : diet}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Prep (m)</label>
                    <input
                      type="number"
                      value={menuPrepTime}
                      onChange={e => setMenuPrepTime(e.target.value)}
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-2 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Availability</label>
                    <select
                      value={menuTimeRange}
                      onChange={e => setMenuTimeRange(e.target.value)}
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-2 py-2 text-xs focus:outline-none"
                    >
                      {['Breakfast', 'Lunch', 'Dinner'].map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1 py-2">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Special Status Badges</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['Chef Special', 'Today Special', 'Restaurant Special', 'Bestseller', 'Recommended', 'New Arrival', 'Hot Selling', 'Limited Edition'].map(badge => (
                      <button
                        type="button"
                        key={badge}
                        onClick={() => {
                          if (specialBadges.includes(badge)) {
                            setSpecialBadges(specialBadges.filter(b => b !== badge));
                          } else {
                            setSpecialBadges([...specialBadges, badge]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${specialBadges.includes(badge) ? 'bg-[var(--color-primary)]/20 text-coral-400 border-[var(--color-primary)]/50 shadow-glow-secondary' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30'}`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase block">Food Photo Upload / Selection</label>

                  {/* Preset realistic photo quick selectors */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: 'Risotto', url: 'https://images.unsplash.com/photo-147612436949-e5addf5fff71?auto=format&fit=crop&w=500&q=80' },
                      { name: 'Wagyu', url: 'https://images.unsplash.com/photo-1544025162-8316773229b4?auto=format&fit=crop&w=500&q=80' },
                      { name: 'Toast', url: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=500&q=80' },
                      { name: 'Dessert', url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=500&q=80' }
                    ].map(photo => (
                      <button
                        type="button"
                        key={photo.name}
                        onClick={() => {
                          setMenuImage(photo.url);
                          toast.success(`Selected preset photo: ${photo.name}`);
                        }}
                        className={`relative h-12 rounded-xl overflow-hidden border transition-all ${menuImage === photo.url ? 'border-[var(--color-primary)] ring-2 ring-rose-600/20 scale-95' : 'border-[var(--border-color)] '}`}
                      >
                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-[var(--color-text-main)] text-[8px] font-bold px-1 rounded">{photo.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Hidden Real Device File Input */}
                  <input
                    type="file"
                    id="device-image-uploader"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleDeviceUpload}
                    className="hidden"
                  />

                  {/* Device Upload Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDeviceUpload(e); }}
                    onClick={() => document.getElementById('device-image-uploader').click()}
                    className="border-2 border-dashed border-[var(--border-color)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-2xl p-5 text-center cursor-pointer transition-all space-y-2 relative overflow-hidden group"
                  >
                    {isUploading ? (
                      <div className="py-2 space-y-3">
                        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div className="text-xs font-bold text-[var(--color-text-muted)]">Uploading from device... {uploadProgress}%</div>
                        <div className="w-full glass-card h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--color-primary)] h-full transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : menuImage ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={menuImage} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-250" />
                          <div className="text-left">
                            <span className="text-[10px] text-[var(--color-text-muted)] font-bold block">Device Image Active</span>
                            <span className="text-[9px] text-[var(--color-text-muted)] font-mono truncate block max-w-[150px]">{menuImage.substring(0, 30)}...</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('device-image-uploader').click();
                            }}
                            className="px-3 py-1.5 glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[10px] font-bold rounded-lg transition-all"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuImage('');
                              toast.success('Food photo removed.');
                            }}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 :bg-red-950/40 text-[10px] font-bold text-red-500 rounded-lg transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-650 block">📸 Upload Photo from Device</span>
                        <span className="text-[9px] text-[var(--color-text-muted)] block">Tap to access mobile gallery, tablet roll, or file explorer</span>
                        <span className="text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest font-bold block">JPG, PNG, WEBP</span>
                      </>
                    )}
                  </div>

                  <input
                    type="text"
                    value={menuImage}
                    onChange={e => setMenuImage(e.target.value)}
                    placeholder="Or enter custom URL..."
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Dish Description</label>
                  <textarea
                    value={menuDescription}
                    onChange={e => setMenuDescription(e.target.value)}
                    placeholder="Write a brief descriptive caption..."
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none h-16 resize-none"
                  />
                </div>

                {/* 🥦 Ingredients Management Section */}
                <div className="space-y-3 pt-3 border-t border-[var(--border-color)] ">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase flex items-center gap-1.5">
                      <BrainCircuit className="text-[var(--color-primary)] animate-pulse" size={14} />
                      🥦 Ingredients Management (Pantry Linking)
                    </label>
                    <span className="text-[9px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-bold uppercase">
                      {menuIngredients.length} linked
                    </span>
                  </div>

                  {/* Ingredients List (Sortable/Reorderable) */}
                  {menuIngredients.length > 0 ? (
                    <div className="space-y-2">
                      {menuIngredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-[var(--bg-panel)] border border-slate-150 rounded-xl gap-2 transition-all hover:border-[var(--color-primary)]/30"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] font-mono w-4">#{idx + 1}</span>
                            <div className="truncate text-xs font-bold text-[var(--color-text-main)] ">
                              {ing.name}
                            </div>
                            <div className="text-[10px] bg-[var(--bg-glass)] text-slate-650 px-2 py-0.5 rounded-full font-extrabold font-mono">
                              {ing.qty} {ing.unit}
                            </div>
                            {ing.pantryLinkId && (
                              <span className="text-[8px] bg-rose-400/15 text-rose-500 border border-emerald-555/20 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                                Linked
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Move Up */}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const next = [...menuIngredients];
                                const temp = next[idx];
                                next[idx] = next[idx - 1];
                                next[idx - 1] = temp;
                                setMenuIngredients(next);
                              }}
                              className={`p-1 rounded-lg hover:bg-[var(--bg-glass)] :glass-card text-[var(--color-text-muted)] ${idx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                              title="Move Up"
                            >
                              ▲
                            </button>
                            {/* Move Down */}
                            <button
                              type="button"
                              disabled={idx === menuIngredients.length - 1}
                              onClick={() => {
                                const next = [...menuIngredients];
                                const temp = next[idx];
                                next[idx] = next[idx + 1];
                                next[idx + 1] = temp;
                                setMenuIngredients(next);
                              }}
                              className={`p-1 rounded-lg hover:bg-[var(--bg-glass)] :glass-card text-[var(--color-text-muted)] ${idx === menuIngredients.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                              title="Move Down"
                            >
                              ▼
                            </button>
                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => {
                                setMenuIngredients(menuIngredients.filter((_, i) => i !== idx));
                                toast.success(`Removed ingredient: ${ing.name}`);
                              }}
                              className="p-1 rounded-lg hover:bg-red-50 :bg-red-950/20 text-red-500"
                              title="Remove Ingredient"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[var(--color-text-muted)] text-center py-2 bg-[var(--bg-panel)] rounded-xl border border-dashed border-[var(--border-color)] ">
                      No ingredients added yet. Set ingredients to automatically sync stock deduction.
                    </div>
                  )}

                  {/* Add Ingredient Form Inline */}
                  <div className="bg-[var(--bg-panel)]/50 p-3 rounded-xl border border-slate-150 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase">Pantry Link / Item Name</label>
                        <select
                          value={newIngPantryId}
                          onChange={e => {
                            const val = e.target.value;
                            setNewIngPantryId(val);
                            const matchingG = groceryItems.find(g => g.id === val);
                            if (matchingG) {
                              setNewIngName(matchingG.name);
                              if (matchingG.unit.includes('kg') || matchingG.unit.includes('g')) {
                                setNewIngUnit('g');
                              } else if (matchingG.unit.includes('liter') || matchingG.unit.includes('ml')) {
                                setNewIngUnit('ml');
                              } else {
                                setNewIngUnit('pcs');
                              }
                            }
                          }}
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                        >
                          <option value="">-- Choose from Pantry (recommended) --</option>
                          {groceryItems.map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.unit})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase">Or Custom Name</label>
                        <input
                          type="text"
                          value={newIngName}
                          onChange={e => {
                            setNewIngName(e.target.value);
                            setNewIngPantryId('');
                          }}
                          placeholder="E.g., Mozzarella Cheese"
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase">Quantity Required</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            value={newIngQty}
                            onChange={e => setNewIngQty(e.target.value)}
                            placeholder="e.g. 200"
                            className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                          />
                          <select
                            value={newIngUnit}
                            onChange={e => setNewIngUnit(e.target.value)}
                            className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                          >
                            {['g', 'kg', 'ml', 'pcs', 'packs'].map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newIngName) {
                            toast.error('Ingredient name is required');
                            return;
                          }
                          if (!newIngQty || parseFloat(newIngQty) <= 0) {
                            toast.error('Valid quantity is required');
                            return;
                          }
                          const payload = {
                            name: newIngName,
                            qty: parseFloat(newIngQty),
                            unit: newIngUnit,
                            pantryLinkId: newIngPantryId || null
                          };
                          setMenuIngredients([...menuIngredients, payload]);
                          toast.success(`Linked ingredient: ${newIngName}`);
                          setNewIngName('');
                          setNewIngQty('');
                          setNewIngPantryId('');
                        }}
                        className="py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-text-main)] rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 h-9"
                      >
                        <Plus size={14} /> Add Linked
                      </button>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer - Sticky */}
            <div className="p-6 border-t border-[var(--border-color)] shrink-0 glass-card/5 backdrop-blur-md flex gap-3 rounded-b-2xl">
              {editingItem && (
                <button
                  type="button"
                  onClick={() => { deleteMenuItem(editingItem.id); setShowEditMenuModal(false); resetMenuForm(); toast.success('Dish deleted'); }}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 :bg-red-950/40 text-red-500 rounded-xl font-bold text-xs flex items-center justify-center transition-all"
                  title="Delete Dish"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowAddMenuModal(false); setShowEditMenuModal(false); resetMenuForm(); }}
                className="flex-1 px-4 py-3 glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[var(--color-text-muted)] rounded-xl font-bold text-xs transition-all text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="menu-form"
                className="flex-[2] relative overflow-hidden bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-[var(--color-text-main)] rounded-full py-3.5 px-6 font-extrabold text-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-[0_4px_20px_-4px_rgba(249,115,22,0.5)] hover:shadow-[0_8px_25px_-5px_rgba(249,115,22,0.6)] flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 glass-card/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <CheckCircle size={18} className="relative z-10" />
                <span className="relative z-10">Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMBO ADD/EDIT MODAL FORM */}
      {(showAddComboModal || showEditComboModal) && (
        <div className="fixed inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass w-full max-w-lg border border-[var(--border-color)] relative flex flex-col shadow-2xl rounded-2xl max-h-[90vh]">

            {/* Header - Sticky */}
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--color-text-main)] ">
                <Sparkles className="text-[var(--color-primary)]" size={20} />
                {editingCombo ? 'Edit Combo Offer' : 'Create New Combo Offer'}
              </h2>
              <button
                onClick={() => { setShowAddComboModal(false); setShowEditComboModal(false); resetComboForm(); }}
                className="w-8 h-8 flex items-center justify-center glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[var(--color-text-muted)] rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <form id="combo-form" onSubmit={handleSaveCombo} className="space-y-4">

                {/* Combo Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Combo Name</label>
                  <input
                    type="text"
                    value={comboName}
                    onChange={e => setComboName(e.target.value)}
                    placeholder="E.g., Gourmet Steak & Mojito Feast"
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* Select Combo Items */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase block">Included Menu Items (Select Multiple)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-550/5 rounded-xl border border-[var(--border-color)] scrollbar-thin">
                    {menuItems.filter(item => !item.isCombo).map(item => {
                      const isSelected = comboSelectedItems.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${isSelected
                              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 text-[var(--color-primary)] '
                              : 'glass-card border-[var(--border-color)] text-[var(--color-text-muted)] '
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            className="rounded text-[var(--color-primary)] border-gray-300 focus:ring-rose-600"
                            onChange={() => {
                              if (isSelected) {
                                setComboSelectedItems(comboSelectedItems.filter(id => id !== item.id));
                              } else {
                                setComboSelectedItems([...comboSelectedItems, item.id]);
                              }
                            }}
                          />
                          <img src={item.image} alt={item.name} className="w-6 h-6 rounded-md object-cover" />
                          <span className="truncate flex-1">{item.name}</span>
                          <span className="font-bold text-[var(--color-text-muted)]">${item.price.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time Pricing Info */}
                {comboSelectedItems.length > 0 && (
                  <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 p-3.5 rounded-xl text-[11px] space-y-1 font-bold text-[var(--color-primary)] ">
                    <div className="flex justify-between">
                      <span>Subtotal of Included Items:</span>
                      <span>${totalOriginalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--color-primary)] font-extrabold">
                      <span>Combo Bundle Discount ({comboDiscount}%):</span>
                      <span>-${(totalOriginalPrice * (parseInt(comboDiscount) || 0) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--color-primary)]/15 pt-1.5 text-xs text-[var(--color-primary)] font-extrabold uppercase">
                      <span>Suggested Package Price:</span>
                      <span>${(totalOriginalPrice * (1 - (parseInt(comboDiscount) || 0) / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {/* Discount Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={comboDiscount}
                      onChange={e => {
                        const disc = e.target.value;
                        setComboDiscount(disc);
                        const computedVal = totalOriginalPrice * (1 - (parseInt(disc) || 0) / 100);
                        setComboPrice(computedVal > 0 ? computedVal.toFixed(2) : '');
                      }}
                      placeholder="15"
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  {/* Final Combo Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Combo Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={comboPrice}
                      onChange={e => setComboPrice(e.target.value)}
                      placeholder="35.00"
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  {/* Stock Portions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Stock Portions</label>
                    <input
                      type="number"
                      value={comboStock}
                      onChange={e => setComboStock(e.target.value)}
                      placeholder="10"
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Combo Special Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Combo Highlight status</label>
                  <div className="flex gap-2 mt-1">
                    {['Bestseller', 'Today Special', 'Restaurant Special'].map(status => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => setComboStatus(status)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all uppercase ${comboStatus === status
                            ? 'bg-[var(--color-primary)]/20 text-coral-400 border-[var(--color-primary)]/50 shadow-glow-secondary'
                            : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-slate-550'
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Combo Image Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase block">Combo Display Image</label>

                  {/* Device Upload Zone */}
                  <input
                    type="file"
                    id="combo-device-image-uploader"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleDeviceUpload(e, 'combo')}
                  />
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDeviceUpload(e, 'combo'); }}
                    onClick={() => document.getElementById('combo-device-image-uploader').click()}
                    className="border-2 border-dashed border-[var(--border-color)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-2xl p-5 text-center cursor-pointer transition-all space-y-2 relative overflow-hidden group"
                  >
                    {isUploading ? (
                      <div className="py-2 space-y-3">
                        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div className="text-xs font-bold text-[var(--color-text-muted)]">Uploading combo image... {uploadProgress}%</div>
                        <div className="w-full glass-card h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--color-primary)] h-full transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : comboImage ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img src={comboImage} alt="Combo Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-250" />
                          <div className="text-left truncate">
                            <span className="text-[10px] text-[var(--color-text-muted)] font-bold block">Combo Image Active</span>
                            <span className="text-[9px] text-[var(--color-text-muted)] font-mono truncate block">{comboImage.substring(0, 40)}...</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('combo-device-image-uploader').click();
                            }}
                            className="px-3 py-1.5 glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[10px] font-bold rounded-lg transition-all"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setComboImage('');
                              toast.success('Combo image removed.');
                            }}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 :bg-red-950/40 text-[10px] font-bold text-red-500 rounded-lg transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-650 block">🍱 Upload Combo Image from Device</span>
                        <span className="text-[9px] text-[var(--color-text-muted)] block">Drag & drop or click to browse</span>
                        <span className="text-[8px] text-[var(--color-text-muted)] uppercase tracking-widest font-bold block">JPG, PNG, WEBP</span>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: 'Feast Combo', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80' },
                      { name: 'Burger Pack', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80' },
                      { name: 'Steak Feast', url: 'https://images.unsplash.com/photo-1544025162-8316773229b4?auto=format&fit=crop&w=500&q=80' },
                      { name: 'Healthy Combo', url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=500&q=80' }
                    ].map(photo => (
                      <button
                        type="button"
                        key={photo.name}
                        onClick={() => {
                          setComboImage(photo.url);
                          toast.success(`Selected preset combo image: ${photo.name}`);
                        }}
                        className={`relative h-12 rounded-xl overflow-hidden border transition-all ${comboImage === photo.url ? 'border-[var(--color-primary)] ring-2 ring-rose-600/20 scale-95' : 'border-[var(--border-color)] '}`}
                      >
                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-1 bg-black/60 text-[var(--color-text-main)] text-[7px] font-bold px-0.5 rounded">{photo.name}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={comboImage}
                    onChange={e => setComboImage(e.target.value)}
                    placeholder="Or enter custom image URL..."
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* Combo Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Description</label>
                  <textarea
                    value={comboDescription}
                    onChange={e => setComboDescription(e.target.value)}
                    placeholder="E.g., Complete package with double portions, custom sides and premium beverage selection."
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none h-16 resize-none"
                  />
                </div>

              </form>
            </div>

            {/* Footer - Sticky */}
            <div className="p-6 border-t border-[var(--border-color)] shrink-0 glass-card/5 backdrop-blur-md flex gap-3 rounded-b-2xl">
              {editingCombo && (
                <button
                  type="button"
                  onClick={() => { deleteMenuItem(editingCombo.id); setShowEditComboModal(false); resetComboForm(); toast.success('Combo deleted'); }}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 :bg-red-950/40 text-red-500 rounded-xl font-bold text-xs flex items-center justify-center transition-all"
                  title="Delete Combo"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowAddComboModal(false); setShowEditComboModal(false); resetComboForm(); }}
                className="flex-1 px-4 py-3 glass-card hover:bg-[var(--bg-glass)] :bg-[var(--bg-glass)] text-[var(--color-text-muted)] rounded-xl font-bold text-xs transition-all text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="combo-form"
                className="flex-[2] relative overflow-hidden bg-gradient-to-r from-rose-700 to-rose-600 text-[var(--color-text-main)] rounded-full py-3.5 px-6 font-extrabold text-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-[0_4px_20px_-4px_rgba(168,85,247,0.5)] hover:shadow-[0_8px_25px_-5px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                <span>Save Combo Offer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GROCERY STOCK MODAL */}
      {showAddGroceryModal && (
        <div className="fixed inset-0 bg-[var(--bg-main)]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass w-full max-w-md p-6 border border-[var(--border-color)] relative flex flex-col gap-6 shadow-2xl">
            <button
              onClick={() => setShowAddGroceryModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold flex items-center gap-2">
              <Plus className="text-[var(--color-primary)]" size={20} />
              Stock New Ingredient
            </h2>

            <form onSubmit={handleAddGrocery} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Ingredient Name</label>
                <input
                  type="text"
                  value={groceryName}
                  onChange={e => setGroceryName(e.target.value)}
                  placeholder="E.g., Saffron Strands"
                  className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Starting Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={groceryQty}
                    onChange={e => setGroceryQty(e.target.value)}
                    placeholder="10.0"
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Unit</label>
                  <select
                    value={groceryUnit}
                    onChange={e => setGroceryUnit(e.target.value)}
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {['kg', 'liters', 'units', 'packets', 'bunches'].map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Category</label>
                  <select
                    value={groceryCategory}
                    onChange={e => setGroceryCategory(e.target.value)}
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {['Produce', 'Meat', 'Oils', 'Powders', 'Herbs', 'Seafood'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">Low Stock Limit</label>
                  <input
                    type="number"
                    step="0.1"
                    value={groceryThreshold}
                    onChange={e => setGroceryThreshold(e.target.value)}
                    placeholder="3.0"
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-premium bg-rose-700 hover:bg-purple-700 text-[var(--color-text-main)] rounded-xl py-3 font-bold text-xs mt-2 animate-bounce-subtle"
              >
                Log to Stock Book
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
