"""Allowlist-only public view of an owner-authorized private Hub catalog."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

ASSETS = ('index.html', 'style.css', 'readability.css', 'app.js')
ROW_FIELDS = ('id', 'name', 'platform', 'status', 'status_th', 'next_action_th',
              'problems_th', 'audit_date', 'evidence_path', 'full_game_translation_verified')
METRIC_FIELDS = ('completed', 'total', 'scope_th', 'basis_th', 'evidence_path')
DENIED = re.compile(r'-----BEGIN .*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|(?<![A-Za-z0-9])[A-Za-z]:[\\/]|/mnt/data/|private-runtime[\\/]', re.I)


def safe_string(value):
    if not isinstance(value, str) or len(value) > 2000 or DENIED.search(value):
        raise ValueError('Unsafe public text')
    return value


def safe_path(value):
    value = safe_string(value)
    if not re.fullmatch(r'(games|tools|engines|docs)/[A-Za-z0-9_./-]+', value) or '..' in value.split('/'):
        raise ValueError('Unsafe evidence path')
    return value


def sanitize(catalog, raw_hash, source_commit, source_updated_at):
    if catalog['repository'] != 'rat12-web/thai-rom-cloud' or catalog['schema_version'] != 1:
        raise ValueError('Wrong source/schema')
    if not re.fullmatch(r'[a-f0-9]{40}', source_commit):
        raise ValueError('Invalid source commit')
    rows = []
    ids = set()
    for source in catalog['projects']:
        row = {key: source[key] for key in ROW_FIELDS}
        for key in ROW_FIELDS:
            if key != 'full_game_translation_verified':
                safe_string(row[key])
        if type(row['full_game_translation_verified']) is not bool:
            raise ValueError('Invalid completion flag')
        if not re.fullmatch(r'(sfc|gba|gb|ps1|homebrew)/[a-z0-9-]+', row['id']) or row['id'] in ids:
            raise ValueError('Invalid/duplicate game ID')
        ids.add(row['id'])
        safe_path(row['evidence_path'])
        row['evidence_summary_th'] = row['status_th']
        row['progress'] = {}
        for key in ('overall', 'patch', 'translation'):
            source_metric = source['progress'][key]
            metric = {field: source_metric[field] for field in METRIC_FIELDS}
            n, d = metric['completed'], metric['total']
            if (n is None) != (d is None):
                raise ValueError('Mixed known/unknown denominator')
            if n is not None and (type(n) is not int or type(d) is not int or d <= 0 or not 0 <= n <= d):
                raise ValueError('Invalid counts')
            if key == 'overall' and d is not None and not source_metric.get('denominator_verified', False):
                raise ValueError('Unverified whole-game denominator')
            safe_string(metric['scope_th']); safe_string(metric['basis_th']); safe_path(metric['evidence_path'])
            row['progress'][key] = metric
        rows.append(row)
    return {'schema_version': 1, 'repository': catalog['repository'], 'branch': 'main',
            'audited': safe_string(catalog['audited']), 'projects': rows,
            'catalog_sha256': raw_hash, 'source_commit': source_commit,
            'source_updated_at': safe_string(source_updated_at), 'sync_interval_minutes': 5,
            'snapshot_policy_th': 'ซิงก์จาก GitHub main ทุก 5 นาทีเมื่อมีข้อมูลเปลี่ยน; อาจล่าช้าตามคิว GitHub Actions เว็บตรวจข้อมูลใหม่ทุก 60 วินาทีขณะเปิด',
            'metrics_policy_th': 'เปอร์เซ็นต์เฉพาะชุดที่ระบุ ไม่ใช่ทั้งเกม ร่างแปลไม่ใช่การอนุมัติ — หมายถึงไม่มีตัวหารที่ตรวจแล้ว ไม่ใช่ 0%'}


def export(source, destination, sync_active=False):
    raw = (source/'docs/PROJECT_STATUS.json').read_bytes()
    commit = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    date = subprocess.check_output(['git', '-C', str(source), 'show', '-s', '--format=%cI', 'HEAD'], text=True).strip()
    result = sanitize(json.loads(raw), hashlib.sha256(raw).hexdigest(), commit, date)
    result['sync_active'] = sync_active
    result['sync_state_th'] = 'ซิงก์ Hub ทุก 5 นาที' if sync_active else 'snapshot ปัจจุบัน · sync อัตโนมัติรออนุมัติสิทธิ์อ่าน Hub'
    if not sync_active:
        result['snapshot_policy_th'] = 'snapshot จาก GitHub main; sync Hub อัตโนมัติรออนุมัติสิทธิ์อ่าน repo ส่วนตัว เว็บตรวจ snapshot ใหม่ทุก 60 วินาที'
    destination.mkdir(parents=True, exist_ok=True)
    expected = set(ASSETS) | {'status.json'}
    if {p.name for p in destination.iterdir()} - expected:
        raise ValueError('Unexpected file in public site; nothing deleted automatically')
    for name in ASSETS:
        path = source/'dashboard'/name
        if path.is_symlink() or path.stat().st_size > 256000:
            raise ValueError('Unexpected asset type/size')
        text = path.read_text(encoding='utf-8')
        if DENIED.search(text):
            raise ValueError('Secret/private path in asset')
        shutil.copyfile(path, destination/name)
    (destination/'status.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    return {'source_commit': commit, 'catalog_sha256': result['catalog_sha256'], 'projects': len(result['projects'])}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--sync-active', action='store_true')
    args = parser.parse_args()
    print(json.dumps(export(args.source, args.output, args.sync_active)))
