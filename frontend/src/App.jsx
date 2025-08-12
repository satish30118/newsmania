import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NewsFeed from './pages/NewsFeed';
import Bookmarks from './pages/Bookmarks';
import { AuthProvider, useAuth } from './utils/auth';

function PrivateRoute({ children }){
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

export default function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/" element={<PrivateRoute><NewsFeed/></PrivateRoute>} />
          <Route path="/bookmarks" element={<PrivateRoute><Bookmarks/></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
