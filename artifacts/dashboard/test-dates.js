const today = new Date();
const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

const formatDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

console.log({
  start: formatDate(prevMonthStart),
  end: formatDate(prevMonthEnd),
  monthName: prevMonthStart.toLocaleString('en-US', { month: 'long' })
});
