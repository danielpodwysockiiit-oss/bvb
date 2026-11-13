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
// Tabellen: Gesamt offiziell von der API, Heim/Auswärts aus den Spielergebnissen berechnet
app.get('/api/tables/:c', async (q, s) => {
  try {
    const c = q.params.c === 'CL' ? 'CL' : 'BL1';
    const [st, ms] = await Promise.all([
      api(`/competitions/${c}/standings`, 60),
      api(`/competitions/${c}/matches?status=FINISHED`, 60)]);
    const total = st.standings.find(x => x.type === 'TOTAL') || st.standings[0];
    const teams = {};
    total.table.forEach(r => (teams[r.team.id] = r.team));
    const build = side => {
      const t = {};
      Object.values(teams).forEach(tm => (t[tm.id] = { team: tm, playedGames: 0, won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }));
      for (const m of ms.matches) {
        if (c === 'CL' && m.stage !== 'LEAGUE_STAGE') continue;
        const h = m.score.fullTime.home, a = m.score.fullTime.away;
        if (h == null || a == null) continue;
        for (const [tm, gf, ga, own] of [[m.homeTeam, h, a, 'HOME'], [m.awayTeam, a, h, 'AWAY']]) {
          if (side !== own || !t[tm.id]) continue;
          const r = t[tm.id];
          r.playedGames++; r.goalsFor += gf; r.goalsAgainst += ga; r.goalDifference += gf - ga;
          if (gf > ga) { r.won++; r.points += 3; } else if (gf === ga) { r.draw++; r.points++; } else r.lost++;
        }
      }
      return Object.values(t)
        .sort((x, y) => y.points - x.points || y.goalDifference - x.goalDifference || y.goalsFor - x.goalsFor || (x.team.name || '').localeCompare(y.team.name || ''))
        .map((r, i) => ({ ...r, position: i + 1 }));
    };
    s.json({ standings: [{ type: 'TOTAL', table: total.table }, { type: 'HOME', table: build('HOME') }, { type: 'AWAY', table: build('AWAY') }] });
  } catch (e) { s.status(500).json({ error: e.message }); }
});
route('/api/matches', () => '/teams/4/matches', 30);
route('/api/match/:id', q => '/matches/' + String(q.params.id).replace(/\D/g, ''), 15);
app.get('/health', (q, s) => s.send('ok'));
app.use(express.static('public'));
app.listen(process.env.PORT || 3000);
