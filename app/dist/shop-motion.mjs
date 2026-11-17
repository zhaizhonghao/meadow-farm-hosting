import {paintFacilityIllustration} from './asset-art.mjs?v=8.6.0';
import {createSolidPrimitives,shade} from './facility-primitives.mjs?v=8.6.0';

const svgNS='http://www.w3.org/2000/svg';
const cardSelector='.ordinary-shop article,.excard,.assetdetailart';

function canvasPainter(ctx) {
  const tile=56;
  const painter={
    tile,shade,depth:(x,y)=>x+y,facing:(x,y)=>x+y>0,
    iso:(x,y,z=0)=>({x:(x-y)*tile,y:((x+y)/2-z)*tile}),
    poly(points,fill,stroke){
      ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
      for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
      ctx.closePath();ctx.fillStyle=fill;ctx.fill();
      if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}
    },
    line(a,b,color,width=2){
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
    },
    ellipse(c,rx,ry,color){
      ctx.beginPath();ctx.ellipse(c.x,c.y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    }
  };
  return Object.assign(painter,createSolidPrimitives(painter));
}

// A single canvas follows the hovered or keyboard-focused card. Unseen cards
// keep their shared SVG poster; no per-card timers or animation loops exist.
export function createShopMotion(models) {
  const catalog=new Map(models.map(m=>[m.id,m]));
  const layer=document.createElementNS(svgNS,'foreignObject');
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  layer.setAttribute('pointer-events','none');layer.setAttribute('data-i18n-ignore','');
  canvas.style.cssText='display:block;width:100%;height:100%;pointer-events:none';
  layer.append(canvas);
  const painter=canvasPainter(ctx);
  let hovered,focused,detail,current,poster,model,box,last=0,started=0;
  const cardOf=el=>el?.closest?.(cardSelector);
  document.addEventListener('pointerover',e=>{hovered=cardOf(e.target);});
  document.addEventListener('pointerout',e=>{hovered=cardOf(e.relatedTarget);});
  document.addEventListener('focusin',e=>{focused=cardOf(e.target);hovered=null;});
  document.addEventListener('focusout',e=>{focused=cardOf(e.relatedTarget);});
  function restore(){
    if(poster)poster.style.removeProperty('visibility');
    layer.remove();poster=null;current=null;
  }
  function frame(now,enabled){
    if(!enabled || !ctx){if(current)restore();return;}
    const candidate=detail?.isConnected && detail.closest('dialog[open]') ? detail :
      hovered?.isConnected ? hovered : focused?.isConnected ? focused : null;
    if(!candidate || (candidate.closest('dialog') && !candidate.closest('dialog[open]'))){
      if(current)restore();return;
    }
    if(candidate!==current){
      if(current)restore();
      const svg=candidate.querySelector('.facility-thumbnail[data-model]');
      if(!svg || !svg.getClientRects().length)return;
      model=catalog.get(svg.dataset.model);
      if(!model)return;
      const r=svg.viewBox.baseVal;
      box={x:r.x,y:r.y,w:r.width,h:r.height};
      for(const [name,value] of Object.entries({x:box.x,y:box.y,width:box.w,height:box.h}))layer.setAttribute(name,value);
      // NFT detail images may be larger than their viewBox in CSS pixels.
      const rect=svg.getBoundingClientRect(), scale=Math.min(4,Math.max(1,Math.min(rect.width/box.w,rect.height/box.h)*devicePixelRatio));
      canvas.width=Math.ceil(box.w*scale);canvas.height=Math.ceil(box.h*scale);
      poster=svg.querySelector('use');poster.style.visibility='hidden';
      svg.append(layer);current=candidate;started=now;last=-Infinity;
    }
    if(now-last<1000/20)return;
    last=now;
    const sx=canvas.width/box.w,sy=canvas.height/box.h;
    ctx.setTransform(sx,0,0,sy,-box.x*sx,-box.y*sy);
    ctx.clearRect(box.x,box.y,box.w,box.h);
    paintFacilityIllustration(painter,model,.78+(now-started)/1000,true);
  }
  return {frame,showDetail(el){detail=el;}};
}
