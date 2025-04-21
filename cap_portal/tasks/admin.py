from django.contrib import admin
from .models import Application, ToDo

# Register your models here.
admin.site.register(Application)
admin.site.register(ToDo)
