from django.contrib import admin
from django.contrib.admin.decorators import register
from . import models

# Register your models here.


class NutritionStatsInline(
    admin.StackedInline[models.NutritionStats, models.NutritionStats]
):
    model = models.NutritionStats
    extra = 1
    max_num = 1
    fieldsets = (
        (
            "Base",
            {
                "fields": (
                    "base_unit",
                    "kcal_per_unit",
                )
            },
        ),
        (
            "Macronutrients",
            {
                "fields": (
                    "fat_saturated_grams_per_unit",
                    "fat_trans_grams_per_unit",
                    "carbohydrate_fiber_grams_per_unit",
                    "carbohydrate_sugar_grams_per_unit",
                    "protein_grams_per_unit",
                ),
            },
        ),
        (
            "Minerals & Electrolytes",
            {
                "fields": (
                    "cholesterol_milligrams_per_unit",
                    "sodium_milligrams_per_unit",
                    "potassium_milligrams_per_unit",
                    "calcium_milligrams_per_unit",
                    "iron_milligrams_per_unit",
                ),
            },
        ),
        (
            "Vitamins",
            {
                "fields": (
                    "vitamin_a_milligrams_per_unit",
                    "vitamin_c_milligrams_per_unit",
                    "vitamin_d_milligrams_per_unit",
                ),
            },
        ),
    )


@register(models.Ingredient)
class IngredientAdmin(admin.ModelAdmin[models.Ingredient]):
    list_display = ("name", "nutrition_stats_inline")
    inlines = [NutritionStatsInline]  # type: ignore

    @admin.display(description="Nutrition Stats")
    def nutrition_stats_inline(self, obj: models.Ingredient) -> str:
        if hasattr(obj, "nutrition_stats"):
            return obj.nutrition_stats.inline_str()
        else:
            return "No nutrition stats"


class RecipeIngredientInline(
    admin.TabularInline[models.RecipeIngredient, models.RecipeIngredient]
):
    model = models.RecipeIngredient
    extra = 1


@register(models.RecipeTag)
class RecipeTagAdmin(admin.ModelAdmin[models.RecipeTag]):
    list_display = ("name", "on_recipes_count")

    @admin.display(description="Number of Recipes")
    def on_recipes_count(self, obj: models.RecipeTag) -> int:
        return obj.recipes.count()


@register(models.Recipe)
class RecipeAdmin(admin.ModelAdmin[models.Recipe]):
    list_display = ("name", "ingredients_list")
    inlines = [RecipeIngredientInline]  # type: ignore

    @admin.display(description="Ingredients")
    def ingredients_list(self, obj: models.Recipe) -> str:
        return ", ".join(str(ri) for ri in obj.ingredients_list.all())
