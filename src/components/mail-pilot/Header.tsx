import { LogOut, Mailbox, User } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type HeaderProps = {
    onLogout: () => void;
    userEmail?: string | null;
}

export default function Header({ onLogout, userEmail }: HeaderProps) {
  const getInitials = (email?: string | null) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };
    
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg shadow-md mr-3">
              <Mailbox className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary">
              Mail Pilot
            </h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="#" alt="Avatar" />
                    <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
                    <span className="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Utilisateur Anonyme
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail || 'Non connecté'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
