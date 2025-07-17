// frontend/src/components/CategoryBar.js
import React from 'react';
import './CategoryBar.css';

const CategoryBar = ({ categories, selectedCategory, onSelectCategory }) => {
    return (
        <div className="category-bar-container">
            {/* Кнопка "Все" для сброса фильтра */}
            <button
                className={`category-chip ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => onSelectCategory(null)}
            >
                Все
            </button>

            {/* Рендерим кнопки для каждой категории */}
            {categories.map(category => (
                <button
                    key={category.id}
                    className={`category-chip ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => onSelectCategory(category.id)}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
};

export default CategoryBar;