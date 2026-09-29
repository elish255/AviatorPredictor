import { json, supabaseUpdate, type VercelRequest, type VercelResponse } from '../src/lib/server.js';
const sites: Record<string,string> = {'1WINBET':'images/1win.png','SportyBet':'images/sportybet.png','BETWINNER':'images/betwinner.png','PremierBet':'images/premierbet.png','BetPawa':'images/betpawa.png','WasafiBet':'images/wasafibet.png','BetKing':'images/betking.png','1XBet':'images/1xbet.png','Gwalabet':'images/gwalabet.png','Sportsbet':'images/sportsbet.png','Bet365':'images/bet365.png','SportPesa':'images/sportpesa.png'};
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res,{success:false,message:'Invalid request'},405);
  const body=(req.body??{}) as Record<string,unknown>; const id=Number(body.userId??0); const name=String(body.name??'');
  if(!id || !sites[name]) return json(res,{success:false,message:'Betting site haijaruhusiwa.'},400);
  try { const updated=await supabaseUpdate('aviator_users',{id:`eq.${id}`},{last_page:'/loading', betting_site:name, betting_site_image:sites[name]}); if(updated===null)return json(res,{success:false,message:'Imeshindikana kuhifadhi uchaguzi.'},500); return json(res,{success:true,site:name,image:sites[name]}); }
  catch { return json(res,{success:false,message:'Server error.'},500); }
}
