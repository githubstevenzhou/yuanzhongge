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

  // ===== 模块导航数据 (源自 dq.asp 命理工具大全) =====
  var NAV = [
    { name:'首页', url:'' },
    { name:'排盘大全', sub:[
      {n:'四柱八字',u:'ppbazi/'},{n:'六爻起卦',u:'pp6y/'},
      {n:'真太阳时',u:'taiyang/'},{n:'地区经度',u:'jingdu/'}
    ]},
    { name:'姓名学', sub:[
      {n:'在线起名',u:'qiming/'},{n:'姓名测试',u:'sm/sm-5.html'},
      {n:'姓名配对',u:'sm/sm-6.html'},{n:'名字配对',u:'xmpd/'},{n:'姓名五格配对',u:'xmwgpd/'}
    ]},
    { name:'算命', sub:[
      {n:'八字算命',u:'sm/'},{n:'生辰八字',u:'sm/sm-1.html'},
      {n:'八字测算',u:'sm/sm-2.html'},{n:'日干论命',u:'sm/sm-3.html'},
      {n:'称骨论命',u:'sm/sm-4.html'},{n:'上辈为人',u:'sm/sm-7.html'},
      {n:'姓氏起源',u:'sm/sm-8.html'},{n:'三世书',u:'sanshishu/'}
    ]},
    { name:'灵签占卜', sub:[
      {n:'观音灵签',u:'guanyin/'},{n:'吕祖灵签',u:'lvzu/'},{n:'黄大仙灵签',u:'huangdaxian/'},
      {n:'关圣帝灵签',u:'guandi/'},{n:'妈祖灵签',u:'mazu/'},{n:'诸葛神算',u:'zgss/'},
      {n:'塔罗占卜',u:'tarot/'},{n:'金钱卦',u:'jqg/'},{n:'在线拜佛',u:'baifo/'}
    ]},
    { name:'相学', sub:[
      {n:'面相查询',u:'mianxiang/'},{n:'面部墨痣',u:'zhixiang/'},
      {n:'男性墨痣',u:'nanzhi/'},{n:'女性墨痣',u:'nvzhi/'},{n:'指纹算命',u:'zwsm/'}
    ]},
    { name:'配对', sub:[
      {n:'星座配对',u:'xzpd/'},{n:'生肖配对',u:'sxpd/'},{n:'血型配对',u:'xxpd/'},
      {n:'QQ号码配对',u:'qqtest/'}
    ]},
    { name:'预测', sub:[
      {n:'生男生女',u:'snsn/'},{n:'清宫表',u:'qgsnsn/'},{n:'眼跳预测',u:'ytyc/'},
      {n:'面热预测',u:'mryc/'},{n:'喷嚏预测',u:'ptyc/'},{n:'心惊预测',u:'xjyc/'},
      {n:'耳鸣预测',u:'emyc/'},{n:'人品计算',u:'renpin/'}
    ]},
    { name:'号码吉凶', sub:[
      {n:'手机号码',u:'shouji/'},{n:'QQ号码',u:'qqjx/'},{n:'电话号码',u:'hmjx/'},
      {n:'身份证测算',u:'sfz/'},{n:'域名吉凶',u:'ymjxcs/'}
    ]},
    { name:'工具', sub:[
      {n:'万年历',u:'wannianli/'},{n:'周公解梦',u:'zgjm/'},{n:'星座运势',u:'xingzuo/'},
      {n:'星座剖析',u:'astro/'},{n:'今日运势',u:'mryc/'}
    ]}
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
    var h = '<div class="foot-tools"><div class="container"><div class="ft-title">命理工具大全</div>';
    h += '<div class="ft-links">';
    var flat=[];
    for(var i=0;i<NAV.length;i++){ if(NAV[i].sub){ for(var j=0;j<NAV[i].sub.length;j++){ flat.push(NAV[i].sub[j]); } } }
    for(var k=0;k<flat.length;k++){ h += '<a href="'+link(flat[k].u)+'">'+esc(flat[k].n)+'</a>'; }
    h += '</div></div></div>';
    // 全站底部广告位（Google AdSense 横幅，版权信息上方）
    h += '<div class="container ad-wrap"><div class="ad-slot" data-ad-slot="bottom" data-ad-label="底部横幅广告"></div></div>';
    h += '<div class="copyright"><div class="container">'+
      '<p>© '+y+' 缘中阁</p>'+
      '<p>静态版基于 ASP 源码改写 · 部署于 GitHub Pages + Cloudflare</p>'+
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
