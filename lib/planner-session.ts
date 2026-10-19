import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

function secret() { const key=process.env.JWT_SECRET; if(!key) throw new Error("JWT_SECRET is required"); return key; }
export function signUser(username:string) {
  const payload=Buffer.from(JSON.stringify({sub:username,exp:Date.now()+7*86400000})).toString("base64url");
  const sig=createHmac("sha256",secret()).update(payload).digest("base64url");
  return payload+"."+sig;
}
export function verifyUser(token?:string):string|null {
  if(!token) return null;
  try {
    const [payload,sig]=token.split(".");
    if(!payload||!sig) return null;
    const expected=createHmac("sha256",secret()).update(payload).digest();
    const received=Buffer.from(sig,"base64url");
    if(expected.length!==received.length||!timingSafeEqual(expected,received)) return null;
    const parsed=JSON.parse(Buffer.from(payload,"base64url").toString());
    return typeof parsed.sub==="string" && parsed.exp>Date.now()?parsed.sub:null;
  } catch { return null; }
}
export async function currentUser() { return verifyUser((await cookies()).get("iweb_session")?.value); }
