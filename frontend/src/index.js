// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext'; // 1. Импорт

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* 2. Оборачиваем CartProvider в NotificationProvider */}
        <NotificationProvider>
            <CartProvider>
                <App />
            </CartProvider>
        </NotificationProvider>
    </React.StrictMode>
);