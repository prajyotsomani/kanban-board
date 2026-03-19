import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Router>
      <SocketProvider>
        <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
          <Navbar />
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/board/:id" 
                element={
                  <ProtectedRoute>
                    <BoardView />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </div>
        <ToastContainer theme="dark" position="bottom-right" />
      </SocketProvider>
    </Router>
  );
};

export default App;
