from django.contrib import admin
from django.contrib.admin import register
from . import models


@register(models.OnHandIngredient)
class OnHandIngredientAdmin(admin.ModelAdmin[models.OnHandIngredient]):
    list_display = ("ingredient", "quantity", "desired_quantity", "warning_quantity")
