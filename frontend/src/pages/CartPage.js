// frontend/src/pages/CartPage.js
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../utils/telegram';
import { SHOP_CONFIG } from '../config'; // 1. Импортируем нашу конфигурацию
import './CartPage.css';

const CartPage = () => {
    const tg = useTelegram();
    const { cartItems, updateQuantity, clearCart, totalPrice } = useCart();
    const navigate = useNavigate();

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
            // Если мы на форме, возвращаемся к корзине, а не выходим
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
    }, [navigate, showForm]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 2. ГЛАВНОЕ ИЗМЕНЕНИЕ - НОВАЯ ЛОГИКА ОФОРМЛЕНИЯ ЗАКАЗА
    const handleCheckout = () => {
        // Формируем текст заказа, как и раньше
        const orderDetails = cartItems.map(item =>
            `${item.name} (x${item.quantity}) - ${item.quantity * item.price} ₽`
        ).join('\n');

        const fullMessage = `
Привет! Хочу сделать заказ.

*Клиент:* ${formData.name}
*Телефон:* ${formData.phone}
*Доставка:* ${formData.shipping}, ${formData.address}

*Состав заказа:*
${orderDetails}
-----------------
*Итого:* ${totalPrice.toFixed(2)} ₽
        `.trim();

        // 3. Кодируем текст для безопасной передачи в URL.
        // Это нужно, чтобы спецсимволы вроде '&' или '#' не сломали ссылку.
        const encodedText = encodeURIComponent(fullMessage);

        // 4. Формируем ссылку на чат с менеджером и с предзаполненным текстом
        const telegramLink = `https://t.me/${SHOP_CONFIG.MANAGER_USERNAME}?text=${encodedText}`;

        // 5. Открываем эту ссылку. Telegram сам перехватит ее,
        // откроет нужный чат и вставит текст в поле ввода.
        tg.openTelegramLink(telegramLink);

        // 6. Закрываем Web App, чтобы завершить процесс
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

    // ... остальной JSX код без изменений, я оставлю его для полноты
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