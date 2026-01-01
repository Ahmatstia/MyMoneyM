import { format } from "date-fns";
import { id } from "date-fns/locale";

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy", { locale: id });
  } catch (error) {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy HH:mm", { locale: id });
  } catch (error) {
    return dateString;
  }
};

export const getCurrentDate = (): string => {
  return format(new Date(), "yyyy-MM-dd");
};

export const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
};
