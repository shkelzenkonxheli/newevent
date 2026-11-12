import QRCode from "qrcode";
import { verifiedOrganizer } from "../../../../server/auth";
import { getDb } from "../../../../server/db";

export async function GET(request: Request, {params}: {params:Promise<{id:string}>}) {
  const user = await verifiedOrganizer();
  if (!user) return new Response(null,{status:404});
  const {id} = await params;
  const event = await getDb().event.findFirst({where:{id,ownerId:user.id},select:{publicToken:true}});
  if (!event) return new Response(null,{status:404});
  const url = new URL("/e/"+event.publicToken,process.env.BETTER_AUTH_URL);
  const png = await QRCode.toBuffer(url.href,{width:480,errorCorrectionLevel:"M"});
  const download = new URL(request.url).searchParams.has("download");
  return new Response(new Uint8Array(png),{headers:{
    "Content-Type":"image/png","Cache-Control":"private, no-store",
    "Content-Disposition":download?'attachment; filename="newevent-qr.png"':"inline",
  }});
}
