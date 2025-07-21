# backend/shop/views.py

from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
# 1. Я немного поправил импорты для чистоты кода
from .models import Product, Category, PromoBanner, DiscountRule
from rest_framework.views import APIView
from rest_framework.response import Response
from decimal import Decimal
from .serializers import ProductListSerializer, ProductDetailSerializer, CategorySerializer, PromoBannerSerializer

# --- ВЕСЬ ВАШ СУЩЕСТВУЮЩИЙ КОД ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ---

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(parent__isnull=True)
    serializer_class = CategorySerializer
    pagination_class = None

class PromoBannerListView(generics.ListAPIView):
    queryset = PromoBanner.objects.filter(is_active=True).order_by('order')
    serializer_class = PromoBannerSerializer
    pagination_class = None

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)
        category_id = self.request.query_params.get('category_id')
        if category_id:
            try:
                queryset = queryset.filter(category_id=category_id)
            except ValueError:
                pass
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductDetailSerializer


# --- ИЗМЕНЕНИЯ ПРИМЕНЯЮТСЯ ТОЛЬКО К ЭТОМУ КЛАССУ ---
class CalculateCartView(APIView):
    def post(self, request, *args, **kwargs):
        cart_items = request.data.get('cartItems', [])
        if not cart_items:
            return Response({"error": "Cart is empty"}, status=400)

        # Шаг 1: Расчет подытогов и количеств (без изменений)
        subtotal = Decimal('0')
        total_quantity = 0
        product_quantities = {}
        category_quantities = {}

        product_ids = [item['id'] for item in cart_items]
        products_in_cart = Product.objects.in_bulk(product_ids)

        for item in cart_items:
            product = products_in_cart.get(item['id'])
            if not product: continue

            price = product.price
            quantity = item['quantity']

            subtotal += price * quantity
            total_quantity += quantity
            product_quantities[product.id] = quantity
            cat_id = product.category_id
            category_quantities[cat_id] = category_quantities.get(cat_id, 0) + quantity

        # Шаг 2: Поиск лучшей применимой скидки (без изменений)
        best_discount_amount = Decimal('0')
        applied_rule = None
        # Оптимизация: используем select_related для предзагрузки связанных моделей
        active_rules = DiscountRule.objects.filter(is_active=True).select_related('product_target', 'category_target')

        for rule in active_rules:
            current_discount = Decimal('0')
            if rule.discount_type == DiscountRule.DiscountType.TOTAL_QUANTITY and total_quantity >= rule.min_quantity:
                current_discount = subtotal * (rule.discount_percentage / 100)
            elif rule.discount_type == DiscountRule.DiscountType.PRODUCT_QUANTITY and rule.product_target_id in product_quantities:
                if product_quantities[rule.product_target_id] >= rule.min_quantity:
                    current_discount = subtotal * (rule.discount_percentage / 100)
            elif rule.discount_type == DiscountRule.DiscountType.CATEGORY_QUANTITY and rule.category_target_id in category_quantities:
                if category_quantities[rule.category_target_id] >= rule.min_quantity:
                    current_discount = subtotal * (rule.discount_percentage / 100)

            if current_discount > best_discount_amount:
                best_discount_amount = current_discount
                applied_rule = rule

        # --- ЗАМЕНА СТАРОЙ ЛОГИКИ ПОИСКА ПОДСКАЗКИ НА НОВУЮ, УМНУЮ ---
        upsell_hint = None
        if not applied_rule: # Ищем подсказку, только если скидка еще НЕ применена
            min_needed_for_hint = float('inf') # Ищем самый легкий способ получить скидку

            for rule in active_rules:
                needed = 0
                current_hint = ""

                # Проверяем правило на ОБЩЕЕ КОЛИЧЕСТВО
                if rule.discount_type == DiscountRule.DiscountType.TOTAL_QUANTITY:
                    needed = rule.min_quantity - total_quantity
                    if 0 < needed:
                        current_hint = f"Добавьте еще {needed} шт. любого товара, чтобы получить скидку {rule.discount_percentage}%!"

                # Проверяем правило на КОЛИЧЕСТВО ТОВАРА
                elif rule.discount_type == DiscountRule.DiscountType.PRODUCT_QUANTITY and rule.product_target:
                    current_qty = product_quantities.get(rule.product_target.id, 0)
                    needed = rule.min_quantity - current_qty
                    if 0 < needed:
                        product_name = rule.product_target.name
                        current_hint = f"Добавьте еще {needed} шт. товара «{product_name}», чтобы получить скидку {rule.discount_percentage}%!"

                # Проверяем правило на КОЛИЧЕСТВО ИЗ КАТЕГОРИИ
                elif rule.discount_type == DiscountRule.DiscountType.CATEGORY_QUANTITY and rule.category_target:
                    current_qty = category_quantities.get(rule.category_target.id, 0)
                    needed = rule.min_quantity - current_qty
                    if 0 < needed:
                        category_name = rule.category_target.name
                        current_hint = f"Добавьте еще {needed} шт. из категории «{category_name}», чтобы получить скидку {rule.discount_percentage}%!"

                # Если мы нашли возможную подсказку, и она "легче" предыдущей, сохраняем ее
                if current_hint and needed < min_needed_for_hint:
                    min_needed_for_hint = needed
                    upsell_hint = current_hint

        # Шаг 4: Формирование ответа (без изменений)
        final_total = subtotal - best_discount_amount
        response_data = {
            'subtotal': subtotal.quantize(Decimal("0.01")),
            'discount_amount': best_discount_amount.quantize(Decimal("0.01")),
            'final_total': final_total.quantize(Decimal("0.01")),
            'applied_rule': applied_rule.name if applied_rule else None,
            'upsell_hint': upsell_hint
        }

        return Response(response_data)