from django.shortcuts import render
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer

# Настраиваем пагинацию (lazy loading). По 10 товаров на страницу
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# View для списка всех активных товаров
class ProductListView(generics.ListAPIView):
    # queryset - это запрос к базе данных
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductListSerializer
    pagination_class = StandardResultsSetPagination

# View для одного конкретного товара
class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductDetailSerializer
    # lookup_field = 'pk' (первичный ключ, ID) используется по умолчанию
