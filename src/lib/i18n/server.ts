import { cookies } from 'next/headers';
import en from '@/locales/en';
import id from '@/locales/id';
import type { Lang } from './context';

export async function getT() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('ac_lang')?.value as Lang) || 'id';
  return lang === 'en' ? en : id;
}
