import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { storage, isFirebaseMock } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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

  // Cancel tracking states
  const [cancellationLogs, setCancellationLogs] = useState([]);

  useEffect(() => {
    const loadLogs = () => {
      const stored = localStorage.getItem('rms_cancellation_logs');
      setCancellationLogs(stored ? JSON.parse(stored) : []);
    };
    loadLogs();

    window.addEventListener('storage', loadLogs);
    window.addEventListener('rms_sync', loadLogs);
    return () => {
      window.removeEventListener('storage', loadLogs);
      window.removeEventListener('rms_sync', loadLogs);
    };
  }, []);

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

    if (!isFirebaseMock && storage) {
      const storageRef = ref(storage, `${targetType === 'combo' ? 'combo' : 'menu'}_images/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          toast.error('Image upload failed!');
          setIsUploading(false);
          setUploadProgress(0);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setImageResult(downloadURL);
          setIsUploading(false);
          setUploadProgress(0);
          toast.success(`${targetType === 'combo' ? 'Combo' : 'Food'} photo successfully uploaded to cloud!`, { icon: '☁️' });
        }
      );
    } else {
      // Fallback base64 upload
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

  // Specials scheduler state
  const [specials, setSpecials] = useState(() => {
    const saved = localStorage.getItem('rms_specials');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Wagyu Beef Steak', tag: 'Chef Choice', discount: '10% OFF', scheduledFor: 'Dinner' },
      { id: '2', name: 'Truffle Mushroom Risotto', tag: 'Best Seller', discount: 'Chef Special', scheduledFor: 'Lunch' }
    ];
  });
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
  const peakParcelHours = peakHour ? `${peakHour}:00 - ${parseInt(peakHour)+1}:00` : 'N/A';

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
      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-[#0B0F19]/90 backdrop-blur-xl pb-4 pt-2 mb-2 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            disabled={navHistory.length === 0 && !isModalOpen}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed group flex-shrink-0"
            title="Go Back (Esc)"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Manager</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-[9px] font-extrabold uppercase text-orange-500 tracking-wider">{activeTab}</span>
              {isModalOpen && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-[9px] font-extrabold uppercase text-purple-500 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Editor
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A] dark:text-white uppercase flex items-center gap-3">
              Catalog & Stock Hub
            </h1>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          {activeTab === 'catalog' ? (
            <div className="flex gap-2">
              <button
                onClick={() => { resetMenuForm(); setShowAddMenuModal(true); }}
                className="btn-premium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full py-2.5 px-5 text-xs font-bold shadow-glow-orange flex items-center gap-2"
              >
                <Plus size={16} />
                Add Menu Dish
              </button>
              <button
                onClick={() => { resetComboForm(); setShowAddComboModal(true); }}
                className="btn-premium bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full py-2.5 px-5 text-xs font-bold shadow-glow-purple flex items-center gap-2"
              >
                <Plus size={16} />
                Create Combo Meal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddGroceryModal(true)}
              className="btn-premium bg-[#111111] dark:bg-[#F8F7F4] text-[#F8F7F4] dark:text-[#111111] rounded-full py-2.5 px-6 text-xs font-bold shadow-md flex items-center gap-2"
            >
              <Plus size={16} />
              Log Grocery Stock
            </button>
          )}
        </div>
      </div>

      {/* AI Insights predictive module */}
      <div className="glass p-5 border border-orange-500/25 bg-gradient-to-r from-orange-500/5 to-amber-500/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center animate-pulse">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-orange-500">AeroDine Intelligence Predictions</h3>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-normal font-semibold">
              Predictive models show a **14% Starter demand surge** tonight. Recommend restocking {lowStockGroceries.length > 0 ? lowStockGroceries.map(g => g.name).join(', ') : 'avocado and herbs'} immediately.
            </p>
          </div>
        </div>
        <span className="text-[9px] bg-orange-500/20 text-orange-500 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Active</span>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabChange('catalog')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'catalog' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-555 hover:text-slate-700'}`}
        >
          Master Menu Catalog ({menuItems.length})
        </button>
        <button
          onClick={() => handleTabChange('inventory')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'inventory' ? 'border-gold-500 text-gold-500' : 'border-transparent text-slate-555 hover:text-slate-700'}`}
        >
          Raw Ingredients Inventory ({groceryItems.length})
        </button>
        <button
          onClick={() => handleTabChange('specials')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'specials' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-555 hover:text-slate-700'}`}
        >
          Restaurant Specials ({specials.length})
        </button>
        <button
          onClick={() => handleTabChange('analytics')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'analytics' ? 'border-cyan-555 text-cyan-550' : 'border-transparent text-slate-555 hover:text-slate-700'}`}
        >
          Menu & Sales Analytics
        </button>
        <button
          onClick={() => handleTabChange('alerts')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'alerts' ? 'border-red-500 text-red-500 animate-pulse' : 'border-transparent text-slate-555 hover:text-slate-700'}`}
        >
          Alert Center ({kitchenAlerts?.filter(a => a.status === 'active' || a.status === 'resolved').length || 0})
        </button>
        <button
          onClick={() => handleTabChange('parcel')}
          className={`pb-3 font-extrabold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'parcel' ? 'border-purple-500 text-purple-500 shadow-glow-purple' : 'border-transparent text-slate-555 hover:text-slate-700'}`}
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
                <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search dish names or dietary tags..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-mint-500"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
                {['All', 'Chats', 'Snacks', 'Combo', 'Fast Food', 'Main Course', 'Street Food', 'Beverage', 'Dessert'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${filterCategory === cat ? 'bg-mint-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-500'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Sub-Filters */}
            <div className="flex flex-wrap gap-2 items-center border-t border-slate-100 dark:border-slate-850 pt-3">
              <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest mr-2">Dietary:</span>
              {['All', 'Veg', 'Non Veg', 'Vegan', 'Egg', 'Seafood', 'Beverages', 'Desserts', 'None'].map(diet => (
                <button
                  key={diet}
                  onClick={() => setFilterDietary(diet)}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-all border ${filterDietary === diet ? 'bg-[#FF8A3D] text-white border-transparent shadow-sm' : 'bg-transparent border-slate-200 dark:border-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                >
                  {diet === 'None' ? 'Other' : diet}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Notion table */}
          <div className="glass overflow-hidden border border-white/20 dark:border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-400">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Dish Detail</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Category</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Price</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Prep time</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Portions</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Status Badges</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {filteredMenu.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="font-extrabold text-slate-950 dark:text-white text-sm">{item.name}</div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block truncate max-w-xs">{item.description}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 dark:bg-slate-850 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-500">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-950 dark:text-white">${item.price.toFixed(2)}</td>
                      <td className="py-4 px-6 font-bold text-slate-500">{item.prepTime || 15} mins</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 min-w-[130px]">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={item.stock}
                              onChange={e => updateMenuStock(item.id, parseInt(e.target.value) || 0)}
                              className={`w-12 text-center bg-slate-50 dark:bg-slate-950 border rounded-lg py-1 font-bold focus:outline-none ${item.stock <= 3 ? 'border-orange-500/50 dark:border-orange-550 text-orange-500 bg-orange-500/5' : 'border-slate-200 dark:border-slate-800'}`}
                            />
                            <span className="text-[10px] text-slate-400">portions</span>
                            {item.stock <= 3 && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 animate-pulse flex items-center gap-0.5 border border-orange-500/20">
                                ⚠️ Low
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            <button
                              onClick={() => updateMenuStock(item.id, (item.stock || 0) + 5)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[8px] font-bold rounded"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => updateMenuStock(item.id, (item.stock || 0) + 10)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[8px] font-bold rounded"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => updateMenuStock(item.id, (item.stock || 0) + 20)}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[8px] font-bold rounded"
                            >
                              +20
                            </button>
                            <button
                              onClick={() => updateMenuStock(item.id, 50)}
                              className="px-1.5 py-0.5 bg-mint-500/15 hover:bg-mint-500/25 text-mint-500 text-[8px] font-bold rounded border border-mint-500/20"
                            >
                              Full
                            </button>
                          </div>
                          {item.lastRestockedAt && (
                            <span className="text-[8px] text-slate-450 block font-mono">
                              Restocked: {new Date(item.lastRestockedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                          {item.dietary && item.dietary !== 'None' && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                              item.dietary === 'Veg' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              item.dietary === 'Non Veg' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              item.dietary === 'Vegan' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' :
                              item.dietary === 'Egg' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              item.dietary === 'Seafood' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                              item.dietary === 'Beverage' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                              item.dietary === 'Dessert' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}>
                              {item.dietary}
                            </span>
                          )}
                          {(item.specialBadges || []).map(badge => (
                            <span key={badge} className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-purple-500/20">
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
                          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-300"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-xl text-red-500"
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
            <div className="glass p-5 border border-white/20 dark:border-white/5 flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-[#1A1A1A] dark:text-white uppercase tracking-wider">Schedule Featured Special</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Highlight premium creations on customer headers</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Select Catalog Item</label>
                  <select 
                    value={specialDishName}
                    onChange={e => setSpecialDishName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
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
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-455 uppercase">Discount / Text</label>
                    <input 
                      type="text" 
                      value={specialPromo}
                      onChange={e => setSpecialPromo(e.target.value)}
                      placeholder="10% OFF"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Schedule Timing</label>
                  <select 
                    value={specialSchedule}
                    onChange={e => setSpecialSchedule(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none"
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
                    localStorage.setItem('rms_specials', JSON.stringify(updated));
                    window.dispatchEvent(new Event('rms_sync'));
                    toast.success(`${specialDishName} added to today's specials!`, { icon: '★' });
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-glow-orange transition-all mt-2"
                >
                  Confirm Special Schedule
                </button>
              </div>
            </div>

            {/* Active specials list grid */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-xs text-[#1A1A1A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="text-amber-500 animate-spin-slow" size={15} />
                Today's Active Scheduled Specials ({specials.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {specials.map(spec => {
                  const matchedDish = menuItems.find(item => item.name === spec.name);
                  return (
                    <div 
                      key={spec.id} 
                      className="glass overflow-hidden border border-amber-550/20 bg-[#1C1C1E] rounded-3xl relative flex flex-col justify-between"
                    >
                      {/* Image header with overlay */}
                      <div className="h-28 relative">
                        <img 
                          src={matchedDish?.image || 'https://images.unsplash.com/photo-1544025162-8316773229b4?auto=format&fit=crop&w=500&q=80'} 
                          alt={spec.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] to-transparent"></div>
                        <span className="absolute top-3 left-3 bg-[#FF8A3D] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {spec.scheduledFor}
                        </span>
                        <span className="absolute top-3 right-3 bg-amber-500 text-[#111111] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {spec.discount}
                        </span>
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="font-extrabold text-white text-sm">{spec.name}</h4>
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mt-0.5">
                            ★ {spec.tag}
                          </span>
                        </div>

                        <button 
                          onClick={() => {
                            const updated = specials.filter(s => s.id !== spec.id);
                            setSpecials(updated);
                            localStorage.setItem('rms_specials', JSON.stringify(updated));
                            window.dispatchEvent(new Event('rms_sync'));
                            toast.success(`Removed ${spec.name} from specials`);
                          }}
                          className="w-full py-2 bg-slate-900/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border border-white/5 hover:border-red-500/20 transition-all flex items-center justify-center gap-1.5"
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
          <div className="glass p-5 border border-purple-500/25 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-purple-500">Parcel & Takeaway Analytics</h3>
                <p className="text-xs text-slate-450 dark:text-slate-350 max-w-2xl mt-1 leading-normal font-bold">
                  Track live parcel orders, revenue generation, and peak pickup timings.
                </p>
              </div>
            </div>
            <span className="text-[9px] bg-purple-500/20 text-purple-500 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Live Tracker</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="glass p-6 border border-white/20 dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Parcel Requests</span>
              <h3 className="text-3xl font-extrabold mt-3 text-purple-500">{totalParcelOrders}</h3>
            </div>
            <div className="glass p-6 border border-white/20 dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Parcel Revenue</span>
              <h3 className="text-3xl font-extrabold mt-3 text-emerald-500">${parcelRevenue.toFixed(2)}</h3>
            </div>
            <div className="glass p-6 border border-white/20 dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Packaging Revenue</span>
              <h3 className="text-3xl font-extrabold mt-3 text-emerald-400">${packagingRevenue.toFixed(2)}</h3>
            </div>
            <div className="glass p-6 border border-white/20 dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Peak Parcel Hours</span>
              <h3 className="text-xl font-extrabold mt-3 text-[#1A1A1A] dark:text-white flex items-center gap-2"><Clock size={16}/> {peakParcelHours}</h3>
            </div>
            <div className="glass p-6 border border-white/20 dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Parcels</span>
              <h3 className="text-3xl font-extrabold mt-3 text-orange-500">{activeParcelOrders.length}</h3>
            </div>
          </div>

          <div className="glass overflow-hidden border border-white/20 dark:border-white/5 mt-6">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-[#1A1A1A] dark:text-white uppercase tracking-wider">Recent Parcel Orders Tracker</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-400">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Token Number</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Customer Name</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Pickup Time</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Amount</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {parcelOrders.map(order => (
                    <tr key={order.id || order.orderNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-4 px-6 font-extrabold text-purple-500">{order.orderType === 'parcel' ? (order.parcelToken || 'N/A') : `Table #${order.table}`}</td>
                      <td className="py-4 px-6 font-bold text-slate-950 dark:text-white">{order.orderType === 'parcel' ? (order.customerName || 'N/A') : 'Balance Parcel'}</td>
                      <td className="py-4 px-6 font-bold text-slate-500">{order.orderType === 'parcel' ? (order.pickupTime || 'N/A') : 'N/A'}</td>
                      <td className="py-4 px-6 font-extrabold text-slate-950 dark:text-white">${order.orderType === 'parcel' ? (order.total?.toFixed(2) || '0.00') : (order.packagingCharge?.toFixed(2) || '0.00')}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          (order.status === 'pending' || order.balanceParcelStatus === 'pending') ? 'bg-slate-100 text-slate-500' :
                          (order.status === 'preparing' || order.balanceParcelStatus === 'packing') ? 'bg-orange-500/10 text-orange-500' :
                          (order.status === 'packed' || order.balanceParcelStatus === 'packed') ? 'bg-purple-500/20 text-purple-600' :
                          (order.status === 'ready_for_pickup' || order.balanceParcelStatus === 'ready_for_pickup') ? 'bg-gold-500/20 text-gold-500' :
                          order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-slate-800 text-slate-400'
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
          <div className="glass p-5 border border-cyan-500/25 bg-gradient-to-r from-cyan-500/5 to-sky-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center animate-pulse">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-cyan-500">AI Sales Intelligence & Peak Demand Deck</h3>
                <p className="text-xs text-slate-450 dark:text-slate-350 max-w-2xl mt-1 leading-normal font-bold">
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
            <div className="glass p-5 border border-white/5 flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-xs text-[#1A1A1A] dark:text-white uppercase tracking-wider">Category Sales Volume Share</h3>
                <p className="text-[10px] text-slate-400 font-bold">Total orders volume mapped by food categories</p>
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
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Visual Recharts Dietary Pie Chart */}
            <div className="glass p-5 border border-white/5 flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-xs text-[#1A1A1A] dark:text-white uppercase tracking-wider">Dietary Revenue Contribution</h3>
                <p className="text-[10px] text-slate-400 font-bold">Aggregate revenue breakdown by food dietary badges</p>
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
                    <span className="text-xs sm:text-sm font-extrabold text-[#1A1A1A] dark:text-white">${todayRevenue.toFixed(0)}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Today</span>
                  </div>
                </div>

                <div className="space-y-3 text-[10px] font-bold w-full sm:w-auto flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[#1A1A1A] dark:text-white">Veg</span>
                    </div>
                    <span className="text-slate-400">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-[#1A1A1A] dark:text-white">Non-Veg</span>
                    </div>
                    <span className="text-slate-400">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <span className="text-slate-400">Other</span>
                    </div>
                    <span className="text-slate-400">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Lists Deck */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Most Ordered */}
            <div className="glass p-5 border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  🔥 Most Ordered Dishes
                </h4>
                <div className="space-y-3 mt-4">
                  {menuAnalytics.mostOrdered.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[#1A1A1A] dark:text-white max-w-[110px] truncate">{item.name}</span>
                      <span className="text-slate-400 font-mono">{item.count} orders (+{item.growth}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Top Revenue */}
            <div className="glass p-5 border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-cyan-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  💰 Top Revenue Contributors
                </h4>
                <div className="space-y-3 mt-4">
                  {menuAnalytics.topRevenue.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[#1A1A1A] dark:text-white max-w-[110px] truncate">{item.name}</span>
                      <span className="text-cyan-500 font-mono">${item.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Peak Selling Times */}
            <div className="glass p-5 border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  🕒 Peak Demand Slot Tracker
                </h4>
                <div className="space-y-3 mt-4">
                  {menuAnalytics.all.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[#1A1A1A] dark:text-white max-w-[110px] truncate">{item.name}</span>
                      <span className="text-amber-500 uppercase tracking-wider text-[8px] bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {item.timeSlot} Peak
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Underperforming Dishes */}
            <div className="glass p-5 border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  📉 Underperforming Warning
                </h4>
                <div className="space-y-3 mt-4">
                  {menuAnalytics.leastOrdered.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[#1A1A1A] dark:text-white max-w-[110px] truncate">{item.name}</span>
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
            <div className="glass p-6 border border-white/20 dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Raw Volume</span>
              <h3 className="text-3xl font-extrabold mt-3">{groceryItems.reduce((acc, g) => acc + g.qty, 0).toFixed(1)} items</h3>
              <p className="text-[10px] text-slate-500 mt-2 font-bold">Standard pantry density healthy</p>
            </div>

            <div className="glass p-6 border border-white/20 dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Low Stock Warnings</span>
              <h3 className={`text-3xl font-extrabold mt-3 ${lowStockGroceries.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                {lowStockGroceries.length} alert(s)
              </h3>
              <p className="text-[10px] text-slate-500 mt-2 font-bold">Autogenerated ordering queue recommendation</p>
            </div>

            <div className="glass p-6 border border-white/20 dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pantry Status</span>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-mint-500 rounded-full animate-ping"></span>
                <span className="text-lg font-bold text-mint-500">Live & Synced</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold">Linked to active recipe estimators</p>
            </div>
          </div>

          {/* Grocery interactive table */}
          <div className="glass overflow-hidden border border-white/20 dark:border-white/5">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-400">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Ingredient Name</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Category</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Current Qty</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Threshold</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Status</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {groceryItems.map(item => {
                    const isLow = item.qty <= item.stockThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-4 px-6 font-extrabold text-slate-950 dark:text-white">{item.name}</td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-100 dark:bg-slate-850 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-500">
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
                              className="w-14 text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 font-bold focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-400">{item.stockThreshold.toFixed(1)} {item.unit}</td>
                        <td className="py-4 px-6">
                          {isLow ? (
                            <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-500/20 animate-pulse-red">Low Stock</span>
                          ) : (
                            <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20">Adequate</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => deleteGroceryItem(item.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-xl text-red-500"
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
                  <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-950 dark:text-white text-sm">{item.name}</h4>
                        <span className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 mt-1 inline-block rounded text-[9px] font-bold text-slate-500">
                          {item.category}
                        </span>
                      </div>
                      {isLow ? (
                        <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[9px] font-bold border border-red-500/20 animate-pulse-red">Low Stock</span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-500/20">Adequate</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={item.qty}
                          onChange={e => updateGroceryStock(item.id, e.target.value)}
                          className="w-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 font-bold focus:outline-none focus:border-orange-500"
                        />
                        <span className="text-[10px] text-slate-500 font-bold">{item.unit}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Min: {item.stockThreshold.toFixed(1)}</span>
                    </div>
                    
                    <button
                      onClick={() => deleteGroceryItem(item.id)}
                      className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-xl text-red-500 flex items-center justify-center gap-1.5 text-[10px] font-extrabold"
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
              <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Active Alerts</span>
              <span className="text-2xl font-extrabold text-red-550 block mt-2">{(kitchenAlerts || []).filter(a => a.status === 'active').length} unresolved</span>
              <span className="text-[10px] text-slate-450 block mt-1 font-bold">Instantly synced across KDS</span>
            </div>

            <div className="glass p-5 border border-white/20 dark:border-white/5">
              <span className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider">Resolved Alerts</span>
              <span className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400 block mt-2">
                {(kitchenAlerts || []).filter(a => a.status === 'resolved').length}
              </span>
              <span className="text-[10px] text-slate-455 block mt-1 font-bold">Actioned by management/kitchen</span>
            </div>

            <div className="glass p-5 border border-white/20 dark:border-white/5">
              <span className="text-[10px] text-slate-455 font-bold block uppercase tracking-wider">Top Alert Trigger</span>
              <span className="text-2xl font-extrabold text-orange-500 block mt-2 truncate">
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
          <div className="glass overflow-hidden border border-white/20 dark:border-white/5">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase">Real-Time Alert History</h3>
                <p className="text-[10px] text-slate-400 font-bold">Centralized hub for all kitchen exceptions and operational issues</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-400">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Status</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Alert Type</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Message</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Date & Time</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500">Resolved By</th>
                    <th className="py-4 px-6 uppercase tracking-wider font-bold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {(!kitchenAlerts || kitchenAlerts.length === 0) ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 font-bold">No kitchen alerts logged. Operations are smooth!</td>
                    </tr>
                  ) : (
                    kitchenAlerts.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            log.status === 'active' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                            log.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-extrabold text-slate-950 dark:text-white">{log.type}</td>
                        <td className="py-4 px-6 text-slate-900 dark:text-slate-350 max-w-[200px] truncate">{log.message}</td>
                        <td className="py-4 px-6 text-slate-450 font-semibold">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          {log.resolvedBy ? (
                            <span className="bg-slate-105 dark:bg-slate-850 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 rounded-xl text-emerald-500"
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
                              className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 rounded-xl text-red-500"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass w-full max-w-lg border border-white/20 dark:border-white/5 relative flex flex-col shadow-2xl rounded-2xl max-h-[85vh] sm:max-h-[90vh]">
            
            {/* Header - Sticky */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#1A1A1A] dark:text-white">
                <Sparkles className="text-mint-500" size={20} />
                {editingItem ? 'Edit Catalog Dish' : 'Create Catalog Dish'}
              </h2>
              <button
                onClick={() => { setShowAddMenuModal(false); setShowEditMenuModal(false); resetMenuForm(); }}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-5 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent pb-10">
              <form id="menu-form" onSubmit={handleSaveMenu} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Dish Name</label>
                <input
                  type="text"
                  value={menuName}
                  onChange={e => setMenuName(e.target.value)}
                  placeholder="E.g., Lobster Thermidor"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-mint-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuPrice}
                    onChange={e => setMenuPrice(e.target.value)}
                    placeholder="24.99"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-mint-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Portions</label>
                  <input
                    type="number"
                    value={menuStock}
                    onChange={e => setMenuStock(e.target.value)}
                    placeholder="15"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-mint-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={menuCategory}
                    onChange={e => setMenuCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-mint-500"
                  >
                    {['Chats', 'Snacks', 'Combo', 'Fast Food', 'Main Course', 'Street Food', 'Beverage', 'Dessert'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Dietary</label>
                  <select
                    value={menuDietary}
                    onChange={e => setMenuDietary(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-mint-500"
                  >
                    {['Veg', 'Non Veg', 'Vegan', 'Egg', 'Seafood', 'Beverages', 'Desserts', 'None'].map(diet => (
                      <option key={diet} value={diet}>{diet === 'None' ? 'Other' : diet}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Prep (m)</label>
                  <input
                    type="number"
                    value={menuPrepTime}
                    onChange={e => setMenuPrepTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Availability</label>
                  <select
                    value={menuTimeRange}
                    onChange={e => setMenuTimeRange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2 text-xs focus:outline-none"
                  >
                    {['Breakfast', 'Lunch', 'Dinner'].map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 py-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Special Status Badges</label>
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
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${specialBadges.includes(badge) ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-glow-purple' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-purple-500/30'}`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Food Photo Upload / Selection</label>

                {/* Preset realistic photo quick selectors */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Risotto', url: 'https://images.unsplash.com/photo-1476124369491-e5addf5fff71?auto=format&fit=crop&w=500&q=80' },
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
                      className={`relative h-12 rounded-xl overflow-hidden border transition-all ${menuImage === photo.url ? 'border-mint-500 ring-2 ring-mint-500/20 scale-95' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded">{photo.name}</span>
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
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-mint-500 hover:bg-mint-500/5 rounded-2xl p-5 text-center cursor-pointer transition-all space-y-2 relative overflow-hidden group"
                >
                  {isUploading ? (
                    <div className="py-2 space-y-3">
                      <div className="w-6 h-6 border-2 border-mint-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div className="text-xs font-bold text-slate-500">Uploading from device... {uploadProgress}%</div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-mint-500 h-full transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : menuImage ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={menuImage} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-250" />
                        <div className="text-left">
                          <span className="text-[10px] text-slate-500 font-bold block">Device Image Active</span>
                          <span className="text-[9px] text-slate-400 font-mono truncate block max-w-[150px]">{menuImage.substring(0, 30)}...</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('device-image-uploader').click();
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded-lg transition-all"
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
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-[10px] font-bold text-red-500 rounded-lg transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-650 dark:text-slate-350 block">📸 Upload Photo from Device</span>
                      <span className="text-[9px] text-slate-400 block">Tap to access mobile gallery, tablet roll, or file explorer</span>
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block">JPG, PNG, WEBP</span>
                    </>
                  )}
                </div>

                <input
                  type="text"
                  value={menuImage}
                  onChange={e => setMenuImage(e.target.value)}
                  placeholder="Or enter custom URL..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-mint-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Dish Description</label>
                <textarea
                  value={menuDescription}
                  onChange={e => setMenuDescription(e.target.value)}
                  placeholder="Write a brief descriptive caption..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none h-16 resize-none"
                />
              </div>

              {/* 🥦 Ingredients Management Section */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <BrainCircuit className="text-mint-500 animate-pulse" size={14} />
                    🥦 Ingredients Management (Pantry Linking)
                  </label>
                  <span className="text-[9px] bg-mint-500/10 text-mint-500 px-2 py-0.5 rounded-full font-bold uppercase">
                    {menuIngredients.length} linked
                  </span>
                </div>

                {/* Ingredients List (Sortable/Reorderable) */}
                {menuIngredients.length > 0 ? (
                  <div className="space-y-2">
                    {menuIngredients.map((ing, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-xl gap-2 transition-all hover:border-mint-500/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 font-mono w-4">#{idx + 1}</span>
                          <div className="truncate text-xs font-bold text-[#1A1A1A] dark:text-white">
                            {ing.name}
                          </div>
                          <div className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-2 py-0.5 rounded-full font-extrabold font-mono">
                            {ing.qty} {ing.unit}
                          </div>
                          {ing.pantryLinkId && (
                            <span className="text-[8px] bg-emerald-500/15 text-emerald-500 border border-emerald-555/20 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
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
                            className={`p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 ${idx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
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
                            className={`p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 ${idx === menuIngredients.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
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
                            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                            title="Remove Ingredient"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-450 dark:text-slate-500 text-center py-2 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-850">
                    No ingredients added yet. Set ingredients to automatically sync stock deduction.
                  </div>
                )}

                {/* Add Ingredient Form Inline */}
                <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Pantry Link / Item Name</label>
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
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-mint-500"
                      >
                        <option value="">-- Choose from Pantry (recommended) --</option>
                        {groceryItems.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Or Custom Name</label>
                      <input
                        type="text"
                        value={newIngName}
                        onChange={e => {
                          setNewIngName(e.target.value);
                          setNewIngPantryId('');
                        }}
                        placeholder="E.g., Mozzarella Cheese"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-mint-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Quantity Required</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={newIngQty}
                          onChange={e => setNewIngQty(e.target.value)}
                          placeholder="e.g. 200"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-mint-500"
                        />
                        <select
                          value={newIngUnit}
                          onChange={e => setNewIngUnit(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-mint-500"
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
                      className="py-1.5 bg-mint-500 hover:bg-mint-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 h-9"
                    >
                      <Plus size={14} /> Add Linked
                    </button>
                  </div>
                </div>
              </div>

              </form>
            </div>

            {/* Footer - Sticky */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white/5 backdrop-blur-md flex gap-3 rounded-b-2xl">
              {editingItem && (
                <button
                  type="button"
                  onClick={() => { deleteMenuItem(editingItem.id); setShowEditMenuModal(false); resetMenuForm(); toast.success('Dish deleted'); }}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl font-bold text-xs flex items-center justify-center transition-all"
                  title="Delete Dish"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowAddMenuModal(false); setShowEditMenuModal(false); resetMenuForm(); }}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-all text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="menu-form"
                className="flex-[2] relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full py-3.5 px-6 font-extrabold text-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-[0_4px_20px_-4px_rgba(249,115,22,0.5)] hover:shadow-[0_8px_25px_-5px_rgba(249,115,22,0.6)] flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <CheckCircle size={18} className="relative z-10" />
                <span className="relative z-10">Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMBO ADD/EDIT MODAL FORM */}
      {(showAddComboModal || showEditComboModal) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass w-full max-w-lg border border-white/20 dark:border-white/5 relative flex flex-col shadow-2xl rounded-2xl max-h-[90vh]">
            
            {/* Header - Sticky */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#1A1A1A] dark:text-white">
                <Sparkles className="text-purple-500" size={20} />
                {editingCombo ? 'Edit Combo Offer' : 'Create New Combo Offer'}
              </h2>
              <button
                onClick={() => { setShowAddComboModal(false); setShowEditComboModal(false); resetComboForm(); }}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <form id="combo-form" onSubmit={handleSaveCombo} className="space-y-4">
                
                {/* Combo Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Combo Name</label>
                  <input
                    type="text"
                    value={comboName}
                    onChange={e => setComboName(e.target.value)}
                    placeholder="E.g., Gourmet Steak & Mojito Feast"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Select Combo Items */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Included Menu Items (Select Multiple)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-550/5 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-850 scrollbar-thin">
                    {menuItems.filter(item => !item.isCombo).map(item => {
                      const isSelected = comboSelectedItems.includes(item.id);
                      return (
                        <label 
                          key={item.id} 
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            className="rounded text-purple-600 border-slate-300 dark:border-slate-800 focus:ring-purple-500"
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
                          <span className="font-bold text-slate-400">${item.price.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time Pricing Info */}
                {comboSelectedItems.length > 0 && (
                  <div className="bg-purple-500/5 border border-purple-500/10 p-3.5 rounded-xl text-[11px] space-y-1 font-bold text-purple-600 dark:text-purple-400">
                    <div className="flex justify-between">
                      <span>Subtotal of Included Items:</span>
                      <span>${totalOriginalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-orange-500 font-extrabold">
                      <span>Combo Bundle Discount ({comboDiscount}%):</span>
                      <span>-${(totalOriginalPrice * (parseInt(comboDiscount) || 0) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-purple-500/15 pt-1.5 text-xs text-purple-600 dark:text-purple-400 font-extrabold uppercase">
                      <span>Suggested Package Price:</span>
                      <span>${(totalOriginalPrice * (1 - (parseInt(comboDiscount) || 0) / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {/* Discount Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Discount %</label>
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
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  {/* Final Combo Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Combo Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={comboPrice}
                      onChange={e => setComboPrice(e.target.value)}
                      placeholder="35.00"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Stock Portions */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Portions</label>
                    <input
                      type="number"
                      value={comboStock}
                      onChange={e => setComboStock(e.target.value)}
                      placeholder="10"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Combo Special Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Combo Highlight status</label>
                  <div className="flex gap-2 mt-1">
                    {['Bestseller', 'Today Special', 'Restaurant Special'].map(status => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => setComboStatus(status)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all uppercase ${
                          comboStatus === status 
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-glow-purple' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Combo Image Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Combo Display Image</label>
                  
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
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-500/5 rounded-2xl p-5 text-center cursor-pointer transition-all space-y-2 relative overflow-hidden group"
                  >
                    {isUploading ? (
                      <div className="py-2 space-y-3">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div className="text-xs font-bold text-slate-500">Uploading combo image... {uploadProgress}%</div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-500 h-full transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : comboImage ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img src={comboImage} alt="Combo Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-250" />
                          <div className="text-left truncate">
                            <span className="text-[10px] text-slate-500 font-bold block">Combo Image Active</span>
                            <span className="text-[9px] text-slate-450 dark:text-slate-400 font-mono truncate block">{comboImage.substring(0, 40)}...</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('combo-device-image-uploader').click();
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded-lg transition-all"
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
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-[10px] font-bold text-red-500 rounded-lg transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-650 dark:text-slate-355 block">🍱 Upload Combo Image from Device</span>
                        <span className="text-[9px] text-slate-400 block">Drag & drop or click to browse</span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold block">JPG, PNG, WEBP</span>
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
                        className={`relative h-12 rounded-xl overflow-hidden border transition-all ${comboImage === photo.url ? 'border-purple-500 ring-2 ring-purple-500/20 scale-95' : 'border-slate-200 dark:border-slate-800'}`}
                      >
                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-1 bg-black/60 text-white text-[7px] font-bold px-0.5 rounded">{photo.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  <input
                    type="text"
                    value={comboImage}
                    onChange={e => setComboImage(e.target.value)}
                    placeholder="Or enter custom image URL..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Combo Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                  <textarea
                    value={comboDescription}
                    onChange={e => setComboDescription(e.target.value)}
                    placeholder="E.g., Complete package with double portions, custom sides and premium beverage selection."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none h-16 resize-none"
                  />
                </div>

              </form>
            </div>

            {/* Footer - Sticky */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white/5 backdrop-blur-md flex gap-3 rounded-b-2xl">
              {editingCombo && (
                <button
                  type="button"
                  onClick={() => { deleteMenuItem(editingCombo.id); setShowEditComboModal(false); resetComboForm(); toast.success('Combo deleted'); }}
                  className="px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-xl font-bold text-xs flex items-center justify-center transition-all"
                  title="Delete Combo"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowAddComboModal(false); setShowEditComboModal(false); resetComboForm(); }}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-all text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="combo-form"
                className="flex-[2] relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full py-3.5 px-6 font-extrabold text-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-[0_4px_20px_-4px_rgba(168,85,247,0.5)] hover:shadow-[0_8px_25px_-5px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass w-full max-w-md p-6 border border-white/20 dark:border-white/5 relative flex flex-col gap-6 shadow-2xl">
            <button
              onClick={() => setShowAddGroceryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold flex items-center gap-2">
              <Plus className="text-purple-500" size={20} />
              Stock New Ingredient
            </h2>

            <form onSubmit={handleAddGrocery} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Ingredient Name</label>
                <input
                  type="text"
                  value={groceryName}
                  onChange={e => setGroceryName(e.target.value)}
                  placeholder="E.g., Saffron Strands"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Starting Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={groceryQty}
                    onChange={e => setGroceryQty(e.target.value)}
                    placeholder="10.0"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Unit</label>
                  <select
                    value={groceryUnit}
                    onChange={e => setGroceryUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-purple-500"
                  >
                    {['kg', 'liters', 'units', 'packets', 'bunches'].map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={groceryCategory}
                    onChange={e => setGroceryCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-purple-500"
                  >
                    {['Produce', 'Meat', 'Oils', 'Powders', 'Herbs', 'Seafood'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Low Stock Limit</label>
                  <input
                    type="number"
                    step="0.1"
                    value={groceryThreshold}
                    onChange={e => setGroceryThreshold(e.target.value)}
                    placeholder="3.0"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-premium bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-bold text-xs mt-2 animate-bounce-subtle"
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
