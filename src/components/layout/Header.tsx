export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-primary/80 backdrop-blur-md border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-foreground">
              ArthSaathi
            </h1>
            <span className="w-2 h-2 bg-primary rounded-full" />
          </div>
          <p className="text-sm text-muted hidden sm:block">
            Finance explained in the language of the people
          </p>
        </div>
      </div>
    </header>
  );
}
