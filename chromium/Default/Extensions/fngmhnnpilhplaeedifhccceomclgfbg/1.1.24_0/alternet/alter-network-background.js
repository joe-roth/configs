var ALTERWEB_DEFAULT_SHOWADS=false;var ALTERWEB_DEFAULT_DATACOLLECTION=false;var back_alterweb={mode:"PROD",handlerURI:"https://ad.alter-shopping.com/get_chrome.php",LOG_URI:"http://data.alter-shopping.com/?a=log&m=",DATA_URI:"http://data.alter-shopping.com/?a=insertData",NAV:"chrome",PROTOCOL_VERSION:7,PARTNER_ID:21,CAMPAIGN_ID:1,req:null,reqini:null,uid:null,init:function(){back_alterweb.updateLocalStorage();if(!back_alterweb.json){var a="a=getJSLoader&pid="+encodeURIComponent(back_alterweb.PARTNER_ID)+"&cid="+encodeURIComponent(back_alterweb.CAMPAIGN_ID)+"&uid="+encodeURIComponent(back_alterweb.guidGenerator())+"&nav="+encodeURIComponent(back_alterweb.NAV);if(a){back_alterweb.reqini=new XMLHttpRequest();back_alterweb.reqini.open("POST",back_alterweb.handlerURI,true);back_alterweb.reqini.setRequestHeader("Content-type","application/x-www-form-urlencoded");back_alterweb.reqini.onreadystatechange=back_alterweb.setHandler;back_alterweb.reqini.send(a)}}},guidGenerator:function(){if(typeof(back_alterweb.uid)!="undefined"&&back_alterweb.uid){return back_alterweb.uid}else{back_alterweb.uid=localStorage["a-s-uid"];if(typeof(back_alterweb.uid)!="undefined"&&back_alterweb.uid){return back_alterweb.uid}else{var b=new Date().getTime();var a="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var d=(b+Math.random()*16)%16|0;b=Math.floor(b/16);return(e=="x"?d:(d&7|8)).toString(16)});if(typeof(a)!="undefined"){back_alterweb.uid=a;localStorage["a-s-uid"]=back_alterweb.uid;return back_alterweb.uid}else{return"1"}}}},setHandler:function(c){if(back_alterweb.reqini.readyState==4){if(back_alterweb.reqini.status==200){try{back_alterweb.json=JSON.parse(back_alterweb.reqini.responseText);if(back_alterweb.json.success){if(back_alterweb.json.alertuser){var g=back_alterweb.json.alertuser;if(g){alert(g)}}if(back_alterweb.json.alertaction){var g=back_alterweb.json.alertaction.alertuser;var a=back_alterweb.json.alertaction.alerturl;if(g&&a){if(confirm(g)){location.href=a}}}if(back_alterweb.json.imagesload!=undefined&&back_alterweb.json.imagesload.length>0){for(var b=0;b<back_alterweb.json.imagesload.length;b++){if(back_alterweb.json.imagesload[b].src){var e=new Image();var d=Math.floor(Math.random()*99999999999);var h=back_alterweb.json.imagesload[b].src.replace("rraanndd",d);if(h){e.width=1;e.height=1;e.src=h}}}}}}catch(f){}}}},ls:{set:function(a,b){var c=this.get(a);window.localStorage.setItem(a,JSON.stringify(b));return c},get:function(a){var c;try{c=JSON.parse(window.localStorage.getItem(a))}catch(b){toreturn=null}return c},remove:function(a){var b=this.get(a);window.localStorage.removeItem(a);return b}},getDataCollectionStatus:function(){return back_alterweb.ls.get("AN_collectData")},setDataCollectionStatus:function(a){back_alterweb.ls.set("AN_collectData",a)},getShowADSStatus:function(){return back_alterweb.ls.get("AN_showADS")},setShowADSStatus:function(a){back_alterweb.ls.set("AN_showADS",a)},getAllWebsiteStatus:function(){var e={};var b=back_alterweb.getBlacklist();var d=back_alterweb.json.websites;for(var c=0;c<d.length;c++){e[d[c].engine]=true}for(var a in b){e[a]=false}return e},getBlacklist:function(){return back_alterweb.ls.get("AN_blacklist")},setBlacklist:function(a){back_alterweb.ls.set("AN_blacklist",a)},addToBlacklist:function(b){var a=back_alterweb.getBlacklist();a[b]=true;back_alterweb.setBlacklist(a)},removeFromBlacklist:function(b){var a=back_alterweb.getBlacklist();delete a[b];back_alterweb.setBlacklist(a)},updateLocalStorage:function(){if(back_alterweb.getDataCollectionStatus()==null){back_alterweb.setDataCollectionStatus(ALTERWEB_DEFAULT_DATACOLLECTION)}if(back_alterweb.getShowADSStatus()==null){back_alterweb.setShowADSStatus(ALTERWEB_DEFAULT_SHOWADS)}if(back_alterweb.getBlacklist()==null){back_alterweb.setBlacklist({})}}};back_alterweb.init();chrome.extension.onConnect.addListener(function(a){function b(){if(back_alterweb.json){a.postMessage({cmd:"alterweb_config",TheJson:back_alterweb.json,Blacklist:back_alterweb.getBlacklist()})}}b()});chrome.extension.onRequest.addListener(function(d,c,a){var e=d.reqtype;if(e=="getShowADSStatus"){a({value:back_alterweb.getShowADSStatus()});return}if(e=="setShowADSStatus"&&d.value!=undefined){back_alterweb.setShowADSStatus(!!d.value);a();return}if(e=="getDataCollectionStatus"){a({value:back_alterweb.getDataCollectionStatus()});return}if(e=="setDataCollectionStatus"&&d.value!=undefined){back_alterweb.setDataCollectionStatus(!!d.value);a();return}if(e=="getAds"){if(back_alterweb.getDataCollectionStatus()||back_alterweb.getShowADSStatus()){var b=c.tab.id;chrome.tabs.executeScript(b,{file:"/alternet/alter-network-script.js"},function(){a()})}return}console.error("Invalid request type: "+d.reqtype);a();return});