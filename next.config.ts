import type { NextConfig } from "next";
const config:NextConfig={poweredByHeader:false,images:{remotePatterns:[{protocol:"https",hostname:"images.unsplash.com",pathname:"/**"},{protocol:"https",hostname:"**.sparkplatform.com",pathname:"/**"},{protocol:"https",hostname:"**.flexmls.com",pathname:"/**"},{protocol:"https",hostname:"**.sparkapi.com",pathname:"/**"}],formats:["image/avif","image/webp"],deviceSizes:[360,640,750,1080,1536,1920]},async redirects(){return [{source:"/communities/lake-worth",destination:"/communities/lake-worth-beach",permanent:true}];}};
export default config;
