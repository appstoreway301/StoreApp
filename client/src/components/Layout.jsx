import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="app">
      <Navbar />
      <main className="container">{children}</main>
      <Footer />
    </div>
  );
}
