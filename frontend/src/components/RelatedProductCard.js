import React from 'react';
import { Link } from 'react-router-dom';
import './RelatedProductCard.css';

const RelatedProductCard = ({ product }) => {
    return (
        <Link to={`/product/${product.id}`} className="related-card">
            <div className="related-card-image-wrapper">
                <img src={product.main_image} alt={product.name} className="related-card-image" />
            </div>
            <div className="related-card-info">
                <p className="related-card-name">{product.name}</p>
                <p className="related-card-price">{parseFloat(product.price).toFixed(0)} ₽</p>
            </div>
        </Link>
    );
};

export default RelatedProductCard;