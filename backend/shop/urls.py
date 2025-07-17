# backend/shop/urls.py
from django.urls import path
from .views import ProductListView, ProductDetailView, CategoryListView, PromoBannerListView

urlpatterns = [
    # 2. ДОБАВЛЯЕМ НОВЫЙ ПУТЬ
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('banners/', PromoBannerListView.as_view(), name='banner-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
]