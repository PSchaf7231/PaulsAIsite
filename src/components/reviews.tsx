"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Review } from "@/lib/config";
export default function Reviews({reviews}:{reviews:Review[]}){
 const [index,setIndex]=useState(0);
 const review=reviews[index % Math.max(reviews.length,1)];
 return <section className="review-section" aria-label="Client reviews"><span className="eyebrow">GOOD MOVES START WITH TRUST</span>{review ? <><blockquote aria-live="polite">“{review.quote}”</blockquote><div className="review-controls"><button className="icon-button" aria-label="Previous review" onClick={()=>setIndex((index+reviews.length-1)%reviews.length)}><ChevronLeft size={16}/></button><span>{review.name} · {index+1} / {reviews.length}</span><button className="icon-button" aria-label="Next review" onClick={()=>setIndex((index+1)%reviews.length)}><ChevronRight size={16}/></button></div></> : <><h2 style={{fontSize:32}}>Your story belongs here.</h2><p className="review-placeholder">Client reviews will appear here once approved testimonials are added.</p></>}</section>;
}
