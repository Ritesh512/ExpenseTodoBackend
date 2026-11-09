const weekdayNumbers = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const getDateParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
};

const formatDate = ({ year, month, day }) =>
  `${year}-${month}-${day}`;

export const getTodoPeriodKey = (frequency, date, timeZone = "UTC") => {
  if (frequency === "once") return "once";

  const parts = getDateParts(date, timeZone);
  const dateKey = formatDate(parts);

  if (frequency === "daily") return dateKey;
  if (frequency === "monthly") return `${parts.year}-${parts.month}`;
  if (frequency === "yearly") return parts.year;
  if (frequency === "weekly") {
    const sunday = new Date(`${dateKey}T00:00:00.000Z`);
    sunday.setUTCDate(sunday.getUTCDate() - weekdayNumbers[parts.weekday]);
    return sunday.toISOString().slice(0, 10);
  }

  return "once";
};

export const isTodoTaskComplete = (task, list, date = new Date()) => {
  if (!list.frequency || list.frequency === "once") return Boolean(task.completed);

  return task.completionPeriod === getTodoPeriodKey(
    list.frequency,
    date,
    list.timeZone || "UTC",
  );
};

export const getDueReminder = (list, date = new Date()) => {
  if (!list.reminderEnabled || !list.reminderTime) return null;

  const parts = getDateParts(date, list.timeZone || "UTC");

  const localTime = `${parts.hour}:${parts.minute}`;
  if (localTime < list.reminderTime) return null;

  const localDate = formatDate(parts);
  let reminderKey;
  if (list.frequency === "daily") {
    reminderKey = localDate;
  } else if (list.frequency === "weekly") {
    if (parts.weekday !== "Sun") return null;
    reminderKey = localDate;
  } else if (list.frequency === "monthly") {
    if (parts.weekday !== "Sun") return null;
    reminderKey = localDate;
  } else if (list.frequency === "yearly") {
    if (parts.day !== "01") return null;
    reminderKey = `${parts.year}-${parts.month}`;
  } else if (list.frequency === "once") {
    if (formatDate(getDateParts(list.createdAt, list.timeZone || "UTC")) !== localDate) {
      return null;
    }
    reminderKey = "once";
  } else {
    return null;
  }

  return { reminderKey };
};
