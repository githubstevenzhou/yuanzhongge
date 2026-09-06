/**
 * bazi.js - 四柱八字排盘 (ported from senlon/sizhu.asp + pp_bz.asp)
 * 依赖: constants.js, common.js, data.js
 *
 * 主要函数:
 *   calc(opt, jqTerms, stimeItems)        - 计算四柱
 *   taiyuan(monthGan, monthZhi)           - 胎元
 *   minggong(monthZhi, dayZhi, mgX)       - 命宫
 *   xunkong(dayGZ, xunkongData)           - 旬空 (空亡)
 *   qiyun(opt, bazi, jqTerms)             - 起运 / 交运
 *   dayun(bazi, sex, qyAge)               - 大运 (10 步)
 *   liunian(bazi, startYear, count)       - 流年
 *   shishen(riGan, otherGan)              - 十神
 */
window.SHL = window.SHL || {};
SHL.bazi = (function(){
  function C(){ return SHL.const; }

  // 真太阳时修正: 经度 + 均时差
  // longitude: 经度 (东经正值), 默认 120 (北京时间基准)
  function trueSolarTime(year,month,day,hour,minute,longitude,stimeItems){
    longitude = longitude||120;
    var d = new Date(year, month-1, day, hour, minute, 0);
    // 经度修正: (经度-120)*4 分钟
    var lonMin = (longitude-120)*4;
    // 均时差修正: 从 stime 表查找该月日的修正 (分钟+秒)
    var eotSec = 0;
    if(stimeItems){
      for(var i=0;i<stimeItems.length;i++){
        var it=stimeItems[i];
        if(parseInt(it.m)===month && parseInt(it.d)===day){
          var min=parseInt(it.min), sec=parseInt(it.sec);
          eotSec = min*60 + (min<0?-sec:sec);
          break;
        }
      }
    }
    return new Date(d.getTime() + lonMin*60000 + eotSec*1000);
  }

  // 在节气表中找到该年的立春时间 (2月的节气)
  function lichun(year, terms){
    for(var i=0;i<terms.length;i++){
      var t=terms[i];
      if(t.y===year && t.m===2) return t;
    }
    return null;
  }
  function termTs(t){ return Date.UTC(t.y, t.m-1, t.d, t.h||0, t.mi||0); }

  // 找到 birth 之前最近的节气 (用于月柱), 返回该节气对象
  function prevTerm(birthTs, terms){
    var last=null;
    for(var i=0;i<terms.length;i++){
      var t=terms[i];
      var ts = termTs(t);
      if(ts<=birthTs) last={idx:i, t:t, ts:ts};
      else break;
    }
    return last;
  }
  // 找到 birth 之后第一个节气 (用于起运计算)
  function nextTerm(birthTs, terms){
    for(var i=0;i<terms.length;i++){
      var t=terms[i];
      var ts = termTs(t);
      if(ts>birthTs) return {idx:i, t:t, ts:ts};
    }
    return null;
  }

  // 计算四柱
  // opt: {year,month,day,hour,minute,longitude}
  // jqTerms: calendar_jq.json.terms  stimeItems: calendar_stime.json.items
  function calc(opt, jqTerms, stimeItems){
    var longitude = opt.longitude!=null?opt.longitude:120;
    var t = trueSolarTime(opt.year, opt.month, opt.day, opt.hour, opt.minute, longitude, stimeItems);
    var yea = t.getFullYear();
    var mon = t.getMonth()+1;
    var dat = t.getDate();
    var hou = t.getHours();
    var minut = t.getMinutes();
    var birthTs = Date.UTC(yea, mon-1, dat, hou, minut);

    // --- 年柱 ---
    var gzyear;
    var yuetag = false;
    var lc = lichun(yea, jqTerms);
    if(mon===1){
      gzyear = yea-1; yuetag=true;
    } else if(mon===2 && lc){
      var lcTs = termTs(lc);
      if(birthTs >= lcTs){ gzyear = yea; }
      else { gzyear = yea-1; yuetag=true; }
    } else {
      gzyear = yea;
    }
    var dy = ((gzyear-1924)%12+12)%12;
    var ty = ((gzyear-1924)%10+10)%10;
    var ygz = C().tg[ty]+C().dz[dy];

    // --- 月柱 ---
    var pt = prevTerm(birthTs, jqTerms);
    var gzmonth;
    if(pt){
      gzmonth = pt.t.m - 1;
      if(gzmonth===0) gzmonth=12;
    } else {
      gzmonth = 12;
    }
    var dm = ((gzmonth)%12+12)%12;
    // 五虎遁年起月: 年干决定月干起算
    // tm = ((gzyear mod 5) - 2) * 2 - 1, 若<0 加 10
    var tm = Math.floor(((gzyear%5)-2)*2-1);
    if(tm<0) tm=tm+10;
    var minggongx = tm;  // 命宫天干起算用
    // 月干 = (tm + gzmonth - 3 + 10) mod 10
    tm = (tm + gzmonth - 3 + 10) % 10;
    if(dm===1) tm = (tm+2+10)%10;
    var mgz = C().tg[tm]+C().dz[dm];

    // --- 日柱 ---
    // 以 1900-02-20 为甲子日基准
    var ref = Date.UTC(1900,1,20);
    var ddate = Date.UTC(yea, mon-1, dat);
    var gzdate = Math.round((ddate-ref)/(86400000));
    if(hou>=23) gzdate = gzdate+1;
    var dtg = ((gzdate%10)+10)%10;
    var ddz = ((gzdate%12)+12)%12;
    var dgz = C().tg[dtg]+C().dz[ddz];

    // --- 时柱 ---
    var ttg;
    if(dtg>4){
      ttg = (dtg-4)*2-2;
    } else {
      ttg = (dtg+1)*2-2;
    }
    var tdec = hou + minut/60;
    var tdz = Math.round(tdec/2)%12;
    ttg = (ttg+tdz)%10;
    ttg = (ttg+10)%10;
    var tgz = C().tg[ttg]+C().dz[tdz];

    return {
      solar: {year:yea,month:mon,day:dat,hour:hou,minute:minut},
      trueSolarDate: t,
      gzyear: gzyear,
      ty:ty, dy:dy, tm:tm, dm:dm, dtg:dtg, ddz:ddz, ttg:ttg, tdz:tdz,
      ygz: ygz, mgz: mgz, dgz: dgz, tgz: tgz,
      minggongx: minggongx,
      yuetag: yuetag,
      ygzWh: SHL.common.tgdzwh(ygz),
      mgzWh: SHL.common.tgdzwh(mgz),
      dgzWh: SHL.common.tgdzwh(dgz),
      tgzWh: SHL.common.tgdzwh(tgz),
      yNayin: SHL.common.layin(ygz),
      mNayin: SHL.common.layin(mgz),
      dNayin: SHL.common.layin(dgz),
      tNayin: SHL.common.layin(tgz),
      hourZhi: C().dz[tdz],
      shengxiao: C().shengxiao[dy],
      birthTs: birthTs
    };
  }

  // 胎元: 月干进一位, 月支进三位
  // (pp_bz.asp: taiy 函数, 实际算法为月干+1, 月支+3)
  function taiyuan(monthGZ){
    var tgIdx = C().tg.indexOf(monthGZ.charAt(0));
    var dzIdx = C().dz.indexOf(monthGZ.charAt(1));
    var tg = C().tg[(tgIdx+1)%10];
    var dz = C().dz[(dzIdx+3)%12];
    return tg+dz;
  }

  // 命宫: 月支 + 日支 逆推至子位, 配以命宫天干起算 (minggongx)
  // 算法 (源自 pp_bz.asp mingg 函数):
  //   mb = (dzIdx_d - dzIdx_m + 2 + 12) % 12   // 命宫地支索引
  //   mg = (minggongx + mb - 1 + 10) % 10      // 命宫天干索引
  function minggong(monthZhi, dayZhi, minggongx){
    var mIdx = C().dz.indexOf(monthZhi);
    var dIdx = C().dz.indexOf(dayZhi);
    if(mIdx<0||dIdx<0) return '';
    var mb = (dIdx - mIdx + 2 + 12) % 12;
    var mg = (minggongx + mb - 1 + 10) % 10;
    return C().tg[mg]+C().dz[mb];
  }

  // 旬空 (空亡) 查找
  // xunkongData: calendar_xunkong.json.items [{shou, gz:[...], kong:[a,b]}]
  function xunkong(dayGZ, xunkongData){
    if(!xunkongData) return [];
    for(var i=0;i<xunkongData.length;i++){
      var row=xunkongData[i];
      var gz = row.gz||[];
      for(var j=0;j<gz.length;j++){
        if(gz[j]===dayGZ){ return row.kong||[]; }
      }
    }
    return [];
  }

  // 藏干
  function canggan(zhi){
    var i = C().dz.indexOf(zhi);
    return i>=0 ? C().dc[i] : "";
  }

  // 十二长生 (地势): 以日干为身, 查对某地支的十二长生状态
  // 阳干顺行, 阴干逆行
  // 返回: 长生/沐浴/冠带/临官/帝旺/衰/病/死/墓/绝/胎/养
  function dishi(dayGan, zhi){
    var ganIdx = C().tg.indexOf(dayGan);
    var zhiIdx = C().dz.indexOf(zhi);
    if(ganIdx<0||zhiIdx<0) return '';
    // 各天干长生位地支索引
    var changshengPos = {
      0:11,  // 甲 -> 亥
      1:6,   // 乙 -> 午 (逆)
      2:2,   // 丙 -> 寅
      3:9,   // 丁 -> 酉 (逆)
      4:2,   // 戊 -> 寅
      5:9,   // 己 -> 酉 (逆)
      6:5,   // 庚 -> 巳
      7:0,   // 辛 -> 子 (逆)
      8:8,   // 壬 -> 申
      9:3    // 癸 -> 卯 (逆)
    };
    var isYang = (ganIdx % 2 === 0);
    var startPos = changshengPos[ganIdx];
    var idx;
    if(isYang){
      idx = (zhiIdx - startPos + 12) % 12;
    } else {
      idx = (startPos - zhiIdx + 12) % 12;
    }
    return C().changsheng[idx];
  }

  // 神煞: 以日柱(或年柱)干支为基准, 查四柱地支中的神煞
  // 返回该柱地支所带的神煞列表 (以日干为主查)
  function shensha(dayGan, dayZhi, targetZhi){
    var result = [];
    var zhiIdx = C().dz.indexOf(targetZhi);
    var ganIdx = C().tg.indexOf(dayGan);
    if(zhiIdx<0||ganIdx<0) return result;

    // 天乙贵人 (以日干查): 甲戊见丑未, 乙己见子申, 丙丁见亥酉, 庚辛见巳寅, 壬癸见卯巳
    var tianyi = {
      0:[1,10],   // 甲见丑未
      1:[0,8],    // 乙见子申
      2:[10,9],   // 丙见亥酉
      3:[10,9],   // 丁见亥酉
      4:[1,10],   // 戊见丑未
      5:[0,8],    // 己见子申
      6:[5,2],    // 庚见巳寅
      7:[5,2],    // 辛见巳寅
      8:[3,5],    // 壬见卯巳
      9:[3,5]     // 癸见卯巳
    };
    var ty = tianyi[ganIdx];
    if(ty && ty.indexOf(zhiIdx)>=0) result.push('天乙贵人');

    // 文昌贵人 (以日干查)
    var wenchang = {0:5, 1:6, 2:8, 3:9, 4:8, 5:9, 6:10, 7:0, 8:2, 9:3};
    if(wenchang[ganIdx]===zhiIdx) result.push('文昌');

    // 三合局 (用于桃花/驿马/华盖/将星等)
    var dayZhiIdx = C().dz.indexOf(dayZhi);
    var sanheJu = [
      {zhi:[8,0,4],  th:9, ma:2, hg:4, jx:0},   // 申子辰 -> 酉/寅/辰/子
      {zhi:[2,6,10], th:3, ma:8, hg:10,jx:6},   // 寅午戌 -> 卯/申/戌/午
      {zhi:[5,9,1],  th:6, ma:10,hg:1, jx:9},   // 巳酉丑 -> 午/亥/丑/酉
      {zhi:[11,3,7], th:0, ma:5, hg:7, jx:3}    // 亥卯未 -> 子/巳/未/卯
    ];
    var ju = -1;
    for(var i=0;i<sanheJu.length;i++){
      if(sanheJu[i].zhi.indexOf(dayZhiIdx)>=0){ ju=i; break; }
    }
    if(ju>=0){
      var s = sanheJu[ju];
      if(s.th===zhiIdx) result.push('桃花');
      if(s.ma===zhiIdx) result.push('驿马');
      if(s.hg===zhiIdx) result.push('华盖');
      if(s.jx===zhiIdx) result.push('将星');
    }
    return result;
  }

  // 五行统计: 统计八字中各五行数量 (含天干和地支藏干)
  function wuxingTongji(bazi){
    var C2 = C();
    var count = {木:0, 火:0, 土:0, 金:0, 水:0};
    // 天干五行
    var gans = [bazi.ygz.charAt(0), bazi.mgz.charAt(0), bazi.dgz.charAt(0), bazi.tgz.charAt(0)];
    for(var i=0;i<gans.length;i++){
      var wh = C2.tgWh[C2.tg.indexOf(gans[i])];
      if(count[wh]!==undefined) count[wh]++;
    }
    // 地支藏干五行
    var zhis = [bazi.ygz.charAt(1), bazi.mgz.charAt(1), bazi.dgz.charAt(1), bazi.tgz.charAt(1)];
    for(var j=0;j<zhis.length;j++){
      var cg = canggan(zhis[j]);
      for(var k=0;k<cg.length;k++){
        var wh2 = C2.tgWh[C2.tg.indexOf(cg.charAt(k))];
        if(count[wh2]!==undefined) count[wh2]++;
      }
    }
    return count;
  }

  // ===== 天干地支关系 (刑冲合害) =====
  // 检测四柱中天干地支的刑冲合害关系
  function ganZhiRelation(bazi){
    var C2 = C();
    var gans = [bazi.ygz.charAt(0), bazi.mgz.charAt(0), bazi.dgz.charAt(0), bazi.tgz.charAt(0)];
    var zhis = [bazi.ygz.charAt(1), bazi.mgz.charAt(1), bazi.dgz.charAt(1), bazi.tgz.charAt(1)];
    var ganNames = ['年干','月干','日干','时干'];
    var zhiNames = ['年支','月支','日支','时支'];
    var result = [];

    // --- 天干五合: 甲己/乙庚/丙辛/丁壬/戊癸 ---
    var ganHe = [['甲','己'],['乙','庚'],['丙','辛'],['丁','壬'],['戊','癸']];
    for(var i=0;i<4;i++){
      for(var j=i+1;j<4;j++){
        for(var k=0;k<ganHe.length;k++){
          if((gans[i]===ganHe[k][0]&&gans[j]===ganHe[k][1])||(gans[i]===ganHe[k][1]&&gans[j]===ganHe[k][0])){
            result.push(ganNames[i]+gans[i]+'与'+ganNames[j]+gans[j]+'天干合（'+ganHe[k][0]+ganHe[k][1]+'合）');
          }
        }
      }
    }
    // --- 天干相冲: 甲庚/乙辛/丙壬/丁癸/戊己(无冲) ---
    var ganChong = [['甲','庚'],['乙','辛'],['丙','壬'],['丁','癸']];
    for(var i2=0;i2<4;i2++){
      for(var j2=i2+1;j2<4;j2++){
        for(var k2=0;k2<ganChong.length;k2++){
          if((gans[i2]===ganChong[k2][0]&&gans[j2]===ganChong[k2][1])||(gans[i2]===ganChong[k2][1]&&gans[j2]===ganChong[k2][0])){
            result.push(ganNames[i2]+gans[i2]+'与'+ganNames[j2]+gans[j2]+'天干冲');
          }
        }
      }
    }

    // --- 地支六合: 子丑/寅亥/卯戌/辰酉/巳申/午未 ---
    var zhiLiuhe = [['子','丑'],['寅','亥'],['卯','戌'],['辰','酉'],['巳','申'],['午','未']];
    for(var i3=0;i3<4;i3++){
      for(var j3=i3+1;j3<4;j3++){
        for(var k3=0;k3<zhiLiuhe.length;k3++){
          if((zhis[i3]===zhiLiuhe[k3][0]&&zhis[j3]===zhiLiuhe[k3][1])||(zhis[i3]===zhiLiuhe[k3][1]&&zhis[j3]===zhiLiuhe[k3][0])){
            result.push(zhiNames[i3]+zhis[i3]+'与'+zhiNames[j3]+zhis[j3]+'六合');
          }
        }
      }
    }
    // --- 地支三合: 申子辰/寅午戌/巳酉丑/亥卯未 ---
    var zhiSanhe = [['申','子','辰'],['寅','午','戌'],['巳','酉','丑'],['亥','卯','未']];
    for(var i4=0;i4<4;i4++){
      for(var j4=i4+1;j4<4;j4++){
        for(var m4=j4+1;m4<4;m4++){
          var trio = [zhis[i4],zhis[j4],zhis[m4]].sort().join('');
          for(var k4=0;k4<zhiSanhe.length;k4++){
            var sanhe = zhiSanhe[k4].slice().sort().join('');
            if(trio===sanhe){
              result.push(zhiNames[i4]+zhis[i4]+'、'+zhiNames[j4]+zhis[j4]+'、'+zhiNames[m4]+zhis[m4]+'三合（'+zhiSanhe[k4].join('')+'合'+sanheJuWx(zhiSanhe[k4])+'）');
            }
          }
        }
      }
    }
    // 半三合
    var zhiBanhe = [
      {pair:['申','子'],full:'申子辰',wx:'水'},{pair:['子','辰'],full:'申子辰',wx:'水'},{pair:['申','辰'],full:'申子辰',wx:'水'},
      {pair:['寅','午'],full:'寅午戌',wx:'火'},{pair:['午','戌'],full:'寅午戌',wx:'火'},{pair:['寅','戌'],full:'寅午戌',wx:'火'},
      {pair:['巳','酉'],full:'巳酉丑',wx:'金'},{pair:['酉','丑'],full:'巳酉丑',wx:'金'},{pair:['巳','丑'],full:'巳酉丑',wx:'金'},
      {pair:['亥','卯'],full:'亥卯未',wx:'木'},{pair:['卯','未'],full:'亥卯未',wx:'木'},{pair:['亥','未'],full:'亥卯未',wx:'木'}
    ];
    for(var i5=0;i5<4;i5++){
      for(var j5=i5+1;j5<4;j5++){
        for(var k5=0;k5<zhiBanhe.length;k5++){
          if((zhis[i5]===zhiBanhe[k5].pair[0]&&zhis[j5]===zhiBanhe[k5].pair[1])||(zhis[i5]===zhiBanhe[k5].pair[1]&&zhis[j5]===zhiBanhe[k5].pair[0])){
            // 检查是否已有完整三合(避免重复)
            var hasFull = false;
            for(var r=0;r<result.length;r++){
              if(result[r].indexOf('三合')>=0 && result[r].indexOf(zhiBanhe[k5].full)>=0){ hasFull=true; break; }
            }
            if(!hasFull){
              result.push(zhiNames[i5]+zhis[i5]+'与'+zhiNames[j5]+zhis[j5]+'半三合（'+zhiBanhe[k5].full.substring(0,2)+'合'+zhiBanhe[k5].wx+'）');
            }
          }
        }
      }
    }
    // --- 地支六冲: 子午/丑未/寅申/卯酉/辰戌/巳亥 ---
    var zhiChong = [['子','午'],['丑','未'],['寅','申'],['卯','酉'],['辰','戌'],['巳','亥']];
    for(var i6=0;i6<4;i6++){
      for(var j6=i6+1;j6<4;j6++){
        for(var k6=0;k6<zhiChong.length;k6++){
          if((zhis[i6]===zhiChong[k6][0]&&zhis[j6]===zhiChong[k6][1])||(zhis[i6]===zhiChong[k6][1]&&zhis[j6]===zhiChong[k6][0])){
            result.push(zhiNames[i6]+zhis[i6]+'与'+zhiNames[j6]+zhis[j6]+'相冲');
          }
        }
      }
    }
    // --- 地支相刑: 寅巳申(三刑)/丑戌未(三刑)/子卯(互刑)/辰辰/午午/酉酉/亥亥(自刑) ---
    var zhiXing3 = [['寅','巳','申'],['丑','戌','未']];
    for(var i7=0;i7<4;i7++){
      for(var j7=i7+1;j7<4;j7++){
        for(var m7=j7+1;m7<4;m7++){
          var trio7 = [zhis[i7],zhis[j7],zhis[m7]].sort().join('');
          for(var k7=0;k7<zhiXing3.length;k7++){
            var xing3 = zhiXing3[k7].slice().sort().join('');
            if(trio7===xing3){
              result.push(zhiNames[i7]+zhis[i7]+'、'+zhiNames[j7]+zhis[j7]+'、'+zhiNames[m7]+zhis[m7]+'三刑（'+zhiXing3[k7].join('')+'刑）');
            }
          }
        }
      }
    }
    // 子卯相刑
    for(var i8=0;i8<4;i8++){
      for(var j8=i8+1;j8<4;j8++){
        if((zhis[i8]==='子'&&zhis[j8]==='卯')||(zhis[i8]==='卯'&&zhis[j8]==='子')){
          result.push(zhiNames[i8]+zhis[i8]+'与'+zhiNames[j8]+zhis[j8]+'相刑（子卯刑）');
        }
      }
    }
    // 自刑: 辰辰/午午/酉酉/亥亥
    var zhiZixing = ['辰','午','酉','亥'];
    for(var i9=0;i9<4;i9++){
      for(var j9=i9+1;j9<4;j9++){
        if(zhis[i9]===zhis[j9] && zhiZixing.indexOf(zhis[i9])>=0){
          result.push(zhiNames[i9]+zhis[i9]+'与'+zhiNames[j9]+zhis[j9]+'自刑');
        }
      }
    }
    // --- 地支相害: 子未/丑午/寅巳/卯辰/申亥/酉戌 ---
    var zhiHai = [['子','未'],['丑','午'],['寅','巳'],['卯','辰'],['申','亥'],['酉','戌']];
    for(var i10=0;i10<4;i10++){
      for(var j10=i10+1;j10<4;j10++){
        for(var k10=0;k10<zhiHai.length;k10++){
          if((zhis[i10]===zhiHai[k10][0]&&zhis[j10]===zhiHai[k10][1])||(zhis[i10]===zhiHai[k10][1]&&zhis[j10]===zhiHai[k10][0])){
            result.push(zhiNames[i10]+zhis[i10]+'与'+zhiNames[j10]+zhis[j10]+'相害');
          }
        }
      }
    }
    return result;
  }

  // 三合局五行
  function sanheJuWx(arr){
    if(arr.join('')==='申子辰') return '水';
    if(arr.join('')==='寅午戌') return '火';
    if(arr.join('')==='巳酉丑') return '金';
    if(arr.join('')==='亥卯未') return '木';
    return '';
  }

  // 十神含义
  function shishenExplain(ss){
    var map = {
      '比肩':'兄弟姐妹、同辈朋友、竞争者。主自立、独立、果断。',
      '劫财':'异性姐妹兄弟。主争夺、耗财、好赌、固执。',
      '食神':'福气、口福、才华。主温和、多才多艺、有福气。',
      '伤官':'聪明、才华外露。主叛逆、好胜、口才好、易得罪人。',
      '偏财':'偏门财、意外财。主慷慨、好交际、不重视金钱。',
      '正财':'正当收入、妻子。主勤俭、守本分、重视家庭。',
      '正官':'上司、法律、丈夫。主守规矩、有责任感、循规蹈矩。',
      '七杀':'压力、权威、小人。主果断、有魄力、易招是非。',
      '偏印':'偏门学问、继母。主孤僻、多疑、有独特见解。',
      '正印':'母亲、学业、贵人。主善良、重感情、爱学习。'
    };
    return map[ss]||'';
  }

  // 日主分析 (基于日干和月令)
  function dayMasterAnalysis(bazi){
    var C2 = C();
    var riGan = bazi.dgz.charAt(0);
    var ganIdx = C2.tg.indexOf(riGan);
    var dayWh = C2.tgWh[ganIdx];
    var monthZhi = bazi.mgz.charAt(1);
    var monthZhiIdx = C2.dz.indexOf(monthZhi);
    var monthWh = C2.dzWh[monthZhiIdx];
    var dsMonth = dishi(riGan, monthZhi); // 日干在月支的地势

    // 日干五行特性
    var ganChar = {
      '甲':'甲木为参天大树，性格刚直、有仁慈之心',
      '乙':'乙木为花草藤蔓，性格柔韧、善于应变',
      '丙':'丙火为太阳之火，性格热情、光明磊落',
      '丁':'丁火为灯烛之火，性格细腻、温暖体贴',
      '戊':'戊土为城墙之土，性格厚重、诚实守信',
      '己':'己土为田园之土，性格包容、踏实勤恳',
      '庚':'庚金为矿石之金，性格刚毅、重义气',
      '辛':'辛金为珠玉之金，性格精致、柔中带刚',
      '壬':'壬水为江河之水，性格奔放、聪明机智',
      '癸':'癸水为雨露之水，性格温柔、内涵丰富'
    };
    // 生旺死绝描述
    var dsDesc = {
      '长生':'如初生之苗，生机勃勃','沐浴':'如初生沐浴，脆弱多变','冠带':'如人冠带，逐渐成长',
      '临官':'如人壮年，精力充沛','帝旺':'如帝旺之时，最为强盛','衰':'如人渐老，力量衰退',
      '病':'如人患病，力不从心','死':'如人气绝，毫无生气','墓':'如入坟墓，收藏归库',
      '绝':'如绝地处逢生，谷底','胎':'如胎养之时，孕育生机','养':'如人养生，休养蓄势'
    };
    // 月令生克关系
    var relation = '';
    if(monthWh===dayWh) relation='月令同我（比劫），日主得令';
    else if(C2.sheng[monthWh]===dayWh) relation='月令生我（印星），日主得生';
    else if(C2.sheng[dayWh]===monthWh) relation='月令我生（食伤），日主泄气';
    else if(C2.ke[monthWh]===dayWh) relation='月令克我（官杀），日主受克';
    else if(C2.ke[dayWh]===monthWh) relation='月令我克（财星），日主耗气';

    var wx = wuxingTongji(bazi);
    var total = wx.木+wx.火+wx.土+wx.金+wx.水;
    var shengWh = C2.sheng[dayWh];
    var bornCount = wx[shengWh]+wx[dayWh];
    var strong = bornCount>=total/2;
    var strongStr = strong?'偏强':'偏弱';
    var yongshen = strong ? '喜克泄耗（官杀、食伤、财星）' : '喜生扶（印星、比劫）';

    return {
      ganChar: ganChar[riGan]||'',
      dsDesc: dsDesc[dsMonth]||'',
      relation: relation,
      strong: strongStr,
      yongshen: yongshen,
      dayWh: dayWh
    };
  }

  // 十神 (以日干为身, 比较另一干)
  function shishen(riGan, otherGan){
    var rg = C().tg.indexOf(riGan);
    var og = C().tg.indexOf(otherGan);
    if(rg<0||og<0) return "";
    var rgWh = C().tgWh[rg], ogWh = C().tgWh[og];
    var sameYin = (rg%2===(og%2));
    var sameWh = (rgWh===ogWh);
    var shengMe = null, meSheng=null, keMe=null, meKe=null;
    for(var k in C().sheng){ if(C().sheng[k]===rgWh) shengMe=k; if(k===rgWh) meSheng=C().sheng[k]; }
    for(var k2 in C().ke){ if(C().ke[k2]===rgWh) keMe=k2; if(k2===rgWh) meKe=C().ke[k2]; }
    if(sameWh){
      return sameYin?"比肩":"劫财";
    } else if(ogWh===meSheng){
      return sameYin?"食神":"伤官";
    } else if(ogWh===shengMe){
      return sameYin?"偏印":"正印";
    } else if(ogWh===meKe){
      return sameYin?"偏财":"正财";
    } else if(ogWh===keMe){
      return sameYin?"七杀":"正官";
    }
    return "";
  }

  // 起运计算
  // 阳男阴女顺排, 阴男阳女逆排
  // sex: 1=男, 0=女; ty: 年干索引 (奇数为阳, 偶数为阴)
  // 顺排: 从 birth 到下一个节气的天数 -> /3 = 年
  // 逆排: 从上一个节气到 birth 的天数 -> /3 = 年
  // 返回: {qyAge, qyText, jiaoyunDate}
  function qiyun(bazi, sex, jqTerms){
    var birthTs = bazi.birthTs;
    var ty = bazi.ty;
    var isYangYear = (ty % 2 === 0);  // ASP: (ty mod 2)=0 -> flag=1 阳年
    // ASP: sex=1 and flag=1 or sex=0 and flag=0 -> sx=1 (顺排)
    var sx = ( (sex===1 && isYangYear) || (sex===0 && !isYangYear) ) ? 1 : 0;

    var pt = prevTerm(birthTs, jqTerms);
    var nt = nextTerm(birthTs, jqTerms);
    var refTerm = sx ? nt : pt;
    if(!refTerm) return {qyAge:0, qyText:'未知', jiaoyunDate:null, sx:sx};

    var diffMs;
    if(sx){
      diffMs = termTs(refTerm.t) - birthTs;  // 顺: birth -> next
    } else {
      diffMs = birthTs - termTs(refTerm.t);  // 逆: prev -> birth
    }
    if(diffMs<0) diffMs = -diffMs;
    // 3 天 = 1 年; 1 天 = 4 个月; 1 小时 = 5 天; ...
    var totalDays = diffMs / 86400000;
    var years = Math.floor(totalDays/3);
    var remDays = totalDays - years*3;
    var months = Math.floor(remDays*4);
    var remHours = (remDays - months/4) * 24;
    var days = Math.floor(remHours*5);
    var hours = Math.floor((remHours*5 - days)*24 + 0.5);

    var qyText = '';
    if(years!==0) qyText = '<b>'+years+'</b> 年 <b>'+months+'</b> 个月 <b>'+days+'</b> 天 <b>'+hours+'</b> 小时';
    else qyText = '<b>'+months+'</b> 个月 <b>'+days+'</b> 天 <b>'+hours+'</b> 小时';

    var qyAge = Math.abs(Math.floor(totalDays/3)) + 1;
    // 交运日期 = 出生真太阳时 + 起运年月日时
    var jiaoyunDate = new Date(bazi.trueSolarDate.getTime() +
      years*365.25*86400000 + months*30*86400000 + days*86400000 + hours*3600000);

    return {qyAge:qyAge, qyText:qyText, jiaoyunDate:jiaoyunDate, sx:sx, years:years, months:months, days:days, hours:hours};
  }

  // 大运: 10 步, 每步 10 年, 从月柱顺/逆推
  // sx: 1=顺排, 0=逆排
  function dayun(bazi, sx){
    var tm = bazi.tm, dm = bazi.dm;
    var arr = [];
    for(var i=0;i<10;i++){
      var t, d;
      if(sx){
        t = (tm+i+10)%10;
        d = (dm+i+12)%12;
      } else {
        t = (tm-i+10)%10;
        d = (dm-i+12)%12;
      }
      var gz = C().tg[t]+C().dz[d];
      arr.push({
        gz: gz,
        nayin: SHL.common.layin(gz),
        shishen: shishen(bazi.dgz.charAt(0), C().tg[t]),
        ganIdx: t, zhiIdx: d
      });
    }
    return arr;
  }

  // 大运岁数: 第 i 步的起止岁数
  // 第 0 步: 1 ~ qyAge-1; 第 1 步: qyAge ~ qyAge+9; 第 i 步(i>=1): qyAge+10*(i-1) ~ qyAge+10*i-1
  function dayunAgeRange(qyAge, i){
    if(i===0) return {from:1, to:qyAge-1};
    return {from: qyAge+10*(i-1), to: qyAge+10*i-1};
  }

  // 大运起始年份
  // 第 0 步: 出生年; 第 1 步: 出生年 + qyAge; 第 i 步(i>=2): 上一步 + 10
  function dayunStartYear(birthYear, qyAge, i){
    if(i===0) return birthYear;
    if(i===1) return birthYear + qyAge;
    return birthYear + qyAge + 10*(i-1);
  }

  // 流年: 从大运起始年起, 每步 10 年
  // 返回每个大运的流年干支列表
  function liunian(birthYear, qyAge){
    var result = [];
    for(var i=0;i<10;i++){
      var startY = dayunStartYear(birthYear, qyAge, i);
      var arr = [];
      for(var j=0;j<10;j++){
        var y = startY + j;
        // 流年干支: 年份 y 的干支
        var dy = ((y-1924)%12+12)%12;
        var ty = ((y-1924)%10+10)%10;
        arr.push({year:y, gz:C().tg[ty]+C().dz[dy]});
      }
      result.push({startYear:startY, list:arr});
    }
    return result;
  }

  return {
    calc: calc,
    taiyuan: taiyuan,
    minggong: minggong,
    xunkong: xunkong,
    canggan: canggan,
    shishen: shishen,
    dishi: dishi,
    shensha: shensha,
    wuxingTongji: wuxingTongji,
    ganZhiRelation: ganZhiRelation,
    shishenExplain: shishenExplain,
    dayMasterAnalysis: dayMasterAnalysis,
    qiyun: qiyun,
    dayun: dayun,
    dayunAgeRange: dayunAgeRange,
    dayunStartYear: dayunStartYear,
    liunian: liunian,
    trueSolarTime: trueSolarTime,
    termTs: termTs,
    prevTerm: prevTerm,
    nextTerm: nextTerm
  };
})();
