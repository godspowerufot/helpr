'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import { useAuth } from '@msflib/react-auth';
import { ROUTES } from '@/constant/routes.constant';
import { accountInitials, accountName } from '@/utils/account.utils';
import { NotificationsMenu } from './NotificationsMenu';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { me, status, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const name = me ? accountName(me) : 'Account';

  const handleSignOut = () => {
    setAnchorEl(null);
    logout({ onSettled: () => router.push(ROUTES.login) });
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-stroke-light bg-glass/42 px-4 backdrop-blur-[18px] lg:px-8">
      <div className="lg:invisible">
        <IconButton
          onClick={onMenuClick}
          aria-label="Open navigation"
          sx={{ width: 44, height: 44 }}
        >
          <MenuIcon aria-hidden="true" />
        </IconButton>
      </div>

      {status === 'authenticated' ? (
        <div className="flex items-center gap-2">
          <NotificationsMenu />

          <button
            type="button"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl)}
            aria-label={`Account menu for ${name}`}
            className="flex min-h-11 items-center gap-2 rounded-standard px-2 text-text transition-colors duration-150 hover:bg-background-light"
          >
            <span
              aria-hidden="true"
              className="f1-m flex size-8 items-center justify-center rounded-full bg-primary-light text-text"
            >
              {accountInitials(name)}
            </span>
            <span className="b2-m hidden max-w-40 truncate sm:block">
              {name}
            </span>
            <KeyboardArrowDown fontSize="small" aria-hidden="true" />
          </button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleSignOut} sx={{ minHeight: 44 }}>
              Sign Out
            </MenuItem>
          </Menu>
        </div>
      ) : null}
    </header>
  );
}
