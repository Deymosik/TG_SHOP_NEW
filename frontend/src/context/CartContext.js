// frontend/src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    // НОВЫЙ STATE для хранения информации о скидке
    const [discountInfo, setDiscountInfo] = useState({
        subtotal: 0,
        discount_amount: 0,
        final_total: 0,
        applied_rule: null,
        upsell_hint: null
    });

    // Этот useEffect будет следить за изменениями в корзине и отправлять запрос на бэкенд
    useEffect(() => {
        // Не делаем запрос, если корзина пуста
        if (cartItems.length === 0) {
            setDiscountInfo({ subtotal: 0, discount_amount: 0, final_total: 0, applied_rule: null, upsell_hint: null });
            return;
        }

        // Создаем "чистую" версию корзины для отправки (только id и quantity)
        const itemsToCalculate = cartItems.map(item => ({ id: item.id, quantity: item.quantity }));

        axios.post('/api/calculate-cart/', { cartItems: itemsToCalculate })
            .then(response => {
                setDiscountInfo(response.data);
            })
            .catch(error => {
                console.error("Ошибка при расчете корзины:", error);
            });

    }, [cartItems]); // Зависимость от cartItems

    const addToCart = (product) => {
        setCartItems(prevItems => {
            const exist = prevItems.find(item => item.id === product.id);
            if (exist) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                )
            );
        }
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        addToCart,
        updateQuantity,
        clearCart,
        discountInfo // Передаем всю информацию о скидке
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};