/**
 * pd.js - 通用配对模块 (星座配对 / 生肖配对 / 血型配对)
 * 用法:
 *   SHL.pd.init({
 *     title:'星座配对',
 *     intro:'简介文本',
 *     dataName:'senlon_xingzuolove',
 *     field1:'xingzuo1', field2:'xingzuo2',
 *     options:[{v:'白羊座',t:'白羊座'}, ...],
 *     label1:'我的星座', label2:'他/她的星座',
 *     resultTitle:'双方星座',
 *     fields:{title:'title',content1:'content1',content2:'content2'} // 可选, 默认即此值
 *   });
 */
window.SHL=window.SHL||{};
SHL.pd=(function(){
  function esc(s){ return SHL.layout.esc(s); }
  function br(s){ return esc(s).replace(/\r\n|\n|\r/g,'<br>'); }

  function init(opt){
    var L=SHL.layout;
    L.setTitle(opt.title);
    var root=document.getElementById('pd-app');
    if(!root) return;

    var optsHtml='';
    for(var i=0;i<opt.options.length;i++){
      var o=opt.options[i];
      optsHtml+='<option value="'+esc(o.v)+'">'+esc(o.t)+'</option>';
    }

    root.innerHTML =
      '<div class="panel"><h2>'+esc(opt.title)+'</h2>'+
      '<div class="desc" style="line-height:1.9">'+(opt.intro||'')+'</div>'+
      '<form id="pdForm" onsubmit="return false">'+
        '<div class="form-row"><label>'+esc(opt.label1)+'</label><div class="ctrl"><select id="pdSel1">'+optsHtml+'</select></div></div>'+
        '<div class="form-row"><label>'+esc(opt.label2)+'</label><div class="ctrl"><select id="pdSel2">'+optsHtml+'</select></div></div>'+
        '<div class="form-row"><label></label><div class="ctrl"><button class="btn btn-gold" id="pdBtn" type="button">开始配对</button></div></div>'+
      '</form>'+
      '<div id="pdResult"></div></div>';

    var fm=opt.fields||{};
    var fTitle=fm.title||'title';
    var fContent1=fm.content1||'content1';
    var fContent2=fm.content2||'content2';

    var data=null;
    function ensureData(){
      if(data) return Promise.resolve(data);
      return SHL.data.rows(opt.dataName).then(function(rows){ data=rows; return rows; });
    }

    function findRow(v1,v2){
      if(!data) return null;
      for(var i=0;i<data.length;i++){
        if(String(data[i][opt.field1])===v1 && String(data[i][opt.field2])===v2) return data[i];
      }
      return null;
    }

    document.getElementById('pdBtn').onclick=function(){
      var v1=document.getElementById('pdSel1').value;
      var v2=document.getElementById('pdSel2').value;
      var r=document.getElementById('pdResult');
      r.innerHTML='<div class="loading">正在配对...</div>';
      ensureData().then(function(){
        var row=findRow(v1,v2);
        if(!row){
          r.innerHTML='<div class="error">未找到 '+esc(v1)+' 与 '+esc(v2)+' 的配对数据。</div>';
          return;
        }
        var html='<div class="result-box">';
        html+='<p>'+esc(opt.resultTitle)+'：<b style="color:#0066cc">'+esc(row[fTitle]||'')+'</b></p>';
        if(row[fContent1]) html+='<div style="color:#cc3300;line-height:2;margin:8px 0">'+br(row[fContent1])+'</div>';
        if(row[fContent2]) html+='<div style="line-height:2;text-indent:2em">'+br(row[fContent2])+'</div>';
        html+='</div>';
        r.innerHTML=html;
      }).catch(function(e){
        r.innerHTML='<div class="error">数据加载失败：'+esc(e.message)+'</div>';
      });
    };
  }
  return {init:init};
})();
