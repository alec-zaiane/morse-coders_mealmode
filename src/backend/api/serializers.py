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


class RecipeIngredientWriteSerializer(serializers.Serializer):
    """For create/update: list of {ingredient: id, quantity}."""

    ingredient = serializers.PrimaryKeyRelatedField(
        queryset=models.Ingredient.objects.all()
    )
    quantity = serializers.FloatField(min_value=0)


class TagSerializer(serializers.ModelSerializer[models.RecipeTag]):
    class Meta:  # type: ignore
        model = models.RecipeTag
        fields = "__all__"


class RecipeStepSerializer(serializers.ModelSerializer[models.RecipeStep]):
    class Meta:  # type: ignore
        model = models.RecipeStep
        fields = "__all__"


class RecipeStepWriteSerializer(serializers.Serializer):
    """For create/update: list of {step_number, description}."""

    step_number = serializers.IntegerField(min_value=1)
    description = serializers.CharField(allow_blank=True)


class RecipeSerializer(serializers.ModelSerializer[models.Recipe]):
    ingredients_list = RecipeIngredientSerializer(many=True, read_only=True)
    recipe_ingredients = RecipeIngredientWriteSerializer(
        many=True, required=False, write_only=True
    )
    recipe_steps = RecipeStepWriteSerializer(
        many=True, required=False, write_only=True
    )
    tags = TagSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)

    class Meta:  # type: ignore
        model = models.Recipe
        fields = "__all__"

    def create(self, validated_data: dict):
        recipe_ingredients = validated_data.pop("recipe_ingredients", [])
        recipe_steps = validated_data.pop("recipe_steps", [])
        validated_data.pop(
            "ingredients", None
        )  # M2M through RecipeIngredient; set below
        recipe = models.Recipe.objects.create(**validated_data)
        for item in recipe_ingredients:
            models.RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=item["ingredient"],
                quantity=item["quantity"],
            )
        for item in recipe_steps:
            models.RecipeStep.objects.create(
                recipe=recipe,
                step_number=item["step_number"],
                description=item["description"],
            )
        return recipe
