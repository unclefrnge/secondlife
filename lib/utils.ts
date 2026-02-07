import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function uniquePush(items: string[], id: string): string[] {
  if (items.includes(id)) {
    return items;
  }
  return [...items, id];
}

export function withAutoplay(url: string): string {
  if (url.includes('autoplay=')) {
    return url;
  }
  return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
