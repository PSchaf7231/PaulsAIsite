export function smsLink(phone:string,message:string,ios=false){
 if(!/^\+[1-9]\d{7,14}$/.test(phone))return null;
 return `sms:${phone}${ios?'&':'?'}body=${encodeURIComponent(message)}`;
}
