from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, RecipeViewSet, TagViewSet
from ingredient_store.views import OnHandIngredientViewSet


router = DefaultRouter()
router.register(r"ingredients", IngredientViewSet, basename="ingredient")
router.register(r"recipes", RecipeViewSet, basename="recipe")
router.register(r"tags", TagViewSet, basename="tag")
router.register(
    r"ingredient-store", OnHandIngredientViewSet, basename="ingredient-store"
)
urlpatterns = [
    path("", include(router.urls)),
]
