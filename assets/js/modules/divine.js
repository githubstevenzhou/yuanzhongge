/**
 * divine.js - 共享占卜模块 (塔罗占卜 / 金钱卦 / 在线拜佛)
 * 用法:
 *   SHL.divine.tarot({title, intro})  - 塔罗占卜
 *   SHL.divine.jqg({title, intro})    - 金钱卦
 *   SHL.divine.baifo({title, intro})  - 在线拜佛
 *
 * 数据依赖:
 *   senlon_tarot  - 22张大阿尔卡那
 *   senlon_64gua  - 64卦 (卦名/卦辞/爻辞)
 */
window.SHL=window.SHL||{};
SHL.divine=(function(){
  function esc(s){ return SHL.layout.esc(s); }
  function br(s){ return esc(s).replace(/\r\n|\n|\r/g,'<br>'); }

  // ====================================================================
  // 塔罗占卜
  // ====================================================================
  function tarot(opt){
    var L=SHL.layout;
    L.setTitle(opt.title||'塔罗占卜');
    var root=document.getElementById('divine-app');
    if(!root) return;

    var topics=opt.topics||[
      {key:'爱情',desc:'感情姻缘、桃花人际'},
      {key:'事业',desc:'工作发展、职场前景'},
      {key:'财运',desc:'财富走势、投资理财'},
      {key:'健康',desc:'身心状况、养生调理'},
      {key:'学业',desc:'考试进修、学习成长'},
      {key:'人际',desc:'交友合作、人脉关系'}
    ];

    var topicOpts='';
    for(var i=0;i<topics.length;i++){
      topicOpts+='<option value="'+esc(topics[i].key)+'">'+esc(topics[i].key)+' - '+esc(topics[i].desc)+'</option>';
    }

    root.innerHTML=
      '<div class="panel"><h2>'+esc(opt.title||'塔罗占卜')+'</h2>'+
      '<div class="desc" style="line-height:1.9">'+(opt.intro||'')+'</div></div>'+
      '<div class="panel"><h2>选择问卜主题</h2>'+
      '<form id="tarotForm" onsubmit="return false">'+
        '<div class="form-row"><label>问卜主题</label><div class="ctrl">'+
          '<select id="tarotTopic" style="max-width:320px">'+topicOpts+'</select>'+
        '</div></div>'+
        '<div class="form-row"><label>心中所想</label><div class="ctrl">'+
          '<input type="text" id="tarotQuestion" maxlength="50" placeholder="默想您要问的事情（可选）" autocomplete="off" style="max-width:320px">'+
        '</div></div>'+
        '<div class="form-row"><label></label><div class="ctrl">'+
          '<button class="btn btn-gold" id="tarotDrawBtn">抽牌占卜</button>'+
        '</div></div>'+
      '</form>'+
      '<div id="tarotResult"></div></div>';

    var data=null;
    function ensureData(){
      if(data) return Promise.resolve(data);
      return SHL.data.rows('senlon_tarot').then(function(r){ data=r; return r; });
    }

    function draw(){
      var btn=document.getElementById('tarotDrawBtn');
      var r=document.getElementById('tarotResult');
      r.innerHTML='<div class="loading">正在洗牌抽牌...</div>';
      ensureData().then(function(rows){
        // 从22张中随机抽3张不重复
        var pool=rows.slice();
        var picked=[];
        for(var k=0;k<3;k++){
          var idx=Math.floor(Math.random()*pool.length);
          picked.push(pool[idx]);
          pool.splice(idx,1);
        }
        // 每张50%概率逆位
        var cards=[];
        for(var j=0;j<3;j++){
          var reversed=Math.random()<0.5;
          cards.push({card:picked[j], reversed:reversed});
        }
        render(cards);
      }).catch(function(e){
        r.innerHTML='<div class="error">数据加载失败：'+esc(e.message)+'</div>';
      });
    }

    function render(cards){
      var positions=['过去','现在','未来'];
      var topic=document.getElementById('tarotTopic').value;
      var question=document.getElementById('tarotQuestion').value.trim();
      var h='<div class="result-box">';
      h+='<p>问卜主题：<b style="color:#cc6600">'+esc(topic)+'</b></p>';
      if(question) h+='<p>心中所想：<b>'+esc(question)+'</b></p>';
      h+='<hr style="border:none;border-top:1px dashed #d4a017;margin:12px 0">';
      for(var i=0;i<3;i++){
        var c=cards[i];
        var card=c.card;
        var pos=positions[i];
        var rev=c.reversed;
        var meaning = rev ? card.reversed : card.upright;
        var posCls = i===0?'tag':i===1?'tag-green':'tag-red';
        h+='<div style="margin:14px 0;padding:12px;background:'+(rev?'#fdf2f0':'#f6fbf2')+';border:1px solid '+(rev?'#d4450f':'#5a8a3a')+';border-radius:4px">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px">';
        h+='<span class="'+posCls+'" style="font-size:13px">'+pos+'</span>';
        h+='<span style="font-size:12px;color:#8a6a48">第 '+esc(card.id)+' 张 · 大阿尔卡那</span>';
        h+='</div>';
        h+='<div style="font-size:22px;font-weight:bold;color:'+(rev?'#d4450f':'#7a3d0e')+';text-align:center;margin:8px 0;letter-spacing:2px">';
        if(rev) h+='【逆位】';
        h+=esc(card.name);
        h+='</div>';
        h+='<div style="text-align:center;font-size:12px;color:#8a6a48;margin-bottom:8px">'+esc(card.nameEn)+'</div>';
        h+='<div style="line-height:1.9;font-size:14px">'+br(meaning)+'</div>';
        h+='</div>';
      }
      h+='<hr style="border:none;border-top:1px dashed #d4a017;margin:12px 0">';
      h+='<p style="font-size:13px;color:#8a6a48">三张牌分别代表<strong>过去</strong>的影响、<strong>现在</strong>的状况与<strong>未来</strong>的走向，综合解读方可获得完整启示。</p>';
      h+='</div>';
      document.getElementById('tarotResult').innerHTML=h;
    }

    document.getElementById('tarotDrawBtn').onclick=draw;
  }

  // ====================================================================
  // 金钱卦
  // ====================================================================
  // 每次摇3枚铜钱:
  //   3正 = 老阴 (阴爻, 动爻, value=0, changing)
  //   3反 = 老阳 (阳爻, 动爻, value=1, changing)
  //   2正1反 = 少阳 (阳爻, value=1, not changing)
  //   2反1正 = 少阴 (阴爻, value=0, not changing)
  function tossOneYao(){
    var coins=[];
    for(var i=0;i<3;i++) coins.push(Math.random()<0.5?1:0); // 1=正, 0=反
    var zheng=coins[0]+coins[1]+coins[2];
    var yao;
    if(zheng===3) yao={value:0,changing:true,type:'老阴',coins:coins,coinText:'正正正'};
    else if(zheng===0) yao={value:1,changing:true,type:'老阳',coins:coins,coinText:'反反反'};
    else if(zheng===2) yao={value:1,changing:false,type:'少阳',coins:coins,coinText:coins.map(function(c){return c?'正':'反';}).join('')};
    else yao={value:0,changing:false,type:'少阴',coins:coins,coinText:coins.map(function(c){return c?'正':'反';}).join('')};
    return yao;
  }

  function yaoLine(yao){
    // 返回爻的文本表示
    if(yao.value===1){
      return '━━━━━━━';
    } else {
      return '━━━ ━━━';
    }
  }

  function yaoMark(yao){
    if(!yao.changing) return '';
    return yao.value===1 ? ' ○' : ' ×';
  }

  function jqg(opt){
    var L=SHL.layout;
    L.setTitle(opt.title||'金钱卦');
    var root=document.getElementById('divine-app');
    if(!root) return;

    root.innerHTML=
      '<div class="panel"><h2>'+esc(opt.title||'金钱卦')+'</h2>'+
      '<div class="desc" style="line-height:1.9">'+(opt.intro||'')+'</div></div>'+
      '<div class="panel"><h2>起卦问卜</h2>'+
      '<form id="jqgForm" onsubmit="return false">'+
        '<div class="form-row"><label>所占之事</label><div class="ctrl">'+
          '<input type="text" id="jqgQuestion" maxlength="50" placeholder="请输入您要占问的事情" autocomplete="off" style="max-width:320px">'+
        '</div></div>'+
      '</form>'+
      '<div style="text-align:center;padding:16px 0">'+
        '<button class="btn btn-gold" id="jqgTossBtn">摇卦 (0/6)</button> &nbsp; '+
        '<button class="btn" id="jqgAutoBtn">一键摇卦</button> &nbsp; '+
        '<button class="btn" id="jqgResetBtn" style="display:none">重新开始</button>'+
      '</div>'+
      '<div id="jqgYaoList" style="font-family:monospace,serif;text-align:center;min-height:60px"></div>'+
      '<div id="jqgResult"></div></div>';

    var yaos=[]; // 从下到上, index 0=初爻, 5=上爻
    var tossBtn=document.getElementById('jqgTossBtn');
    var autoBtn=document.getElementById('jqgAutoBtn');
    var resetBtn=document.getElementById('jqgResetBtn');
    var yaoList=document.getElementById('jqgYaoList');
    var resultDiv=document.getElementById('jqgResult');
    var data=null;

    function ensureData(){
      if(data) return Promise.resolve(data);
      return SHL.data.rows('senlon_64gua').then(function(r){ data=r; return r; });
    }

    function findGua(binary){
      if(!data) return null;
      for(var i=0;i<data.length;i++){
        if(data[i].binary===binary) return data[i];
      }
      return null;
    }

    function renderYaoProgress(){
      if(yaos.length===0){
        yaoList.innerHTML='<div class="notice">请点击「摇卦」按钮，共需摇6次以成卦。</div>';
        return;
      }
      var h='<div style="display:inline-block;text-align:left">';
      // 从上爻(最后摇的)到初爻显示
      for(var i=yaos.length-1;i>=0;i--){
        var y=yaos[i];
        var posName=['初','二','三','四','五','上'][i];
        var cls = y.value===1 ? 'green' : 'red';
        h+='<div style="font-size:18px;line-height:2;color:#3a2a18">';
        h+='<span style="color:#8a6a48;font-size:13px;width:24px;display:inline-block">'+posName+'爻</span> ';
        h+='<b style="color:'+(y.value===1?'#5a8a3a':'#d4450f')+'">'+yaoLine(y)+'</b>';
        h+='<span style="font-size:13px;color:#8a6a48">'+yaoMark(y)+'</span>';
        h+=' <span class="tag" style="font-size:11px">'+esc(y.type)+'</span>';
        h+=' <span style="font-size:12px;color:#aaa">['+esc(y.coinText)+']</span>';
        h+='</div>';
      }
      h+='</div>';
      yaoList.innerHTML=h;
    }

    function tossOnce(){
      if(yaos.length>=6) return;
      yaos.push(tossOneYao());
      tossBtn.textContent='摇卦 ('+yaos.length+'/6)';
      renderYaoProgress();
      if(yaos.length>=6){
        tossBtn.disabled=true;
        autoBtn.disabled=true;
        resetBtn.style.display='inline-block';
        showResult();
      }
    }

    function showResult(){
      resultDiv.innerHTML='<div class="loading">正在排卦...</div>';
      ensureData().then(function(){
        // 本卦 binary (从下到上)
        var benBin='';
        var i;
        for(i=0;i<6;i++) benBin+=yaos[i].value;
        // 变卦 binary
        var bianBin='';
        var hasChange=false;
        for(i=0;i<6;i++){
          if(yaos[i].changing){
            bianBin+=(1-yaos[i].value);
            hasChange=true;
          } else {
            bianBin+=yaos[i].value;
          }
        }
        var benGua=findGua(benBin);
        var bianGua=hasChange?findGua(bianBin):null;
        var question=document.getElementById('jqgQuestion').value.trim();

        var h='<div class="result-box">';
        if(question) h+='<p>所占之事：<b style="color:#0066cc">'+esc(question)+'</b></p>';

        // 卦象显示
        h+='<h3 style="color:#cc6600">本卦：'+(benGua?esc(benGua.symbol+' '+benGua.name):'未找到')+'</h3>';
        h+='<div style="font-family:monospace,serif;font-size:22px;text-align:center;margin:10px auto;max-width:200px;padding:10px;background:#fbf6ed;border:1px dashed #d9c8a4">';
        for(i=5;i>=0;i--){
          var y=yaos[i];
          h+='<div style="color:'+(y.value===1?'#5a8a3a':'#d4450f')+';line-height:1.6">'+yaoLine(y)+'<span style="font-size:14px">'+yaoMark(y)+'</span></div>';
        }
        h+='</div>';

        if(benGua){
          h+='<h3>卦辞</h3><div style="line-height:2;text-indent:2em">'+br(benGua.gunci)+'</div>';
          if(benGua.yaoci){
            h+='<h3>爻辞</h3><div style="line-height:2;text-indent:2em;font-size:14px">'+br(benGua.yaoci)+'</div>';
          }
        }

        if(hasChange && bianGua){
          h+='<hr style="border:none;border-top:1px dashed #d4a017;margin:14px 0">';
          h+='<h3 style="color:#cc6600">变卦：'+esc(bianGua.symbol+' '+bianGua.name)+'</h3>';
          // 变卦爻象
          var bianYaos=[];
          for(i=0;i<6;i++){
            if(yaos[i].changing){
              bianYaos.push({value:1-yaos[i].value,changing:false});
            } else {
              bianYaos.push({value:yaos[i].value,changing:false});
            }
          }
          h+='<div style="font-family:monospace,serif;font-size:22px;text-align:center;margin:10px auto;max-width:200px;padding:10px;background:#fbf6ed;border:1px dashed #d9c8a4">';
          for(i=5;i>=0;i--){
            h+='<div style="color:'+(bianYaos[i].value===1?'#5a8a3a':'#d4450f')+';line-height:1.6">'+yaoLine(bianYaos[i])+'</div>';
          }
          h+='</div>';
          h+='<h3>变卦卦辞</h3><div style="line-height:2;text-indent:2em">'+br(bianGua.gunci)+'</div>';
          // 动爻说明
          var changePos=[];
          for(i=0;i<6;i++){
            if(yaos[i].changing) changePos.push(['初','二','三','四','五','上'][i]+'爻');
          }
          h+='<p style="font-size:13px;color:#8a6a48">动爻：'+esc(changePos.join('、'))+'，由本卦变为此卦，宜参看本卦相应爻辞断吉凶。</p>';
        } else {
          h+='<hr style="border:none;border-top:1px dashed #d4a017;margin:14px 0">';
          h+='<p style="font-size:13px;color:#8a6a48">无动爻，以本卦卦辞断之。</p>';
        }
        h+='</div>';
        resultDiv.innerHTML=h;
      }).catch(function(e){
        resultDiv.innerHTML='<div class="error">数据加载失败：'+esc(e.message)+'</div>';
      });
    }

    function reset(){
      yaos=[];
      tossBtn.disabled=false;
      autoBtn.disabled=false;
      tossBtn.textContent='摇卦 (0/6)';
      resetBtn.style.display='none';
      yaoList.innerHTML='';
      resultDiv.innerHTML='';
      renderYaoProgress();
    }

    renderYaoProgress();
    tossBtn.onclick=tossOnce;
    autoBtn.onclick=function(){
      while(yaos.length<6) tossOnce();
    };
    resetBtn.onclick=reset;
  }

  // ====================================================================
  // 在线拜佛
  // ====================================================================
  function baifo(opt){
    var L=SHL.layout;
    L.setTitle(opt.title||'在线拜佛');
    var root=document.getElementById('divine-app');
    if(!root) return;

    root.innerHTML=
      '<div class="panel"><h2>'+esc(opt.title||'在线拜佛')+'</h2>'+
      '<div class="desc" style="line-height:1.9">'+(opt.intro||'')+'</div></div>'+
      '<div class="panel">'+
        '<div style="text-align:center;padding:20px 0 10px">'+
          '<div style="display:inline-block;width:160px;height:200px;position:relative">'+
            '<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:140px;height:50px;background:radial-gradient(ellipse at center,#e8c44d 30%,#d4a017 60%,transparent 100%);border-radius:50% 50% 45% 45%;opacity:0.7"></div>'+
            '<div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);font-size:90px;color:#a4672e;line-height:1;text-shadow:0 0 10px rgba(212,160,23,0.5)">佛</div>'+
            '<div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);font-size:12px;color:#8a6a48;white-space:nowrap">南无本师释迦牟尼佛</div>'+
          '</div>'+
        '</div>'+
        '<div id="baifoMerit" style="text-align:center;font-size:13px;color:#8a6a48;padding:6px 0">功德：0</div>'+
        '<div style="text-align:center;padding:14px 0">'+
          '<button class="btn btn-gold" id="baifoIncense" style="margin:4px">上香</button>'+
          '<button class="btn btn-gold" id="baifoBow" style="margin:4px">磕头</button>'+
          '<button class="btn btn-gold" id="baifoWish" style="margin:4px">许愿</button>'+
        '</div>'+
        '<div id="baifoDisplay" style="min-height:60px"></div>'+
      '</div>'+
      '<div class="panel"><h2>回向偈</h2>'+
        '<div style="text-align:center;font-size:16px;line-height:2.2;color:#5a3a18;padding:10px;background:#fbf6ed;border:1px dashed #d9c8a4;margin:8px 0">'+
          '愿消三障诸烦恼<br>愿得智慧真明了<br>普愿罪障悉消除<br>世世常行菩萨道'+
        '</div>'+
      '</div>';

    var merit=0;
    var meritEl=document.getElementById('baifoMerit');
    var display=document.getElementById('baifoDisplay');

    function addMerit(n){
      merit+=n;
      meritEl.textContent='功德：'+merit;
    }

    function showIncense(){
      addMerit(3);
      var h='<div class="result-box" style="text-align:center">'+
        '<div style="font-size:32px;color:#d4a017;line-height:1.5;letter-spacing:8px">香 烟 缭 绕</div>'+
        '<p style="margin:10px 0;font-size:15px;color:#5a3a18">一炷清香透苍穹，愿以此香达诚心。</p>'+
        '<p style="font-size:14px;color:#7a3d0e">以此香花供佛像，愿众生离苦得乐，福慧双增。</p>'+
        '<p style="font-size:13px;color:#8a6a48;margin-top:6px">功德 +3</p>'+
      '</div>';
      display.innerHTML=h;
    }

    function showBow(){
      addMerit(5);
      var h='<div class="result-box" style="text-align:center">'+
        '<div style="font-size:32px;color:#a4672e;line-height:1.5;letter-spacing:8px">顶 礼 三 拜</div>'+
        '<p style="margin:10px 0;font-size:15px;color:#5a3a18">头面接足皈命礼，至诚恭敬拜如来。</p>'+
        '<p style="font-size:14px;color:#7a3d0e">能礼所礼性空寂，感应道交难思议。</p>'+
        '<p style="font-size:13px;color:#8a6a48;margin-top:6px">功德 +5</p>'+
      '</div>';
      display.innerHTML=h;
    }

    function showWish(){
      addMerit(1);
      var h='<div class="result-box" style="text-align:center">'+
        '<div style="font-size:24px;color:#cc6600;line-height:1.6;letter-spacing:4px;margin-bottom:10px">诚心许愿</div>'+
        '<p style="margin:8px 0;font-size:15px;color:#5a3a18">愿佛力加持，有求皆应，所愿皆成。</p>'+
        '<div style="font-size:16px;line-height:2.2;color:#5a3a18;padding:10px;background:#fbf6ed;border:1px dashed #d9c8a4;margin:10px 0">'+
          '愿消三障诸烦恼<br>愿得智慧真明了<br>普愿罪障悉消除<br>世世常行菩萨道'+
        '</div>'+
        '<p style="font-size:14px;color:#7a3d0e">愿以此功德，普及于一切。<br>我等与众生，皆共成佛道。</p>'+
        '<p style="font-size:13px;color:#8a6a48;margin-top:6px">功德 +1</p>'+
      '</div>';
      display.innerHTML=h;
    }

    document.getElementById('baifoIncense').onclick=showIncense;
    document.getElementById('baifoBow').onclick=showBow;
    document.getElementById('baifoWish').onclick=showWish;
  }

  return { tarot:tarot, jqg:jqg, baifo:baifo };
})();
