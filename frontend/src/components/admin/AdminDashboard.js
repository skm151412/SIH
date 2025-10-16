import React, { useState } from 'react';
import { Route, Switch, useRouteMatch, NavLink } from 'react-router-dom';
import MapView from './MapView';
import ComplaintManagement from './ComplaintManagement';
import UserManagement from './UserManagement';
import DashboardStats from './DashboardStats';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { path, url } = useRouteMatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="admin-dashboard">
      <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Dashboard</h2>
          <button 
            className="mobile-close" 
            onClick={() => setMobileMenuOpen(false)}
          >
            &times;
          </button>
        </div>
        <nav className="sidebar-nav">
          <NavLink exact to={`${url}`} activeClassName="active" onClick={() => setMobileMenuOpen(false)}>
            <i className="fas fa-chart-bar"></i> Overview
          </NavLink>
          <NavLink to={`${url}/map`} activeClassName="active" onClick={() => setMobileMenuOpen(false)}>
            <i className="fas fa-map-marked-alt"></i> Map Visualization
          </NavLink>
          <NavLink to={`${url}/complaints`} activeClassName="active" onClick={() => setMobileMenuOpen(false)}>
            <i className="fas fa-clipboard-list"></i> Complaints
          </NavLink>
          <NavLink to={`${url}/users`} activeClassName="active" onClick={() => setMobileMenuOpen(false)}>
            <i className="fas fa-users"></i> Users
          </NavLink>
        </nav>
      </div>
      
      <div className="admin-content">
        <div className="content-header">
          <button 
            className="mobile-menu-button" 
            onClick={() => setMobileMenuOpen(true)}
          >
            <i className="fas fa-bars"></i>
          </button>
          <div className="header-title">
            <h1>Civic Issues Administration</h1>
          </div>
          <div className="header-actions">
            <button className="refresh-button">
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
        
        <div className="content-body">
          <Switch>
            <Route exact path={path}>
              <DashboardStats />
            </Route>
            <Route path={`${path}/map`}>
              <MapView />
            </Route>
            <Route path={`${path}/complaints`}>
              <ComplaintManagement />
            </Route>
            <Route path={`${path}/users`}>
              <UserManagement />
            </Route>
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;