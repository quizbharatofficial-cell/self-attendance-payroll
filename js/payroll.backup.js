const $ = id => document.getElementById(id);

let loadedEmployee = null;
let loadedMonth = "";
let loadedSummary = null;
let editingPayrollId = "";

function loadEmployees() {
  $("employeeId").innerHTML =
    '<option value="">Select Employee</option>';

  HRMS.get("employees")
    .filter(e => !e.status || e.status === "Active")
    .forEach(e => {
      const option = document.createElement("option");
      option.value = e.id;
      option.textContent = `${e.code} - ${e.name}`;
      $("employeeId").appendChild(option);
    });
}

function getSettings() {
  return HRMS.getObject("salarySettings");
}

function getRules(settings) {
  return {
    P: val(settings.payableP, 1),
    A: val(settings.payableA, 0),
    HD: val(settings.payableHD, 0.5),
    EL: val(settings.payableEL, 1),
    CL: val(settings.payableCL, 1),
    SL: val(settings.payableSL, 1),
    WO: val(settings.payableWO, 1),
    HOLIDAY: val(settings.payableHoliday, 1)
  };
}

function val(value, fallback = 0) {
  if (value === "" ||
      value === undefined ||
      value === null) {
    return fallback;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildSummary(employeeId, month) {
  const settings = getSettings();
  const rules = getRules(settings);

  const records = HRMS.get("attendance")
    .filter(a =>
      a.employeeId === employeeId &&
      a.date &&
      a.date.startsWith(month)
    );

  const count = {
    P: 0,
    A: 0,
    HD: 0,
    EL: 0,
    CL: 0,
    SL: 0,
    WO: 0,
    HOLIDAY: 0
  };

  let work = 0;
  let ot = 0;

  records.forEach(a => {
    const status =
      String(a.status || "").toUpperCase();

    if (
      Object.prototype.hasOwnProperty.call(
        count,
        status
      )
    ) {
      count[status]++;
    }

    work += Math.max(
      0,
      Number(a.workingHours) || 0
    );

    ot += Math.max(
      0,
      Number(a.otHours) || 0
    );
  });

  const payable =
    count.P * rules.P +
    count.A * rules.A +
    count.HD * rules.HD +
    count.EL * rules.EL +
    count.CL * rules.CL +
    count.SL * rules.SL +
    count.WO * rules.WO +
    count.HOLIDAY * rules.HOLIDAY;

  return {
    counts: count,
    payableDays: round2(payable),
    workingHours: round2(work),
    otHours: round2(ot)
  };
}

function validateSettings(settings) {
  const divisor = Number(settings.salaryDivisor);
  const shift =
    Number(settings.payrollShiftHours);
  const multiplier =
    Number(settings.otMultiplier);

  if (!divisor || divisor <= 0) {
    notify(
      "Configure Salary Divisor in Settings.",
      "error"
    );
    return false;
  }

  if (!shift || shift <= 0) {
    notify(
      "Configure Payroll Shift Hours in Settings.",
      "error"
    );
    return false;
  }

  if (
    !Number.isFinite(multiplier) ||
    multiplier < 0
  ) {
    notify(
      "Configure OT Multiplier in Settings.",
      "error"
    );
    return false;
  }

  return true;
}

$("loadPayroll").addEventListener(
  "click",
  loadPayroll
);

function loadPayroll() {
  const employeeId = $("employeeId").value;
  const month = $("payrollMonth").value;

  if (!employeeId || !month) {
    notify(
      "Select Employee and Month.",
      "error"
    );
    return;
  }

  const employee =
    HRMS.get("employees")
      .find(e => e.id === employeeId);

  if (!employee) {
    notify("Employee not found.", "error");
    return;
  }

  const settings = getSettings();

  if (!validateSettings(settings)) return;

  loadedEmployee = employee;
  loadedMonth = month;
  loadedSummary =
    buildSummary(employeeId, month);

  $("basic").value =
    money(employee.basic);

  $("hra").value =
    money(employee.hra);

  $("gross").value =
    money(
      Number(employee.basic || 0) +
      Number(employee.hra || 0)
    );

  $("payableDays").value =
    loadedSummary.payableDays;

  $("workingHours").value =
    loadedSummary.workingHours;

  $("otHours").value =
    loadedSummary.otHours;

  $("salaryDivisor").value =
    settings.salaryDivisor;

  $("shiftHours").value =
    settings.payrollShiftHours;

  $("otMultiplier").value =
    settings.otMultiplier;

  $("attendanceAward").value =
    Number(settings.attendanceAward) || 0;

  calculatePayroll();

  notify(
    "Salary and attendance loaded.",
    "success"
  );
}

function calculatePayroll() {
  if (!loadedEmployee || !loadedSummary) {
    notify(
      "Load Employee + Month first.",
      "error"
    );
    return null;
  }

  const settings = getSettings();

  if (!validateSettings(settings)) return null;

  const basic =
    Number(loadedEmployee.basic) || 0;

  const hra =
    Number(loadedEmployee.hra) || 0;

  const gross = basic + hra;

  const divisor =
    Number(settings.salaryDivisor);

  const shiftHours =
    Number(settings.payrollShiftHours);

  const multiplier =
    Number(settings.otMultiplier);

  const payable =
    Number(loadedSummary.payableDays) || 0;

  const otHours =
    Math.max(
      0,
      Number(loadedSummary.otHours) || 0
    );

  const earnedBasic =
    basic / divisor * payable;

  const earnedHRA =
    hra / divisor * payable;

  const otRate =
    gross /
    divisor /
    shiftHours *
    multiplier;

  const otAmount =
    otRate * otHours;

  const attendanceAward =
    positive($("attendanceAward").value);

  const bonus =
    positive($("bonus").value);

  const incentive =
    positive($("incentive").value);

  const arrear =
    positive($("arrear").value);

  const otherEarning =
    positive($("otherEarning").value);

  const totalEarnings =
    earnedBasic +
    earnedHRA +
    otAmount +
    attendanceAward +
    bonus +
    incentive +
    arrear +
    otherEarning;

  const pfRate =
    positive(settings.pfRate) / 100;

  const esiRate =
    positive(settings.esiRate) / 100;

  const pfAmount =
    earnedBasic * pfRate;

  const esiAmount =
    totalEarnings * esiRate;

  const lwfAmount =
    positive(settings.lwfAmount);

  let canteenAmount = 0;

  if (settings.canteenRule === "Fixed") {
    canteenAmount =
      positive(settings.canteenAmount);
  }

  if (settings.canteenRule === "PerDay") {
    canteenAmount =
      positive(settings.canteenAmount) *
      payable;
  }

  const advance =
    positive($("advance").value);

  const loan =
    positive($("loan").value);

  const fine =
    positive($("fine").value);

  const otherDeduction =
    positive($("otherDeduction").value);

  const totalDeduction =
    pfAmount +
    esiAmount +
    lwfAmount +
    canteenAmount +
    advance +
    loan +
    fine +
    otherDeduction;

  let netSalary =
    totalEarnings - totalDeduction;

  netSalary =
    applyRounding(
      netSalary,
      settings.roundingRule
    );

  const result = {
    earnedBasic: round2(earnedBasic),
    earnedHRA: round2(earnedHRA),
    otRate: round2(otRate),
    otAmount: round2(otAmount),

    attendanceAward,
    bonus,
    incentive,
    arrear,
    otherEarning,

    totalEarnings:
      round2(totalEarnings),

    pfAmount:
      round2(pfAmount),

    esiAmount:
      round2(esiAmount),

    lwfAmount:
      round2(lwfAmount),

    canteenAmount:
      round2(canteenAmount),

    advance,
    loan,
    fine,
    otherDeduction,

    totalDeduction:
      round2(totalDeduction),

    netSalary:
      round2(netSalary)
  };

  showResult(result);

  return result;
}

$("calculatePayroll").addEventListener(
  "click",
  calculatePayroll
);

function showResult(r) {
  $("earnedBasic").value =
    money(r.earnedBasic);

  $("earnedHRA").value =
    money(r.earnedHRA);

  $("otRate").value =
    money(r.otRate);

  $("otAmount").value =
    money(r.otAmount);

  $("pfAmount").value =
    money(r.pfAmount);

  $("esiAmount").value =
    money(r.esiAmount);

  $("lwfAmount").value =
    money(r.lwfAmount);

  $("canteenAmount").value =
    money(r.canteenAmount);

  $("totalEarnings").value =
    money(r.totalEarnings);

  $("totalDeduction").value =
    money(r.totalDeduction);

  $("netSalary").value =
    money(r.netSalary);
}

[
  "attendanceAward",
  "bonus",
  "incentive",
  "arrear",
  "otherEarning",
  "advance",
  "loan",
  "fine",
  "otherDeduction"
].forEach(id => {
  $(id).addEventListener("input", () => {
    if (loadedEmployee) {
      calculatePayroll();
    }
  });
});

$("savePayroll").addEventListener(
  "click",
  savePayroll
);

function savePayroll() {
  const result = calculatePayroll();

  if (!result) return;

  const payroll = HRMS.get("payroll");

  const duplicate =
    payroll.find(item =>
      item.employeeId === loadedEmployee.id &&
      item.month === loadedMonth &&
      item.id !== editingPayrollId
    );

  if (duplicate) {
    notify(
      "Payroll already exists for this Employee + Month.",
      "error"
    );
    return;
  }

  const settings = getSettings();

  const record = {
    id:
      editingPayrollId ||
      HRMS.generateId("PAY"),

    employeeId:
      loadedEmployee.id,

    month:
      loadedMonth,

    employeeCode:
      loadedEmployee.code,

    employeeName:
      loadedEmployee.name,

    basic:
      Number(loadedEmployee.basic) || 0,

    hra:
      Number(loadedEmployee.hra) || 0,

    gross:
      (Number(loadedEmployee.basic) || 0) +
      (Number(loadedEmployee.hra) || 0),

    payableDays:
      loadedSummary.payableDays,

    workingHours:
      loadedSummary.workingHours,

    otHours:
      loadedSummary.otHours,

    attendanceSummary:
      loadedSummary.counts,

    salaryDivisor:
      Number(settings.salaryDivisor),

    shiftHours:
      Number(settings.payrollShiftHours),

    otMultiplier:
      Number(settings.otMultiplier),

    pfRate:
      positive(settings.pfRate),

    esiRate:
      positive(settings.esiRate),

    roundingRule:
      settings.roundingRule || "None",

    ...result,

    status: "Generated",

    updatedAt:
      new Date().toISOString()
  };

  payroll.push(record);

  HRMS.set("payroll", payroll);

  notify(
    "Payroll generated successfully.",
    "success"
  );
}

$("clearPayroll").addEventListener(
  "click",
  clearPayroll
);

function clearPayroll() {
  loadedEmployee = null;
  loadedMonth = "";
  loadedSummary = null;
  editingPayrollId = "";

  $("employeeId").value = "";
  $("payrollMonth").value = "";

  [
    "basic",
    "hra",
    "gross",
    "payableDays",
    "workingHours",
    "otHours",
    "salaryDivisor",
    "shiftHours",
    "otMultiplier",
    "earnedBasic",
    "earnedHRA",
    "otRate",
    "otAmount",
    "attendanceAward",
    "bonus",
    "incentive",
    "arrear",
    "otherEarning",
    "totalEarnings",
    "pfAmount",
    "esiAmount",
    "lwfAmount",
    "canteenAmount",
    "advance",
    "loan",
    "fine",
    "otherDeduction",
    "totalDeduction",
    "netSalary"
  ].forEach(id => {
    $(id).value = "";
  });
}

function positive(value) {
  return Math.max(
    0,
    Number(value) || 0
  );
}

function applyRounding(value, rule) {
  if (rule === "Nearest1") {
    return Math.round(value);
  }

  if (rule === "Nearest10") {
    return Math.round(value / 10) * 10;
  }

  return value;
}

function round2(value) {
  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
}

function money(value) {
  return Number(value || 0)
    .toFixed(2);
}

function notify(message, type) {
  const toast = $("toast");

  toast.textContent = message;
  toast.className =
    `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

loadEmployees();
EOFcat > js/payroll.js <<'EOF'
const $ = id => document.getElementById(id);

let loadedEmployee = null;
let loadedMonth = "";
let loadedSummary = null;
let editingPayrollId = "";

function loadEmployees() {
  $("employeeId").innerHTML =
    '<option value="">Select Employee</option>';

  HRMS.get("employees")
    .filter(e => !e.status || e.status === "Active")
    .forEach(e => {
      const option = document.createElement("option");
      option.value = e.id;
      option.textContent = `${e.code} - ${e.name}`;
      $("employeeId").appendChild(option);
    });
}

function getSettings() {
  return HRMS.getObject("salarySettings");
}

function getRules(settings) {
  return {
    P: val(settings.payableP, 1),
    A: val(settings.payableA, 0),
    HD: val(settings.payableHD, 0.5),
    EL: val(settings.payableEL, 1),
    CL: val(settings.payableCL, 1),
    SL: val(settings.payableSL, 1),
    WO: val(settings.payableWO, 1),
    HOLIDAY: val(settings.payableHoliday, 1)
  };
}

function val(value, fallback = 0) {
  if (value === "" ||
      value === undefined ||
      value === null) {
    return fallback;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildSummary(employeeId, month) {
  const settings = getSettings();
  const rules = getRules(settings);

  const records = HRMS.get("attendance")
    .filter(a =>
      a.employeeId === employeeId &&
      a.date &&
      a.date.startsWith(month)
    );

  const count = {
    P: 0,
    A: 0,
    HD: 0,
    EL: 0,
    CL: 0,
    SL: 0,
    WO: 0,
    HOLIDAY: 0
  };

  let work = 0;
  let ot = 0;

  records.forEach(a => {
    const status =
      String(a.status || "").toUpperCase();

    if (
      Object.prototype.hasOwnProperty.call(
        count,
        status
      )
    ) {
      count[status]++;
    }

    work += Math.max(
      0,
      Number(a.workingHours) || 0
    );

    ot += Math.max(
      0,
      Number(a.otHours) || 0
    );
  });

  const payable =
    count.P * rules.P +
    count.A * rules.A +
    count.HD * rules.HD +
    count.EL * rules.EL +
    count.CL * rules.CL +
    count.SL * rules.SL +
    count.WO * rules.WO +
    count.HOLIDAY * rules.HOLIDAY;

  return {
    counts: count,
    payableDays: round2(payable),
    workingHours: round2(work),
    otHours: round2(ot)
  };
}

function validateSettings(settings) {
  const divisor = Number(settings.salaryDivisor);
  const shift =
    Number(settings.payrollShiftHours);
  const multiplier =
    Number(settings.otMultiplier);

  if (!divisor || divisor <= 0) {
    notify(
      "Configure Salary Divisor in Settings.",
      "error"
    );
    return false;
  }

  if (!shift || shift <= 0) {
    notify(
      "Configure Payroll Shift Hours in Settings.",
      "error"
    );
    return false;
  }

  if (
    !Number.isFinite(multiplier) ||
    multiplier < 0
  ) {
    notify(
      "Configure OT Multiplier in Settings.",
      "error"
    );
    return false;
  }

  return true;
}

$("loadPayroll").addEventListener(
  "click",
  loadPayroll
);

function loadPayroll() {
  const employeeId = $("employeeId").value;
  const month = $("payrollMonth").value;

  if (!employeeId || !month) {
    notify(
      "Select Employee and Month.",
      "error"
    );
    return;
  }

  const employee =
    HRMS.get("employees")
      .find(e => e.id === employeeId);

  if (!employee) {
    notify("Employee not found.", "error");
    return;
  }

  const settings = getSettings();

  if (!validateSettings(settings)) return;

  loadedEmployee = employee;
  loadedMonth = month;
  loadedSummary =
    buildSummary(employeeId, month);

  $("basic").value =
    money(employee.basic);

  $("hra").value =
    money(employee.hra);

  $("gross").value =
    money(
      Number(employee.basic || 0) +
      Number(employee.hra || 0)
    );

  $("payableDays").value =
    loadedSummary.payableDays;

  $("workingHours").value =
    loadedSummary.workingHours;

  $("otHours").value =
    loadedSummary.otHours;

  $("salaryDivisor").value =
    settings.salaryDivisor;

  $("shiftHours").value =
    settings.payrollShiftHours;

  $("otMultiplier").value =
    settings.otMultiplier;

  $("attendanceAward").value =
    Number(settings.attendanceAward) || 0;

  calculatePayroll();

  notify(
    "Salary and attendance loaded.",
    "success"
  );
}

function calculatePayroll() {
  if (!loadedEmployee || !loadedSummary) {
    notify(
      "Load Employee + Month first.",
      "error"
    );
    return null;
  }

  const settings = getSettings();

  if (!validateSettings(settings)) return null;

  const basic =
    Number(loadedEmployee.basic) || 0;

  const hra =
    Number(loadedEmployee.hra) || 0;

  const gross = basic + hra;

  const divisor =
    Number(settings.salaryDivisor);

  const shiftHours =
    Number(settings.payrollShiftHours);

  const multiplier =
    Number(settings.otMultiplier);

  const payable =
    Number(loadedSummary.payableDays) || 0;

  const otHours =
    Math.max(
      0,
      Number(loadedSummary.otHours) || 0
    );

  const earnedBasic =
    basic / divisor * payable;

  const earnedHRA =
    hra / divisor * payable;

  const otRate =
    gross /
    divisor /
    shiftHours *
    multiplier;

  const otAmount =
    otRate * otHours;

  const attendanceAward =
    positive($("attendanceAward").value);

  const bonus =
    positive($("bonus").value);

  const incentive =
    positive($("incentive").value);

  const arrear =
    positive($("arrear").value);

  const otherEarning =
    positive($("otherEarning").value);

  const totalEarnings =
    earnedBasic +
    earnedHRA +
    otAmount +
    attendanceAward +
    bonus +
    incentive +
    arrear +
    otherEarning;

  const pfRate =
    positive(settings.pfRate) / 100;

  const esiRate =
    positive(settings.esiRate) / 100;

  const pfAmount =
    earnedBasic * pfRate;

  const esiAmount =
    totalEarnings * esiRate;

  const lwfAmount =
    positive(settings.lwfAmount);

  let canteenAmount = 0;

  if (settings.canteenRule === "Fixed") {
    canteenAmount =
      positive(settings.canteenAmount);
  }

  if (settings.canteenRule === "PerDay") {
    canteenAmount =
      positive(settings.canteenAmount) *
      payable;
  }

  const advance =
    positive($("advance").value);

  const loan =
    positive($("loan").value);

  const fine =
    positive($("fine").value);

  const otherDeduction =
    positive($("otherDeduction").value);

  const totalDeduction =
    pfAmount +
    esiAmount +
    lwfAmount +
    canteenAmount +
    advance +
    loan +
    fine +
    otherDeduction;

  let netSalary =
    totalEarnings - totalDeduction;

  netSalary =
    applyRounding(
      netSalary,
      settings.roundingRule
    );

  const result = {
    earnedBasic: round2(earnedBasic),
    earnedHRA: round2(earnedHRA),
    otRate: round2(otRate),
    otAmount: round2(otAmount),

    attendanceAward,
    bonus,
    incentive,
    arrear,
    otherEarning,

    totalEarnings:
      round2(totalEarnings),

    pfAmount:
      round2(pfAmount),

    esiAmount:
      round2(esiAmount),

    lwfAmount:
      round2(lwfAmount),

    canteenAmount:
      round2(canteenAmount),

    advance,
    loan,
    fine,
    otherDeduction,

    totalDeduction:
      round2(totalDeduction),

    netSalary:
      round2(netSalary)
  };

  showResult(result);

  return result;
}

$("calculatePayroll").addEventListener(
  "click",
  calculatePayroll
);

function showResult(r) {
  $("earnedBasic").value =
    money(r.earnedBasic);

  $("earnedHRA").value =
    money(r.earnedHRA);

  $("otRate").value =
    money(r.otRate);

  $("otAmount").value =
    money(r.otAmount);

  $("pfAmount").value =
    money(r.pfAmount);

  $("esiAmount").value =
    money(r.esiAmount);

  $("lwfAmount").value =
    money(r.lwfAmount);

  $("canteenAmount").value =
    money(r.canteenAmount);

  $("totalEarnings").value =
    money(r.totalEarnings);

  $("totalDeduction").value =
    money(r.totalDeduction);

  $("netSalary").value =
    money(r.netSalary);
}

[
  "attendanceAward",
  "bonus",
  "incentive",
  "arrear",
  "otherEarning",
  "advance",
  "loan",
  "fine",
  "otherDeduction"
].forEach(id => {
  $(id).addEventListener("input", () => {
    if (loadedEmployee) {
      calculatePayroll();
    }
  });
});

$("savePayroll").addEventListener(
  "click",
  savePayroll
);

function savePayroll() {
  const result = calculatePayroll();

  if (!result) return;

  const payroll = HRMS.get("payroll");

  const duplicate =
    payroll.find(item =>
      item.employeeId === loadedEmployee.id &&
      item.month === loadedMonth &&
      item.id !== editingPayrollId
    );

  if (duplicate) {
    notify(
      "Payroll already exists for this Employee + Month.",
      "error"
    );
    return;
  }

  const settings = getSettings();

  const record = {
    id:
      editingPayrollId ||
      HRMS.generateId("PAY"),

    employeeId:
      loadedEmployee.id,

    month:
      loadedMonth,

    employeeCode:
      loadedEmployee.code,

    employeeName:
      loadedEmployee.name,

    basic:
      Number(loadedEmployee.basic) || 0,

    hra:
      Number(loadedEmployee.hra) || 0,

    gross:
      (Number(loadedEmployee.basic) || 0) +
      (Number(loadedEmployee.hra) || 0),

    payableDays:
      loadedSummary.payableDays,

    workingHours:
      loadedSummary.workingHours,

    otHours:
      loadedSummary.otHours,

    attendanceSummary:
      loadedSummary.counts,

    salaryDivisor:
      Number(settings.salaryDivisor),

    shiftHours:
      Number(settings.payrollShiftHours),

    otMultiplier:
      Number(settings.otMultiplier),

    pfRate:
      positive(settings.pfRate),

    esiRate:
      positive(settings.esiRate),

    roundingRule:
      settings.roundingRule || "None",

    ...result,

    status: "Generated",

    updatedAt:
      new Date().toISOString()
  };

  payroll.push(record);

  HRMS.set("payroll", payroll);

  notify(
    "Payroll generated successfully.",
    "success"
  );
}

$("clearPayroll").addEventListener(
  "click",
  clearPayroll
);

function clearPayroll() {
  loadedEmployee = null;
  loadedMonth = "";
  loadedSummary = null;
  editingPayrollId = "";

  $("employeeId").value = "";
  $("payrollMonth").value = "";

  [
    "basic",
    "hra",
    "gross",
    "payableDays",
    "workingHours",
    "otHours",
    "salaryDivisor",
    "shiftHours",
    "otMultiplier",
    "earnedBasic",
    "earnedHRA",
    "otRate",
    "otAmount",
    "attendanceAward",
    "bonus",
    "incentive",
    "arrear",
    "otherEarning",
    "totalEarnings",
    "pfAmount",
    "esiAmount",
    "lwfAmount",
    "canteenAmount",
    "advance",
    "loan",
    "fine",
    "otherDeduction",
    "totalDeduction",
    "netSalary"
  ].forEach(id => {
    $(id).value = "";
  });
}

function positive(value) {
  return Math.max(
    0,
    Number(value) || 0
  );
}

function applyRounding(value, rule) {
  if (rule === "Nearest1") {
    return Math.round(value);
  }

  if (rule === "Nearest10") {
    return Math.round(value / 10) * 10;
  }

  return value;
}

function round2(value) {
  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
}

function money(value) {
  return Number(value || 0)
    .toFixed(2);
}

function notify(message, type) {
  const toast = $("toast");

  toast.textContent = message;
  toast.className =
    `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

loadEmployees();
