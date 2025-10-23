export function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Agents</h3>
          <p className="text-3xl font-bold text-foreground">0</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">MCPs</h3>
          <p className="text-3xl font-bold text-foreground">0</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Automations</h3>
          <p className="text-3xl font-bold text-foreground">0</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Tools</h3>
          <p className="text-3xl font-bold text-foreground">0</p>
        </div>
      </div>
    </div>
  )
}
