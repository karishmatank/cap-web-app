# Generated by Django 5.1.7 on 2025-05-08 13:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_userprofile_graduation_year'),
    ]

    operations = [
        migrations.CreateModel(
            name='AllowedEmail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, unique=True)),
            ],
        ),
    ]
