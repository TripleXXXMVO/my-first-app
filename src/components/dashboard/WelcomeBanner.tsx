function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface WelcomeBannerProps {
  displayName: string;
}

export function WelcomeBanner({ displayName }: WelcomeBannerProps) {
  const greeting = getGreeting();

  return (
    <div className="rounded-xl border border-[#DAC0FF]/30 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-xl font-bold text-[#222222] sm:text-2xl">
        {greeting}, {displayName}
      </h2>
      <p className="mt-1 font-body text-sm text-[#6b6b6b]">
        Here is an overview of your workspace.
      </p>
    </div>
  );
}
