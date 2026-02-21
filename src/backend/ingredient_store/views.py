from rest_framework import viewsets

from . import models, serializers


class OnHandIngredientViewSet(viewsets.ModelViewSet[models.OnHandIngredient]):
    queryset = models.OnHandIngredient.objects.all()
    serializer_class = serializers.OnHandIngredientSerializer
