// frontend/src/context/CartContext.js
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

// Создаем кастомный хук для удобного использования контекста
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    // Добавление товара
    const addToCart = (product) => {
        setCartItems(prevItems => {
            const exist = prevItems.find(item => item.id === product.id);
            if (exist) {
                // Если товар уже есть, увеличиваем количество
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            // Если товара нет, добавляем его с количеством 1
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    // Изменение количества товара
    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            // Если количество 0 или меньше, удаляем товар
            removeFromCart(productId);
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity: quantity } : item
                )
            );
        }
    };

    // Удаление товара из корзины
    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    // Полная очистка корзины
    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        addToCart,
        updateQuantity,
        clearCart,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};