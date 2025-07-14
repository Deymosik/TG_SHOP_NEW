// frontend/src/pages/CartPage.js
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../utils/telegram';
import './CartPage.css';

const CartPage = () => {
    const tg = useTelegram();
    const { cartItems, updateQuantity, clearCart, totalPrice } = useCart();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        shipping: 'Почта'
    });

    // Отслеживаем, заполнена ли форма, чтобы активировать кнопку "Готово"
    const isFormValid = formData.name && formData.phone && formData.address;

    useEffect(() => {
        // 3. Все вызовы tg теперь безопасны
        tg.BackButton.show();
        const handleBackButtonClick = () => navigate(-1);
        tg.BackButton.onClick(handleBackButtonClick);

        return () => {
            tg.BackButton.offClick(handleBackButtonClick);
            tg.BackButton.hide();
        };
    }, [navigate, tg]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckout = () => {
        // Формируем текст заказа
        const orderDetails = cartItems.map(item =>
            `${item.name} (x${item.quantity}) - ${item.quantity * item.price} ₽`
        ).join('\n');

        const fullMessage = `
Здравствуйте! Хочу сделать заказ.

👤 **Получатель:** ${formData.name}
📞 **Телефон:** ${formData.phone}
🚚 **Доставка:** ${formData.shipping}
🏠 **Адрес:** ${formData.address}

---
**Заказ:**
${orderDetails}
---
**Итого:** ${totalPrice.toFixed(2)} ₽
        `.trim();

        // Этот метод закроет Web App и передаст данные боту.
        // ВАЖНО: Это сработает, только если вы откроете Web App через кнопку в чате с ботом!
        // Для локальной разработки эта команда может не сработать.
        tg.sendData(fullMessage);
        // Если sendData не поддерживается или вы хотите другой UX:
        // tg.close();
    };

    if (cartItems.length === 0 && !showForm) {
        return (
            <div className="cart-page empty">
                <h2>Корзина пуста</h2>
                <button onClick={() => navigate('/')}>Перейти к товарам</button>
            </div>
        );
    }

    return (
        <div className="cart-page">
            {!showForm ? (
                <>
                    <div className="cart-header">
                        <h2>Ваш заказ</h2>
                        <button className="clear-cart-btn" onClick={clearCart}>Очистить корзину</button>
                    </div>
                    <div className="cart-items">
                        {cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <img src={item.main_image} alt={item.name} className="cart-item-img" />
                                <div className="cart-item-info">
                                    <div className="cart-item-name">{item.name}</div>
                                    <div className="cart-item-price">{item.price} ₽</div>
                                </div>
                                <div className="cart-item-controls">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="sticky-footer">
                        <div className="total-price">
                            <span>Итого:</span>
                            <span>{totalPrice.toFixed(2)} ₽</span>
                        </div>
                        <button className="checkout-btn" onClick={() => setShowForm(true)}>
                            Оформить заказ
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h2>Оформление заказа</h2>
                    <form className="checkout-form">
                        <input type="text" name="name" placeholder="ФИО" value={formData.name} onChange={handleInputChange} required />
                        <input type="tel" name="phone" placeholder="Номер телефона" value={formData.phone} onChange={handleInputChange} required />
                        <input type="text" name="address" placeholder="Адрес доставки (Город, улица, дом, квартира, индекс)" value={formData.address} onChange={handleInputChange} required />
                        <div className="shipping-options">
                            <label className={formData.shipping === 'Почта' ? 'active' : ''}>
                                <input type="radio" name="shipping" value="Почта" checked={formData.shipping === 'Почта'} onChange={handleInputChange} />
                                Почта
                            </label>
                            <label className={formData.shipping === 'СДЭК' ? 'active' : ''}>
                                <input type="radio" name="shipping" value="СДЭК" checked={formData.shipping === 'СДЭК'} onChange={handleInputChange} />
                                СДЭК
                            </label>
                        </div>
                    </form>
                    <div className="sticky-footer">
                        <button className="checkout-btn" onClick={handleCheckout} disabled={!isFormValid}>
                            Готово
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CartPage;