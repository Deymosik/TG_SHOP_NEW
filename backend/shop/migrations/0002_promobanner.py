# Generated by Django 4.2.23 on 2025-07-15 15:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PromoBanner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=100, verbose_name='Название (для админа)')),
                ('image', models.ImageField(upload_to='banners/', verbose_name='Изображение (формат 3:4)')),
                ('link_url', models.URLField(verbose_name='URL-ссылка (куда ведет баннер)')),
                ('order', models.IntegerField(default=0, help_text='Чем меньше число, тем левее будет баннер', verbose_name='Порядок сортировки')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен (виден клиенту)')),
            ],
            options={
                'verbose_name': 'Промо-баннер',
                'verbose_name_plural': 'Промо-баннеры',
                'ordering': ['order'],
            },
        ),
    ]
