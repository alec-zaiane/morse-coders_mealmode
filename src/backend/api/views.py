from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from . import models, serializers


class IngredientViewSet(viewsets.ModelViewSet[models.Ingredient]):
    queryset = models.Ingredient.objects.all()
    serializer_class = serializers.IngredientSerializer
    filter_backends = [SearchFilter]
    search_fields = ["name"]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
        "on_hand": ["isnull"],
    }


class RecipeViewSet(viewsets.ModelViewSet[models.Recipe]):
    queryset = models.Recipe.objects.all()
    serializer_class = serializers.RecipeSerializer


class TagViewSet(viewsets.ModelViewSet[models.RecipeTag]):
    queryset = models.RecipeTag.objects.all()
    serializer_class = serializers.TagSerializer
