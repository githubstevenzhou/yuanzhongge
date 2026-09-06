/**
 * yc.js - 通用身体征兆预测模块 (眼跳/喷嚏/心惊/耳鸣/面热)
 * 用法: SHL.yc.init({lb, title, intro, hasFx, fxLabel})
 *   lb       分类，对应 senlon_msyuce.lb 字段 (如 "眼跳")
 *   title    页面标题
 *   intro    简介文本
 *   hasFx    是否显示左/右方位选择器
 *   fxLabel  方位选择器标签 (仅 hasFx=true 时使用)
 */
window.SHL=window.SHL||{};
SHL.yc=(function(){
  function esc(s){ return SHL.layout.esc(s); }
  function br(s){ return esc(s).replace(/\r\n|\n|\r/g,'<br>'); }

  // 时辰对照表 (1-12)
  var SHICHEN=[
    {v:'1',  t:'23-01 [子时]'},
    {v:'2',  t:'01-03 [丑时]'},
    {v:'3',  t:'03-05 [寅时]'},
    {v:'4',  t:'05-07 [卯时]'},
    {v:'5',  t:'07-09 [辰时]'},
    {v:'6',  t:'09-11 [巳时]'},
    {v:'7',  t:'11-13 [午时]'},
    {v:'8',  t:'13-15 [未时]'},
    {v:'9',  t:'15-17 [申时]'},
    {v:'10', t:'17-19 [酉时]'},
    {v:'11', t:'19-21 [戌时]'},
    {v:'12', t:'21-23 [亥时]'}
  ];
  function shichenLabel(v){
    for(var i=0;i<SHICHEN.length;i++){ if(SHICHEN[i].v===String(v)) return SHICHEN[i].t; }
    return '';
  }

  function init(opt){
    var L=SHL.layout;
    L.setTitle(opt.title);
    var root=document.getElementById('yc-app');
    if(!root) return;

    // 方位选择器 (可选)
    var fxHtml='';
    if(opt.hasFx){
      var fxLab=opt.fxLabel||'选择方位';
      fxHtml='<div class="form-row"><label>'+esc(fxLab)+'</label><div class="ctrl">'+
        '<label style="margin-right:18px"><input type="radio" name="ycFx" value="左" checked> 左</label>'+
        '<label><input type="radio" name="ycFx" value="右"> 右</label>'+
        '</div></div>';
    }

    // 时辰下拉
    var optHtml='';
    for(var i=0;i<SHICHEN.length;i++){
      optHtml+='<option value="'+SHICHEN[i].v+'">'+esc(SHICHEN[i].t)+'</option>';
    }

    root.innerHTML=
      '<div class="panel"><h2>'+esc(opt.title)+'</h2>'+
        '<div class="desc" style="line-height:1.9">'+esc(opt.intro||'')+'</div>'+
      '</div>'+
      '<div class="panel"><h2>开始测算</h2>'+
        '<form id="ycForm" onsubmit="return false">'+
          fxHtml+
          '<div class="form-row"><label>发生时间</label><div class="ctrl">'+
            '<select id="ycStime" style="max-width:220px">'+optHtml+'</select>'+
          '</div></div>'+
          '<div class="form-row"><label></label><div class="ctrl"><button class="btn btn-gold" id="ycBtn">开始分析</button></div></div>'+
        '</form>'+
        '<div id="ycResult"></div>'+
      '</div>';

    var data=null;
    function ensureData(){
      if(data) return Promise.resolve(data);
      return SHL.data.rows('senlon_msyuce').then(function(rows){ data=rows; return rows; });
    }

    // 按 lb + stime + (fx 或忽略) 查找
    function findRow(lb, stime, fx){
      if(!data) return null;
      var s=String(stime);
      for(var i=0;i<data.length;i++){
        var r=data[i];
        if(String(r.lb)===lb && String(r.stime)===s){
          if(opt.hasFx){
            if(String(r.fx)===fx) return r;
          } else {
            return r;
          }
        }
      }
      return null;
    }

    function calc(){
      var stime=document.getElementById('ycStime').value;
      var fx='';
      if(opt.hasFx){
        var radios=document.getElementsByName('ycFx');
        for(var j=0;j<radios.length;j++){ if(radios[j].checked){ fx=radios[j].value; break; } }
      }
      var r=document.getElementById('ycResult');
      r.innerHTML='<div class="loading">正在测算...</div>';
      ensureData().then(function(){
        var row=findRow(opt.lb, stime, fx);
        var h='<div class="result-box">';
        h+='<p>查询条件：';
        if(opt.hasFx) h+='<b>'+esc(fx)+'</b>'+esc(opt.lb)+' · ';
        h+='<b>'+esc(shichenLabel(stime))+'</b></p>';
        if(row){
          h+='<h3 style="color:#cc6600">预测结果</h3>';
          h+='<p style="font-size:16px;color:#0066cc;line-height:2">'+br(row.content)+'</p>';
        } else {
          h+='<div class="error">未找到对应时段的预测结果。</div>';
        }
        h+='</div>';
        r.innerHTML=h;
      }).catch(function(e){
        r.innerHTML='<div class="error">数据加载失败：'+esc(e.message)+'</div>';
      });
    }

    document.getElementById('ycBtn').onclick=calc;
  }
  return {init:init};
})();
