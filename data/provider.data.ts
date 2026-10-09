export type MockProvider = {
  id: number;
  slug: string;
  workspace_slug: string;
  display_name: string;
  bio: string;
  service_area: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
};

// The signed-in account owns this provider in mock mode.
export const MOCK_MY_PROVIDER_SLUG = 'sparkle-home';

export const MOCK_PROVIDERS: MockProvider[] = [
  {
    id: 1,
    slug: 'sparkle-home',
    workspace_slug: 'sparkle-home',
    display_name: 'Sparkle Home Services',
    bio: 'A four-person team doing deep cleans, move-out cleans and weekly upkeep across Eket since 2019. We bring our own supplies.',
    service_area: 'Grace Bill Road, Eket Town, Afaha Eket',
    phone: '+2348031234501',
    latitude: 4.6478,
    longitude: 7.9268,
  },
  {
    id: 2,
    slug: 'tunde-plumbing',
    workspace_slug: 'tunde-plumbing',
    display_name: 'Tunde Fixes Plumbing',
    bio: 'Licensed plumber. Leaks, blocked drains, water heaters and bathroom fittings. Same-day call-outs anywhere in Eket.',
    service_area: 'Marina Road, Eket Town, Idua',
    phone: '+2348031234502',
    latitude: 4.6392,
    longitude: 7.9318,
  },
  {
    id: 3,
    slug: 'brightwire-electric',
    workspace_slug: 'brightwire-electric',
    display_name: 'Brightwire Electrical',
    bio: 'Wiring, inverter installs, fault finding and prepaid meter setup. Safety-first, with written quotes before work starts.',
    service_area: 'Eket-Oron Road, Ikot Udota, Esit Eket',
    phone: '+2348031234503',
    latitude: 4.6262,
    longitude: 7.9455,
  },
  {
    id: 4,
    slug: 'kemi-braids',
    workspace_slug: 'kemi-braids',
    display_name: 'Kemi Braids & Beauty',
    bio: 'Home-service braids, cornrows, wig installs and makeup for events. Products included on request.',
    service_area: 'Atabong Road, Eket Town, Okon',
    phone: '+2348031234504',
    latitude: 4.6531,
    longitude: 7.9171,
  },
  {
    id: 5,
    slug: 'swiftmove-eket',
    workspace_slug: 'swiftmove-eket',
    display_name: 'SwiftMove Eket',
    bio: 'Two vans and a careful crew for apartment moves, office relocations and single-item deliveries around Eket and Esit Eket.',
    service_area: 'All of Eket',
    phone: '+2348031234505',
    latitude: 4.6602,
    longitude: 7.9378,
  },
  {
    id: 6,
    slug: 'mr-okafor-maths',
    workspace_slug: 'mr-okafor-maths',
    display_name: 'Mr Okafor Maths Tutoring',
    bio: 'WAEC, JAMB and IGCSE maths and further maths. Twelve years teaching; lessons at your home or online.',
    service_area: 'Idua Road, Eket Town, Online',
    phone: '+2348031234506',
    latitude: 4.6335,
    longitude: 7.911,
  },
  {
    id: 7,
    slug: 'chef-ima-kitchen',
    workspace_slug: 'chef-ima-kitchen',
    display_name: 'Chef Ima’s Kitchen',
    bio: 'Private chef for family dinners, small parties and weekly meal prep. Efik and Ibibio classics, continental on request. I shop, cook and clean up.',
    service_area: 'Eket Town, Afaha Eket, Ikot Ibiok',
    phone: '+2348031234507',
    latitude: 4.6449,
    longitude: 7.9201,
  },
  {
    id: 8,
    slug: 'mama-grace-homecare',
    workspace_slug: 'mama-grace-homecare',
    display_name: 'Mama Grace Home Care',
    bio: 'Trusted domestic help for busy homes: daily chores, cooking basics, errands and after-school minding. Vetted, references available.',
    service_area: 'Atabong Road, Eket Town, Okon',
    phone: '+2348031234508',
    latitude: 4.651,
    longitude: 7.9235,
  },
  {
    id: 9,
    slug: 'fresh-fold-laundry',
    workspace_slug: 'fresh-fold-laundry',
    display_name: 'Fresh Fold Laundry',
    bio: 'Pickup laundry, washing, ironing and folding. Delicates hand-washed. Back in 48 hours.',
    service_area: 'Marina Road, Eket Town, Idua',
    phone: '+2348031234509',
    latitude: 4.6365,
    longitude: 7.9262,
  },
  {
    id: 10,
    slug: 'okon-woodworks',
    workspace_slug: 'okon-woodworks',
    display_name: 'Okon Woodworks',
    bio: 'Carpenter for doors, wardrobes, kitchen cabinets and furniture repairs. Measured quotes; I bring my own tools.',
    service_area: 'Eket-Oron Road, Ikot Udota, Esit Eket',
    phone: '+2348031234510',
    latitude: 4.629,
    longitude: 7.942,
  },
  {
    id: 11,
    slug: 'colour-pro-painting',
    workspace_slug: 'colour-pro-painting',
    display_name: 'Colour Pro Painting',
    bio: 'Interior and exterior painting with clean edges and covered floors. Paint advice and colour samples free.',
    service_area: 'Idua Road, Eket Town, Afaha Eket',
    phone: '+2348031234511',
    latitude: 4.642,
    longitude: 7.9155,
  },
  {
    id: 12,
    slug: 'cool-breeze-ac',
    workspace_slug: 'cool-breeze-ac',
    display_name: 'Cool Breeze AC Services',
    bio: 'Split-unit AC servicing, gas refill, installation and fault repair. Same-week visits across Eket.',
    service_area: 'Grace Bill Road, Eket Town, Idua',
    phone: '+2348031234512',
    latitude: 4.647,
    longitude: 7.93,
  },
];
