import { Link } from 'react-router-dom';

export default function AdminPage() {
  return (
    <div className="admin-page">
      <h1>Admin Panel</h1>
      <div className="admin-cards">
        <Link to="/admin/products" className="admin-card">
          <h2>Products</h2>
          <p>Add and manage products, images, stock, and categories.</p>
        </Link>
        <Link to="/admin/stock" className="admin-card">
          <h2>Stock & Sales</h2>
          <p>View inventory levels, out of stock alerts, and sales summary.</p>
        </Link>
        <Link to="/admin/branches" className="admin-card">
          <h2>Branches</h2>
          <p>Manage authorized stores, their physical address, and product stock per branch.</p>
        </Link>
        <Link to="/admin/shipments" className="admin-card">
          <h2>Shipments</h2>
          <p>View shipment status, retry failed labels, and manage shipping.</p>
        </Link>
      </div>
    </div>
  );
}
