// Contribution counts only. No repository names, so private client work stays private.
export async function contributionYear(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    body: JSON.stringify({
      query: `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
        totalContributions weeks { contributionDays { date weekday contributionCount } } } } } }`,
      variables: { login },
    }),
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json' },
    method: 'POST',
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(`GitHub GraphQL failed: ${JSON.stringify(body.errors ?? body)}`);
  const cal = body.data.user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((week, col) =>
    week.contributionDays.map((d) => ({ col, count: d.contributionCount, date: d.date, row: d.weekday })),
  );
  return { cols: cal.weeks.length, days: withLevels(days), total: cal.totalContributions };
}

// Size by rank among active days. GitHub's own levels scale to the single busiest day, so one
// outlier would leave almost the whole year looking the same.
export function withLevels(days) {
  const counts = days.filter((d) => d.count > 0).map((d) => d.count).sort((a, b) => a - b);
  const cut = (share) => counts[Math.floor(counts.length * share)] ?? 0;
  const [q1, q2, q3] = [0.25, 0.5, 0.75].map(cut);
  const level = (n) => (n === 0 ? 0 : n <= q1 ? 1 : n <= q2 ? 2 : n <= q3 ? 3 : 4);
  return days.map((d) => ({ ...d, level: level(d.count) }));
}
