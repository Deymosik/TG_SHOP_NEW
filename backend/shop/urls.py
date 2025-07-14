from django.urls import path
from .views import ProductListView, ProductDetailView

urlpatterns = [
    # эндпоинт для списка товаров. ?page=2 для пагинации
    path('products/', ProductListView.as_view(), name='product-list'),
    # эндпоинт для конкретного товара по его ID
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
]