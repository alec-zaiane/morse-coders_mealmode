from django.db import models
from django.utils.translation import gettext_lazy as _

from typing import TYPE_CHECKING


class IngredientUnit(models.TextChoices):
    KILOGRAM = "kg", _("Kilogram")
    LITER = "l", _("Liter")
    PIECE = "pc", _("Piece / Count")
    # more can be added here later


class NutritionStats(models.Model):
    """
    Nutrition stats for an ingredient per one base unit (like x calories per 100g).
    """

    ingredient = models.OneToOneField(
        "Ingredient",
        on_delete=models.CASCADE,
        related_name="nutrition_stats",
        null=True,
        blank=True,
    )
    base_unit = models.CharField(
        max_length=4,
        choices=IngredientUnit.choices,
        default=IngredientUnit.KILOGRAM,
        help_text=_(
            "The base unit for the nutrition stats (e.g., per kg, per liter, etc.)"
        ),
    )

    # per-unit nutrition stats, null means unknown / not provided
    kcal_per_unit = models.FloatField(null=True)
    fat_saturated_grams_per_unit = models.FloatField(null=True)
    fat_trans_grams_per_unit = models.FloatField(null=True)
    carbohydrate_fiber_grams_per_unit = models.FloatField(null=True)
    carbohydrate_sugar_grams_per_unit = models.FloatField(null=True)
    protein_grams_per_unit = models.FloatField(null=True)
    cholesterol_grams_per_unit = models.FloatField(null=True)
    sodium_milligrams_per_unit = models.FloatField(null=True)

    potassium_milligrams_per_unit = models.FloatField(null=True)
    calcium_milligrams_per_unit = models.FloatField(null=True)
    iron_milligrams_per_unit = models.FloatField(null=True)
    vitamin_a_milligrams_per_unit = models.FloatField(null=True)
    vitamin_c_milligrams_per_unit = models.FloatField(null=True)
    vitamin_d_milligrams_per_unit = models.FloatField(null=True)

    # more can be added here later

    def inline_str(self) -> str:
        return f"{self.kcal_per_unit} kcal per {self.base_unit}"


class Ingredient(models.Model):
    name = models.CharField(max_length=100)

    if TYPE_CHECKING:
        nutrition_stats: "models.OneToOneField[NutritionStats]"

    def __str__(self) -> str:
        return f"{self.name} ({self.nutrition_stats.inline_str() if hasattr(self, 'nutrition_stats') else 'No nutrition stats'})"


class RecipeIngredient(models.Model):
    recipe: "models.ForeignKey[Recipe]" = models.ForeignKey(
        "Recipe",
        on_delete=models.CASCADE,
        related_name="ingredients_list",
    )
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.FloatField()  # quantity in below units
    unit = models.CharField(
        max_length=4,
        choices=IngredientUnit.choices,
        default=IngredientUnit.KILOGRAM,
        help_text=_(
            "The unit multiplier for the ingredient quantity (e.g., kg, liter, piece, etc.)"
        ),
    )
    notes = models.TextField(blank=True)  # optional notes about the ingredient

    def __str__(self) -> str:
        match self.unit:
            case IngredientUnit.KILOGRAM:
                return f"{self.quantity / 1000}g of {self.ingredient.name}"
            case IngredientUnit.LITER:
                return f"{self.quantity}l of {self.ingredient.name}"
            case IngredientUnit.PIECE:
                return f"{self.quantity} piece(s) of {self.ingredient.name}"
            case _:
                raise NotImplementedError(
                    f"Unit {self.unit} not implemented in __str__ method for RecipeIngredient"
                )


class Recipe(models.Model):
    name = models.CharField(max_length=100)
    ingredients = models.ManyToManyField(Ingredient, through=RecipeIngredient)

    if TYPE_CHECKING:
        from django.db.models.manager import RelatedManager

        ingredients_list: "RelatedManager[RecipeIngredient]"
