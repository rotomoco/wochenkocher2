import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChefHat, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Deine Woche' },
    { path: '/wochenplanung', label: 'Wochenplanung' },
    { path: '/einkaufsliste', label: 'Einkaufsliste' },
    { path: '/gerichte', label: 'Gerichteübersicht' },
    { path: '/zutaten', label: 'Zutaten' },
    { path: '/einstellungen', label: 'Einstellungen' },
    { path: '/suche', label: 'Suche' },
    { path: '/profil', label: 'Profil', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-green-600 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-green-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="flex items-center ml-4 hover:bg-green-700 px-3 py-2 rounded-md">
                <ChefHat className="h-8 w-8" />
                <span className="ml-2 text-xl font-bold">WochenKocher</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Sliding Menu */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-50 flex flex-col`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-green-600">Menü</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center py-2 px-4 rounded-md ${
                    location.pathname === item.path
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-green-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon && <item.icon className="w-5 h-5 mr-2" />}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Tischlerei Collin, Duisburg</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;