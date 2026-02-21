import requests

def from_superstore(code):
    cookies = {
        'bm_sz': '6901B01EA4276EC98DF2AE835FBE13D2~YAAQTKcQAr2odnGcAQAAA0uXfR6r8jDfn9hLGYo4B4dtqdu4AHmAPcjgo4b8DP9BZQs70wj1OSsH2iHbKsL8qFzMgui8ajgiqpEIpcElaauykUaPazbnT9SVWURjRH1lcp9YtTm1EcWR7LFFXSktgUvcOIrkC76cca4dEWwPVIMB0Kj0EBO+VZwyscCcwnRBg58hb9QGqqPXxQ/e18+XXBQg2Y3m1rfRoOvJOoWcdUbVf3VbsgZo4dIwn4apX9/J1tI9cB9t7JbYuBF66Ds6Yz5dWRWNcqJYpSVswT14OztV6xfQUllZqQW4Fxs3ryMjYEMnHq1Gh44zpX1mGiC7HJKFPRI4m7QY2Flx7NygNZrkeQ==~3753523~3551544',
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en',
        # 'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        'Site-Banner': 'superstore',
        'Business-User-Agent': 'PCXWEB',
        'x-application-type': 'Web',
        'x-loblaw-tenant-id': 'ONLINE_GROCERIES',
        'x-apikey': 'C1xujSegT5j3ap3yexJjqhOfELwGKYvz',
        'Origin_Session_Header': 'B',
        'Origin': 'https://www.realcanadiansuperstore.ca',
        'DNT': '1',
        'Sec-GPC': '1',
        'Connection': 'keep-alive',
        'Referer': 'https://www.realcanadiansuperstore.ca/',
        # 'Cookie': 'bm_sz=6901B01EA4276EC98DF2AE835FBE13D2~YAAQTKcQAr2odnGcAQAAA0uXfR6r8jDfn9hLGYo4B4dtqdu4AHmAPcjgo4b8DP9BZQs70wj1OSsH2iHbKsL8qFzMgui8ajgiqpEIpcElaauykUaPazbnT9SVWURjRH1lcp9YtTm1EcWR7LFFXSktgUvcOIrkC76cca4dEWwPVIMB0Kj0EBO+VZwyscCcwnRBg58hb9QGqqPXxQ/e18+XXBQg2Y3m1rfRoOvJOoWcdUbVf3VbsgZo4dIwn4apX9/J1tI9cB9t7JbYuBF66Ds6Yz5dWRWNcqJYpSVswT14OztV6xfQUllZqQW4Fxs3ryMjYEMnHq1Gh44zpX1mGiC7HJKFPRI4m7QY2Flx7NygNZrkeQ==~3753523~3551544',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
    }

    params = {
        'lang': 'en',
        'date': '20022026',
        'pickupType': 'STORE',
        'storeId': '1080',
        'banner': 'superstore',
    }

    response = requests.get(
        f"https://api.pcexpress.ca/pcx-bff/api/v1/products/{code}",
        params=params,
        cookies=cookies,
        headers=headers,
    )
    return min([e['price']['value'] if not e['dealPrice'] else e['dealPrice'] for e in response.json()['offers']])