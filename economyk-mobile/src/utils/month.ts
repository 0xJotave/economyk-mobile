const formatDate = (date: Date) => {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;
  const currentMonthFormated = String(currentMonth).padStart(2, "0");
  return currentYear + "-" + currentMonthFormated;
};

export const getCurrentMonth = () => {
  const currentDate = new Date();
  const currentDateFormated = formatDate(currentDate);
  return currentDateFormated;
};

type MonthStep = 1 | -1;

export const changeMonth = (currentMonth: string, delta: MonthStep) => {
  const [year, month] = currentMonth.split("-").map(Number);
  const newMonth = new Date(year, month - 1 + delta, 1);
  const newMonthFormated = formatDate(newMonth);
  return newMonthFormated;
};
