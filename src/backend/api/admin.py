from django.contrib import admin
from django.contrib.admin.decorators import register
from . import models

# Register your models here.


class NutritionStatsInline(admin.StackedInline[models.NutritionStats]):
    model = models.NutritionStats
    extra = 1
    max_num = 1


@register(models.Ingredient)
class IngredientAdmin(admin.ModelAdmin[models.Ingredient]):
    list_display = ("name",)
    inlines = [NutritionStatsInline]


class RecipeIngredientInline(admin.TabularInline[models.RecipeIngredient]):
    model = models.RecipeIngredient
    extra = 1


@register(models.Recipe)
class RecipeAdmin(admin.ModelAdmin[models.Recipe]):
    list_display = ("name", "ingredients_list")
    inlines = [RecipeIngredientInline]

    @admin.display(description="Ingredients")
    def ingredients_list(self, obj: models.Recipe) -> str:
        return ", ".join(str(ri) for ri in obj.ingredients)
