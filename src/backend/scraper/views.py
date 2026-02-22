from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from . import models, serializers


class ScraperViewSet(viewsets.ModelViewSet[models.Scraper]):
    queryset = models.Scraper.objects.select_related("cached_source").prefetch_related("sources").all()
    serializer_class = serializers.ScraperSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["ingredient"]


class SourceViewSet(viewsets.ModelViewSet[models.Source]):
    queryset = models.Source.objects.all()
    serializer_class = serializers.SourceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scraper"]
