// frontend/src/pages/ProductPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ImageSlider from '../components/ImageSlider';
import { useTelegram } from '../utils/telegram';
import RelatedProductCard from '../components/RelatedProductCard';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import './ProductPage.css';

const ProductPage = () => {
    // --- ВСЯ ВАША СУЩЕСТВУЮЩАЯ ЛОГИКА ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ---
    const { id: initialId } = useParams();
    const navigate = useNavigate();
    const tg = useTelegram();
    const { showNotification } = useNotification();
    const [currentProductId, setCurrentProductId] = useState(parseInt(initialId));
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const { addToCart, cartItems, updateQuantity } = useCart();
    const itemInCart = cartItems.find(item => item.id === product.id);
    const [isSwitchingColor, setIsSwitchingColor] = useState(false);


    const fetchProductData = useCallback((id) => {
        axios.get(`/api/products/${id}/`)
            .then(response => {
                setProduct(response.data);
                // Заменяем URL в истории, чтобы кнопка "назад" работала правильно
                window.history.replaceState(null, '', `/product/${id}`);
            })
            .catch(error => {
                console.error("Ошибка при загрузке товара:", error);
            })
            .finally(() => {
                setLoading(false);
                setIsSwitchingColor(false); // Завершаем индикацию загрузки цвета
            });
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchProductData(currentProductId);

        tg.BackButton.show();
        const handleBackButtonClick = () => navigate(-1); // Кнопка "назад" всегда ведет на предыдущую реальную страницу
        tg.BackButton.onClick(handleBackButtonClick);

        return () => {
            tg.BackButton.offClick(handleBackButtonClick);
            tg.BackButton.hide();
        };
    }, [fetchProductData, navigate, tg]); // Запускается только один раз

    // 3. НОВЫЙ useEffect, который следит за сменой ID и подгружает новые данные
    useEffect(() => {
        // Если ID изменился (не первая загрузка), подгружаем новые данные
        if (product && currentProductId !== product.id) {
            setIsSwitchingColor(true); // Включаем индикацию
            fetchProductData(currentProductId);
        }
    }, [currentProductId, fetchProductData, product]);

    const handleAddToCart = () => {
        tg.HapticFeedback.notificationOccurred('success');
        addToCart(product);
    };

    const allColorVariations = useMemo(() => {
        if (!product || !product.color_variations) {
            return [];
        }
        // Создаем массив, который включает ТЕКУЩИЙ товар и все его ВАРИАНТЫ
        const fullList = [
            // Добавляем текущий товар в минималистичном формате
            { id: product.id, main_image: product.main_image },
            ...product.color_variations
        ];
        // Сортируем массив по ID. Это гарантирует, что порядок будет ВСЕГДА одинаковым
        return fullList.sort((a, b) => a.id - b.id);
    }, [product]); // Пересчитываем только при изменении 'product'

    const handleColorSwitch = (e, newId) => {
        e.preventDefault(); // Отменяем стандартный переход по ссылке
        // Если кликнули не на текущий цвет, обновляем ID
        if (newId !== currentProductId) {
            setCurrentProductId(newId);
        }
    };

    const handleQuantityChange = (newQuantity) => {
        tg.HapticFeedback.impactOccurred('light');
        updateQuantity(product.id, newQuantity);
    };

    // --- ЛОГИКА ОТОБРАЖЕНИЯ ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ---
    if (loading) {
        return <div className="loader">Загрузка...</div>;
    }

    if (!product) {
        return <div className="loader">Товар не найден</div>;
    }


    const allImages = [product.main_image, ...(product.images || []).map(img => img.image)].filter(Boolean);


    // --- ИЗМЕНЕНИЯ В РЕНДЕРИНГЕ (JSX) НАЧИНАЮТСЯ ЗДЕСЬ ---
    return (
        <div className={`product-page ${isSwitchingColor ? 'switching-color' : ''}`}>
        <div className="product-page">
            <ImageSlider images={allImages} />

            <div className="product-details">
                <h1 className="product-title">{product.name}</h1>

                <div className="info-panels-product">
                    {(product.info_panels || []).map(panel => (
                        <span key={panel.name} className="info-panel" style={{ backgroundColor: panel.color, color: panel.text_color }}>
                            {panel.name}
                        </span>
                    ))}
                </div>

                {allColorVariations.length > 1 && (
                    <div className="product-section">
                        <h2>Цвет</h2>
                        <div className="color-swatches-container">
                            {allColorVariations.map(variation => (
                                <Link
                                    to={`/product/${variation.id}`}
                                    key={variation.id}
                                    className={`color-swatch ${variation.id === product.id ? 'active' : ''}`}
                                    // 5. Вешаем наш новый обработчик клика
                                    onClick={(e) => handleColorSwitch(e, variation.id)}
                                >
                                    <img src={variation.main_image} alt="Color variation" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="product-price-main">{parseFloat(product.price).toFixed(2)} ₽</div>

                {product.audio_sample && (
                    <div className="product-section audio-section">
                        <h2>Пример записи микрофонов</h2>
                        <audio controls className="audio-player">
                            <source src={product.audio_sample} type="audio/mpeg" />
                            Ваш браузер не поддерживает воспроизведение аудио.
                        </audio>
                    </div>
                )}

                {itemInCart && product.related_products && product.related_products.length > 0 && (
                    <div className="product-section related-section">
                        <h2>С этим товаром покупают</h2>
                        <div className="related-products-container">
                            {product.related_products.map(related_product => (
                                <RelatedProductCard key={related_product.id} product={related_product} />
                            ))}
                        </div>
                    </div>
                )}

                <div className="product-section">
                    <h2>Описание</h2>
                    <p>{product.description}</p>
                </div>

                {/* НОВЫЙ БЛОК: Отображение информационных карточек, если они есть */}
                {product.info_cards && product.info_cards.length > 0 && (
                    <div className="product-section">
                        <div className="info-cards-container">
                            {product.info_cards.map((card, index) => (
                                <a
                                    key={index}
                                    href={card.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    // ИЗМЕНЕНИЕ: Просто меняем класс, чтобы применить новые стили
                                    className="info-card-rectangle"
                                >
                                    <img src={card.image} alt={card.title} className="info-card-image-rect" />
                                    <div className="info-card-text-content">
                                        <h4 className="info-card-title-rect">{card.title}</h4>
                                        {/* Мы не отображаем поле 'text' из модели, но если бы оно было,
                            можно было бы добавить <p>{card.text}</p> сюда */}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* ИЗМЕНЕНИЕ: Заменяем старый блок 'specifications' на новый 'functionality' */}
                {product.functionality && Object.keys(product.functionality).length > 0 && (
                    <div className="product-section">
                        <h2>Функционал</h2>
                        <ul className="spec-list">
                            {Object.entries(product.functionality).map(([key, value]) => (
                                <li key={key}>
                                    <strong>{key}:</strong> {value}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* НОВЫЙ БЛОК: Добавляем отображение для 'characteristics' */}
                {product.characteristics && Object.keys(product.characteristics).length > 0 && (
                    <div className="product-section">
                        <h2>Технические характеристики</h2>
                        <ul className="spec-list">
                            {Object.entries(product.characteristics).map(([key, value]) => (
                                <li key={key}>
                                    <strong>{key}:</strong> {value}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Блок с кнопкой "Добавить в корзину" или степпером остается без изменений */}
            <div className="sticky-footer">
                {itemInCart ? (
                    <div className="cart-controls-container">
                        <Link to="/cart" className="go-to-cart-btn">
                            В корзине
                        </Link>
                        <div className="quantity-stepper">
                            <button className="quantity-btn"
                                    onClick={() => handleQuantityChange(itemInCart.quantity - 1)}>−
                            </button>
                            <span className="quantity-display">{itemInCart.quantity}</span>
                            <button className="quantity-btn"
                                    onClick={() => handleQuantityChange(itemInCart.quantity + 1)}>+
                            </button>
                        </div>
                    </div>
                ) : (
                    <button className="add-to-cart-btn" onClick={handleAddToCart}>
                        Добавить в корзину
                    </button>
                )}
            </div>
        </div>
        </div>
    );
};

export default ProductPage;