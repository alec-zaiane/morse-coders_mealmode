from django.contrib import admin
from . import models


class ConfirmableRecipeIngredientInline(
    admin.TabularInline[models.ConfirmableRecipeIngredient, models.ConfirmableRecipe]
):
    model = models.ConfirmableRecipeIngredient
    extra = 0


class ConfirmableRecipeStepInline(
    admin.TabularInline[models.ConfirmableRecipeStep, models.ConfirmableRecipe]
):
    model = models.ConfirmableRecipeStep
    extra = 0


@admin.register(models.ConfirmableRecipe)
class ConfirmableRecipeAdmin(admin.ModelAdmin[models.ConfirmableRecipe]):
    inlines = (ConfirmableRecipeIngredientInline, ConfirmableRecipeStepInline)
    list_display = ("id", "name", "source_url", "servings")
    search_fields = ("name", "source_url")


@admin.register(models.Source)
class SourceAdmin(admin.ModelAdmin[models.Source]):
    list_display = (
        "id",
        "url",
        "scraper",
        "updated_at",
        "cached_price",
        "cached_error",
        "quantity",
        "quantity_unit",
    )
    search_fields = ("url",)


@admin.register(models.Scraper)
class ScraperAdmin(admin.ModelAdmin[models.Scraper]):
    list_display = ("id", "ingredient", "cached_price", "cached_source", "updated_at")
    search_fields = ("ingredient__name",)
