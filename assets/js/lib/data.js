/**
 * data.js - 数据加载器
 * 从 docs/assets/js/data/*.json 异步加载命理数据
 *
 * 路径解析: 基于本脚本 (assets/js/lib/data.js) 的位置推断站点根,
 * 这样无论页面位于根目录或子目录都能正确加载。
 */
window.SHL = window.SHL || {};
SHL.data = (function(){
  function detectBase(){
    var scripts = document.getElementsByTagName('script');
    var src = '';
    for(var i=0;i<scripts.length;i++){
      if(/lib\/data\.js(\?|$)/.test(scripts[i].src)){ src=scripts[i].src; break; }
    }
    if(!src) src = location.pathname;
    // 去掉查询串
    src = src.replace(/\?.*$/,'');
    // 去掉 assets/js/lib/data.js, 保留到根
    var m = src.match(/^(.*\/)assets\/js\/lib\/data\.js$/);
    if(m) return m[1] + 'assets/js/data/';
    // 兜底: 当前目录
    return location.pathname.replace(/[^/]*$/,'') + 'assets/js/data/';
  }
  var base = detectBase();
  var cache = {};
  function url(name){ return base + name + '.json'; }
  function fetchJson(name){
    if(cache[name]) return cache[name];
    cache[name] = fetch(url(name)).then(function(r){
      if(!r.ok) throw new Error('加载失败: '+name+' ('+r.status+')');
      return r.json();
    });
    return cache[name];
  }
  return {
    load: fetchJson,
    base: base,
    // 便捷方法: 返回 rows 数组
    rows: function(name){
      return fetchJson(name).then(function(d){ return d.rows||d.items||d; });
    },
    clearCache: function(){ cache={}; }
  };
})();
