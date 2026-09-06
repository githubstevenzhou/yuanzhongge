/**
 * common.js - 通用命理计算函数 (ported from senlon/function.asp)
 */
window.SHL = window.SHL || {};

SHL.common = {
  // 纳音
  layin: function(tgdz){
    var C = SHL.const;
    for(var i=0;i<60;i++){ if(C.jiazi[i]===tgdz) return SHL.nayin[i]; }
    return "";
  },
  // 天干地支五行
  tgdzwh: function(tgdz){
    var C = SHL.const;
    var ti = C.tg.indexOf(tgdz.charAt(0));
    var di = C.dz.indexOf(tgdz.charAt(1));
    if(ti>=0) return C.tgWh[ti];
    if(di>=0) return C.dzWh[di];
    return "";
  },
  ganWh: function(g){ var i=SHL.const.tg.indexOf(g); return i>=0?SHL.const.tgWh[i]:""; },
  zhiWh: function(z){ var i=SHL.const.dz.indexOf(z); return i>=0?SHL.const.dzWh[i]:""; },
  // 三才 (尾数取五行)
  getsancai: function(sc){
    var m = ((sc%10)+10)%10;
    var map={0:"水",1:"木",2:"木",3:"火",4:"火",5:"土",6:"土",7:"金",8:"金",9:"水"};
    return map[m];
  },
  // 评分
  getpf: function(sc){
    var map={"大吉":12,"吉":8,"半吉":5,"大凶":0,"凶":1,"半凶":2,"平":4};
    return map[sc]!==undefined?map[sc]:4;
  },
  // 四季
  siji: function(yue){
    var m={1:"冬",2:"冬",3:"春",4:"春",5:"春",6:"夏",7:"夏",8:"夏",9:"秋",10:"秋",11:"秋",12:"冬"};
    return m[parseInt(yue)]||"";
  },
  // 天干相生
  ganSheng: function(a,b){ return SHL.const.sheng[SHL.common.ganWh(a)]===SHL.common.ganWh(b); },
  // 天干相克
  ganKe: function(a,b){ return SHL.const.ke[SHL.common.ganWh(a)]===SHL.common.ganWh(b); },
  // 地支生肖
  shengxiaoOf: function(zhi){ var i=SHL.const.dz.indexOf(zhi); return i>=0?SHL.const.shengxiao[i]:""; },
  // 生肖转地支
  zhiOfShengxiao: function(sx){ var i=SHL.const.shengxiao.indexOf(sx); return i>=0?SHL.const.dz[i]:""; },

  // 汉字五行 (从 hzwh 数据查找: 字符属于哪个五行)
  _hzwhCache: null,
  charWh: function(ch, hzwhData){
    if(!ch) return "";
    if(!this._hzwhCache && hzwhData){
      var m={}; for(var i=0;i<hzwhData.length;i++){ var r=hzwhData[i]; var wh=r.wh; var chars=(r.hz||"").replace(/\r/g,""); for(var j=0;j<chars.length;j++){ if(!m[chars[j]]) m[chars[j]]=wh; } } this._hzwhCache=m;
    }
    return this._hzwhCache ? (this._hzwhCache[ch]||"") : "";
  },

  // 五格数理: 计算天格/地格/人格/总格/外格 (姓名笔画)
  // xingBihua: 姓的笔画数组, mingBihua: 名的笔画数组
  wuge: function(xingBihua, mingBihua){
    var x = xingBihua.slice();
    var m = mingBihua.slice();
    var tianGe, renGe, diGe, zongGe, waiGe;
    // 单姓/复姓处理
    if(x.length===1){
      tianGe = x[0]+1;
      renGe = x[0] + (m[0]||0);
    } else {
      tianGe = x[0]+x[1];
      renGe = x[x.length-1] + (m[0]||0);
    }
    if(m.length===1){
      diGe = m[0]+1;
    } else {
      diGe = m.reduce(function(a,b){return a+b;},0);
    }
    zongGe = x.concat(m).reduce(function(a,b){return a+b;},0);
    waiGe = zongGe - renGe + 1;
    if(waiGe<1) waiGe=1;
    return {tian:tianGe, ren:renGe, di:diGe, zong:zongGe, wai:waiGe};
  },

  // 数字取吉凶 (81数理)
  shuli: function(n, data81){
    if(!data81) return null;
    n = ((n-1)%80)+1; // 1-81 循环
    if(n===0) n=81;
    for(var i=0;i<data81.length;i++){ if(parseInt(data81[i].id)===n || parseInt(data81[i].xuhao)===n) return data81[i]; }
    return data81[(n-1)%data81.length];
  },

  // 简单随机抽签
  drawLot: function(max){ return Math.floor(Math.random()*max)+1; },

  // HTML 转义
  esc: function(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); },

  // 取 URL 查询参数
  qs: function(name){
    var m = new RegExp("[?&]"+name+"=([^&]*)").exec(location.search);
    return m?decodeURIComponent(m[1].replace(/\+/g," ")):"";
  },

  // ===== 农历转换模块 (lunarInfo 表 1900-2099) =====
  // 移植自 wannianli 页面算法，新增 lunarToSolar 反向转换
  lunar: (function(){
    // 农历数据表 1900-2099 (共200年)
    var lunarInfo=[
0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252];
    var solarMonth=[31,28,31,30,31,30,31,31,30,31,30,31];
    var nStr1=['日','一','二','三','四','五','六','七','八','九','十'];
    var nStr2=['初','十','廿','卅'];
    var lunarMonthName=['正','二','三','四','五','六','七','八','九','十','冬','腊'];

    function lYearDays(y){var i,sum=348;for(i=0x8000;i>0x8;i>>=1)sum+=(lunarInfo[y-1900]&i)?1:0;return sum+leapDays(y);}
    function leapDays(y){if(leapMonth(y))return((lunarInfo[y-1900]&0x10000)?30:29);else return 0;}
    function leapMonth(y){return(lunarInfo[y-1900]&0xf);}
    function monthDays(y,m){return((lunarInfo[y-1900]&(0x10000>>m))?30:29);}
    function solarDays(y,m){if(m===1)return(((y%4===0)&&(y%100!==0)||(y%400===0))?29:28);else return solarMonth[m];}

    // 公历 -> 农历
    // 入参: y/m/d 为公历年月日
    // 返回: {year,month,day,isLeap} 或 null(超出范围)
    function solarToLunar(y,m,d){
      if(y<1900||y>2099) return null;
      var offset=Math.floor((Date.UTC(y,m-1,d)-Date.UTC(1900,0,31))/86400000);
      var i,temp=0,year;
      for(i=1900;i<2100&&offset>0;i++){temp=lYearDays(i);offset-=temp;}
      if(offset<0){offset+=temp;i--;}
      year=i;
      var leap=leapMonth(i),isLeap=false,month,day;
      for(i=1;i<13&&offset>0;i++){
        if(leap>0&&i===(leap+1)&&isLeap===false){--i;isLeap=true;temp=leapDays(year);}
        else{temp=monthDays(year,i);}
        if(isLeap===true&&i===(leap+1))isLeap=false;
        offset-=temp;
      }
      if(offset===0&&leap>0&&i===leap+1){if(isLeap){isLeap=false;}else{isLeap=true;--i;}}
      if(offset<0){offset+=temp;--i;}
      month=i;day=offset+1;
      return {year:year,month:month,day:day,isLeap:isLeap};
    }

    // 农历 -> 公历
    // 入参: y/m/d 为农历年月日, isLeap 表示该月是否为闰月
    // 返回: {year,month,day} 公历 或 null(超出范围/非法)
    function lunarToSolar(y,m,d,isLeap){
      if(y<1900||y>2099) return null;
      if(m<1||m>12) return null;
      isLeap = !!isLeap;
      var leap = leapMonth(y);
      // 该年无闰月但用户指定闰月 -> 非法
      if(isLeap && (leap===0 || m!==leap)) return null;
      // 从当年正月初一(公历)开始累加天数
      // 正月初一对应公历日期: 用 solarToLunar 反向查找太复杂，直接累加农历天数
      // 找到当年春节(正月初一)的公历日期
      var springFestival = findSpringFestival(y);
      if(!springFestival) return null;
      // 累加到目标月日前一天的总天数
      var offset = 0;
      // 闰月处理: 月份顺序为 1,2,...,leap,闰leap,leap+1,...
      var order = monthOrder(y); // 返回该年所有月份的列表 [{m, isLeap}, ...]
      var foundIdx = -1;
      for(var i=0;i<order.length;i++){
        if(order[i].m===m && !!order[i].isLeap===isLeap){ foundIdx=i; break; }
        offset += monthDays2(y, order[i]);
      }
      if(foundIdx<0) return null;
      offset += (d-1); // 加上目标月内的天数(初一是第1天)
      var result = new Date(Date.UTC(springFestival.year, springFestival.month-1, springFestival.day) + offset*86400000);
      return {year:result.getUTCFullYear(), month:result.getUTCMonth()+1, day:result.getUTCDate()};
    }

    // 辅助: 某年春节(正月初一)的公历日期
    function findSpringFestival(y){
      // 在公历1月20日~2月20日之间查找农历正月初一
      for(var d=new Date(y,0,20); d<=new Date(y,1,20); d=new Date(d.getTime()+86400000)){
        var l=solarToLunar(d.getFullYear(), d.getMonth()+1, d.getDate());
        if(l && l.month===1 && l.day===1 && !l.isLeap){
          return {year:d.getFullYear(), month:d.getMonth()+1, day:d.getDate()};
        }
      }
      return null;
    }
    // 辅助: 某年农历月份顺序列表 [{m, isLeap}]
    function monthOrder(y){
      var leap=leapMonth(y);
      var arr=[];
      for(var i=1;i<=12;i++){
        arr.push({m:i, isLeap:false});
        if(leap>0 && i===leap){ arr.push({m:leap, isLeap:true}); }
      }
      return arr;
    }
    // 辅助: 某农历月的天数
    function monthDays2(y, mo){
      if(mo.isLeap) return leapDays(y);
      return monthDays(y, mo.m);
    }

    // 农历日名 (初一、初二...三十)
    function cDay(d){
      if(d===10)return '初十';if(d===20)return '二十';if(d===30)return '三十';
      return nStr2[Math.floor(d/10)]+nStr1[d%10];
    }
    // 农历月名 (正月、二月...闰X月)
    function monthName(l){
      if(l.isLeap) return '闰'+lunarMonthName[l.month-1]+'月';
      return lunarMonthName[l.month-1]+'月';
    }
    // 农历日期完整字符串 (如"农历甲子年正月初一")
    function lunarStr(l){
      if(!l) return '';
      var C=SHL.const;
      var gzIdx=(l.year-4)%60;
      gzIdx=((gzIdx%60)+60)%60;
      var gz=C.tg[gzIdx%10]+C.dz[gzIdx%12];
      var sx=C.shengxiao[gzIdx%12];
      return '农历'+gz+'年('+sx+')'+(l.isLeap?'闰':'')+lunarMonthName[l.month-1]+'月'+cDay(l.day);
    }

    return {
      solarToLunar: solarToLunar,
      lunarToSolar: lunarToSolar,
      leapMonth: leapMonth,
      monthDays: monthDays,
      lYearDays: lYearDays,
      cDay: cDay,
      monthName: monthName,
      lunarStr: lunarStr
    };
  })()
};
