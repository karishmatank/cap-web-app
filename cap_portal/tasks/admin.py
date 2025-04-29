from django.contrib import admin
from .models import Application, ToDo, PlatformTemplate, PlatformTemplateToDo

# Register your models here.
admin.site.register(Application)
admin.site.register(ToDo)

class PlatformTemplateToDoInline(admin.TabularInline):
    model = PlatformTemplateToDo
    extra = 1

@admin.register(PlatformTemplate)
class PlatformTemplateAdmin(admin.ModelAdmin):
    inlines = [PlatformTemplateToDoInline]