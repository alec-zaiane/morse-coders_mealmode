from django.db import models
from django.utils.translation import gettext_lazy as _

from typing import TYPE_CHECKING, Optional

from api import models as api_models

if TYPE_CHECKING:
    from api.models import NullableFloatField

# Create your models here.


class OnHandIngredient(models.Model):
    ingredient: models.ForeignKey[api_models.Ingredient, api_models.Ingredient] = (
        models.ForeignKey(
            api_models.Ingredient,
            on_delete=models.CASCADE,
            related_name="on_hand_ingredients",
        )
    )
    quantity: "NullableFloatField" = models.FloatField(
        null=True,
        blank=True,
        help_text=_("Quantity of the ingredient currently on hand"),
    )
    desired_quantity: "NullableFloatField" = models.FloatField(
        null=True,
        blank=True,
        help_text=_(
            "Desired quantity of the ingredient to have on hand (e.g., for meal planning)"
        ),
    )
    warning_quantity: "NullableFloatField" = models.FloatField(
        null=True,
        blank=True,
        help_text=_(
            "Optional warning threshold quantity (e.g., if quantity on hand falls below this, issue a warning)"
        ),
    )
    notes: models.TextField[Optional[str], Optional[str]] = models.TextField(
        blank=True, help_text=_("Optional notes about the ingredient on hand")
    )
