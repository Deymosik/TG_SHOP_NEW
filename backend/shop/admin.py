from django.contrib import admin
from .models import InfoPanel, Category, Product, ProductImage

# Встраиваем управление дополнительными фото прямо в страницу редактирования товара
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1  # Количество пустых форм для загрузки новых фото
    verbose_name = "Дополнительное фото"
    verbose_name_plural = "Дополнительные фото"

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_active') # Что видим в списке товаров
    list_filter = ('category', 'is_active', 'info_panels') # Фильтры справа
    search_fields = ('name', 'description') # Поиск по названию и описанию
    inlines = [ProductImageInline] # Встраиваем доп. фото
    list_editable = ('is_active',) # Позволяет менять активность прямо из списка
    actions = ['make_active', 'make_inactive'] # Добавляем массовые действия

    # Описание для массовых действий
    def make_active(self, request, queryset):
        queryset.update(is_active=True)
    make_active.short_description = "Сделать выделенные товары активными"

    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)
    make_inactive.short_description = "Сделать выделенные товары неактивными"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('__str__',)
    search_fields = ('name',)

@admin.register(InfoPanel)
class InfoPanelAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'text_color')

# Регистрировать ProductImage отдельно не нужно, т.к. она встроена в ProductAdmin