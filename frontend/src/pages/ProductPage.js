// frontend/src/pages/ProductPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageSlider from '../components/ImageSlider';
import { useTelegram } from '../utils/telegram'; // Импортируем наш хук
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import './ProductPage.css';

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const tg = useTelegram();
    const { addToCart } = useCart();
    const { showNotification } = useNotification();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        tg.BackButton.show();
        const handleBackButtonClick = () => navigate(-1);
        tg.BackButton.onClick(handleBackButtonClick);

        axios.get(`/api/products/${id}/`)
            .then(response => {
                setProduct(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Ошибка при загрузке товара:", error);
                setLoading(false);
            });

        return () => {
            tg.BackButton.offClick(handleBackButtonClick);
            tg.BackButton.hide();
        };
    }, [id, navigate, tg]);

    const handleAddToCart = () => {
        // Тактильный отклик работает почти везде, его оставляем
        tg.HapticFeedback.notificationOccurred('success');

        // 3. ГЛАВНОЕ ИЗМЕНЕНИЕ: Проверяем версию API
        if (tg.isVersionAtLeast('6.2')) {
            // Если версия подходящая, используем нативный showAlert
            tg.showAlert(`Товар "${product.name}" добавлен в корзину!`);
        } else {
            // Иначе, используем наш кастомный компонент
            showNotification(`Товар "${product.name}" добавлен!`);
        }

        addToCart(product);
    };

    if (loading) {
        return <div className="loader">Загрузка...</div>;
    }

    if (!product) {
        return <div className="loader">Товар не найден</div>;
    }

    // ИСПРАВЛЕНИЕ: Безопасно собираем массив изображений
    const allImages = [
        product.main_image,
        // Если product.images не существует, используем пустой массив []
        ...(product.images || []).map(img => img.image)
    ].filter(Boolean);

    return (
        <div className="product-page">
            <ImageSlider images={allImages} />

            <div className="product-details">
                <h1 className="product-title">{product.name}</h1>

                <div className="info-panels-product">
                    {/* ИСПРАВЛЕНИЕ: Безопасный рендер панелек */}
                    {(product.info_panels || []).map(panel => (
                        <span key={panel.name} className="info-panel" style={{ backgroundColor: panel.color, color: panel.text_color }}>
                            {panel.name}
                        </span>
                    ))}
                </div>

                <div className="product-price-main">{parseFloat(product.price).toFixed(2)} ₽</div>

                <div className="product-section">
                    <h2>Описание</h2>
                    <p>{product.description}</p>
                </div>

                {/* ИСПРАВЛЕНИЕ: Безопасный рендер характеристик */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="product-section">
                        <h2>Технические характеристики</h2>
                        <ul className="spec-list">
                            {Object.entries(product.specifications).map(([key, value]) => (
                                <li key={key}>
                                    <strong>{key}:</strong> {value}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="sticky-footer">
                <button className="add-to-cart-btn" onClick={handleAddToCart}>
                    Добавить в корзину
                </button>
            </div>
        </div>
    );
};

export default ProductPage;