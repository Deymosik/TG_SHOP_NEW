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
    # null=True, blank=True означает, что поле не обязательное
    # related_name='subcategories' позволяет легко получать подкатегории
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories', verbose_name="Родительская категория")

    def __str__(self):
        # Показываем полный путь категории для удобства (например, "Электроника -> Смартфоны")
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return ' -> '.join(full_path[::-1])

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"


# Модель самого товара
class Product(models.Model):
    name = models.CharField("Название товара", max_length=200)
    description = models.TextField("Описание")
    price = models.DecimalField("Цена", max_digits=10, decimal_places=2)
    specifications = models.JSONField("Технические характеристики", default=dict, help_text="Введите в формате JSON, например {\"Процессор\": \"M1\", \"Память\": \"16 ГБ\"}")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products", verbose_name="Категория")
    # related_name="info_panels" позволяет товару иметь много панелек
    info_panels = models.ManyToManyField(InfoPanel, blank=True, verbose_name="Информационные панельки")
    is_active = models.BooleanField("Активен (виден клиенту)", default=True)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)

    # Главное фото товара (обложка)
    main_image = models.ImageField("Главное фото (4:3)", upload_to='products/main/')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ['-created_at'] # Сортируем по-умолчанию по дате создания


# Модель для дополнительных фото товара (для слайдера)
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', verbose_name="Товар")
    image = models.ImageField("Фото", upload_to='products/additional/')

    def __str__(self):
        return f"Фото для {self.product.name}"

    class Meta:
        verbose_name = "Дополнительное фото"
        verbose_name_plural = "Дополнительные фото"

# --- Модель для информационных баннеров (сторис) ---
class PromoBanner(models.Model):
    title = models.CharField("Название (для админа)", max_length=100)
    image = models.ImageField("Изображение (формат 3:4)", upload_to='banners/')
    link_url = models.URLField("URL-ссылка (куда ведет баннер)")
    order = models.IntegerField("Порядок сортировки", default=0, help_text="Чем меньше число, тем левее будет баннер")
    is_active = models.BooleanField("Активен (виден клиенту)", default=True)

    class Meta:
        verbose_name = "Промо-баннер"
        verbose_name_plural = "Промо-баннеры"
        ordering = ['order'] # Сортируем по-умолчанию по полю order

    def __str__(self):
        return self.title