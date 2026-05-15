export const StatsCard = ({ label, value, sub }) => (
  <div className="border border-border p-6">
    <p className="text-xs tracking-widest uppercase text-muted-foreground font-light">{label}</p>
    <p className="mt-2 font-serif text-4xl font-light">{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
);
