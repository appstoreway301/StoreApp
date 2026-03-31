import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app">
      <Navbar />
      <main className="container">{children}</main>
    </div>
  );
}
