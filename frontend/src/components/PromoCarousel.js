// frontend/src/components/PromoCarousel.js
import React from 'react';
import './PromoCarousel.css';

const PromoCarousel = ({ banners }) => {
    // Компонент ничего не рендерит, если баннеров нет
    if (!banners || banners.length === 0) {
        return null;
    }

    return (
        <div className="promo-carousel-container">
            {banners.map(banner => (
                // Каждый баннер - это ссылка, открывающаяся в новой вкладке
                <a
                    href={banner.link_url}
                    key={banner.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="promo-banner-card"
                >
                    <img src={banner.image} alt="Промо-баннер" className="promo-banner-image" />
                </a>
            ))}
        </div>
    );
};

export default PromoCarousel;