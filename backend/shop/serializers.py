# backend/shop/serializers.py
from rest_framework import serializers
from .models import InfoPanel, Category, Product, ProductImage, PromoBanner

class InfoPanelSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfoPanel
        fields = ('name', 'color', 'text_color')

# ИЗМЕНЕНИЕ ЗДЕСЬ
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ('image',)

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')

class ProductListSerializer(serializers.ModelSerializer):
    info_panels = InfoPanelSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'main_image', 'info_panels')

    def get_main_image(self, obj):
        request = self.context.get('request')
        if obj.main_image:
            return request.build_absolute_uri(obj.main_image.url)
        return None

# ИЗМЕНЕНИЕ ЗДЕСЬ: ПЕРЕДАЕМ КОНТЕКСТ ВЛОЖЕННОМУ СЕРИАЛИЗАТОРУ
class ProductDetailSerializer(serializers.ModelSerializer):
    info_panels = InfoPanelSerializer(many=True, read_only=True)
    # Передаем контекст, чтобы ProductImageSerializer мог получить доступ к request
    images = ProductImageSerializer(many=True, read_only=True, context=serializers.SerializerMethodField.context)
    main_image = serializers.SerializerMethodField()

    # Конвертируем JSONField в обычный объект на выходе
    specifications = serializers.JSONField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'price', 'specifications', 'info_panels', 'main_image', 'images')

    def get_main_image(self, obj):
        request = self.context.get('request')
        if obj.main_image:
            return request.build_absolute_uri(obj.main_image.url)
        return None

    # Важно передать контекст во вложенные сериализаторы
    def to_representation(self, instance):
        self.context['request'] = self.context['view'].request
        return super().to_representation(instance)

# --- НОВЫЙ СЕРИАЛИЗАТОР ДЛЯ ПРОМО-БАННЕРОВ ---
class PromoBannerSerializer(serializers.ModelSerializer):
    # Превращаем путь к картинке в полный URL
    image = serializers.SerializerMethodField()

    class Meta:
        model = PromoBanner
        fields = ('id', 'image', 'link_url')

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url)
        return None