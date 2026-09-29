/**
 * ads.js - Google AdSense 广告位管理（缘中阁）
 * ------------------------------------------------------------------
 * ★ 广告总开关：网站正式接入 AdSense 并审核通过后，把 ADS_ENABLED 改为 true 即可。
 *    关闭(false)状态下页面上不显示任何广告占位框，完全零干扰。
 *
 * 接入 AdSense 步骤：
 * 1. 将下方 ADS_ENABLED 改为 true
 * 2. 将 ADSENSE_CLIENT 替换为你的发布商 ID（形如 ca-pub-1234567890123456）
 * 3. 在 AdSense 后台「广告 → 按广告单元」创建展示广告单元，
 *    把广告单元 ID 填入 ADSENSE_SLOTS（与页面中 data-ad-slot 名称对应）
 * 4. 修改站点根目录 ads.txt，把 pub-XXXXXXXXXXXXXXXX 改成你的发布商 ID
 *
 * 配置完成后，页面会自动展示真实广告；开关关闭或未填 ID 时广告位完全隐藏。
 * ------------------------------------------------------------------
 * 页面中可通过以下方式手动插入广告位（顶部/底部已由 layout.js 自动生成）：
 *   <div class="ad-slot" data-ad-slot="top" data-ad-label="顶部横幅广告"></div>
 * 如需在文章/表单中间插广告，在 HTML 里加 data-ad-slot="inarticle" 的 div，
 * 并在 ADSENSE_SLOTS 中补一个同名广告单元 ID 即可。
 */
(function(){
  // ===== 配置区（接入时修改这里） =====
  var ADS_ENABLED = false;  // 广告总开关：未接入 AdSense 前保持 false（不显示任何广告/占位框）
  var ADSENSE_CLIENT = 'ca-pub-2430544512774360'; // 你的 AdSense 发布商 ID
  var ADSENSE_SLOTS = {
    top:       '0000000001',  // 全站顶部横幅（导航下方，所有页面自动加载）
    bottom:    '0000000002',  // 全站底部横幅（版权信息上方，所有页面自动加载）
    inarticle: '0000000003'   // 文中广告（预留：在页面内容中插入 data-ad-slot="inarticle" 即可启用）
  };
  // ===================================

  var configured = ADS_ENABLED && !/X{8,}/.test(ADSENSE_CLIENT);

  // 已配置真实 ID 时，加载 AdSense 官方脚本（只加载一次）
  if(configured && !document.getElementById('adsbygoogle-js')){
    var s = document.createElement('script');
    s.id = 'adsbygoogle-js';
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    window.adsbygoogle = window.adsbygoogle || [];
  }

  function fillSlots(){
    var nodes = document.querySelectorAll('.ad-slot');
    for(var i=0;i<nodes.length;i++){
      var el = nodes[i];
      if(el.getAttribute('data-ad-filled')) continue;
      var slotName = el.getAttribute('data-ad-slot');
      var label = el.getAttribute('data-ad-label') || '广告位';
      var slotId = ADSENSE_SLOTS[slotName];
      if(configured && slotId && !/X{8,}|^0{6,}/.test(slotId)){
        // 真实广告
        el.innerHTML = '<ins class="adsbygoogle" style="display:block" ' +
          'data-ad-client="' + ADSENSE_CLIENT + '" ' +
          'data-ad-slot="' + slotId + '" ' +
          'data-ad-format="auto" data-full-width-responsive="true"></ins>';
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e){}
      } else {
        // 未开启/未配置：完全隐藏广告位（连同外层容器），页面不留任何占位
        el.style.display = 'none';
        var wrap = el.closest('.ad-wrap');
        if(wrap) wrap.style.display = 'none';
      }
      el.setAttribute('data-ad-filled', '1');
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', fillSlots);
  } else {
    fillSlots();
  }
  // layout.js 动态渲染 header/footer 后再执行一次，确保顶部/底部广告位被填充
  window.addEventListener('load', fillSlots);
})();
