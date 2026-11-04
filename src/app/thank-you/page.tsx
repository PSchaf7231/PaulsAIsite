import Link from 'next/link';
export const metadata={title:'Thank you',robots:{index:false,follow:true}};
export default function ThankYou(){return <section className="container section"><h1>Thank you for reaching out.</h1><p>Your request is saved for Paul. He will follow up personally.</p><Link className="btn" href="/listings">Keep exploring homes</Link></section>;}
