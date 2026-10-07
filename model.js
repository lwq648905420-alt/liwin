export const fields=['name','category','price','exchange','purchase','shipping','fulfillment','commission','advertising','returns','tax','other','sales','competition'];
export const labels=['商品名称','品类','售价USD','汇率CNY每USD','采购CNY','头程CNY','履约USD','佣金百分比','广告百分比','退货损耗百分比','税费百分比','其他USD','预计月销量','竞争程度'];
export function validate(p){
 if(!String(p.name||'').trim())throw Error('请填写商品名称');
 for(const f of fields.slice(2,-1))if(!Number.isFinite(Number(p[f]))||Number(p[f])<0||String(p[f]).trim()==='')throw Error('请输入有效的非负数：'+labels[fields.indexOf(f)]);
 if(Number(p.exchange)<=0||Number(p.price)<=0)throw Error('售价和汇率必须大于 0');
 for(const f of ['commission','advertising','returns','tax'])if(Number(p[f])>100)throw Error('百分比不能超过 100');
 if(!['低','中','高'].includes(p.competition))throw Error('竞争程度应为低、中或高');
 return p;
}
export function calculate(p){
 validate(p);const price=Number(p.price),rate=['commission','advertising','returns','tax'].reduce((s,k)=>s+Number(p[k])/100,0);
 const fixed=(Number(p.purchase)+Number(p.shipping))/Number(p.exchange)+Number(p.fulfillment)+Number(p.other);
 const cost=fixed+price*rate,profit=price-cost,margin=profit/price*100;
 return {cost,profit,margin,monthly:profit*Number(p.sales),breakeven:rate<1?fixed/(1-rate):null,recommend:profit<=0?'暂缓':margin>=25&&p.competition!=='高'?'优先验证':'谨慎验证'};
}
export function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell!=='')throw Error('CSV 引号格式错误');else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x!==''))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSV 存在未闭合引号');row.push(cell);if(row.some(x=>x!==''))rows.push(row);return rows;
}
export function importCSV(text){const rows=parseCSV(text);if(rows.length<2)throw Error('文件没有商品数据');const header=rows.shift();if(header.join('|')!==labels.join('|')&&header.join('|')!==fields.join('|'))throw Error('列名不匹配，请先下载导入模板');return rows.map((r,i)=>{if(r.length!==fields.length)throw Error('第 '+(i+2)+' 行列数不正确');const p=Object.fromEntries(fields.map((f,j)=>[f,r[j]]));try{validate(p);}catch(e){throw Error('第 '+(i+2)+' 行：'+e.message);}return p;});}
export function exportCSV(products){const safe=x=>{let s=String(x??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return '\uFEFF'+[labels,...products.map(p=>fields.map(f=>p[f]))].map(r=>r.map(safe).join(',')).join('\r\n');}
