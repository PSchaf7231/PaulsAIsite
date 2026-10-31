import {homePlaces} from './home-places';
const commons=(file:string)=>`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=960`;
export const communityPhotos=[...homePlaces,
 {city:'Boynton Beach',file:'Green Cay Wetlands in Boynton Beach, FL.jpg',photo:commons('Green Cay Wetlands in Boynton Beach, FL.jpg'),author:'Wendy Cutler',license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',alt:'Green Cay Wetlands in suburban Boynton Beach'},
 {city:'Lake Worth Beach',file:'Lake Worth Florida Pier.jpg',photo:commons('Lake Worth Florida Pier.jpg'),author:'Gszrir',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',alt:'Lake Worth Beach pier'},
 {city:'Palm Beach Gardens',file:'Downtown at the Gardens.jpg',photo:commons('Downtown at the Gardens.jpg'),author:'Andyxox~commonswiki',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',alt:'Entrance to Downtown at the Gardens, Palm Beach Gardens'}
];
