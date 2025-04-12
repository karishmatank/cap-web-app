import json, os
from django.conf import settings

def nav_links(request):
    json_path = os.path.join(settings.BASE_DIR, 'static', 'data', 'nav_links.json')
    with open(json_path) as f:
        data = json.load(f)
    return {'nav_links': data}