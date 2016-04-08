!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e(require("Clappr")):"function"==typeof define&&define.amd?define(["Clappr"],e):"object"==typeof exports?exports.ClapprThumbnailsPlugin=e(require("Clappr")):t.ClapprThumbnailsPlugin=e(t.Clappr)}(this,function(t){return function(t){function e(o){if(i[o])return i[o].exports;var n=i[o]={exports:{},id:o,loaded:!1};return t[o].call(n.exports,n,n.exports,e),n.loaded=!0,n.exports}var i={};return e.m=t,e.c=i,e.p="<%=baseUrl%>/",e(0)}([function(t,e,i){"use strict";function o(t){return t&&t.__esModule?t:{"default":t}}function n(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function r(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function s(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}Object.defineProperty(e,"__esModule",{value:!0});var a=function(){function t(t,e){for(var i=0;i<e.length;i++){var o=e[i];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}return function(e,i,o){return i&&t(e.prototype,i),o&&t(e,o),e}}(),u=i(4),l=i(3),h=o(l),d=i(2),c=o(d),p=function(t){function e(t){n(this,e);var i=r(this,Object.getPrototypeOf(e).call(this,t));return i._init(),i}return s(e,t),a(e,[{key:"name",get:function(){return"scrub-thumbnails"}},{key:"attributes",get:function(){return{"class":this.name,"data-scrub-thumbnails":""}}},{key:"template",get:function(){return(0,u.template)(h["default"])}}],[{key:"buildSpriteConfig",value:function(t,e,i,o,n,r,s){s=s||0;for(var a=[],u=0;e>u;u++)a.push({url:t,time:s+u*r,w:i,h:o,x:u%n*i,y:Math.floor(u/n)*o});return a}}]),a(e,[{key:"bindEvents",value:function(){this.listenTo(this.core.mediaControl,u.Events.MEDIACONTROL_MOUSEMOVE_SEEKBAR,this._onMouseMove),this.listenTo(this.core.mediaControl,u.Events.MEDIACONTROL_MOUSELEAVE_SEEKBAR,this._onMouseLeave),this.listenTo(this.core.mediaControl,u.Events.MEDIACONTROL_RENDERED,this._onMediaControlRendered)}},{key:"_init",value:function(){this._loaded=!1,this._show=!1,this._hoverPosition=0,this._thumbs=[],this._$backdropCarousel=[],this._loadThumbs()}},{key:"_loadThumbs",value:function(){var t=this;this._loadThumbnails(function(){t._loadBackdrop(),t._loaded=!0,t._renderPlugin()})}},{key:"_getOptions",value:function(){if(!("scrubThumbnails"in this.core.options))throw"'scrubThumbnails property missing from options object.";return this.core.options.scrubThumbnails}},{key:"_appendElToMediaControl",value:function(){this.core.mediaControl.$el.find(".media-control-background").first().after(this.el)}},{key:"_onMediaControlRendered",value:function(){this._render(),this._init()}},{key:"_onMouseMove",value:function(t){this._calculateHoverPosition(t),this._show=!0,this._renderPlugin()}},{key:"_onMouseLeave",value:function(){this._show=!1,this._renderPlugin()}},{key:"_calculateHoverPosition",value:function(t){var e=t.pageX-this.core.mediaControl.$seekBarContainer.offset().left;this._hoverPosition=Math.min(1,Math.max(e/this.core.mediaControl.$seekBarContainer.width(),0))}},{key:"_loadThumbnails",value:function(t){var e=this,i=this._getOptions().thumbs,o=[],n=i.length;if(0===n)return void t();for(var r=function(r){var s=i[r];e._thumbs.push(null);var a=r<i.length-1?i[r+1]:null,u=a?a.time-s.time:null,l=new Image,h=function(){var i=l.width,o=l.height;e._thumbs[r]={imageW:i,imageH:o,x:s.x||0,y:s.y||0,w:s.w||i,h:s.h||o,url:s.url,time:s.time,duration:u},0===--n&&t()};-1===o.indexOf(s.url)&&o.push(s.url),l.onload=h,l.src=s.url},s=0;s<i.length;s++)r(s)}},{key:"_buildImg",value:function(t,e){var i=e/t.h,o=$("<img />").addClass("thumbnail-img").attr("src",t.url),n=$("<div />").addClass("thumbnail-container");return n.width(t.w*i),n.height(e),o.css({height:t.imageH*i,left:-1*t.x*i,top:-1*t.y*i}),n.append(o),n}},{key:"_loadBackdrop",value:function(){if(this._getOptions().backdropHeight)for(var t=this.$el.find("[data-backdrop-carousel]"),e=0;e<this._thumbs.length;e++){var i=this._buildImg(this._thumbs[e],this._getOptions().backdropHeight);this._$backdropCarousel.push(i),t.append(i)}}},{key:"_updateCarousel",value:function(){if(this._getOptions().backdropHeight){var t=this._hoverPosition,e=this.core.mediaControl.container.getDuration(),i=e*t,o=this.$el.find("[data-backdrop]").width(),n=this.$el.find("[data-backdrop-carousel]"),r=n.width(),s=this._thumbs,a=r/s.length,u=this._getThumbIndexForTime(i),l=s[u],h=l.duration;null===h&&(h=Math.max(e-l.time,0));var d=i-l.time,c=d/h,p=a*c,f=u*a+p,b=f-t*o;n.css("left",-b);for(var m=0;m<s.length;m++){var g=a*m,v=g-f;0>v&&(v=Math.min(0,v+a));var _=Math.max(.6-Math.abs(v)/(2*a),.08);this._$backdropCarousel[m].css("opacity",_)}}}},{key:"_updateSpotlightThumb",value:function(){if(this._getOptions().spotlightHeight){var t=this._hoverPosition,e=this.core.mediaControl.container.getDuration(),i=e*t,o=this._getThumbIndexForTime(i),n=this._thumbs[o],r=this.$el.find("[data-spotlight]");r.empty(),r.append(this._buildImg(n,this._getOptions().spotlightHeight));var s=this.$el.width(),a=r.width(),u=s*t-a/2;u=Math.max(Math.min(u,s-a),0),r.css("left",u)}}},{key:"_getThumbIndexForTime",value:function(t){for(var e=this._thumbs,i=e.length-1;i>=0;i--){var o=e[i];if(o.time<=t)return i}return 0}},{key:"_renderPlugin",value:function(){this._loaded&&(this._show&&this._getOptions().thumbs.length>0?(this.$el.removeClass("hidden"),this._updateCarousel(),this._updateSpotlightThumb()):this.$el.addClass("hidden"))}},{key:"_render",value:function(){return this.$el.html(this.template({backdropHeight:this._getOptions().backdropHeight,spotlightHeight:this._getOptions().spotlightHeight})),this.$el.append(u.Styler.getStyleFor(c["default"])),this.$el.addClass("hidden"),this._appendElToMediaControl(),this}}]),e}(u.UICorePlugin);e["default"]=p,t.exports=e["default"]},function(t,e){"use strict";t.exports=function(){var t=[];return t.toString=function(){for(var t=[],e=0;e<this.length;e++){var i=this[e];i[2]?t.push("@media "+i[2]+"{"+i[1]+"}"):t.push(i[1])}return t.join("")},t.i=function(e,i){"string"==typeof e&&(e=[[null,e,""]]);for(var o={},n=0;n<this.length;n++){var r=this[n][0];"number"==typeof r&&(o[r]=!0)}for(n=0;n<e.length;n++){var s=e[n];"number"==typeof s[0]&&o[s[0]]||(i&&!s[2]?s[2]=i:i&&(s[2]="("+s[2]+") and ("+i+")"),t.push(s))}},t}},function(t,e,i){e=t.exports=i(1)(),e.push([t.id,".scrub-thumbnails{position:absolute;bottom:55px;width:100%;-webkit-transition:opacity .3s ease;transition:opacity .3s ease}.scrub-thumbnails.hidden{opacity:0}.scrub-thumbnails .image-cache{display:none}.scrub-thumbnails .thumbnail-container{display:inline-block;position:relative;overflow:hidden;background-color:#000}.scrub-thumbnails .thumbnail-container .thumbnail-img{position:absolute;width:auto}.scrub-thumbnails .spotlight{background-color:#000;overflow:hidden;position:absolute;bottom:0;left:0;border:2px solid #fff}.scrub-thumbnails .spotlight img{width:auto}.scrub-thumbnails .backdrop{position:absolute;left:0;bottom:0;right:0;background-color:#000;overflow:hidden}.scrub-thumbnails .backdrop .carousel{position:absolute;top:0;left:0;height:100%;white-space:nowrap}.scrub-thumbnails .backdrop .carousel img{width:auto}",""])},function(t,e){t.exports='<% if (backdropHeight) { %>\n<div class="backdrop" style="height: <%= backdropHeight%>px;" data-backdrop><div class="carousel" data-backdrop-carousel></div></div>\n<% }; %>\n<% if (spotlightHeight) { %>\n<div class="spotlight" style="height: <%= spotlightHeight%>px;" data-spotlight></div>\n<% }; %>\n'},function(e,i){e.exports=t}])});