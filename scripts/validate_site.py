"""Fail closed before uploading any public Pages artifact."""
import hashlib
import json
import sys
from pathlib import Path
from export_status import ASSETS, DENIED, METRIC_FIELDS, ROW_FIELDS, sanitize

root = Path(sys.argv[1])
assert {p.name for p in root.iterdir()} == set(ASSETS) | {'status.json'}, 'Unexpected public file'
for path in root.iterdir():
    assert path.is_file() and not path.is_symlink() and path.stat().st_size < 256000
    assert not DENIED.search(path.read_text(encoding='utf-8')), 'Secret/private path'
data = json.loads((root/'status.json').read_text(encoding='utf-8'))
allowed = {'schema_version','repository','branch','audited','projects','catalog_sha256','source_commit','source_updated_at','sync_interval_minutes','snapshot_policy_th','metrics_policy_th','sync_active','sync_state_th'}
assert set(data) == allowed, 'Unknown top-level field'
for row in data['projects']:
    assert set(row) == set(ROW_FIELDS) | {'progress','evidence_summary_th'}, 'Unknown project field'
    for metric in row['progress'].values():
        assert set(metric) == set(METRIC_FIELDS), 'Unknown metric field'
sanitize(data, data['catalog_sha256'], data['source_commit'], data['source_updated_at'])
print(json.dumps({'status':'PASS','public_files':sorted(p.name for p in root.iterdir()),'projects':len(data['projects']),'source_commit':data['source_commit']}))
