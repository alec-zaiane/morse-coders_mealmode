import requests
from typing import Optional
from bs4 import BeautifulSoup
import json
from typing import Any
from urllib.parse import urlparse

ScrapingReturn = tuple[Optional[float], Optional[str]]
# The above type is (price per unit, error message). Price and error are mutually exclusive


def from_url(url: str) -> ScrapingReturn:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return (None, "Invalid URL format. URL must start with http:// or https://")
    if "realcanadiansuperstore" in url.split("."):
        code = url.split("/")[-1].split("?")[0]
        return from_superstore(code)
    return try_schema_org_product(url)


def try_schema_org_product(url: str) -> ScrapingReturn:
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "DNT": "1",
    }

    # as a fallback, see if the page contains schema.org product data that we can parse
    try:
        response = requests.get(url, headers=headers, timeout=10)
    except requests.RequestException as exc:
        return (None, f"Failed to reach the URL: {exc}")
    if response.status_code != 200:
        return (None, f"Failed to reach the URL: {response.status_code}")
    soup = BeautifulSoup(response.text, "html.parser")
    tag = soup.find("script", {"type": "application/ld+json"})
    if not tag:
        print(response.text)
        return (None, "Unsupported Source (code 1)")

    try:
        data: dict[str, Any] | list[Any] = json.loads(tag.string or "")
        while isinstance(data, list):
            data = data[0]
        offers: dict[str, Any] | list[dict[str, Any]] = data.get("offers", {})
        if isinstance(offers, list):
            offers = offers[0]
        price = offers.get("price")
        if price is not None:
            return (float(price), None)
        else:
            return (None, "Unsupported Source (code 2)")
    except json.JSONDecodeError:
        return (None, "Unsupported Source (code 3)")


def from_superstore(code: str) -> ScrapingReturn:
    cookies = {
        "bm_sz": "6901B01EA4276EC98DF2AE835FBE13D2~YAAQTKcQAr2odnGcAQAAA0uXfR6r8jDfn9hLGYo4B4dtqdu4AHmAPcjgo4b8DP9BZQs70wj1OSsH2iHbKsL8qFzMgui8ajgiqpEIpcElaauykUaPazbnT9SVWURjRH1lcp9YtTm1EcWR7LFFXSktgUvcOIrkC76cca4dEWwPVIMB0Kj0EBO+VZwyscCcwnRBg58hb9QGqqPXxQ/e18+XXBQg2Y3m1rfRoOvJOoWcdUbVf3VbsgZo4dIwn4apX9/J1tI9cB9t7JbYuBF66Ds6Yz5dWRWNcqJYpSVswT14OztV6xfQUllZqQW4Fxs3ryMjYEMnHq1Gh44zpX1mGiC7HJKFPRI4m7QY2Flx7NygNZrkeQ==~3753523~3551544",
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en",
        # 'Accept-Encoding': 'gzip, deflate, br, zstd',
        "Content-Type": "application/json",
        "Site-Banner": "superstore",
        "Business-User-Agent": "PCXWEB",
        "x-application-type": "Web",
        "x-loblaw-tenant-id": "ONLINE_GROCERIES",
        "x-apikey": "C1xujSegT5j3ap3yexJjqhOfELwGKYvz",
        "Origin_Session_Header": "B",
        "Origin": "https://www.realcanadiansuperstore.ca",
        "DNT": "1",
        "Sec-GPC": "1",
        "Connection": "keep-alive",
        "Referer": "https://www.realcanadiansuperstore.ca/",
        # 'Cookie': 'bm_sz=6901B01EA4276EC98DF2AE835FBE13D2~YAAQTKcQAr2odnGcAQAAA0uXfR6r8jDfn9hLGYo4B4dtqdu4AHmAPcjgo4b8DP9BZQs70wj1OSsH2iHbKsL8qFzMgui8ajgiqpEIpcElaauykUaPazbnT9SVWURjRH1lcp9YtTm1EcWR7LFFXSktgUvcOIrkC76cca4dEWwPVIMB0Kj0EBO+VZwyscCcwnRBg58hb9QGqqPXxQ/e18+XXBQg2Y3m1rfRoOvJOoWcdUbVf3VbsgZo4dIwn4apX9/J1tI9cB9t7JbYuBF66Ds6Yz5dWRWNcqJYpSVswT14OztV6xfQUllZqQW4Fxs3ryMjYEMnHq1Gh44zpX1mGiC7HJKFPRI4m7QY2Flx7NygNZrkeQ==~3753523~3551544',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
    }

    params = {
        "lang": "en",
        "date": "20022026",
        "pickupType": "STORE",
        "storeId": "1080",
        "banner": "superstore",
    }

    response = requests.get(
        f"https://api.pcexpress.ca/pcx-bff/api/v1/products/{code}",
        params=params,
        cookies=cookies,
        headers=headers,
    )
    out = min(
        [
            e["price"]["value"] if not e["dealPrice"] else e["dealPrice"]
            for e in response.json()["offers"]
        ]
    )
    return (out, None)
