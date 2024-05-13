from os import environ
import pathlib
from datetime import datetime
import requests

PROJECT_ROOT = pathlib.Path(__file__).parent.resolve()
TITLE = '# Otakudesu API\n'
DESC = f'{TITLE}\nAutomated README powered by GitHub Actions to dynamically display cat gifs.\nUpdate every 12 hours\n\n'
# giphy params
URL = f'https://api.giphy.com/v1/gifs/search'
SEARCH_LIMIT = 1
URL_PARAMS = params = {
    "q": 'cat',
    "api_key": environ.get('GIPHY_API_KEY'),
    "limit": SEARCH_LIMIT
}


def generate_content():
    with requests.get(url=URL, params=URL_PARAMS) as r:
        if r.status_code != 200:
            raise r.raise_for_status()
        return r.json().get('data')
    return None


def generate_rows():
    retval = [f'## Cats\n\n']
    for idx, content in enumerate(generate_content()):
        img = content.get('images').get('fixed_height')
        retval.append(f'![{content.get("title")}]({img.get("url")})\n')
    return retval


if __name__ == '__main__':
    with open(f'{PROJECT_ROOT}/README.md', "w") as f:
        f.write(DESC)
        try:
            for gif in generate_rows():
                f.write(gif)
        except Exception as exc:
            import traceback
            traceback.print_exc()
            f.write(f'<p style="color:red">Error: {exc}</p>')
