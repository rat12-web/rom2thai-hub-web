"""One small weekly activity commit after a successful Hub read/export."""
import datetime
import json
from pathlib import Path

now = datetime.datetime.now(datetime.timezone.utc)
year, week, _ = now.isocalendar()
bucket = f'{year}-W{week:02d}'
path = Path('.automation/last_verified.json')
old = json.loads(path.read_text()) if path.exists() else {}
if old.get('week') != bucket:
    data = json.loads(Path('site/status.json').read_text(encoding='utf-8'))
    assert data['sync_active'] is True
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps({'week':bucket, 'verified_at':now.isoformat(),
                                'source_commit':data['source_commit'],
                                'reason':'Successful read/export; weekly activity prevents idle schedule expiry'}, indent=2)+'\n')
    print('Weekly activity marker updated')
else:
    print('Current week already verified; no keepalive change')
