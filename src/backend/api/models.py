from django.db import models
from django.utils.translation import gettext_lazy as _

from typing import TYPE_CHECKING, Optional

NullableFloatField = models.FloatField[Optional[float], Optional[float]]


class IngredientUnit(models.TextChoices):
    KILOGRAM = "kg", _("Kilogram")
    LITER = "L", _("Liter")
    PIECE = "pc", _("Piece / Count")
    # more can be added here later


class NutritionStats(models.Model):
    """
    Nutrition stats for an ingredient per one base unit (like x calories per 100g).
    """

    ingredient: models.OneToOneField["Ingredient", "Ingredient"] = models.OneToOneField(
        "Ingredient",
        on_delete=models.CASCADE,
        related_name="nutrition_stats",
        null=True,
        blank=True,
    )
    base_unit: models.CharField[IngredientUnit, IngredientUnit] = models.CharField(
        max_length=4,
        choices=IngredientUnit.choices,
        default=IngredientUnit.KILOGRAM,
        help_text=_(
            "The base unit for the nutrition stats (e.g., per kg, per liter, etc.)"
        ),
    )

    # per-unit nutrition stats, null means unknown / not provided
    kcal_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Calories (Kcal) per base unit")
    )
    fat_saturated_grams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Saturated fat (g) per base unit")
    )
    fat_trans_grams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Trans fat (g) per base unit")
    )
    carbohydrate_fiber_grams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Fiber (g) per base unit")
    )
    carbohydrate_sugar_grams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Sugars (g) per base unit")
    )
    protein_grams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Protein (g) per base unit")
    )
    cholesterol_milligrams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Cholesterol (mg) per base unit")
    )
    sodium_milligrams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Sodium (mg) per base unit")
    )
    potassium_milligrams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Potassium (mg) per base unit")
    )
    calcium_milligrams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Calcium (mg) per base unit")
    )
    iron_milligrams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Iron (mg) per base unit")
    )
    vitamin_a_milligrams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Vitamin A (mg) per base unit")
    )
    vitamin_c_milligrams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Vitamin C (mg) per base unit")
    )
    vitamin_d_milligrams_per_unit: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Vitamin D (mg) per base unit")
    )

    # more can be added here later

    def inline_str(self) -> str:
        n = sum(
            1
            for field in self._meta.fields
            if field.name not in ("id", "ingredient", "base_unit", "kcal_per_unit")
            and getattr(self, field.name) is not None
            and getattr(self, field.name) != 0
        )
        return f"{self.kcal_per_unit:.2f} kcal per {self.base_unit} {f'+{n} other nonzero nutrients' if n > 0 else ''}"


class Ingredient(models.Model):
    name: models.CharField[str, str] = models.CharField(max_length=100)
    lowest_cost: NullableFloatField = models.FloatField(
        null=True,
        blank=True,
        help_text=_("Lowest known cost per base unit (e.g., $/kg"),
    )

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
    ingredient: models.ForeignKey[Ingredient] = models.ForeignKey(
        Ingredient, on_delete=models.CASCADE
    )
    quantity: models.FloatField[float, float] = models.FloatField(
        help_text=_(
            "Quantity in base units (e.g., grams, liters, pieces), defined by the ingredient's nutrition stats)"
        )
    )  # quantity in base units
    notes: models.TextField[Optional[str], Optional[str]] = models.TextField(
        blank=True
    )  # optional notes about the ingredient

    def __str__(self) -> str:
        match self.ingredient.nutrition_stats.base_unit:
            case IngredientUnit.KILOGRAM:
                return f"{self.quantity * 1000}g of {self.ingredient.name}"
            case IngredientUnit.LITER:
                return f"{self.quantity}l of {self.ingredient.name}"
            case IngredientUnit.PIECE:
                return f"{self.quantity} piece(s) of {self.ingredient.name}"
            case _:
                raise NotImplementedError(
                    f"Unit {self.unit} not implemented in __str__ method for RecipeIngredient"
                )


class RecipeTag(models.Model):
    name: models.CharField[str, str] = models.CharField(max_length=50)

    if TYPE_CHECKING:
        recipes: "models.ManyToManyField[Recipe, Recipe]"

    def __str__(self) -> str:
        return self.name


class RecipeStep(models.Model):
    recipe: "models.ForeignKey[Recipe]" = models.ForeignKey(
        "Recipe",
        on_delete=models.CASCADE,
        related_name="steps",
    )
    step_number: models.IntegerField[int, int] = models.IntegerField()
    description: models.TextField[str, str] = models.TextField()

    class Meta:
        unique_together = ("recipe", "step_number")
        ordering = ["step_number"]


class Recipe(models.Model):
    name: models.CharField[str, str] = models.CharField(max_length=100)
    ingredients = models.ManyToManyField(Ingredient, through=RecipeIngredient)
    servings: models.IntegerField[int, int] = models.IntegerField(
        default=1, help_text=_("Number of servings this recipe makes")
    )
    tags: models.ManyToManyField[RecipeTag, RecipeTag] = models.ManyToManyField(
        RecipeTag, blank=True, related_name="recipes"
    )
    prep_time_minutes: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Preparation time in minutes")
    )
    cook_time_minutes: NullableFloatField = models.FloatField(
        null=True, blank=True, help_text=_("Cooking time in minutes")
    )
    notes: models.TextField[Optional[str], Optional[str]] = models.TextField(
        blank=True, help_text=_("Optional notes about the recipe")
    )

    if TYPE_CHECKING:
        from django_stubs_ext.db.models.manager import RelatedManager

        steps: "RelatedManager[RecipeStep]"
        ingredients_list: "RelatedManager[RecipeIngredient]"
