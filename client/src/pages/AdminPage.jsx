import { Link } from 'react-router-dom';

export default function AdminPage() {
  return (
    <div className="admin-page">
      <h1>Admin Panel</h1>
      <div className="admin-cards">
        <Link to="/admin/products" className="admin-card">
          <h2>Products</h2>
          <p>Add, edit, and manage products, images, and stock.</p>
        </Link>
        <Link to="/admin/categories" className="admin-card">
          <h2>Categories</h2>
          <p>Create and manage category tags for products.</p>
        </Link>
        <Link to="/admin/stock" className="admin-card">
          <h2>Stock & Sales</h2>
          <p>View inventory levels, out of stock alerts, and sales summary.</p>
        </Link>
        <Link to="/admin/shipments" className="admin-card">
          <h2>Shipments</h2>
          <p>View shipment status, retry failed labels, and manage shipping.</p>
        </Link>
      </div>
    </div>
  );
}
