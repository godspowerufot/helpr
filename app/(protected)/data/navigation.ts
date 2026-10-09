import { ElementType } from 'react';
import AddBusinessOutlined from '@mui/icons-material/AddBusinessOutlined';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import ListAltOutlined from '@mui/icons-material/ListAltOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { ROUTES } from '@/constant/routes.constant';

export interface NavLink {
  id: string;
  label: string;
  href: string;
  icon: ElementType;
  exact?: boolean;
}

export const customerLinks: NavLink[] = [
  {
    id: 'find',
    label: 'Find Help',
    href: ROUTES.services,
    icon: SearchOutlined,
  },
  {
    id: 'bookings',
    label: 'My Bookings',
    href: ROUTES.bookings.list,
    icon: EventNoteOutlined,
  },
];

export const providerLinks: NavLink[] = [
  {
    id: 'provider',
    label: 'Dashboard',
    href: ROUTES.provider.dashboard,
    icon: SpaceDashboardOutlined,
    exact: true,
  },
  {
    id: 'provider-bookings',
    label: 'Incoming Bookings',
    href: ROUTES.provider.bookings,
    icon: InboxOutlined,
  },
  {
    id: 'provider-listings',
    label: 'My Services',
    href: ROUTES.provider.listings,
    icon: ListAltOutlined,
  },
  {
    id: 'provider-availability',
    label: 'Availability',
    href: ROUTES.provider.availability,
    icon: EventBusyOutlined,
  },
  {
    id: 'provider-profile',
    label: 'Business Profile',
    href: ROUTES.provider.profile,
    icon: StorefrontOutlined,
  },
];

export const onboardLink: NavLink = {
  id: 'onboard',
  label: 'Become a Provider',
  href: ROUTES.provider.onboard,
  icon: AddBusinessOutlined,
};
