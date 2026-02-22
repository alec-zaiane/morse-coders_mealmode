from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import serializers as drf_serializers
from django_filters.rest_framework import DjangoFilterBackend
from . import models, serializers
from . import recipe_loader
from drf_spectacular.utils import extend_schema, inline_serializer  # type: ignore


class ScraperViewSet(viewsets.ModelViewSet[models.Scraper]):
    queryset = (
        models.Scraper.objects.select_related("cached_source")
        .prefetch_related("sources")
        .all()
    )
    serializer_class = serializers.ScraperSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ingredient"]

    @action(detail=True, methods=["post"])
    def refresh(self, request: Request, pk: int | None = None) -> Response:
        """Scrape all sources, update cached_price/cached_source, return updated scraper."""
        scraper: models.Scraper = self.get_object()
        scraper.update()
        scraper.save()
        scraper.refresh_from_db()
        serializer = self.get_serializer(scraper)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SourceViewSet(viewsets.ModelViewSet[models.Source]):
    queryset = models.Source.objects.all()
    serializer_class = serializers.SourceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scraper"]


class ConfirmableRecipeViewSet(viewsets.ModelViewSet[models.ConfirmableRecipe]):
    queryset = models.ConfirmableRecipe.objects.prefetch_related(
        "ingredients_list", "steps_list"
    ).all()
    serializer_class = serializers.ConfirmableRecipeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["source_url"]

    @extend_schema(
        summary="Confirm a ConfirmableRecipe, saving it as an actual Recipe",
        responses={
            200: inline_serializer(
                name="ConfirmRecipeResponse",
                fields={
                    "message": drf_serializers.CharField(
                        help_text="Success message confirming the recipe was saved"
                    ),
                },
            ),
            400: inline_serializer(
                name="ConfirmRecipeErrorResponse",
                fields={
                    "error": drf_serializers.CharField(
                        help_text="Error message if confirming failed"
                    ),
                },
            ),
        },
    )
    @action(detail=True, methods=["post"])
    def confirm(self, request: Request, pk: int | None = None) -> Response:
        """Confirm the recipe, saving it as an actual Recipe and deleting the ConfirmableRecipe."""
        confirmable_recipe: models.ConfirmableRecipe = self.get_object()
        result = recipe_loader.save_confirmable_recipe_as_actual_recipe(
            confirmable_recipe
        )
        if result.error:
            return Response({"error": result.error}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                {"message": "Recipe confirmed and saved successfully"},
                status=status.HTTP_200_OK,
            )

    @extend_schema(
        summary="Load a recipe from a URL, creating a ConfirmableRecipe for confirmation",
        request=inline_serializer(
            name="LoadRecipeRequest",
            fields={
                "url": drf_serializers.URLField(
                    help_text="The URL of the recipe to load"
                ),
            },
        ),
        responses={
            200: serializers.ConfirmableRecipeSerializer,
            400: inline_serializer(
                name="LoadRecipeErrorResponse",
                fields={
                    "error": drf_serializers.CharField(
                        help_text="Error message if loading failed"
                    ),
                },
            ),
        },
    )
    @action(detail=False, methods=["post"], url_path="load-recipe")
    def load_recipe(self, request: Request) -> Response:
        """Load a recipe from a URL, returning the ConfirmableRecipe for confirmation."""
        url = request.data.get("url")
        if not url:
            return Response(
                {"error": "URL is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        result = recipe_loader.load_recipe_from_url(url)
        if result.error:
            return Response({"error": result.error}, status=status.HTTP_400_BAD_REQUEST)
        else:
            serializer = self.get_serializer(result.confirmable_recipe)
            return Response(serializer.data, status=status.HTTP_200_OK)
