import { NextRequest, NextResponse } from 'next/server'
 
export async function POST(req: NextRequest){
    const body = await req.json();
    console.log("Config Select : ", body);
    return NextResponse.json({ status: "ok" });
}