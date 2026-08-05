const monthField =
  document.getElementById("summaryMonth");

const employeeField =
  document.getElementById("summaryEmployee");

const table =
  document.getElementById("summaryTable");

const search =
  document.getElementById("summarySearch");

let currentSummary = [];

function loadEmployees() {

  const employees = HRMS.get("employees")
    .filter(emp => !emp.status || emp.status === "Active");

  employeeField.innerHTML =
    '<option value="">All Employees</option>';

  employees.forEach(emp => {

    const option = document.createElement("option");

    option.value = emp.id;

    option.textContent =
      `${emp.code} - ${emp.name}`;

    employeeField.appendChild(option);
  });
}

function getDaysInMonth(month) {

  if (!month) return 0;

  const [year, monthNumber] =
    month.split("-").map(Number);

  return new Date(
    year,
    monthNumber,
    0
  ).getDate();
}

function getPayableRules() {

  const settings =
    HRMS.getObject("salarySettings");

  return {
    P: numberOr(settings.payableP, 1),
    A: numberOr(settings.payableA, 0),
    HD: numberOr(settings.payableHD, 0.5),
    EL: numberOr(settings.payableEL, 1),
    CL: numberOr(settings.payableCL, 1),
    SL: numberOr(settings.payableSL, 1),
    WO: numberOr(settings.payableWO, 1),
    HOLIDAY: numberOr(
      settings.payableHoliday,
      1
    )
  };
}

function numberOr(value, fallback) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function calculateEmployeeSummary(employee, month) {

  const attendance = HRMS.get("attendance")
    .filter(item =>
      item.employeeId === employee.id &&
      item.date &&
      item.date.startsWith(month)
    );

  const calendarDays =
    getDaysInMonth(month);

  const counts = {
    P: 0,
    A: 0,
    HD: 0,
    EL: 0,
    CL: 0,
    SL: 0,
    WO: 0,
    HOLIDAY: 0
  };

  let totalWorkingHours = 0;
  let totalOTHours = 0;

  attendance.forEach(item => {

    const status =
      String(item.status || "")
        .trim()
        .toUpperCase();

    if (
      Object.prototype.hasOwnProperty.call(
        counts,
        status
      )
    ) {
      counts[status]++;
    }

    totalWorkingHours +=
      Math.max(
        0,
        Number(item.workingHours) || 0
      );

    totalOTHours +=
      Math.max(
        0,
        Number(item.otHours) || 0
      );
  });

  const rules = getPayableRules();

  const payableDays =
    counts.P * rules.P +
    counts.A * rules.A +
    counts.HD * rules.HD +
    counts.EL * rules.EL +
    counts.CL * rules.CL +
    counts.SL * rules.SL +
    counts.WO * rules.WO +
    counts.HOLIDAY * rules.HOLIDAY;

  /*
    Working Days =
    Calendar Days - recorded Weekly Off
                  - recorded Holidays

    This is an attendance summary value.
    Payroll uses Payable Days separately.
  */

  const workingDays =
    Math.max(
      0,
      calendarDays -
      counts.WO -
      counts.HOLIDAY
    );

  return {
    employeeId: employee.id,
    code: employee.code || "",
    name: employee.name || "",

    month,

    calendarDays,
    workingDays,

    present: counts.P,
    absent: counts.A,
    halfDay: counts.HD,
    el: counts.EL,
    cl: counts.CL,
    sl: counts.SL,
    wo: counts.WO,
    holiday: counts.HOLIDAY,

    payableDays:
      round2(payableDays),

    workingHours:
      round2(totalWorkingHours),

    otHours:
      round2(totalOTHours)
  };
}

function generateSummary() {

  const month = monthField.value;

  if (!month) {
    notify("Please select a month.", "error");
    return;
  }

  let employees =
    HRMS.get("employees")
      .filter(
        emp =>
          !emp.status ||
          emp.status === "Active"
      );

  if (employeeField.value) {

    employees =
      employees.filter(
        emp =>
          emp.id === employeeField.value
      );
  }

  currentSummary =
    employees.map(employee =>
      calculateEmployeeSummary(
        employee,
        month
      )
    );

  renderSummary(search.value);
}

function renderSummary(filter = "") {

  const query =
    filter.trim().toLowerCase();

  const rows =
    currentSummary.filter(item => {

      const text =
        `${item.code} ${item.name}`
          .toLowerCase();

      return text.includes(query);
    });

  table.innerHTML = "";

  if (!rows.length) {

    table.innerHTML = `
      <tr>
        <td colspan="14"
            class="empty-row">
          No summary records found.
        </td>
      </tr>
    `;

    return;
  }

  rows.forEach(item => {

    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td>
        ${safe(item.code)} -
        ${safe(item.name)}
      </td>

      <td>${item.calendarDays}</td>
      <td>${item.workingDays}</td>

      <td>${item.present}</td>
      <td>${item.absent}</td>
      <td>${item.halfDay}</td>

      <td>${item.el}</td>
      <td>${item.cl}</td>
      <td>${item.sl}</td>

      <td>${item.wo}</td>
      <td>${item.holiday}</td>

      <td>
        <strong>
          ${formatNumber(item.payableDays)}
        </strong>
      </td>

      <td>
        ${formatNumber(item.workingHours)}
      </td>

      <td>
        <strong>
          ${formatNumber(item.otHours)}
        </strong>
      </td>
    `;

    table.appendChild(row);
  });
}

function round2(value) {

  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
}

function formatNumber(value) {

  return Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );
}

function safe(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function notify(message, type) {

  const toast =
    document.getElementById("toast");

  toast.textContent = message;

  toast.className =
    `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

document
  .getElementById("generateSummary")
  .addEventListener(
    "click",
    generateSummary
  );

search.addEventListener(
  "input",
  function() {
    renderSummary(this.value);
  }
);

loadEmployees();
