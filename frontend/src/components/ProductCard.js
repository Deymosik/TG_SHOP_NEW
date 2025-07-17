import React from 'react';
import './ProductCard.css';

// ИЗМЕНЕНИЕ: Переменная API_URL здесь больше не нужна

const ProductCard = ({ product }) => {
    return (
        <div className="product-card">
            <div className="product-image-container">
                {/*
                  ИЗМЕНЕНИЕ: Теперь мы просто используем product.main_image,
                  так как он уже содержит полный URL вида "http://127.0.0.1:8000/media/..."
                */}
                <img src={product.main_image} alt={product.name} className="product-image" />

                <div className="info-panels">
                    {product.info_panels.map(panel => (
                        <span key={panel.name} className="info-panel" style={{ backgroundColor: panel.color, color: panel.text_color }}>
                            {panel.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">{parseFloat(product.price).toFixed(2)} ₽</p>
            </div>
        </div>
    );
};

export default ProductCard;