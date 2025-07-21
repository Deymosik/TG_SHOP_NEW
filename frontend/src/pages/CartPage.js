// frontend/src/pages/CartPage.js
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../utils/telegram';
import { SHOP_CONFIG } from '../config';
import './CartPage.css';

const CartPage = () => {
    const tg = useTelegram();
    const navigate = useNavigate();

    // 1. ПОЛУЧАЕМ НОВЫЕ ДАННЫЕ ИЗ КОНТЕКСТА КОРЗИНЫ
    // Вместо totalPrice мы теперь используем discountInfo, который содержит все расчеты.
    const { cartItems, updateQuantity, clearCart, discountInfo } = useCart();

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: tg.initDataUnsafe.user?.first_name ?? '',
        phone: '',
        address: '',
        shipping: 'Почта'
    });

    const isFormValid = formData.name && formData.phone && formData.address;

    useEffect(() => {
        tg.BackButton.show();
        const handleBackButtonClick = () => {
            if (showForm) {
                setShowForm(false);
            } else {
                navigate(-1);
            }
        };
        tg.BackButton.onClick(handleBackButtonClick);

        return () => {
            tg.BackButton.offClick(handleBackButtonClick);
            tg.BackButton.hide();
        };
    }, [navigate, showForm, tg]); // Добавляем tg в зависимости

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 2. ОБНОВЛЯЕМ ЛОГИКУ ОФОРМЛЕНИЯ ЗАКАЗА, ЧТОБЫ ВКЛЮЧИТЬ СКИДКИ
    const handleCheckout = () => {
        const orderDetails = cartItems.map(item =>
            `${item.name} (x${item.quantity})`
        ).join('\n');

        // Формируем красивую сводку по заказу с учетом скидки
        const summary = `
-----------------
Сумма: ${discountInfo.subtotal} ₽
Скидка (${discountInfo.applied_rule || 'нет'}): ${discountInfo.discount_amount} ₽
**Итого к оплате: ${discountInfo.final_total} ₽**
        `.trim();

        const fullMessage = `
Привет! Хочу сделать заказ.

**Клиент:** ${formData.name}
**Телефон:** ${formData.phone}
**Доставка:** ${formData.shipping}, ${formData.address}

**Состав заказа:**
${orderDetails}

${summary}
        `.trim();

        const encodedText = encodeURIComponent(fullMessage);
        const telegramLink = `https://t.me/${SHOP_CONFIG.MANAGER_USERNAME}?text=${encodedText}`;

        tg.openTelegramLink(telegramLink);
        tg.close();
    };

    if (cartItems.length === 0 && !showForm) {
        return (
            <div className="cart-page empty">
                <h2>Корзина пуста</h2>
                <button onClick={() => navigate('/')}>Перейти к товарам</button>
            </div>
        );
    }

    // --- 3. ГЛАВНЫЕ ИЗМЕНЕНИЯ В ОТОБРАЖЕНИИ (JSX) ---
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
                        {/* БЛОК ПОДСКАЗКИ ДЛЯ УВЕЛИЧЕНИЯ ПРОДАЖ */}
                        {discountInfo.upsell_hint && (
                            <div className="upsell-hint">
                                ✨ {discountInfo.upsell_hint}
                            </div>
                        )}

                        {/* БЛОК С ПОЛНОЙ СВОДКОЙ ПО ЗАКАЗУ */}
                        <div className="order-summary">
                            <div className="summary-row">
                                <span>Товары</span>
                                <span>{discountInfo.subtotal} ₽</span>
                            </div>
                            {/* Показываем строку со скидкой, только если она есть */}
                            {parseFloat(discountInfo.discount_amount) > 0 && (
                                <div className="summary-row discount">
                                    <span>Скидка ({discountInfo.applied_rule || 'Ваша скидка'})</span>
                                    <span>- {discountInfo.discount_amount} ₽</span>
                                </div>
                            )}
                            <div className="summary-row final-total">
                                <span>Итого</span>
                                <span>{discountInfo.final_total} ₽</span>
                            </div>
                        </div>

                        <button className="checkout-btn" onClick={() => setShowForm(true)}>
                            Оформить заказ
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h2>Оформление заказа</h2>
                    <form className="checkout-form" onSubmit={(e) => e.preventDefault()}>
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