import copy
import unittest
from export_status import sanitize


def fixture():
    metric = {'completed':None, 'total':None, 'scope_th':'ทั้งเกม', 'basis_th':'ยังไม่รู้จำนวนรวม', 'evidence_path':'games/ps1/test/REPORT.md'}
    row = {'id':'ps1/test', 'name':'Authored test', 'platform':'PS1', 'status':'PARTIAL', 'status_th':'ทดสอบ',
           'next_action_th':'ตรวจต่อ', 'problems_th':'ยังไม่ครบ', 'audit_date':'2026-10-14',
           'evidence_path':'games/ps1/test/REPORT.md', 'full_game_translation_verified':False,
           'progress':{key:copy.deepcopy(metric) for key in ('overall','patch','translation')}}
    return {'repository':'rat12-web/thai-rom-cloud','schema_version':1,'audited':'2026-10-14','projects':[row]}


class PublicExportTests(unittest.TestCase):
    def run_export(self, value):
        return sanitize(value, 'f'*64, 'a'*40, '2026-10-14T00:00:00Z')

    def test_unknown_fields_private_inventory_and_raw_evidence_not_published(self):
        data = fixture(); data['private_inventory']=['copyrighted fixture sentinel']
        data['projects'][0]['raw_script']='PRIVATE_SENTINEL'
        data['projects'][0]['evidence']='RAW_SCRIPT_SENTINEL'
        out = str(self.run_export(data))
        self.assertNotIn('SENTINEL',out)
        self.assertNotIn('private_inventory',out)

    def test_known_counts_preserved_and_unknown_not_zero(self):
        data=fixture();data['projects'][0]['progress']['translation'].update(completed=0,total=271)
        result=self.run_export(data)['projects'][0]['progress']
        self.assertEqual(result['translation']['completed'],0)
        self.assertIsNone(result['overall']['completed'])

    def test_invalid_count_paths_secrets_and_duplicates_block_export(self):
        for mutate in (
            lambda d:d['projects'][0]['progress']['patch'].update(completed=12,total=10),
            lambda d:d['projects'][0].update(evidence_path='games/../private/file.md'),
            lambda d:d['projects'][0].update(problems_th='-----BEGIN OPENSSH PRIVATE KEY-----'),
            lambda d:d['projects'][0].update(problems_th='D:/owner/private-input.gba'),
            lambda d:d['projects'].append(copy.deepcopy(d['projects'][0])),
        ):
            data=fixture();mutate(data)
            with self.assertRaises(ValueError):self.run_export(data)


if __name__=='__main__':unittest.main()
