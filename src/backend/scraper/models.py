from django.db import models
from scraper import scraping
from datetime import datetime, timedelta, timezone

from api.models import IngredientUnit

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from api.models import NullableFloatField, Ingredient


class Scraper(models.Model):
    ingredient: "models.OneToOneField[Optional[Ingredient], Optional[Ingredient]]" = (
        models.OneToOneField(
            "api.Ingredient",
            on_delete=models.CASCADE,
            related_name="scraper",
            null=True,
            blank=True,
        )
    )
    cached_source: models.ForeignKey["Optional[Source]", "Optional[Source]"] = (
        models.ForeignKey(
            "Source",
            on_delete=models.SET_NULL,
            null=True,
            related_name="best_for",
            blank=True,
        )
    )
    cached_price: "NullableFloatField" = models.FloatField(null=True, blank=True)
    updated_at: models.DateTimeField[datetime, datetime] = models.DateTimeField(
        auto_now=True
    )

    if TYPE_CHECKING:
        from django_stubs_ext.db.models.manager import RelatedManager

        sources: RelatedManager["Source"]

    @property
    def min_price_per_unit(self):
        if self.cached_price and datetime.now(
            timezone.utc
        ) - self.updated_at <= timedelta(hours=1):
            return self.cached_price
        self.update()
        return self.cached_price

    @property
    def min_url(self) -> Optional[str]:
        if self.cached_source and datetime.now(
            timezone.utc
        ) - self.updated_at <= timedelta(hours=1):
            return self.cached_source.url
        self.update()
        return self.cached_source.url if self.cached_source else None

    def update(self):
        min_source, min_price = None, None
        for src in self.sources.all():
            if min_price is None or (
                src.min_price_per_unit and src.min_price_per_unit < min_price
            ):
                min_source = src
                min_price = src.min_price_per_unit
        self.cached_source = min_source
        self.cached_price = min_price
        return min_price


class Source(models.Model):
    url: models.CharField[str, str] = models.CharField(max_length=100)
    updated_at: models.DateTimeField[datetime, datetime] = models.DateTimeField(
        auto_now=True
    )
    cached_price: "NullableFloatField" = models.FloatField(null=True, blank=True)
    cached_error: models.CharField[Optional[str], Optional[str]] = models.CharField(
        max_length=200, null=True, blank=True
    )
    quantity_unit: models.CharField[IngredientUnit, IngredientUnit] = models.CharField(
        max_length=4,
        choices=IngredientUnit.choices,
        default=IngredientUnit.KILOGRAM,
        help_text=(
            "The base unit for the Source stats (e.g., per kg, per liter, etc.)"
        ),
    )
    quantity: models.FloatField[float, float] = models.FloatField(
        null=False, blank=False
    )
    scraper: models.ForeignKey[Scraper, Scraper] = models.ForeignKey(
        Scraper, on_delete=models.CASCADE, related_name="sources"
    )

    @property
    def min_price_per_unit(self):
        if self.cached_price and datetime.now(
            timezone.utc
        ) - self.updated_at <= timedelta(hours=1):
            return self.cached_price

        new_price, error = scraping.from_url(self.url)
        now = datetime.now(timezone.utc)
        if error:
            self.cached_error = error
            self.cached_price = None
            self.updated_at = now
            Source.objects.filter(pk=self.pk).update(cached_error=error, cached_price=None, updated_at=now)
            print(f"Error scraping {self.url}: {error}")
        elif new_price is not None:
            self.cached_price = new_price / self.quantity
            self.cached_error = None
            self.updated_at = now
            Source.objects.filter(pk=self.pk).update(cached_price=self.cached_price, cached_error=None, updated_at=now)
        else:
            print(
                f"Scraping {self.url} had no error and no price, this should never happen"
            )
        return self.cached_price
