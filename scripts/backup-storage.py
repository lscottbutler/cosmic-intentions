"""Read-only authenticated Storage export using the database's complete object inventory."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import sys
from urllib.parse import quote
from urllib.request import Request, urlopen


def export_objects(objects, root, fetch):
    manifest = []
    for item in objects:
        bucket, name = item['bucket_id'], item['name']
        parts = PurePosixPath(name).parts
        if (not bucket or bucket in ('.', '..') or '/' in bucket or '\\' in bucket
                or not name or name.startswith('/') or '\\' in name
                or any(p in ('.', '..') for p in name.split('/'))):
            raise ValueError('Unsafe storage object path; export stopped')
        target = root / bucket / Path(*parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        size, digest = 0, hashlib.sha256()
        with fetch(bucket, name) as source, target.open('wb') as output:
            while block := source.read(1024 * 1024):
                output.write(block)
                digest.update(block)
                size += len(block)
        expected = (item.get('metadata') or {}).get('size')
        if expected is not None and size != int(expected):
            raise ValueError('Storage size mismatch; export stopped')
        manifest.append({'bucket_id': bucket, 'name': name, 'bytes': size,
                         'sha256': digest.hexdigest()})
    return manifest


if __name__ == '__main__':
    inventory, destination = Path(sys.argv[1]), Path(sys.argv[2])
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    base = 'https://wbqzwbubbeorcknevips.supabase.co/storage/v1/object/authenticated/'

    def download(bucket, name):
        req = Request(base + quote(bucket, safe='') + '/' + quote(name, safe='/'),
                      headers={'apikey': key, 'Authorization': 'Bearer ' + key})
        return urlopen(req, timeout=120)

    result = export_objects(json.loads(inventory.read_text()), destination, download)
    destination.mkdir(parents=True, exist_ok=True)
    (destination / 'SHA256-MANIFEST.json').write_text(json.dumps(result, indent=2))
    print('Storage objects exported:', len(result))
