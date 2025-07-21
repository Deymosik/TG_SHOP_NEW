# backend/shop/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import InfoPanel, Category, Product, ProductImage, PromoBanner, ProductInfoCard, DiscountRule, ColorGroup

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    verbose_name = "Дополнительное фото"
    verbose_name_plural = "Дополнительные фото"

class ProductInfoCardInline(admin.TabularInline):
    model = ProductInfoCard
    extra = 0
    verbose_name = "Инфо-карточка (фича)"
    verbose_name_plural = "Инфо-карточки (фичи)"
    fields = ('image', 'title', 'link_url')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_active')
    list_filter = ('category', 'is_active', 'info_panels', 'color_group')
    search_fields = ('name', 'description')
    inlines = [ProductImageInline, ProductInfoCardInline]
    list_editable = ('is_active',)

    # --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    # Мы объединяем две последние секции в одну и убираем дубликат 'info_panels'.
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'color_group', 'category', 'price', 'description', 'is_active')
        }),
        ('Медиафайлы', {
            'fields': ('main_image', 'audio_sample')
        }),
        ('Характеристики и Функционал', {
            'fields': ('functionality', 'characteristics')
        }),
        # Новая, объединенная и исправленная секция
        ('Связи и опции', {
            'fields': ('related_products', 'info_panels')
        }),
    )

    filter_horizontal = ('related_products', 'info_panels',)

    actions = ['make_active', 'make_inactive']
    def make_active(self, request, queryset):
        queryset.update(is_active=True)
    make_active.short_description = "Сделать выделенные товары активными"

    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)
    make_inactive.short_description = "Сделать выделенные товары неактивными"


# --- Остальные классы вашей админ-панели остаются без изменений ---

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('__str__',)
    search_fields = ('name',)

@admin.register(ColorGroup)
class ColorGroupAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(InfoPanel)
class InfoPanelAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'text_color')

@admin.register(PromoBanner)
class PromoBannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active', 'display_image', 'link_url')
    list_editable = ('order', 'is_active')
    search_fields = ('title',)

    def display_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="66" style="object-fit:cover;" />', obj.image.url)
        return "Нет фото"
    display_image.short_description = 'Превью'

@admin.register(DiscountRule)
class DiscountRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_type', 'min_quantity', 'discount_percentage', 'is_active')
    list_filter = ('discount_type', 'is_active')
    list_editable = ('is_active',)
    search_fields = ('name',)

    fieldsets = (
        (None, {
            'fields': ('name', 'is_active')
        }),
        ('Условие', {
            'fields': ('discount_type', 'min_quantity')
        }),
        ('Результат', {
            'fields': ('discount_percentage',)
        }),
        ('Цель (заполнять, если нужно)', {
            'description': "Укажите 'Целевой товар' для скидки на товар. Укажите 'Целевую категорию' для скидки на категорию. Оставьте пустым для скидки на всю корзину.",
            'fields': ('product_target', 'category_target')
        }),
    )