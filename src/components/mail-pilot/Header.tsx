
'use client';

import { LogOut, User } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUser } from '@/firebase';

type HeaderProps = {
    onLogout?: () => void;
}

const NsConseilLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="#1E2A47"/>
        <g transform="translate(0 -2)">
            <path d="M16 4L26 16L16 28L6 16L16 4Z" stroke="#E6A23C" strokeWidth="2"/>
            <text x="16" y="18.5" textAnchor="middle" dy=".3em" fontSize="11" fontWeight="bold" fill="#E5E7EB">NS</text>
        </g>
    </svg>
)

export default function Header({ onLogout }: HeaderProps) {
  const { user } = useUser();

  const getInitials = (email?: string | null, name?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return '?';
  };
    
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm" style={{borderColor: 'hsl(var(--border))'}}>
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
            <div className="mr-3">
              <NsConseilLogo />
            </div>
            <h1 className="text-2xl font-bold" style={{color: 'hsl(var(--primary))'}}>
              NS CONSEIL
            </h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
           {user && onLogout && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || "#"} alt="Avatar" />
                    <AvatarFallback>{getInitials(user.email, user.displayName)}</AvatarFallback>
                    <span className="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || (user.isAnonymous ? 'Utilisateur Anonyme' : 'Utilisateur')}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || 'Non connecté'}
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
           )}
        </div>
      </div>
    </header>
  );
}
