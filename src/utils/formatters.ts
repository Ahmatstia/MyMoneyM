// File: src/utils/formatters.ts
export const getMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Reset waktu ke 00:00:00 dan 23:59:59
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { start: startDate, end: endDate };
};

export const getWeekRange = () => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - now.getDay()); // Hari Minggu
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // Hari Sabtu

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { start: startDate, end: endDate };
};

export const getYearRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1);
  const endDate = new Date(now.getFullYear(), 11, 31);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { start: startDate, end: endDate };
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("id-ID", options);
  } catch (error) {
    console.warn("Format date error:", error);
    return dateString;
  }
};

export const formatDateShort = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hari ini";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    }

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch (error) {
    return dateString;
  }
};
