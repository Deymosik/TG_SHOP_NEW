// frontend/src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import { useTelegram } from './utils/telegram';
import Notification from './components/Notification'; // 1. Импорт
import { useNotification } from './context/NotificationContext'; // 2. Импорт
import './App.css';

function App() {
    const tg = useTelegram();
    const { notification } = useNotification(); // 3. Получаем состояние уведомления

    useEffect(() => {
        tg.ready();
    }, [tg]);

    return (
        <BrowserRouter>
            {/* 4. Размещаем компонент Notification здесь. Он будет поверх всех страниц */}
            <Notification
                message={notification.message}
                type={notification.type}
                isVisible={notification.isVisible}
            />
            <Routes>
                <Route index element={<HomePage />} />
                <Route path="product/:id" element={<ProductPage />} />
                <Route path="cart" element={<CartPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;