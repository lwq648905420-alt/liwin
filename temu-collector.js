// Runs only when the user clicks their bookmark on a Temu page. No network requests.
export function collectTemuPage() {
  if (!/(^|\.)temu\.com$/.test(location.hostname)) { alert('请先打开能看到商品的 Temu 页面，再点击此收藏。'); return; }
  if (window.__liwinTemuCollector) { window.__liwinTemuCollector.scan(); return; }
  const products = new Map();
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;right:16px;top:16px;z-index:2147483647;background:white;color:#222;padding:18px;border:2px solid #ff6900;border-radius:12px;box-shadow:0 4px 25px #0004;width:285px;font:14px/1.6 sans-serif';
  const title = document.createElement('strong'); title.textContent = 'Liwin · Temu 页面采集'; panel.append(title);
  const status = document.createElement('p'); panel.append(status);
  const note = document.createElement('p'); note.textContent = '往下滑加载商品，再点“收集当前页面”。只读取商品卡片；不读取登录信息。新品时间和资质仍需核实。'; panel.append(note);
  const cleanURL = raw => { const u = new URL(raw, location.href); const ids = ['goods_id','mall_id'].map(k=>[k,u.searchParams.get(k)]); u.search = ''; u.hash = ''; for(const [k,v] of ids) if(v && /^\d+$/.test(v)) u.searchParams.set(k,v); return u.href; };
  function scan() {
    for (const a of document.querySelectorAll('a[href]')) {
      if (panel.contains(a)) continue;
      let u; try { u = new URL(a.href, location.href); } catch { continue; }
      if (!/(^|\.)temu\.com$/.test(u.hostname)) continue;
      const id = u.pathname.match(/-g-(\d+)\.html/)?.[1] || (/goods\.html$/.test(u.pathname) ? u.searchParams.get('goods_id') : null);
      if (!id || !/^\d+$/.test(id)) continue;
      const img = a.querySelector('img');
      const name = (a.getAttribute('title') || img?.getAttribute('alt') || a.getAttribute('aria-label') || a.innerText || '').trim();
      if (name.length < 4) continue;
      const text = (a.innerText || '').trim().slice(0,2500);
      let image = null;
      try { const v = new URL(img?.currentSrc || img?.src || '', location.href); if(img && v.protocol==='https:') {v.search='';v.hash='';image=v.href;} } catch {}
      const prior = products.get(id);
      const texts = [...new Set([...(prior?.cardTexts || []), text].filter(Boolean))].slice(0,10);
      products.set(id, {platform:'Temu',id,title:name.slice(0,1000),url:cleanURL(u.href),imageURL:image || prior?.imageURL || null,cardTexts:texts,visibleCardText:texts.join('\n').slice(0,5000),price:null,currency:null,listingDate:null,newnessStatus:'上架日期未核实；页面来源不等于近月上架',qualificationStatus:'待核实',evidenceURL:cleanURL(location.href),pageTitle:document.title,fetchedAt:new Date().toISOString()});
    }
    status.textContent = '已收集 '+ products.size +' 个去重商品。';
  }
  function download() {
    scan(); if (!products.size) {alert('还没有读到商品。请打开有商品卡片的列表，加载后再试。');return;}
    const result = {platform:'Temu',collectionMethod:'用户浏览器可见商品卡片；未请求私人接口',fetchedAt:new Date().toISOString(),limits:['当前页面快照，不能证明最近一个月上架','价格仅保留卡片原文，未推断币种或销量','普通商品及资质需要逐款核实'],products:[...products.values()]};
    const url = URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url;a.download='temu-真实页面商品-'+new Date().toISOString().slice(0,10)+'.json';panel.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  for (const [label, handler] of [['收集当前页面',scan],['下载已采集商品',download]]) {const b=document.createElement('button');b.textContent=label;b.style.cssText='margin:4px;padding:8px;cursor:pointer';b.onclick=handler;panel.append(b);}
  const close = document.createElement('button');close.textContent='关闭';close.onclick=()=>{panel.remove();delete window.__liwinTemuCollector;};panel.append(close);
  document.documentElement.append(panel);window.__liwinTemuCollector={scan};scan();
}
const bookmark = document.getElementById('temu-bookmark');
if (bookmark) bookmark.href='javascript:('+collectTemuPage.toString()+')();void(0)';
