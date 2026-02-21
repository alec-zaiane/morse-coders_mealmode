from rest_framework import serializers
from . import models


class NutritionStatsSerializer(serializers.ModelSerializer[models.NutritionStats]):
    class Meta:  # type: ignore
        model = models.NutritionStats
        fields = "__all__"


class IngredientSerializer(serializers.ModelSerializer[models.Ingredient]):
    nutrition_stats = NutritionStatsSerializer(read_only=True)

    class Meta:  # type: ignore
        model = models.Ingredient
        fields = ("id", "name", "nutrition_stats", "lowest_cost")


class RecipeIngredientSerializer(serializers.ModelSerializer[models.RecipeIngredient]):
    ingredient = IngredientSerializer(read_only=True)

    class Meta:  # type: ignore
        model = models.RecipeIngredient
        fields = ("id", "ingredient", "quantity")


class TagSerializer(serializers.ModelSerializer[models.RecipeTag]):
    class Meta:  # type: ignore
        model = models.RecipeTag
        fields = "__all__"


class RecipeSerializer(serializers.ModelSerializer[models.Recipe]):
    ingredients_list = RecipeIngredientSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:  # type: ignore
        model = models.Recipe
        fields = "__all__"
