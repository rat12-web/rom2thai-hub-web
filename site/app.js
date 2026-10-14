'use strict';
const $ = s => document.querySelector(s);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const repo = 'https://github.com/rat12-web/thai-rom-cloud';
const labels = {partial:'งานบางส่วน',blocked:'ติดขัด',reference:'งานอ้างอิง',fixture:'เกมทดสอบ'};
const names = {overall:'โดยรวมทั้งเกม',patch:'การแพตช์',translation:'การแปล'};
let data, view = 'cards', platform = 'all', activeDetail = null, refreshing = false;
function percent(m) { return m.completed === null || m.total === null ? null : Math.round(m.completed / m.total * 1000) / 10; }
function category(p) { if(p.id.startsWith('homebrew/')) return 'fixture'; if(p.status.includes('BLOCKED') || p.status.includes('DEFECTS')) return 'blocked'; if(p.status.startsWith('REFERENCE')) return 'reference'; return 'partial'; }
function badge(p) { const c = category(p); return `<span class="badge ${c}">${labels[c]}</span>`; }
function metric(m, key) { const n = percent(m); return `<div class="metric"><div class="metric-label">${names[key]}</div><div class="metric-value ${n === null ? 'unknown' : ''}">${n === null ? '—' : `${n}%`}</div><div class="rail ${n === null ? 'unknown' : ''}">${n === null ? '' : `<span style="width:${n}%"></span>`}</div><div class="scope">${n === null ? 'ยังไม่มีจำนวนรวมที่ตรวจแล้ว' : `${m.completed.toLocaleString()}/${m.total.toLocaleString()} · ${escapeHTML(m.scope_th)}`}</div></div>`; }
function visible() { const term = $('#search').value.toLocaleLowerCase().trim(), status = $('#status-filter').value; return data.projects.filter(p => (category(p)!=='fixture' || $('#include-fixture').checked || status==='fixture') && (platform==='all'||p.platform===platform) && (status==='all'||category(p)===status) && `${p.name} ${p.status_th} ${p.problems_th} ${p.platform}`.toLocaleLowerCase().includes(term)); }
function render() {
 const rows = visible(); $('#result-count').textContent = rows.length; $('#empty').hidden = rows.length > 0;
 $('#results').className = view === 'cards' ? 'cards' : '';
 if(view === 'cards') $('#results').innerHTML = rows.map(p => `<article class="game-card" data-console="${escapeHTML(p.id.split('/')[0])}"><div class="card-top"><span class="console" data-console="${escapeHTML(p.id.split('/')[0])}">${escapeHTML(p.platform)}</span>${badge(p)}</div><h3>${escapeHTML(p.name)}</h3><div class="game-id">${escapeHTML(p.id)}</div><div class="metrics">${Object.keys(names).map(k=>metric(p.progress[k],k)).join('')}</div><p class="card-status">${escapeHTML(p.status_th)}</p><p class="next-line"><span>ทำถัดไป</span>${escapeHTML(p.next_action_th)}</p><p class="problem-line"><span>ปัญหาที่พบ</span>${escapeHTML(p.problems_th)}</p><div class="card-footer"><span>ตรวจสถานะ ${escapeHTML(p.audit_date)}</span><button data-id="${escapeHTML(p.id)}">ดูรายละเอียด ↗</button></div></article>`).join('');
 else $('#results').innerHTML = `<div class="table-wrap"><table><thead><tr>${['ชื่อเกม','เครื่องเกม','โดยรวมทั้งเกม','การแพตช์','การแปล','สถานะปัจจุบัน','ทำถัดไป','ปัญหาที่พบ'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(p=>`<tr data-console="${escapeHTML(p.id.split('/')[0])}"><td><button class="table-name" data-id="${escapeHTML(p.id)}">${escapeHTML(p.name)}</button><br>${badge(p)}</td><td><span class="console" data-console="${escapeHTML(p.id.split('/')[0])}">${escapeHTML(p.platform)}</span></td>${Object.keys(names).map(k=>`<td>${metric(p.progress[k],k)}</td>`).join('')}<td>${escapeHTML(p.status_th)}</td><td>${escapeHTML(p.next_action_th)}</td><td>${escapeHTML(p.problems_th)}</td></tr>`).join('')}</tbody></table></div>`;
}
function showDetails(id) { activeDetail = id; const p = data.projects.find(x=>x.id===id); if(!p) return;
 $('#detail-content').innerHTML = `<h2 id="detail-title">${escapeHTML(p.name)}</h2><span class="console" data-console="${escapeHTML(p.id.split('/')[0])}">${escapeHTML(p.platform)}</span> ${badge(p)}<p>${escapeHTML(p.status_th)}</p><div class="detail-metrics">${Object.keys(names).map(k=>{const m=p.progress[k],n=percent(m);return `<div class="detail-metric"><span class="metric-value ${n===null?'unknown':''}">${n===null?'—':n+'%'}</span><strong>${names[k]} · ${escapeHTML(m.scope_th)}</strong><p>${n===null?'ไม่มีตัวหารที่ยืนยันแล้ว':`${m.completed.toLocaleString()} ÷ ${m.total.toLocaleString()} × 100`}</p><p>${escapeHTML(m.basis_th)}</p><a class="evidence-link" href="${repo}/blob/main/${encodeURI(m.evidence_path)}" target="_blank" rel="noopener">หลักฐานตัวเลข ↗</a></div>`;}).join('')}</div><h3>สถานะปัจจุบัน / ขอบเขตการตรวจ</h3><p>${escapeHTML(p.evidence_summary_th ?? p.evidence ?? p.status_th)}</p><h3>ทำถัดไป</h3><p>${escapeHTML(p.next_action_th)}</p><h3>ปัญหาที่พบ</h3><p>${escapeHTML(p.problems_th)}</p><a class="evidence-link" href="${repo}/blob/main/${encodeURI(p.evidence_path)}" target="_blank" rel="noopener">เปิดรายงานล่าสุดใน GitHub ↗</a><p><code>${escapeHTML(p.status)}</code><br>ตรวจสถานะ ${escapeHTML(p.audit_date)} · ไม่ได้เล่นเกมเพิ่มในงาน dashboard นี้</p>`;
 if (!$('#details').open) $('#details').showModal();
}
function exportCSV() {
 const columns = ['ชื่อเกม','เครื่องเกม','โดยรวม (%)','แพตช์ (%)','แปล (%)','ขอบเขตแพตช์','ขอบเขตแปล','สถานะ','ทำถัดไป','ปัญหา'];
 const rows = visible().map(p=>[p.name,p.platform,...Object.keys(names).map(k=>percent(p.progress[k])??'ยังประเมินไม่ได้'),p.progress.patch.scope_th,p.progress.translation.scope_th,p.status_th,p.next_action_th,p.problems_th]);
 // Prefix cells starting with spreadsheet formula markers; UTF-8 BOM for Thai Excel.
 const cell = v => '"'+String(v).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
 const csv = '\ufeff'+[columns,...rows].map(r=>r.map(cell).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ROM2THAI-status-'+data.audited+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function init() {
 try {
 const response = await fetch('status.json?t='+Date.now(),{cache:'no-store'}); if(!response.ok) throw Error('HTTP '+response.status); data = await response.json();
 if(!Array.isArray(data.projects)||data.schema_version!==1) throw Error('Unsupported catalog');
 const real=data.projects.filter(p=>category(p)!=='fixture'); $('#game-count').textContent=real.length;$('#partial-count').textContent=real.filter(p=>category(p)==='partial').length;$('#blocked-count').textContent=real.filter(p=>category(p)==='blocked').length;$('#complete-count').textContent=real.filter(p=>p.full_game_translation_verified).length;$('#audit-date').textContent=data.audited;
 $('#platforms').innerHTML=['all',...new Set(real.map(p=>p.platform))].map(x=>`<button data-platform="${escapeHTML(x)}" aria-pressed="${x==='all'}">${x==='all'?'ทุกเครื่อง':escapeHTML(x)}</button>`).join('');
 $('#platforms').addEventListener('click',e=>{const b=e.target.closest('[data-platform]');if(!b)return;platform=b.dataset.platform;$('#platforms').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));render();});
 for(const selector of ['#search','#status-filter','#include-fixture']) $(selector).addEventListener(selector==='#search'?'input':'change',render);
 for(const mode of ['cards','table']) $('#'+mode+'-view').addEventListener('click',()=>{view=mode;for(const m of ['cards','table'])$('#'+m+'-view').setAttribute('aria-pressed',m===view);render();});
 $('#results').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b)showDetails(b.dataset.id);});
 $('#details .close').addEventListener('click',()=>$('#details').close()); $('#details').addEventListener('close',()=>{activeDetail=null;});
 $('#reset').addEventListener('click',()=>{$('#search').value='';$('#status-filter').value='all';platform='all';$('#include-fixture').checked=false;$('#platforms').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.platform==='all'));render();});
 $('#export').addEventListener('click',exportCSV);
 $('#data-info').addEventListener('click',()=>{activeDetail=null;$('#detail-content').innerHTML=`<h2 id="detail-title">ข้อมูลและการอัปเดต</h2><p>${escapeHTML(data.snapshot_policy_th)}</p><p>${escapeHTML(data.metrics_policy_th)}</p><h3>ตรวจสอบข้อมูลต้นทาง</h3><p>SHA-256 ของ PROJECT_STATUS.json</p><pre>${escapeHTML(data.catalog_sha256)}</pre><a class="evidence-link" href="${repo}/blob/main/docs/PROJECT_STATUS.json" target="_blank" rel="noopener">ข้อมูลล่าสุดใน GitHub ↗</a><br><a class="evidence-link" href="${repo}/blob/main/dashboard/README.md" target="_blank" rel="noopener">วิธีอัปเดตและเปิดบนเครื่องอื่น ↗</a><p>ไม่มี ROM, BIOS หรือคลังข้อความเกมในเว็บไซต์นี้</p>`;$('#details').showModal();});
 render(); updateSyncNote(); setInterval(refreshStatus,60000); document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshStatus();});
 } catch(error) {$('#audit-date').textContent='โหลดไม่ได้';$('#results').innerHTML=`<div class="error">โหลดสถานะไม่สำเร็จ (${escapeHTML(error.message)})<br><a class="evidence-link" href="${repo}/blob/main/docs/PROJECT_STATUS.md">เปิดสถานะจาก GitHub ↗</a></div>`;}
}
function updateSyncNote(error) {
 const el = $('#sync-note');
 if(error) {el.textContent='ตรวจข้อมูลใหม่ไม่สำเร็จ · แสดงข้อมูลเดิมที่ตรวจสถานะ '+data.audited+' · จะตรวจอีกครั้งอัตโนมัติ';return;}
 const commit=data.source_commit;
 el.innerHTML=commit ? `ข้อมูลจาก main <a href="${repo}/commit/${encodeURIComponent(commit)}" target="_blank" rel="noopener">${escapeHTML(commit.slice(0,7))}</a> · ตรวจข้อมูลเว็บล่าสุด ${new Date().toLocaleTimeString('th-TH')} · ${escapeHTML(data.sync_state_th || 'ตรวจข้อมูลเว็บทุก 60 วินาที')}` : 'ข้อมูล snapshot · ตรวจสถานะ '+escapeHTML(data.audited);
}
async function refreshStatus() {
 if(refreshing || document.hidden || !data)return;refreshing=true;
 try {
  const response=await fetch('status.json?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);
  const next=await response.json();if(next.schema_version!==1||!Array.isArray(next.projects))throw Error('Unsupported catalog');
  if(next.catalog_sha256!==data.catalog_sha256 || next.source_commit!==data.source_commit){
   data=next;const real=data.projects.filter(p=>category(p)!=='fixture');
   $('#game-count').textContent=real.length;$('#partial-count').textContent=real.filter(p=>category(p)==='partial').length;$('#blocked-count').textContent=real.filter(p=>category(p)==='blocked').length;$('#complete-count').textContent=real.filter(p=>p.full_game_translation_verified).length;$('#audit-date').textContent=data.audited;
   render();if(activeDetail && $('#details').open)showDetails(activeDetail);
  }
  updateSyncNote();
 } catch(error){updateSyncNote(error);} finally{refreshing=false;}
}
init();
