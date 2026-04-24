export function generateMonthDays(year, month) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const days = [];
  
  // 1. Get the padding days from the previous month
  // If first day is Wednesday (3), we need 3 days from Tuesday, Monday, Sunday
  const startPadding = firstDayOfMonth.getDay(); 
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startPadding);

  // 2. Fill 42 cells (standard 6-week grid)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }

  return days;
}