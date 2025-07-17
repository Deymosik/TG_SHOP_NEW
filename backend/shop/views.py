# backend/shop/views.py
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from .models import Product, Category, PromoBanner
from .serializers import ProductListSerializer, ProductDetailSerializer, CategorySerializer, PromoBannerSerializer

# --- НОВОЕ VIEW ДЛЯ СПИСКА КАТЕГОРИЙ ---
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(parent__isnull=True) # Показываем только родительские категории
    serializer_class = CategorySerializer
    pagination_class = None # Отключаем пагинацию для категорий


# --- НОВОЕ VIEW ДЛЯ СПИСКА БАННЕРОВ ---
class PromoBannerListView(generics.ListAPIView):
    queryset = PromoBanner.objects.filter(is_active=True).order_by('order')
    serializer_class = PromoBannerSerializer
    pagination_class = None # Баннеров обычно немного, пагинация не нужна


# --- ОБНОВЛЯЕМ VIEW ДЛЯ СПИСКА ТОВАРОВ ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = StandardResultsSetPagination

    # ГЛАВНОЕ ИЗМЕНЕНИЕ: get_queryset вместо queryset
    def get_queryset(self):
        """
        Эта функция будет динамически формировать список товаров
        в зависимости от того, передана ли категория в URL.
        """
        queryset = Product.objects.filter(is_active=True)
        
        # Получаем 'category_id' из параметров запроса (например, /api/products/?category_id=1)
        category_id = self.request.query_params.get('category_id')

        if category_id:
            try:
                # Фильтруем товары по указанной категории
                queryset = queryset.filter(category_id=category_id)
            except ValueError:
                # Если передан неверный id, просто игнорируем его
                pass
        
        return queryset


# View для одного товара остается без изменений
class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductDetailSerializer