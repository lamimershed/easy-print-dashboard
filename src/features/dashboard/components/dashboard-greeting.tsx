interface DashboardGreetingProps {
  companyName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function DashboardGreeting({ companyName }: DashboardGreetingProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-foreground">
        {getGreeting()}, {companyName}
      </h2>
      <p className="font-medium text-muted-foreground">
        Here's what's happening at your floor today.
      </p>
    </section>
  );
}
