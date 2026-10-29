import { ImageResponse } from 'next/og';
export async function GET(req:Request){
 const title=(new URL(req.url).searchParams.get('title')||'Find your place in Palm Beach County').slice(0,100);
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'64px',background:'#143e3b',color:'#fff'}}><div style={{display:'flex',fontSize:27,color:'#dce8cf'}}>PALM BEACH LIVING</div><div style={{display:'flex',fontSize:58,lineHeight:1.15,maxWidth:1050}}>{title}</div><div style={{display:'flex',justifyContent:'space-between',fontSize:26}}><span>Paul Schafranick</span><span>561-255-7285</span></div></div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=86400, s-maxage=86400'}});
}
