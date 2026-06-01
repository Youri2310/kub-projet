import { NextRequest, NextResponse } from 'next/server'
 
export async function POST(req: NextRequest){
    const body = req.json();
    console.log("Config Select : ", body);
    return NextResponse.json;
}