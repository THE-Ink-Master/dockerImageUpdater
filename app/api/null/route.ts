import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    return NextResponse.json({ status: 200 });
  } catch (err) {
    return NextResponse.json({ status: 500, err });
  }
}

export async function POST(request: Request) {
  try {
    return NextResponse.json({ status: 200 });
  } catch (err) {
    return NextResponse.json({ status: 500, err });
  }
}

export async function DELETE(request: Request) {
  try {
    return NextResponse.json({ status: 200 });
  } catch (err) {
    return NextResponse.json({ status: 500, err });
  }
}

export async function HEAD(request: Request) {
  try {
    return NextResponse.json({ status: 200 });
  } catch (err) {
    return NextResponse.json({ status: 500, err });
  }
}