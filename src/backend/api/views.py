from rest_framework import viewsets

from . import models, serializers


class IngredientViewSet(viewsets.ModelViewSet[models.Ingredient]):
    queryset = models.Ingredient.objects.all()
    serializer_class = serializers.IngredientSerializer


class RecipeViewSet(viewsets.ModelViewSet[models.Recipe]):
    queryset = models.Recipe.objects.all()
    serializer_class = serializers.RecipeSerializer
