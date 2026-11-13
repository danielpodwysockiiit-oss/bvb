import express from 'express';
const app = express(), KEY = process.env.FOOTBALL_DATA_KEY, B = 'https://api.football-data.org/v4', cache = {};
async function api(p, ttl) {
  const c = cache[p];
  if (c && Date.now() - c.t < ttl * 1000) return c.d;
  const r = await fetch(B + p, { headers: { 'X-Auth-Token': KEY } });
  if (!r.ok) throw new Error('API ' + r.status);
  const d = await r.json(); cache[p] = { t: Date.now(), d }; return d;
}
const route = (path, f, ttl) => app.get(path, async (q, s) => {
  try { s.json(await api(f(q), ttl)); } catch (e) { s.status(500).json({ error: e.message }); }
});
route('/api/tables/:c', q => '/competitions/' + (q.params.c === 'CL' ? 'CL' : 'BL1') + '/standings', 60);
route('/api/matches', () => '/teams/4/matches', 30);
route('/api/match/:id', q => '/matches/' + String(q.params.id).replace(/\D/g, ''), 15);
app.get('/health', (q, s) => s.send('ok'));
app.use(express.static('public'));
app.listen(process.env.PORT || 3000);
