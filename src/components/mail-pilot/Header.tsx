import { Mailbox } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg shadow">
              <Mailbox className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold font-headline text-primary">
              Mail Pilot
            </h1>
          </div>
          <p className="hidden md:block text-muted-foreground">
            Your automated email campaign assistant.
          </p>
        </div>
      </div>
    </header>
  );
}
