# backend/shop/serializers.py

from rest_framework import serializers
from .models import InfoPanel, Category, Product, ProductImage, PromoBanner, ProductInfoCard, ColorGroup



class InfoPanelSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfoPanel
        fields = ('name', 'color', 'text_color')

# ПЕРЕМЕСТИЛИ ЭТОТ КЛАСС ВВЕРХ
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

# ПЕРЕМЕСТИЛИ ЭТОТ КЛАСС ВВЕРХ
class ProductInfoCardSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    class Meta:
        model = ProductInfoCard
        fields = ('title', 'image', 'link_url')
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')

class PromoBannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    class Meta:
        model = PromoBanner
        fields = ('id', 'image', 'link_url')
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url)
        return None


# --- ОСНОВНЫЕ СЕРИАЛИЗАТОРЫ, КОТОРЫЕ ИСПОЛЬЗУЮТ ВСПОМОГАТЕЛЬНЫЕ ---

class ColorVariationSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = ('id', 'main_image') # Отдаем только ID для навигации и картинку для swatch'а
    def get_main_image(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.main_image.url) if obj.main_image else None

class ProductListSerializer(serializers.ModelSerializer):
    # Использует InfoPanelSerializer, который определен выше
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

class ProductDetailSerializer(serializers.ModelSerializer):
    info_panels = InfoPanelSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True, context=serializers.SerializerMethodField.context)
    info_cards = ProductInfoCardSerializer(many=True, read_only=True, context=serializers.SerializerMethodField.context)
    related_products = ProductListSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    audio_sample = serializers.SerializerMethodField()
    functionality = serializers.JSONField()
    characteristics = serializers.JSONField()
    color_variations = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'price', 'main_image', 'images', 'audio_sample', 'info_panels', 'info_cards', 'functionality', 'characteristics', 'related_products', 'color_variations')

    def get_main_image(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.main_image.url) if obj.main_image else None

    def get_audio_sample(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.audio_sample.url) if obj.audio_sample else None

    def to_representation(self, instance):
        self.context['request'] = self.context['view'].request
        return super().to_representation(instance)

    def get_color_variations(self, obj):
        # Если у товара нет цветовой группы, возвращаем пустой список
        if not obj.color_group:
            return []

        # Находим все товары в той же группе, исключая текущий товар
        queryset = Product.objects.filter(color_group=obj.color_group).exclude(id=obj.id)

        # Сериализуем найденные товары, передавая request для полных URL картинок
        return ColorVariationSerializer(queryset, many=True, context=self.context).data