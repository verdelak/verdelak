export interface MenuItem {
  text: string;
  link?: string;
  externalUrl?: string;
  externalSiteKey?: string;
  openInNewTab?: boolean;
  children?: MenuItem[];
  dividerAfter?: boolean;
  roles?: string[];
  description?: string;
  status?: 'Working' | 'Planned' | 'Placeholder' | 'External';
  tags?: string[];
}

export const MAIN_MENU: MenuItem[] = [
  {
    text: 'Home',
    link: '/',
    description: 'Application home dashboard.',
    status: 'Working',
    tags: ['Home']
  },
  {
    text: 'Admin',
    roles: ['Admin'],
    children: [
      { text: 'Bartender' },
      { text: 'Blog', link: '/admin/blog', description: 'Create, edit, publish, and tag blog entries.', status: 'Working', tags: ['Blog', 'Content'] },
      { text: 'Barcode Staging', link: '/barcode-staging', description: 'Stage scanned barcodes and lookup candidate data.', status: 'Working', tags: ['Barcode', 'Inventory'] },
      { text: 'Dino', link: '/admin/dino', description: 'Manage dinosaur taxonomy, discovery notes, sections, and illustrations.', status: 'Working', tags: ['Dino', 'Content'] },
      { text: 'Film review' },
      { text: 'Imports', link: '/admin/imports', description: 'Stage external provider imports from Steam, GOG, BoardGameGeek, and manual CSV rows.', status: 'Working', tags: ['Imports', 'Software', 'Board Games'] },
      { text: 'Resume', link: '/admin/resume', description: 'Edit resume profile, sections, certifications, awards, and projects.', status: 'Working', tags: ['Resume', 'Personal'] },
      { text: 'Settings', link: '/admin/settings', description: 'Manage shared lookup values and settings.', status: 'Working', tags: ['Settings'] },
      { text: 'Users', link: '/admin/users', description: 'Manage user accounts and account types.', status: 'Working', tags: ['Security', 'Users'] }
    ]
  },
  {
    text: 'Inventory',
    children: [
      { text: 'Alcohol', link: '/alcohol', description: 'Browse and manage alcohol inventory from the legacy spreadsheet.', status: 'Working', tags: ['Alcohol', 'Inventory'] },
      {
        text: 'Books',
        children: [
          { text: 'All', link: '/books', description: 'Browse all owned books.', status: 'Working', tags: ['Books'] },
          { text: 'Hardcover', link: '/books/hardcover', description: 'Browse hardcover books.', status: 'Working', tags: ['Books'] },
          { text: 'Softcover', link: '/books/softcover', description: 'Browse softcover books.', status: 'Working', tags: ['Books'] },
          { text: 'Audio Book', link: '/books/audio-book', dividerAfter: true, description: 'Browse audio books.', status: 'Working', tags: ['Books'] },
          { text: 'Want List', link: '/books/want-list', description: 'View wanted books.', status: 'Working', tags: ['Books', 'Want List'] }
        ]
      },
      {
        text: 'Software',
        children: [
          { text: 'All', link: '/software', description: 'Browse and manage software by platform, store/location, media, and owned/wanted status.', status: 'Working', tags: ['Software', 'Inventory'] },
          { text: 'Want List', link: '/software/want-list', description: 'View wanted software with platform and location filters.', status: 'Working', tags: ['Software', 'Want List'] }
        ]
      },
      { text: 'Cards' },
      { text: 'Toys', link: '/toys', description: 'Browse and manage toy figures by company, line, series, boxed status, and have/want status.', status: 'Working', tags: ['Toys', 'Inventory'] },
      {
        text: 'Comics',
        children: [
          { text: 'All', link: '/comics', description: 'Browse comic titles with owned and wanted issues.', status: 'Working', tags: ['Comics', 'Inventory'] },
          { text: 'Want List', link: '/comics/want-list', description: 'View wanted comic titles and issues.', status: 'Working', tags: ['Comics', 'Want List'] }
        ]
      },
      { text: 'Spookytown', link: '/spookytown', description: 'Browse and manage Spookytown collection items.', status: 'Working', tags: ['Spookytown', 'Inventory'] },
      {
        text: 'Music',
        children: [
          { text: 'CDs', link: '/music/cds', description: 'Browse owned CD albums.', status: 'Working', tags: ['Music', 'CDs'] },
          { text: 'Tapes', link: '/music/tapes', description: 'Browse owned tape albums.', status: 'Working', tags: ['Music', 'Tapes'] },
          { text: 'Vinyl', link: '/music/vinyl', description: 'Browse owned vinyl albums.', status: 'Working', tags: ['Music', 'Vinyl'] },
          { text: 'MP3s', link: '/music/mp3s', dividerAfter: true, description: 'Browse owned MP3 albums.', status: 'Working', tags: ['Music', 'MP3s'] },
          { text: 'All', link: '/music/all', description: 'Browse all owned music formats.', status: 'Working', tags: ['Music'] },
          { text: 'Want List', link: '/music/want-list', description: 'View wanted music albums.', status: 'Working', tags: ['Music', 'Want List'] },
          { text: 'Metal Archives Compare', link: '/music/metal-archives', description: 'Compare a metal band discography against owned and wanted albums.', status: 'Working', tags: ['Music', 'Metal Archives', 'Want List'] }
        ]
      },
      {
        text: 'Movies',
        children: [
          {
            text: 'Films',
            children: [
              { text: 'All' },
              { text: 'DVD' },
              { text: 'Dubs' }
            ]
          },
          {
            text: 'Adult',
            children: [
              { text: 'All' },
              { text: 'DVD' },
              { text: 'Dubs' }
            ]
          }
        ]
      },
      { text: 'Magazines', link: '/magazines', description: 'Browse and manage magazine issues, including Heavy Metal and White Dwarf.', status: 'Working', tags: ['Magazines', 'Inventory'] },
      {
        text: 'Gaming',
        children: [
          { text: 'Board Games', link: '/boardgames', description: 'Browse board game collection.', status: 'Working', tags: ['Gaming', 'Board Games'] },
          { text: 'RPGs', link: '/rpg', description: 'Browse owned RPG products, systems, and series.', status: 'Working', tags: ['Gaming', 'RPG'] },
          { text: 'RPG Want List', link: '/rpg/want-list', description: 'View wanted RPG products.', status: 'Working', tags: ['Gaming', 'RPG', 'Want List'] },
          {
            text: 'Warhammer',
            children: [
              { text: 'Full Tilt', link: '/full-tilt', description: 'Track a local Full Tilt jousting match.', status: 'Working', tags: ['Gaming', 'Warhammer'] }
            ]
          },
          {
            text: 'Minis/Dreamblade',
            children: [
              { text: 'All', link: '/minis', description: 'Browse miniature collections including Dreamblade, World of Warcraft, and Bones with have/want status.', status: 'Working', tags: ['Gaming', 'Miniatures', 'Dreamblade'] },
              { text: 'Want List', link: '/minis/want-list', description: 'View zero-owned and explicitly wanted miniatures.', status: 'Working', tags: ['Gaming', 'Miniatures', 'Want List'] }
            ]
          },
          {
            text: 'Magic',
            children: [
              { text: 'All', link: '/mtg', description: 'Browse and manage Magic: The Gathering cards by card identity, printing, set, rarity, color, location, and owned/wanted status.', status: 'Working', tags: ['Gaming', 'Magic', 'Cards'] },
              { text: 'Want List', link: '/mtg/want-list', description: 'View wanted Magic: The Gathering cards with set, rarity, color, type, and location filters.', status: 'Working', tags: ['Gaming', 'Magic', 'Cards', 'Want List'] }
            ]
          },
          { text: 'Pirates' },
          { text: 'Dragon Dice', link: '/dice-games', description: 'Browse and manage Dragon Dice inventory with have/want quantities.', status: 'Working', tags: ['Gaming', 'Dragon Dice', 'Dice'] },
          { text: 'Chessex', link: '/chessex', description: 'Browse and manage Chessex dice sets by category, set type, and have/want status.', status: 'Working', tags: ['Gaming', 'Chessex', 'Dice'] },
          { text: 'Dice games', link: '/dice-games', description: 'Browse and manage D&D Dice Masters and related dice game inventory.', status: 'Working', tags: ['Gaming', 'Dice Games', 'D&D Dice Masters'] }
        ]
      }
    ]
  },
  {
    text: 'Chores',
    children: [
      { text: 'Manage Chores', link: '/chores', roles: ['Admin'], description: 'Create and maintain recurring chores that feed the master schedule.', status: 'Working', tags: ['Chores', 'Tasks'] },
      { text: 'Schedule', link: '/tasks', description: 'Track scheduled tasks and chores.', status: 'Working', tags: ['Chores', 'Tasks'] },
      { text: 'Fish', link: '/fish', roles: ['Admin'], description: 'Manage fish tank setup, locations, and future tanks.', status: 'Working', tags: ['Fish', 'Chores'] },
      { text: 'BackupLogs', link: '/backups', roles: ['Admin'], description: 'Log manual backups and monitor backup freshness.', status: 'Working', tags: ['Backups', 'Chores'] },
      { text: 'Gardening Diary', link: '/gardening', roles: ['Admin'], description: 'Plan seed trays, garden plots, and seasonal notes.', status: 'Working', tags: ['Gardening', 'Chores'] },
      { text: 'Lifting Logs' }
    ]
  },
  {
    text: 'Personal',
    children: [
      { text: 'Pictures' },
      { text: 'Blog', link: '/blog', description: 'Read published personal blog entries.', status: 'Working', tags: ['Blog', 'Personal'] },
      { text: 'Resume', link: '/resume', description: 'View resume, projects, certifications, and awards.', status: 'Working', tags: ['Resume', 'Personal'] },
      {
        text: 'Shows',
        children: [
          { text: 'All', link: '/shows', description: 'Track owned show seasons, wanted seasons, and watch or rewatch planning.', status: 'Working', tags: ['Shows', 'Personal'] },
          { text: 'Want List', link: '/shows/want-list', description: 'Review shows with wanted seasons or missing season detail.', status: 'Working', tags: ['Shows', 'Want List', 'Personal'] }
        ]
      },
      { text: 'Workout logs' },
      { text: 'Guitar', link: '/guitar', description: 'Explore guitar and bass scales, positions, chords, tunings, and practice routines.', status: 'Working', tags: ['Guitar', 'Music', 'Practice'] },
      { text: 'Phone List', link: '/phone-list', description: 'Browse contacts, phone numbers, email addresses, and Xmas card flags.', status: 'Working', tags: ['Contacts', 'Personal'] },
      { text: 'Finance Tracker', link: '/finance-tracker', roles: ['Admin'], description: 'Admin-only personal finance tracking workspace.', status: 'Working', tags: ['Finance', 'Personal'] },
      { text: 'Home Inventory', link: '/home-inventory', description: 'Browse home inventory items and details.', status: 'Working', tags: ['Inventory', 'Home'] },
      {
        text: 'Recipe/Grocery/Canning',
        children: [
          { text: 'Recipes', link: '/recipes', description: 'Browse and manage recipes with ingredients, steps, and food tags.', status: 'Working', tags: ['Recipes', 'Grocery', 'Personal'] },
          { text: 'Shopping List', link: '/shopping-list', description: 'Review needed shopping-list items grouped by category.', status: 'Working', tags: ['Shopping', 'Grocery', 'Personal'] }
        ]
      },
      { text: 'Goals and Plans', link: '/goals-plans', roles: ['Admin'], description: 'Import and inspect annual goals and planning outlines.', status: 'Working', tags: ['Goals', 'Plans'] }
    ]
  },
  {
    text: 'External',
    children: [
      { text: 'Bartender', externalSiteKey: 'bartender', description: 'Open the external Bartender site.', status: 'External', tags: ['External'] },
      { text: 'Dino', externalSiteKey: 'dino', description: 'Open the external Dino content site.', status: 'External', tags: ['External', 'Dino'] },
      { text: 'CD', externalSiteKey: 'cd', description: 'Open the external CD collection site.', status: 'External', tags: ['External', 'CD'] },
      { text: 'Personal', externalSiteKey: 'personal', description: 'Open the external Personal site.', status: 'External', tags: ['External'] },
      { text: 'Film Review', externalSiteKey: 'film-review', description: 'Open the external Film Review site.', status: 'External', tags: ['External', 'Film'] }
    ]
  },
  {
    text: 'Misc',
    children: [
      { text: 'Links', link: '/links', description: 'Browse saved links grouped by topic.', status: 'Working', tags: ['Links'] },
      { text: 'Site Map', link: '/site-map', description: 'Search and browse the application index.', status: 'Working', tags: ['Navigation'] }
    ]
  }
];

