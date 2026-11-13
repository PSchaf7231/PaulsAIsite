// US phone numbers on website forms: 10 digits, or 11 starting with 1.
export function validUsPhone(value:string){const d=value.replace(/\D/g,'');return d.length===10||(d.length===11&&d.startsWith('1'));}
export const PHONE_ERROR='Please enter a 10-digit phone number.';
