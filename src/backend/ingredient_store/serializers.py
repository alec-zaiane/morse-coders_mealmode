from rest_framework import serializers
from . import models


class OnHandIngredientSerializer(serializers.ModelSerializer[models.OnHandIngredient]):
    class Meta:  # type: ignore
        model = models.OnHandIngredient
        fields = ("id", "ingredient", "quantity", "desired_quantity", "warning_quantity", "notes")
