# backend/shop/models.py

from django.db import models

# Модель для информационных панелек (Акция, Скидка и т.д.)
class InfoPanel(models.Model):
    name = models.CharField("Название", max_length=50)
    color = models.CharField("Цвет фона (HEX, например #FF0000)", max_length=7, default="#444444")
    text_color = models.CharField("Цвет текста (HEX, например #FFFFFF)", max_length=7, default="#FFFFFF")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Информационная панелька"
        verbose_name_plural = "Информационные панельки"


# Модель для категорий товаров
class Category(models.Model):
    name = models.CharField("Название категории", max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories', verbose_name="Родительская категория")

    def __str__(self):
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return ' -> '.join(full_path[::-1])

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"

# --- НОВАЯ МОДЕЛЬ ДЛЯ ГРУППИРОВКИ ЦВЕТОВ ---
class ColorGroup(models.Model):
    name = models.CharField("Название группы (например, 'Чехол для iPhone 15 Pro')", max_length=200, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Группа цветов"
        verbose_name_plural = "Группы цветов"

# Модель самого товара
class Product(models.Model):
    name = models.CharField("Название товара", max_length=200)
    description = models.TextField("Описание")
    price = models.DecimalField("Цена", max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products", verbose_name="Категория")
    info_panels = models.ManyToManyField(InfoPanel, blank=True, verbose_name="Информационные панельки")
    is_active = models.BooleanField("Активен (виден клиенту)", default=True)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)
    main_image = models.ImageField("Главное фото (4:3)", upload_to='products/main/')
    audio_sample = models.FileField("Пример аудио (MP3, WAV)", upload_to='products/audio/', null=True, blank=True)
    functionality = models.JSONField("Функционал", default=dict, blank=True, help_text="Ключевые особенности, например: {\"Шумоподавление\": \"Активное (ANC)\", \"Тип подключения\": \"Bluetooth 5.2\"}")
    characteristics = models.JSONField("Тех. характеристики", default=dict, blank=True, help_text="Физические и технические данные, например: {\"Вес\": \"250 г\", \"Диаметр динамика\": \"40 мм\"}")
    related_products = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False, # Важно для такой связи
        verbose_name="Сопутствующие товары"
    )

    color_group = models.ForeignKey(
        ColorGroup,
        on_delete=models.SET_NULL, # Если группу удалят, товары останутся, но без группы
        related_name='products',
        null=True, # Поле не обязательное
        blank=True,
        verbose_name="Группа цветов"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ['-created_at']


# Модель для дополнительных фото товара (для слайдера)
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', verbose_name="Товар")
    image = models.ImageField("Фото", upload_to='products/additional/')

    def __str__(self):
        return f"Фото для {self.product.name}"

    class Meta:
        verbose_name = "Дополнительное фото"
        verbose_name_plural = "Дополнительные фото"

# Модель для информационных баннеров (сторис)
class PromoBanner(models.Model):
    title = models.CharField("Название (для админа)", max_length=100)
    image = models.ImageField("Изображение (формат 3:4)", upload_to='banners/')
    link_url = models.URLField("URL-ссылка (куда ведет баннер)")
    order = models.IntegerField("Порядок сортировки", default=0, help_text="Чем меньше число, тем левее будет баннер")
    is_active = models.BooleanField("Активен (виден клиенту)", default=True)

    class Meta:
        verbose_name = "Промо-баннер"
        verbose_name_plural = "Промо-баннеры"
        ordering = ['order']

    def __str__(self):
        return self.title

# --- ПОЛНАЯ ЗАМЕНА ВАШЕЙ МОДЕЛИ ProductInfoCard ---
class ProductInfoCard(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='info_cards', verbose_name="Товар")

    # Новые поля согласно требованиям
    title = models.CharField("Заголовок (под фото)", max_length=100)
    image = models.ImageField("Фото для карточки (квадратное)", upload_to='products/info_cards/')
    link_url = models.URLField("URL для перехода по клику")

    def __str__(self):
        return self.title

    class Meta:
        # Новые, более понятные названия для админки
        verbose_name = "Инфо-карточка (фича)"
        verbose_name_plural = "Инфо-карточки (фичи)"

# --- НОВАЯ МОДЕЛЬ ДЛЯ ПРАВИЛ СКИДОК ---
class DiscountRule(models.Model):
    # Перечисление для типов скидок
    class DiscountType(models.TextChoices):
        TOTAL_QUANTITY = 'TOTAL_QTY', 'На общее количество товаров в корзине'
        PRODUCT_QUANTITY = 'PRODUCT_QTY', 'На количество конкретного товара'
        CATEGORY_QUANTITY = 'CATEGORY_QTY', 'На количество товаров из конкретной категории'

    name = models.CharField("Название правила (для админа)", max_length=255)
    discount_type = models.CharField(
        "Тип скидки",
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.TOTAL_QUANTITY
    )
    min_quantity = models.PositiveIntegerField("Минимальное количество для активации", default=2)
    discount_percentage = models.DecimalField("Процент скидки", max_digits=5, decimal_places=2, help_text="Например, 10.5 для 10.5%")

    # Поля-цели, которые обязательны только для определенных типов скидок
    product_target = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Целевой товар")
    category_target = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Целевая категория")

    is_active = models.BooleanField("Правило активно", default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Правило скидки"
        verbose_name_plural = "Правила скидок"
        ordering = ['-discount_percentage'] # Приоритет у правил с большей скидкой