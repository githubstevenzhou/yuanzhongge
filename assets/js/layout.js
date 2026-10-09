/**
 * layout.js - 静态站点公共框架 (header/footer/导航)
 * 各页面只需引入本脚本并提供 #site-header / #site-footer 占位元素即可。
 */
(function(){
  // 推断站点根路径 (基于本脚本位置 assets/js/layout.js)
  var scripts = document.getElementsByTagName('script');
  var src = '';
  for(var i=0;i<scripts.length;i++){ if(/layout\.js(\?|$)/.test(scripts[i].src)){ src=scripts[i].src; break; } }
  // assets/js/layout.js -> root = 去掉 assets/js/layout.js(含查询串)
  var root = src.replace(/assets\/js\/layout\.js([?#][^/]*)?$/,'');
  if(!root) root='./';
  window.SHL_ROOT = root;

  // ===== 主导航：聚焦四柱八字排盘 =====
  var NAV = [
    { name:'首页', url:'' },
    { name:'八字排盘', url:'ppbazi/' },
    { name:'真太阳时', url:'taiyang/' },
    { name:'地区经度', url:'jingdu/' },
    { name:'排盘说明', sub:[
      {n:'如何排盘',u:'guide/how-to/'},
      {n:'术语解释',u:'guide/terms/'},
      {n:'示例命盘',u:'guide/example/'}
    ]},
    { name:'关于', url:'about/' },
    { name:'联系', url:'contact/' }
  ];

  // 页脚信任链接
  var FOOTER_LINKS = [
    {n:'关于缘中阁',u:'about/'},
    {n:'联系我们',u:'contact/'},
    {n:'隐私政策',u:'privacy/'},
    {n:'免责声明',u:'disclaimer/'}
  ];

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function link(u){ return root + u; }

  function renderHeader(){
    var el = document.getElementById('site-header');
    if(!el) return;
    var h = [];
    h.push('<div class="topbar"><div class="container flex between">'+
      '<a class="logo" href="'+link('')+'"><span class="logo-icon">☯</span>缘中阁</a>'+
      '</div></div>');
    h.push('<nav class="mainnav"><div class="container"><ul class="nav-list">');
    for(var i=0;i<NAV.length;i++){
      var it=NAV[i];
      if(it.sub){
        h.push('<li class="nav-item has-sub"><a href="'+(it.url?link(it.url):'javascript:;')+'">'+esc(it.name)+'</a><div class="submenu">');
        for(var j=0;j<it.sub.length;j++){
          h.push('<a href="'+link(it.sub[j].u)+'">'+esc(it.sub[j].n)+'</a>');
        }
        h.push('</div></li>');
      } else {
        h.push('<li class="nav-item"><a href="'+link(it.url)+'">'+esc(it.name)+'</a></li>');
      }
    }
    h.push('</ul></div></nav>');
    // 全站顶部广告位（Google AdSense 横幅，导航下方）
    h.push('<div class="container ad-wrap"><div class="ad-slot" data-ad-slot="top" data-ad-label="顶部横幅广告"></div></div>');
    el.innerHTML = h.join('');
  }

  function renderFooter(){
    var el = document.getElementById('site-footer');
    if(!el) return;
    var y = new Date().getFullYear();
    var h = '<div class="foot-tools"><div class="container"><div class="ft-title">缘中阁</div>';
    h += '<div class="ft-links">';
    for(var k=0;k<FOOTER_LINKS.length;k++){ h += '<a href="'+link(FOOTER_LINKS[k].u)+'">'+esc(FOOTER_LINKS[k].n)+'</a>'; }
    h += '</div></div></div>';
    // 全站底部广告位（Google AdSense 横幅，版权信息上方）
    h += '<div class="container ad-wrap"><div class="ad-slot" data-ad-slot="bottom" data-ad-label="底部横幅广告"></div></div>';
    h += '<div class="copyright"><div class="container">'+
      '<p>© '+y+' 缘中阁 · 四柱八字排盘工具</p>'+
      '<p>排盘结果由传统命理规则程序演算，仅供文化参考与娱乐，不构成任何专业建议。</p>'+
      '</div></div>';
    el.innerHTML = h;
  }

  // 设置页面标题（仅在页面未定义静态标题时兜底，保护 HTML 中更丰富的 SEO 标题不被覆盖）
  function setTitle(title){
    if(title && document.title.indexOf('缘中阁') < 0){
      document.title = title + ' - 缘中阁';
    }
  }

  // 通用结果渲染区
  function resultBox(html, id){
    id = id||'result';
    var el = document.getElementById(id);
    if(el){ el.innerHTML = '<div class="result-box">'+html+'</div>'; }
  }

  // 表单通用样式辅助
  function formRow(label, control){
    return '<div class="form-row"><label>'+label+'</label><div class="ctrl">'+control+'</div></div>';
  }

  // 自动加载广告管理脚本 (ads.js 与 layout.js 同目录)
  function loadAds(){
    var s = document.createElement('script');
    s.src = root + 'assets/js/ads.js';
    s.async = true;
    document.body.appendChild(s);
  }

  function init(){
    renderHeader();
    renderFooter();
    loadAds();
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  window.SHL = window.SHL||{};
  SHL.layout = { root:root, link:link, esc:esc, setTitle:setTitle, resultBox:resultBox, formRow:formRow, NAV:NAV };
})();
