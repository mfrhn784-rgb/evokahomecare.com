import { NextRequest } from "next/server";
import { GET as authGET, POST as authPOST, DELETE as authDELETE } from "../auth/route";

export async function GET(req: NextRequest) {
  return authGET(req);
}

export async function POST(req: NextRequest) {
  return authPOST(req);
}

export async function DELETE(req: NextRequest) {
  return authDELETE();
}
