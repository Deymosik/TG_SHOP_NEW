// frontend/src/pages/HomePage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import CategoryBar from '../components/CategoryBar';
import PromoCarousel from '../components/PromoCarousel'; // 1. Импортируем карусель
import './HomePage.css';

const API_BASE_URL = "/api/";

const HomePage = () => {
    // --- СОСТОЯНИЯ ---
    const [banners, setBanners] = useState([]); // Состояние для баннеров
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextPage, setNextPage] = useState(null);
    const observer = useRef();
    const { totalItems } = useCart();

    // 2. ЭФФЕКТ ДЛЯ ЗАГРУЗКИ ВСЕХ ДАННЫХ ПРИ СТАРТЕ
    useEffect(() => {
        // Загружаем баннеры
        axios.get(`${API_BASE_URL}banners/`)
            .then(response => setBanners(response.data))
            .catch(error => console.error("Ошибка при загрузке баннеров:", error));

        // Загружаем категории
        axios.get(`${API_BASE_URL}categories/`)
            .then(response => setCategories(response.data))
            .catch(error => console.error("Ошибка при загрузке категорий:", error));
    }, []); // Пустой массив - сработает только один раз

    // ... (остальной код fetchProducts, useEffect для категорий, lastProductElementRef и т.д. БЕЗ ИЗМЕНЕНИЙ)
    const fetchProducts = useCallback((reset = false) => {
        setLoading(true);
        let url = nextPage;
        if (reset) {
            const categoryParam = selectedCategory ? `&category_id=${selectedCategory}` : '';
            url = `${API_BASE_URL}products/?page=1${categoryParam}`;
        }
        if (!url) {
            setLoading(false);
            return;
        }
        axios.get(url)
            .then(response => {
                setProducts(prev => reset ? response.data.results : [...prev, ...response.data.results]);
                setNextPage(response.data.next);
            })
            .catch(error => console.error("Ошибка при загрузке товаров:", error))
            .finally(() => setLoading(false));
    }, [nextPage, selectedCategory]);

    useEffect(() => {
        setProducts([]);
        setNextPage(null);
        fetchProducts(true);
    }, [selectedCategory]);

    const lastProductElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPage) {
                fetchProducts(false);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, nextPage, fetchProducts]);

    const handleSelectCategory = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    return (
        <div className="home-page">
            {/* 3. Вставляем компонент карусели в самом верху */}
            <PromoCarousel banners={banners} />

            <CategoryBar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
            />

            <div className="products-grid">
                {products.map((product, index) => (
                    <Link to={`/product/${product.id}`} key={product.id} className="product-link">
                        <div ref={products.length === index + 1 ? lastProductElementRef : null}>
                            <ProductCard product={product} />
                        </div>
                    </Link>
                ))}
            </div>

            {loading && (
                <div className="products-grid">
                    {[...Array(4)].map((_, i) => <div key={`skeleton-${i}`} className="skeleton-card"></div>)}
                </div>
            )}

            {!nextPage && !loading && products.length === 0 && <div className="no-products-message">В этой категории пока нет товаров</div>}

            {totalItems > 0 && (
                <Link to="/cart" className="cart-fab">
                    🛒
                    <span className="cart-fab-badge">{totalItems}</span>
                </Link>
            )}
        </div>
    );
};

export default HomePage;