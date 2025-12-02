import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="mr-8 hidden md:flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">AI RFP Manager</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground/60">Create RFP</Link>
              <Link to="/rfps" className="transition-colors hover:text-foreground/80 text-foreground/60">All RFPs</Link>
              <Link to="/vendors" className="transition-colors hover:text-foreground/80 text-foreground/60">Vendors</Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
