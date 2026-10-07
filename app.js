import {fields,labels,validate,calculate,importCSV,exportCSV} from './model.js';
const $=id=>document.getElementById(id),key='liwin-products-v1';
const defaults={name:'',category:'家居用品',price:24.99,exchange:7.2,purchase:28,shipping:8,fulfillment:4.5,commission:15,advertising:12,returns:3,tax:0,other:0.5,sales:100,competition:'中'};
const examples=[{...defaults,id:'demo1',name:'桌面收纳盒（示例）',price:29.99,competition:'低'},{...defaults,id:'demo2',name:'硅胶旅行分装瓶（示例）',category:'旅行用品',price:19.99,purchase:18,sales:180,competition:'高'},{...defaults,id:'demo3',name:'便携宠物水杯（示例）',category:'宠物用品',price:16.99,purchase:45,shipping:12,sales:80}];
let products=[],editing=null,timer;
function message(text){$('message').textContent=text;$('message').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('message').hidden=true,5000);}
try{const data=localStorage.getItem(key);products=data?JSON.parse(data):examples;if(!Array.isArray(products))throw Error();products.forEach(validate);}catch{message('保存的数据无法读取，请导入备份。');products=[];}
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(next){try{localStorage.setItem(key,JSON.stringify(next));products=next;render();return true;}catch{message('浏览器无法保存，请检查存储权限或空间。');return false;}}
function render(){const metrics=products.map(p=>({...p,...calculate(p)}));const average=metrics.length?metrics.reduce((s,p)=>s+p.margin,0)/metrics.length:0;
 $('stats').innerHTML=[['候选商品',products.length],['优先验证',metrics.filter(p=>p.recommend==='优先验证').length],['平均利润率',average.toFixed(1)+'%'],['预计月利润合计',money(metrics.reduce((s,p)=>s+p.monthly,0))]].map(([a,b])=>`<div class="stat"><span>${a}</span><strong>${b}</strong></div>`).join('');
 const search=$('search').value.toLowerCase(),filter=$('filter').value,sort=$('sort').value;
 const shown=metrics.filter(p=>(p.name+' '+p.category).toLowerCase().includes(search)&&(!filter||p.recommend===filter)).sort((a,b)=>b[sort]-a[sort]);
 $('rows').innerHTML=shown.map(p=>`<tr><td><strong>${escape(p.name)}</strong><small>${escape(p.category)}</small></td><td>${money(Number(p.price))}</td><td>${money(p.cost)}</td><td class="${p.profit>0?'positive':'negative'}">${money(p.profit)}</td><td class="${p.profit>0?'positive':'negative'}">${p.margin.toFixed(1)}%</td><td>${money(p.monthly)}</td><td>${escape(p.competition)}</td><td><span class="badge ${p.recommend==='暂缓'?'stop':p.recommend==='谨慎验证'?'wait':''}">${p.recommend}</span></td><td><button class="row-action" data-action="edit" data-id="${escape(p.id)}">编辑</button><button class="row-action" data-action="delete" data-id="${escape(p.id)}">删除</button></td></tr>`).join('');$('empty').hidden=shown.length>0;
}
$('inputs').innerHTML=fields.map((f,i)=>`<label>${labels[i]}${f==='competition'?`<select name="${f}"><option>低</option><option>中</option><option>高</option></select>`:`<input name="${f}" ${i<2?'type="text" maxlength="120"':'type="number" min="'+(f==='price'||f==='exchange'?'0.0001':'0')+'" step="any"'+(['commission','advertising','returns','tax'].includes(f)?' max="100"':'')} required>`}</label>`).join('');
function formData(){return Object.fromEntries(new FormData($('form')));}
function preview(){try{const m=calculate(formData());$('preview').textContent=`单件利润 ${money(m.profit)} · 利润率 ${m.margin.toFixed(1)}% · 盈亏平衡售价 ${m.breakeven===null?'无法覆盖成本':money(m.breakeven)} · ${m.recommend}`;}catch{$('preview').textContent='填写商品名称和成本，查看利润测算。';}}
function open(p){editing=p?.id||null;$('form-title').textContent=p?'编辑商品':'添加商品';fields.forEach(f=>$('form').elements.namedItem(f).value=(p||defaults)[f]);$('form-error').textContent='';preview();$('editor').showModal();}
$('add').onclick=()=>open();$('close').onclick=$('cancel').onclick=()=>$('editor').close();$('form').oninput=preview;
$('form').onsubmit=e=>{e.preventDefault();try{const p={...validate(formData()),id:editing||crypto.randomUUID()};const next=editing?products.map(x=>x.id===editing?p:x):[...products,p];if(persist(next)){$('editor').close();message('商品已保存');}}catch(e){$('form-error').textContent=e.message;}};
$('rows').onclick=e=>{const b=e.target.closest('button[data-action]');if(!b)return;const p=products.find(p=>p.id===b.dataset.id);if(!p)return;if(b.dataset.action==='edit')open(p);else if(confirm('删除商品「'+p.name+'」？'))persist(products.filter(x=>x.id!==p.id));};
['search','filter','sort'].forEach(id=>$(id).addEventListener('input',render));
function download(name,data){const url=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export').onclick=()=>download('liwin-选品.csv',exportCSV(products));$('template').onclick=()=>download('liwin-导入模板.csv',exportCSV([{...defaults,name:'请替换为商品名称'}]));$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('请使用小于 2 MB 的 CSV 文件');const incoming=importCSV(await file.text()).map(p=>({...p,id:crypto.randomUUID()}));if(persist([...products,...incoming]))message('已导入 '+incoming.length+' 个商品');}catch(e){message('导入失败：'+e.message);}finally{$('file').value='';}};
render();
