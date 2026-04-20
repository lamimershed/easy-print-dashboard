export type Id = number | string | null;

export type TPopupState<T> =
  | { type: 'close'; id?: Id; data?: T }
  | { type: 'add'; id?: Id; data?: T }
  | { type: 'edit'; id: Id; data: T };

export type Sort = 'order:desc' | 'order:asc' | '' | undefined;

export type IsActive = 'true' | 'false' | '';
