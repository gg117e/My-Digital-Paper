import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export const formatDateTitle = (dateStr: string): string => {
  const date = parseISO(dateStr);
  return format(date, 'yyyy年 M月 d日 (EEE)', { locale: ja });
};

export const formatMonthYear = (date: Date): string => {
  return format(date, 'yyyy年 M月', { locale: ja });
};

export const getISODate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};