/**
 * hmjx.js - 号码吉凶模块 (手机/QQ/电话号码吉凶 + 网站域名吉凶)
 * 用法:
 *   SHL.hmjx.init({title,label,intro,maxLength,inputMode,dataName})  // 号码类
 *   SHL.hmjx.initDomain({title,intro})                              // 域名类
 *
 * 号码算法 (源自 ASP shouji/qqjx/hmjx):
 *   word=int(号码); word=word/80; temp=int(word); word=word-temp; word=int(word*80)
 *   if word=0 then word=81   -> 在 senlon_shouji 表按 num 查询
 *   (号码均为正数, ASP int() 等价于 JS Math.trunc)
 *
 * 域名算法 (源自 ASP ymjxcs):
 *   每个字符按 CtoN 映射累加得 s; if s>100 报错; 否则 s=s mod 81, s=0 取 80
 *   按 num 在 senlon_ymjxcs 表查询
 */
window.SHL=window.SHL||{};
SHL.hmjx=(function(){
  function esc(s){ return SHL.layout.esc(s); }
  function br(s){ return esc(s).replace(/\r\n|\n|\r/g,'<br>'); }

  // 号码吉凶: /80 取余算法 (与 ASP int() 序列一致, 号码为正数)
  function calcNum(raw){
    var n=parseInt(raw,10);
    if(isNaN(n)) return null;
    var word=n/80;
    var temp=Math.trunc(word);
    word=word-temp;
    word=Math.trunc(word*80);
    if(word===0) word=81;
    return String(word);
  }

  function init(opt){
    var L=SHL.layout;
    L.setTitle(opt.title);
    var root=document.getElementById('hmjx-app');
    if(!root) return;
    var dataName=opt.dataName||'senlon_shouji';
    var isNum=opt.inputMode!=='text';
    var maxLen=opt.maxLength||11;
    root.innerHTML=
      '<div class="panel"><h2>'+esc(opt.title)+'</h2>'+
      '<div class="desc" style="line-height:1.9">'+(opt.intro||'')+'</div></div>'+
      '<div class="panel"><h2>'+esc(opt.label)+'分析</h2>'+
      '<form id="hmjxForm" onsubmit="return false">'+
        '<div class="form-row"><label>'+esc(opt.label)+'</label><div class="ctrl">'+
          '<input type="text" id="hmjxInput" maxlength="'+maxLen+'" inputmode="'+(isNum?'numeric':'text')+'" placeholder="请输入'+esc(opt.label)+'" autocomplete="off" style="max-width:260px">'+
        '</div></div>'+
        '<div class="form-row"><label></label><div class="ctrl"><button class="btn btn-gold" id="hmjxBtn">立刻分析</button></div></div>'+
      '</form>'+
      '<div id="hmjxResult"></div></div>';

    var input=document.getElementById('hmjxInput');
    if(isNum){
      input.oninput=function(){ this.value=this.value.replace(/[^\d]/g,''); };
    }
    input.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); calc(); } };

    var rows=null;
    function ensureData(){
      if(rows) return Promise.resolve(rows);
      return SHL.data.rows(dataName).then(function(r){ rows=r; return r; });
    }
    function findRow(num){
      if(!rows) return null;
      for(var i=0;i<rows.length;i++){
        if(String(rows[i].num)===num) return rows[i];
      }
      return null;
    }

    function calc(){
      var raw=input.value.trim();
      if(!raw){ alert('请输入'+opt.label+'！'); input.focus(); return; }
      if(isNum && !/^\d+$/.test(raw)){ alert('请输入正确的数字！'); input.focus(); return; }
      if(raw.length>maxLen){ alert('请输入'+maxLen+'位以内的'+opt.label+'！'); input.focus(); return; }
      var r=document.getElementById('hmjxResult');
      r.innerHTML='<div class="loading">正在分析...</div>';
      var num=calcNum(raw);
      ensureData().then(function(){
        var row=findRow(num);
        var html='<div class="result-box">';
        html+='<p>您分析的'+esc(opt.label)+'：<b style="color:#0066cc;font-size:18px;letter-spacing:2px">'+esc(raw)+'</b></p>';
        if(row){
          var jx=row.jx||'';
          var tagCls = jx.indexOf('凶')>=0 ? (jx.indexOf('吉')>=0?'tag':'tag-red') : 'tag-green';
          html+='<p>'+esc(opt.label)+'吉凶分析：<b style="color:#0066cc">'+esc(row.title||'')+'</b> <span class="tag '+tagCls+'">'+esc(jx)+'</span></p>';
          if(row.content){
            html+='<h3>主人个性分析</h3><p style="line-height:2;text-indent:2em">'+br(row.content)+'</p>';
          }
        } else {
          html+='<div class="error">未找到数理 '+esc(num)+' 的吉凶数据。</div>';
        }
        html+='</div>';
        r.innerHTML=html;
      }).catch(function(e){
        r.innerHTML='<div class="error">数据加载失败：'+esc(e.message)+'</div>';
      });
    }

    document.getElementById('hmjxBtn').onclick=calc;
  }

  // ===== 域名吉凶 =====
  // CtoN 字符映射 (源自 ASP ymjxcs CtoN 函数)
  var CTO_N_MAP={};
  (function(){
    var i;
    for(i=0;i<10;i++) CTO_N_MAP[''+i]=i;
    'aefghn'.split('').forEach(function(c){ CTO_N_MAP[c]=3; });
    'bdjkpqtxy'.split('').forEach(function(c){ CTO_N_MAP[c]=2; });
    'cilorsuvwz'.split('').forEach(function(c){ CTO_N_MAP[c]=1; });
    CTO_N_MAP['m']=4; CTO_N_MAP['.']=0; CTO_N_MAP['-']=0;
  })();
  function ctoN(ch){
    var lower=ch.toLowerCase();
    if(CTO_N_MAP.hasOwnProperty(lower)) return CTO_N_MAP[lower];
    return 100; // 未识别字符 (与 ASP case else 一致)
  }

  function initDomain(opt){
    var L=SHL.layout;
    L.setTitle(opt.title);
    var root=document.getElementById('hmjx-app');
    if(!root) return;
    root.innerHTML=
      '<div class="panel"><h2>'+esc(opt.title)+'</h2>'+
      '<div class="desc" style="line-height:1.9">'+(opt.intro||'')+'</div></div>'+
      '<div class="panel"><h2>域名分析</h2>'+
      '<form id="hmjxForm" onsubmit="return false">'+
        '<div class="form-row"><label>网站域名</label><div class="ctrl">'+
          '<input type="text" id="hmjxInput" maxlength="60" inputmode="text" placeholder="如 example.com" autocomplete="off" style="max-width:300px">'+
        '</div></div>'+
        '<div class="form-row"><label></label><div class="ctrl"><button class="btn btn-gold" id="hmjxBtn">分析域名</button></div></div>'+
      '</form>'+
      '<div id="hmjxResult"></div></div>';

    var input=document.getElementById('hmjxInput');
    input.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); calc(); } };

    var rows=null;
    function ensureData(){
      if(rows) return Promise.resolve(rows);
      return SHL.data.rows('senlon_ymjxcs').then(function(r){ rows=r; return r; });
    }
    function findRow(num){
      if(!rows) return null;
      for(var i=0;i<rows.length;i++){
        if(String(rows[i].num)===String(num)) return rows[i];
      }
      return null;
    }

    function calc(){
      var raw=input.value.trim();
      if(!raw){ alert('请输入网站域名！'); input.focus(); return; }
      var r=document.getElementById('hmjxResult');
      r.innerHTML='<div class="loading">正在分析...</div>';
      // 累加每个字符的 CtoN 值
      var s=0;
      for(var i=0;i<raw.length;i++){
        s+=ctoN(raw.charAt(i));
      }
      ensureData().then(function(){
        var html='<div class="result-box">';
        html+='<p>您分析的域名：<b style="color:#0066cc">'+esc(raw)+'</b></p>';
        if(s>100){
          // 与 ASP 一致: s>100 视为乱输入
          html+='<div class="error">请不要乱丢垃圾（域名包含不支持的字符）。</div>';
        } else {
          var idx=s%81;
          if(idx===0) idx=80;
          var row=findRow(idx);
          if(row && row.text){
            html+='<p>域名吉凶分析：<b style="color:#cc6600;font-size:16px">'+esc(row.text)+'</b></p>';
          } else {
            html+='<div class="error">未找到数理 '+esc(idx)+' 的吉凶数据。</div>';
          }
        }
        html+='</div>';
        r.innerHTML=html;
      }).catch(function(e){
        r.innerHTML='<div class="error">数据加载失败：'+esc(e.message)+'</div>';
      });
    }

    document.getElementById('hmjxBtn').onclick=calc;
  }

  return {init:init, initDomain:initDomain};
})();
