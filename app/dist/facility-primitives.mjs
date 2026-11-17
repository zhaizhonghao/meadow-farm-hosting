// Map sprites and catalogue illustrations project the same solids. Only the
// drawing surface (canvas or SVG) and the camera are supplied by the caller.
export function shade(hex, amount) {
  const rgb = parseInt(hex.slice(1), 16);
  return '#' + [rgb >> 16, (rgb >> 8) & 255, rgb & 255]
    .map(channel => Math.max(0, Math.min(255, Math.round(channel + amount))).toString(16).padStart(2, '0')).join('');
}

const ordinaryAccents = {
  well:'#828d76', mill:'#8f9686', bakery:'#ae7459', lumber:'#778768', dairy:'#a17c65',
  cakery:'#ac9280', warehouse:'#828b7d', depot:'#9b8d6a', silo:'#929889'
};
export function facilityAccent(building, model) {
  if (building.ordinary) return ordinaryAccents[building.type] || '#9c927e';
  if (building.assetId) return model?.tier === 2 ? '#c5a35e' : '#469e9e';
  return null;
}

export function createSolidPrimitives({iso, poly, line, facing, depth}) {
  function quad(x, y, width, length, z, color) {
    poly([iso(x,y,z), iso(x+width,y,z), iso(x+width,y+length,z), iso(x,y+length,z)], color);
  }
  function box(x, y, width, length, height, wall='#ede5cc', lid='#f8f0db', base=0) {
    const top = base + height;
    const sideX = facing(1,0) ? x+width : x, sideY = facing(0,1) ? y+length : y;
    poly([iso(sideX,y,base), iso(sideX,y+length,base), iso(sideX,y+length,top), iso(sideX,y,top)], shade(wall,-22));
    poly([iso(x,sideY,base), iso(x+width,sideY,base), iso(x+width,sideY,top), iso(x,sideY,top)], wall);
    quad(x,y,width,length,top,lid);
  }
  function roof(x, y, width, length, height, color) {
    const a=iso(x-.08,y-.08,height), b=iso(x+width+.08,y-.08,height);
    const c=iso(x+width+.08,y+length+.08,height), d=iso(x-.08,y+length+.08,height);
    const peakA=iso(x+width/2,y-.08,height+.5), peakB=iso(x+width/2,y+length+.08,height+.5);
    const faces=[
      {points:[a,peakA,peakB,d], color, order:depth(x+width*.25,y+length*.5)},
      {points:[peakA,b,c,peakB], color:shade(color,-25), order:depth(x+width*.75,y+length*.5)},
      {points:[a,b,peakA], color:shade(color,-12), order:depth(x+width*.5,y-.08)},
      {points:[d,c,peakB], color:shade(color,-8), order:depth(x+width*.5,y+length+.08)}
    ];
    for (const face of faces.sort((a,b)=>a.order-b.order)) poly(face.points,face.color);
    line(peakA,peakB,shade(color,15),1.5);
  }
  return {quad, box, roof};
}
