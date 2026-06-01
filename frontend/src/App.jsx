import React, { useState, useEffect } from 'react';

// --- INLINE SVG ICONS ---
const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  ),
  Products: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  Customers: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Orders: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
  )
};

const API_BASE = import.meta.env.VITE_API_URL || '';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'products', 'customers', 'orders'
  
  // App state
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    total_revenue: 0,
    low_stock_products: []
  });
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);
  
  // Modals state
  const [productModal, setProductModal] = useState({ show: false, mode: 'create', data: null });
  const [customerModal, setCustomerModal] = useState({ show: false, data: null });
  const [orderModal, setOrderModal] = useState({ show: false, data: null }); // view receipt
  const [orderCreateMode, setOrderCreateMode] = useState(false); // toggle build order UI
  
  // Form input validation state
  const [errors, setErrors] = useState({});

  // Helper: Trigger custom toast alert
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- API OPERATIONS ---
  
  const fetchAllData = async () => {
    try {
      const prodRes = await fetch(`${API_BASE}/api/products`);
      const productsData = await prodRes.json();
      setProducts(Array.isArray(productsData) ? productsData : []);

      const custRes = await fetch(`${API_BASE}/api/customers`);
      const customersData = await custRes.json();
      setCustomers(Array.isArray(customersData) ? customersData : []);

      const ordRes = await fetch(`${API_BASE}/api/orders`);
      const ordersData = await ordRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      const statsRes = await fetch(`${API_BASE}/api/orders/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      addToast('Failed to connect to the backend server API.', 'error');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- PRODUCT SUBMISSIONS ---
  
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = {
      name: formData.get('name'),
      sku: formData.get('sku'),
      price: parseFloat(formData.get('price')),
      quantity_in_stock: parseInt(formData.get('quantity_in_stock'), 10)
    };

    // Client-side validations
    const formErrors = {};
    if (!productData.name) formErrors.name = 'Product name is required';
    if (!productData.sku) formErrors.sku = 'SKU is required';
    if (isNaN(productData.price) || productData.price <= 0) formErrors.price = 'Price must be greater than 0';
    if (isNaN(productData.quantity_in_stock) || productData.quantity_in_stock < 0) formErrors.quantity_in_stock = 'Quantity cannot be negative';

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});

    try {
      let res;
      if (productModal.mode === 'create') {
        res = await fetch(`${API_BASE}/api/products/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } else {
        res = await fetch(`${API_BASE}/api/products/${productModal.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      }

      const resData = await res.json();
      if (!res.ok) {
        addToast(resData.detail || 'Failed to save product.', 'error');
      } else {
        addToast(`Product "${productData.name}" successfully ${productModal.mode === 'create' ? 'created' : 'updated'}.`);
        setProductModal({ show: false, mode: 'create', data: null });
        fetchAllData();
      }
    } catch (err) {
      addToast('An error occurred while saving the product.', 'error');
    }
  };

  const handleProductDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) {
        addToast(resData.detail || 'Failed to delete product.', 'error');
      } else {
        addToast(`Product "${name}" successfully deleted.`);
        fetchAllData();
      }
    } catch (err) {
      addToast('An error occurred while deleting the product.', 'error');
    }
  };

  // --- CUSTOMER SUBMISSIONS ---
  
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const customerData = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone_number: formData.get('phone_number')
    };

    // Client validations
    const formErrors = {};
    if (!customerData.full_name) formErrors.full_name = 'Full name is required';
    if (!customerData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) formErrors.email = 'Valid email is required';
    if (!customerData.phone_number) formErrors.phone_number = 'Phone number is required';

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/api/customers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const resData = await res.json();
      if (!res.ok) {
        addToast(resData.detail || 'Failed to save customer.', 'error');
      } else {
        addToast(`Customer "${customerData.full_name}" successfully added.`);
        setCustomerModal({ show: false, data: null });
        fetchAllData();
      }
    } catch (err) {
      addToast('An error occurred while saving customer.', 'error');
    }
  };

  const handleCustomerDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/customers/${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) {
        addToast(resData.detail || 'Failed to delete customer.', 'error');
      } else {
        addToast(`Customer "${name}" successfully deleted.`);
        fetchAllData();
      }
    } catch (err) {
      addToast('An error occurred while deleting the customer.', 'error');
    }
  };

  // --- ORDER BUILDER ---
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  const handleOrderItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;
    setOrderItems(newItems);
  };

  // Real-time calculation of order preview total
  const calculatePreviewTotal = () => {
    let total = 0;
    orderItems.forEach(item => {
      const prod = products.find(p => p.id === parseInt(item.product_id, 10));
      if (prod) {
        total += parseFloat(prod.price) * item.quantity;
      }
    });
    return total;
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      addToast('Please select a customer for the order.', 'error');
      return;
    }

    // Filter valid items
    const validItems = orderItems
      .filter(item => item.product_id !== '')
      .map(item => ({
        product_id: parseInt(item.product_id, 10),
        quantity: parseInt(item.quantity, 10)
      }));

    if (validItems.length === 0) {
      addToast('Order must contain at least one product.', 'error');
      return;
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      items: validItems
    };

    try {
      const res = await fetch(`${API_BASE}/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (!res.ok) {
        addToast(resData.detail || 'Failed to place order.', 'error');
      } else {
        addToast('Order placed successfully.');
        setOrderCreateMode(false);
        setSelectedCustomerId('');
        setOrderItems([{ product_id: '', quantity: 1 }]);
        fetchAllData();
      }
    } catch (err) {
      addToast('An error occurred while submitting the order.', 'error');
    }
  };

  const handleOrderDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to cancel and delete Order #${id}? Product stock levels will be restored.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) {
        addToast(resData.detail || 'Failed to cancel order.', 'error');
      } else {
        addToast(`Order #${id} has been cancelled. Product stocks restored.`);
        fetchAllData();
      }
    } catch (err) {
      addToast('An error occurred while cancelling the order.', 'error');
    }
  };

  // --- VIEWS SEARCH FILTERS ---
  const [prodSearch, setProdSearch] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(custSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    const custName = o.customer?.full_name || '';
    return custName.toLowerCase().includes(orderSearch.toLowerCase()) ||
           o.id.toString().includes(orderSearch);
  });

  return (
    <div className="app-container">
      {/* --- SIDEBAR --- */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </div>
          <h2>INVENCORE</h2>
        </div>
        <ul className="sidebar-menu">
          <li className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => { setCurrentView('dashboard'); setOrderCreateMode(false); }}>
              <Icons.Dashboard />
              <span>Dashboard</span>
            </button>
          </li>
          <li className={`sidebar-item ${currentView === 'products' ? 'active' : ''}`}>
            <button onClick={() => { setCurrentView('products'); setOrderCreateMode(false); }}>
              <Icons.Products />
              <span>Products</span>
            </button>
          </li>
          <li className={`sidebar-item ${currentView === 'customers' ? 'active' : ''}`}>
            <button onClick={() => { setCurrentView('customers'); setOrderCreateMode(false); }}>
              <Icons.Customers />
              <span>Customers</span>
            </button>
          </li>
          <li className={`sidebar-item ${currentView === 'orders' ? 'active' : ''}`}>
            <button onClick={() => { setCurrentView('orders'); }}>
              <Icons.Orders />
              <span>Orders</span>
            </button>
          </li>
        </ul>
        <div className="sidebar-footer">
          <span>v1.0.0 (Production)</span>
        </div>
      </aside>

      {/* --- TOASTS --- */}
      <div className="toasts-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icons.Alert />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="main-content">
        
        {/* ======================================================== */}
        {/* --- VIEW: DASHBOARD --- */}
        {/* ======================================================== */}
        {currentView === 'dashboard' && (
          <>
            <div className="content-header">
              <h1>System Dashboard</h1>
              <button className="btn btn-primary" onClick={() => { setCurrentView('orders'); setOrderCreateMode(true); }}>
                <Icons.Plus /> New Order
              </button>
            </div>

            {/* Top Metrics Row */}
            <div className="stats-grid">
              <div className="stat-card blue" onClick={() => setCurrentView('products')}>
                <div className="stat-info">
                  <span className="stat-label">Total Products</span>
                  <span className="stat-value">{stats.total_products}</span>
                </div>
                <div className="stat-icon"><Icons.Products /></div>
              </div>
              <div className="stat-card emerald" onClick={() => setCurrentView('customers')}>
                <div className="stat-info">
                  <span className="stat-label">Total Customers</span>
                  <span className="stat-value">{stats.total_customers}</span>
                </div>
                <div className="stat-icon"><Icons.Customers /></div>
              </div>
              <div className="stat-card amber" onClick={() => { setCurrentView('orders'); setOrderCreateMode(false); }}>
                <div className="stat-info">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">{stats.total_orders}</span>
                </div>
                <div className="stat-icon"><Icons.Orders /></div>
              </div>
              <div className="stat-card emerald">
                <div className="stat-info">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-value">${parseFloat(stats.total_revenue).toFixed(2)}</span>
                </div>
                <div className="stat-icon" style={{ color: 'var(--accent-emerald)' }}>$</div>
              </div>
            </div>

            {/* Alerts Panel for Low Stock */}
            <div className="alert-box">
              <div className="alert-header">
                <Icons.Alert />
                <span>Inventory Alerts (Stock under 10 units)</span>
              </div>
              {stats.low_stock_products.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>All products are sufficiently stocked. No low-stock items.</p>
              ) : (
                <div className="alert-list">
                  {stats.low_stock_products.map(p => (
                    <span key={p.id} className="alert-pill">
                      {p.name} (SKU: {p.sku}) - {p.quantity_in_stock} left
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dashboard Recent Orders Panel */}
            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title">Recent Activity</h3>
                <button className="btn btn-secondary btn-action" onClick={() => { setCurrentView('orders'); setOrderCreateMode(false); }}>View All</button>
              </div>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Total Amount</th>
                      <th>Date Placed</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{o.customer?.full_name || 'N/A'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>${parseFloat(o.total_amount).toFixed(2)}</td>
                        <td>{new Date(o.created_at).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-action" onClick={() => setOrderModal({ show: true, data: o })}>
                            <Icons.Eye />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders placed yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* --- VIEW: PRODUCTS --- */}
        {/* ======================================================== */}
        {currentView === 'products' && (
          <>
            <div className="content-header">
              <h1>Product Catalog</h1>
              <button className="btn btn-primary" onClick={() => { setErrors({}); setProductModal({ show: true, mode: 'create', data: null }); }}>
                <Icons.Plus /> Add Product
              </button>
            </div>

            <div className="panel">
              <div className="controls-row">
                <input
                  type="text"
                  placeholder="Search products by SKU or name..."
                  className="search-input"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Qty in Stock</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      let statusPill = <span className="status-pill success">Normal</span>;
                      if (p.quantity_in_stock === 0) {
                        statusPill = <span className="status-pill danger">Out of Stock</span>;
                      } else if (p.quantity_in_stock < 10) {
                        statusPill = <span className="status-pill warning">Low Stock</span>;
                      }

                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{p.sku}</td>
                          <td>{p.name}</td>
                          <td>${parseFloat(p.price).toFixed(2)}</td>
                          <td>{p.quantity_in_stock}</td>
                          <td>{statusPill}</td>
                          <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-action" onClick={() => { setErrors({}); setProductModal({ show: true, mode: 'edit', data: p }); }}>
                              <Icons.Edit />
                            </button>
                            <button className="btn btn-danger btn-action" onClick={() => handleProductDelete(p.id, p.name)}>
                              <Icons.Trash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* --- VIEW: CUSTOMERS --- */}
        {/* ======================================================== */}
        {currentView === 'customers' && (
          <>
            <div className="content-header">
              <h1>Customer Profiles</h1>
              <button className="btn btn-primary" onClick={() => { setErrors({}); setCustomerModal({ show: true, data: null }); }}>
                <Icons.Plus /> Add Customer
              </button>
            </div>

            <div className="panel">
              <div className="controls-row">
                <input
                  type="text"
                  placeholder="Search customers by name or email..."
                  className="search-input"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Full Name</th>
                      <th>Email Address</th>
                      <th>Phone Number</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(c => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                        <td>{c.email}</td>
                        <td>{c.phone_number}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-danger btn-action" onClick={() => handleCustomerDelete(c.id, c.full_name)}>
                            <Icons.Trash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* --- VIEW: ORDERS --- */}
        {/* ======================================================== */}
        {currentView === 'orders' && (
          <>
            {!orderCreateMode ? (
              <>
                <div className="content-header">
                  <h1>Order Listing</h1>
                  <button className="btn btn-primary" onClick={() => setOrderCreateMode(true)}>
                    <Icons.Plus /> Create Order
                  </button>
                </div>

                <div className="panel">
                  <div className="controls-row">
                    <input
                      type="text"
                      placeholder="Search orders by customer or ID..."
                      className="search-input"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>

                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Total Amount</th>
                          <th>Date Placed</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(o => (
                          <tr key={o.id}>
                            <td>#{o.id}</td>
                            <td style={{ fontWeight: 600 }}>{o.customer?.full_name || 'N/A'}</td>
                            <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>${parseFloat(o.total_amount).toFixed(2)}</td>
                            <td>{new Date(o.created_at).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="btn btn-secondary btn-action" onClick={() => setOrderModal({ show: true, data: o })}>
                                <Icons.Eye /> View Receipt
                              </button>
                              <button className="btn btn-danger btn-action" onClick={() => handleOrderDelete(o.id)}>
                                <Icons.Trash /> Cancel Order
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              // --- ORDER BUILDER UI ---
              <>
                <div className="content-header">
                  <h1>Create New Order</h1>
                  <button className="btn btn-secondary" onClick={() => setOrderCreateMode(false)}>Cancel & Return</button>
                </div>

                <div className="order-builder-layout">
                  {/* Left Side: Order Builder Panel */}
                  <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 className="panel-title">Add Items to Cart</h3>
                    
                    <div className="form-group">
                      <label>1. Select Customer</label>
                      <select
                        className="form-control"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      >
                        <option value="">-- Choose a Customer --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>2. Product Items</label>
                      <div className="order-items-list">
                        {orderItems.map((item, index) => {
                          const selectedProd = products.find(p => p.id === parseInt(item.product_id, 10));

                          return (
                            <div key={index} className="order-item-row">
                              {/* Product selection */}
                              <select
                                className="form-control"
                                value={item.product_id}
                                onChange={(e) => handleOrderItemChange(index, 'product_id', e.target.value)}
                              >
                                <option value="">-- Select Product --</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                                    {p.name} (SKU: {p.sku}) - ${parseFloat(p.price).toFixed(2)} [Stock: {p.quantity_in_stock}]
                                  </option>
                                ))}
                              </select>

                              {/* Quantity select */}
                              <input
                                type="number"
                                min="1"
                                className="form-control"
                                value={item.quantity}
                                onChange={(e) => handleOrderItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                              />

                              {/* Price preview */}
                              <div style={{ fontStyle: 'normal', color: 'var(--text-secondary)', padding: '0 8px', fontSize: '0.9rem' }}>
                                {selectedProd ? `$${(parseFloat(selectedProd.price) * item.quantity).toFixed(2)}` : '$0.00'}
                              </div>

                              {/* Remove row */}
                              <button
                                type="button"
                                className="btn btn-danger btn-action"
                                onClick={() => handleRemoveOrderItem(index)}
                                disabled={orderItems.length === 1}
                              >
                                <Icons.Close />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAddOrderItem}
                        style={{ marginTop: '14px', width: 'fit-content' }}
                      >
                        <Icons.Plus /> Add Another Product
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Order Summary Panel */}
                  <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
                    <h3 className="panel-title">Checkout Summary</h3>
                    
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Selected Customer:</span>
                        <span style={{ fontWeight: 600 }}>
                          {customers.find(c => c.id === parseInt(selectedCustomerId, 10))?.full_name || 'None selected'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Distinct Items:</span>
                        <span>{orderItems.filter(item => item.product_id !== '').length}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Grand Total:</span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        ${calculatePreviewTotal().toFixed(2)}
                      </span>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleOrderSubmit}>
                      Place Order
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </main>

      {/* ======================================================== */}
      {/* --- MODAL: PRODUCT (ADD / EDIT) --- */}
      {/* ======================================================== */}
      {productModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{productModal.mode === 'create' ? 'Create Product Profile' : 'Modify Product Profile'}</h3>
              <button className="modal-close" onClick={() => setProductModal({ show: false, mode: 'create', data: null })}>
                <Icons.Close />
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="sku">SKU Code</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    defaultValue={productModal.data ? productModal.data.sku : ''}
                    className="form-control"
                    placeholder="e.g. LAP-HP-001"
                    disabled={productModal.mode === 'edit'}
                  />
                  {errors.sku && <span className="form-error">{errors.sku}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="name">Product Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={productModal.data ? productModal.data.name : ''}
                    className="form-control"
                    placeholder="e.g. HP EliteBook Laptop"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="price">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    defaultValue={productModal.data ? productModal.data.price : ''}
                    className="form-control"
                    placeholder="0.00"
                  />
                  {errors.price && <span className="form-error">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="quantity_in_stock">Quantity in Stock</label>
                  <input
                    type="number"
                    id="quantity_in_stock"
                    name="quantity_in_stock"
                    defaultValue={productModal.data ? productModal.data.quantity_in_stock : '0'}
                    className="form-control"
                    placeholder="0"
                  />
                  {errors.quantity_in_stock && <span className="form-error">{errors.quantity_in_stock}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setProductModal({ show: false, mode: 'create', data: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --- MODAL: CUSTOMER (ADD) --- */}
      {/* ======================================================== */}
      {customerModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Customer Profile</h3>
              <button className="modal-close" onClick={() => setCustomerModal({ show: false, data: null })}>
                <Icons.Close />
              </button>
            </div>
            <form onSubmit={handleCustomerSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="full_name">Customer Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    className="form-control"
                    placeholder="e.g. John Doe"
                  />
                  {errors.full_name && <span className="form-error">{errors.full_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    placeholder="e.g. john.doe@example.com"
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone_number">Phone Number</label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    className="form-control"
                    placeholder="e.g. +1 555-0199"
                  />
                  {errors.phone_number && <span className="form-error">{errors.phone_number}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCustomerModal({ show: false, data: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --- MODAL: ORDER DETAILS / RECEIPT --- */}
      {/* ======================================================== */}
      {orderModal.show && orderModal.data && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '600px' }}>
            <div className="modal-header">
              <h3>Order Invoice - Receipt</h3>
              <button className="modal-close" onClick={() => setOrderModal({ show: false, data: null })}>
                <Icons.Close />
              </button>
            </div>
            <div className="modal-body">
              <div className="invoice-container">
                
                {/* Header Meta */}
                <div className="invoice-header">
                  <div className="invoice-section">
                    <span className="invoice-section-title">Invoice To</span>
                    <strong style={{ fontSize: '1.05rem' }}>{orderModal.data.customer?.full_name || 'N/A'}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{orderModal.data.customer?.email}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{orderModal.data.customer?.phone_number}</span>
                  </div>
                  <div className="invoice-meta">
                    <span className="invoice-section-title">Order ID</span>
                    <h3 style={{ color: 'var(--accent-blue)', margin: '4px 0' }}>#{orderModal.data.id}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(orderModal.data.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Items list */}
                <div className="invoice-section">
                  <span className="invoice-section-title" style={{ marginBottom: '8px' }}>Line Items</span>
                  <div className="table-container">
                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Item SKU / Name</th>
                          <th>Unit Price</th>
                          <th>Quantity</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderModal.data.items?.map(item => (
                          <tr key={item.id}>
                            <td>
                              <strong style={{ display: 'block', color: 'var(--accent-blue)' }}>{item.product?.sku || 'UNKNOWN'}</strong>
                              <span>{item.product?.name || 'Deleted Product'}</span>
                            </td>
                            <td>${parseFloat(item.price_at_order).toFixed(2)}</td>
                            <td>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              ${(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total amount summary */}
                <div className="invoice-total-box">
                  <span className="invoice-total-label">Grand Total Amount Paid:</span>
                  <span className="invoice-total-value">${parseFloat(orderModal.data.total_amount).toFixed(2)}</span>
                </div>

              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOrderModal({ show: false, data: null })}>Close Invoice</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
