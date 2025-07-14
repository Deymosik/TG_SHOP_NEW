import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import './HomePage.css';
import { Link } from 'react-router-dom';
import {useCart} from "../context/CartContext";

const API_URL = "http://127.0.0.1:8000/api/products/";

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nextPage, setNextPage] = useState(API_URL); // URL для следующей страницы данных
    const observer = useRef();
    const { totalItems } = useCart();

    // Используем useRef для предотвращения двойного вызова в StrictMode
    const initialLoad = useRef(false);

    // Функция для загрузки товаров
    const loadMoreProducts = useCallback(() => {
        // Если следующей страницы нет или уже идет загрузка, выходим
        if (!nextPage || loading) return;

        setLoading(true);
        axios.get(nextPage)
            .then(response => {
                // ИСПРАВЛЕНИЕ: Перед добавлением новых товаров, убедимся, что они не дублируются.
                // Это решает проблему с двойной загрузкой в React.StrictMode.
                setProducts(prevProducts => {
                    const existingIds = new Set(prevProducts.map(p => p.id));
                    const newProducts = response.data.results.filter(p => !existingIds.has(p.id));
                    return [...prevProducts, ...newProducts];
                });

                // Сохраняем URL следующей страницы
                setNextPage(response.data.next);
                setLoading(false);
            })
            .catch(error => {
                console.error("Ошибка при загрузке товаров:", error);
                setLoading(false);
            });
    }, [nextPage, loading]);

    // Наблюдатель за последним элементом для бесконечной прокрутки
    const lastProductElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPage) {
                loadMoreProducts();
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, nextPage, loadMoreProducts]);

    // Загружаем первую порцию товаров при загрузке страницы
    useEffect(() => {
        // ИСПРАВЛЕНИЕ: Этот блок гарантирует, что начальная загрузка произойдет только один раз.
        if (!initialLoad.current) {
            loadMoreProducts();
            initialLoad.current = true;
        }
    }, [loadMoreProducts]);

    return (
        <div className="home-page">
            <div className="products-grid">
                {products.map((product, index) => (
                    <Link
                        to={`/product/${product.id}`} // Указываем путь к странице товара
                        key={product.id}
                        className="product-link"
                    >
                        <div ref={products.length === index + 1 ? lastProductElementRef : null}>
                            <ProductCard product={product}/>
                        </div>
                    </Link>
                ))}
            </div>
            {/* Пока идет загрузка, показываем скелетоны */}
            {loading && (
                <div className="products-grid">
                    {[...Array(4)].map((_, i) => <div key={`skeleton-${i}`} className="skeleton-card"></div>)}
                </div>
            )}
            {!nextPage && !loading && products.length > 0 &&
                <div className="end-of-list">Вы просмотрели все товары</div>}
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