/**
 * qian.js - 通用灵签模块 (观音/黄大仙/吕祖/关帝/妈祖 等)
 * 用法: SHL.qian.init({dataName, title, deity, intro})
 */
window.SHL=window.SHL||{};
SHL.qian=(function(){
  function esc(s){ return SHL.layout.esc(s); }
  function br(s){ return esc(s).replace(/\r\n|\n|\r/g,'<br>'); }

  function init(opt){
    var L=SHL.layout;
    L.setTitle(opt.title);
    var root=document.getElementById('qian-app');
    if(!root) return;
    root.innerHTML =
      '<div class="panel"><h2>'+esc(opt.title)+'</h2>'+
      '<div class="notice">'+(opt.intro||'')+'</div>'+
      '<div class="center" style="padding:20px 0">'+
        '<button class="btn btn-gold" id="qianDraw" style="font-size:18px;padding:12px 40px">🪷 诚心求签</button>'+
      '</div>'+
      '<div id="qianResult"></div></div>';

    var data=null;
    function ensureData(){
      if(data) return Promise.resolve(data);
      return SHL.data.rows(opt.dataName).then(function(rows){ data=rows; return rows; });
    }

    document.getElementById('qianDraw').onclick=function(){
      var btn=this; btn.disabled=true; btn.textContent='正在抽签...';
      ensureData().then(function(rows){
        var idx=Math.floor(Math.random()*rows.length);
        render(rows[idx]);
        btn.disabled=false; btn.textContent='🪷 再抽一签';
      }).catch(function(e){
        document.getElementById('qianResult').innerHTML='<div class="error">数据加载失败：'+esc(e.message)+'</div>';
        btn.disabled=false; btn.textContent='🪷 诚心求签';
      });
    };

    function g(r,k){ var fm=opt.fields||{}; return r[fm[k]||k]||''; }
    function render(r){
      var fm=opt.fields||{};
      var no=g(r,'no'), level=g(r,'level'), title=g(r,'title'), gongwei=g(r,'gongwei');
      var poem=g(r,'poem'), meaning=g(r,'meaning'), jieyue=g(r,'jieyue'), xianji=g(r,'xianji');
      var jieqian=g(r,'jieqian'), gushi=g(r,'gushi');
      var lvCls = level.indexOf('上')>=0?'tag-green':level.indexOf('下')>=0?'tag-red':'';
      var h='<div class="result-box">';
      h+='<div class="center"><span class="qian-no">'+esc(no||('第'+r.id+'签'))+'</span>'+(level?'　<span class="tag '+lvCls+'">'+esc(level)+'</span>':'')+'</div>';
      if(title) h+='<div class="qian-title center">【'+esc(title)+'】</div>';
      if(gongwei) h+='<div class="center" style="color:#8a6a48;font-size:13px">'+esc(gongwei)+'</div>';
      if(poem) h+='<div style="margin:10px auto;max-width:420px;text-align:center;font-size:17px;line-height:2;color:#5a3a18">'+br(poem)+'</div>';
      if(meaning) h+='<h3>签意</h3><p>'+br(meaning)+'</p>';
      if(jieyue) h+='<h3>解曰</h3><p>'+br(jieyue)+'</p>';
      if(xianji) h+='<h3>仙机</h3><p>'+br(xianji)+'</p>';
      if(jieqian) h+='<h3>解签</h3><p>'+br(jieqian)+'</p>';
      if(gushi) h+='<h3>典故</h3><p>'+br(gushi)+'</p>';
      h+='</div>';
      document.getElementById('qianResult').innerHTML=h;
    }
  }
  return {init:init};
})();
