import { verifiedOrganizer } from "../../../../server/auth";
import { getDb } from "../../../../server/db";

export async function GET(_request: Request, {params}: {params:Promise<{id:string}>}) {
  const user = await verifiedOrganizer();
  if (!user) return new Response(null,{status:404});
  const {id} = await params;
  const event = await getDb().event.findFirst({where:{id,ownerId:user.id},include:{
    dates:true,ideas:true,invitees:true,audit:true,
    participants:{select:{id:true,name:true,ballot:{include:{dates:true,ideas:true}},rsvp:{select:{attending:true,updatedAt:true}}}},
  }});
  if (!event) return new Response(null,{status:404});
  return Response.json(event,{headers:{"Cache-Control":"private, no-store","Content-Disposition":'attachment; filename="newevent-export.json"'}});
}
