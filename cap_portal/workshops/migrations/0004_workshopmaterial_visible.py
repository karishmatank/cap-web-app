# Generated by Django 5.1.7 on 2025-04-18 01:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workshops', '0003_alter_workshopmaterial_google_doc_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='workshopmaterial',
            name='visible',
            field=models.BooleanField(default=True),
        ),
    ]
