const hosts:Record<string,string>={'chatgpt.com':'ChatGPT','chat.openai.com':'ChatGPT','perplexity.ai':'Perplexity','claude.ai':'Claude','copilot.microsoft.com':'Copilot','gemini.google.com':'Gemini','poe.com':'Poe'};
const tags:Record<string,string>={chatgpt:'ChatGPT','chatgpt.com':'ChatGPT',openai:'ChatGPT',perplexity:'Perplexity','perplexity.ai':'Perplexity',claude:'Claude','claude.ai':'Claude',copilot:'Copilot',gemini:'Gemini',poe:'Poe'};
export function aiReferral(referrer:string,search:string){
 const tag=new URLSearchParams(search).get('utm_source')?.toLowerCase();if(tag&&tags[tag])return tags[tag];
 try{const host=new URL(referrer).hostname.toLowerCase();return Object.entries(hosts).find(([domain])=>host===domain||host.endsWith('.'+domain))?.[1]||null;}catch{return null;}
}
