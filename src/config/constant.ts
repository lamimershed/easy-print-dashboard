export const SORT_OPTIONS = [
  { label: 'desc', value: 'order:desc' },
  { label: 'asc', value: 'order:asc' },
];

export const IS_ACTIVE_OPTIONS = [
  { label: 'active', value: 'true' },
  { label: 'inactive', value: 'false' },
];

// Generate avatar URL with initials
export const getAvatar = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4B90C6&color=fff&bold=true`;
};
