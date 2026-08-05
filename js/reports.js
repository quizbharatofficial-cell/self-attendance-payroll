const $ = id => document.getElementById(id);

let reportRows = [];
let reportMode = "";

function loadFilters() {

  const employees = HRMS.get("employees");

  $("reportEmployee").innerHTML =
    '<option value="">All Employees</option>';

  employees.forEach(emp => {

    const option = document.createElement("option");

    option.value = emp.id;

    option.textContent =
      `${emp.code} - ${emp.name}`;

    $("reportEmployee").appendChild(option);
  });

  const departments = [
    ...new Set(
      employees
        .map(emp => emp.department)
        .filter(Boolean)
    )
  ].sort();

  departments.forEach(dept => {

    const option = document.createElement("option");

    option.value = dept;
    option.textContent = dept;

    $("reportDepartment").appendChild(option);
  });
}

$("generateReport").addEventListener(
  "click",
  generateReport
);

function generateReport() {

  reportMode = $("reportType").value;

  const payrollTypes = [
    "payroll",
    "salary",
    "pf",
    "esi",
    "lwf",
    "canteen",
    "advance",
    "salarySummary"
  ];

  if (payrollTypes.includes(reportMode)) {
    buildPayrollReport();
  } else {
    buildAttendanceReport();
  }

  renderReport($("reportSearch").value);
}

function buildAttendanceReport() {

  const employees = HRMS.get("employees");

  const from = $("fromDate").value;
  const to = $("toDate").value;
  const month = $("reportMonth").value;
  const empId = $("reportEmployee").value;
  const department = $("reportDepartment").value;
  const filterStatus = $("reportStatus").value;

  let records = HRMS.get("attendance");

  records = records.filter(item => {

    const emp =
      employees.find(e => e.id === item.employeeId);

    if (!emp) return false;

    if (from && item.date < from) return false;
    if (to && item.date > to) return false;

    if (
      month &&
      !item.date.startsWith(month)
    ) return false;

    if (
      empId &&
      item.employeeId !== empId
    ) return false;

    if (
      department &&
      emp.department !== department
    ) return false;

    const status =
      String(item.status || "").toUpperCase();

    if (
      filterStatus &&
      status !== filterStatus.toUpperCase()
    ) return false;

    if (
      reportMode === "present" &&
      status !== "P"
    ) return false;

    if (
      reportMode === "absent" &&
      status !== "A"
    ) return false;

    if (
      reportMode === "leave" &&
      !["EL","CL","SL"].includes(status)
    ) return false;

    if (
      reportMode === "ot" &&
      Number(item.otHours || 0) <= 0
    ) return false;

    if (
      reportMode === "late" &&
      item.late !== true
    ) return false;

    return true;
  });

  reportRows = records.map(item => {

    const emp =
      employees.find(e => e.id === item.employeeId) || {};

    return {
      date: item.date,
      employee:
        `${emp.code || ""} - ${emp.name || ""}`,
      department: emp.department || "",
      status: item.status || "",
      workingHours:
        Number(item.workingHours) || 0,
      otHours:
        Number(item.otHours) || 0,
      remarks: item.remarks || ""
    };
  });

  $("reportTitle").textContent =
    reportName(reportMode);

  $("reportHead").innerHTML = `
    <tr>
      <th>Date</th>
      <th>Employee</th>
      <th>Department</th>
      <th>Status</th>
      <th>Working Hours</th>
      <th>OT Hours</th>
      <th>Remarks</th>
    </tr>
  `;
}

function buildPayrollReport() {

  const employees = HRMS.get("employees");

  const month = $("reportMonth").value;
  const empId = $("reportEmployee").value;
  const department = $("reportDepartment").value;
  const filterStatus = $("reportStatus").value;

  let records = HRMS.get("payroll");

  records = records.filter(item => {

    const emp =
      employees.find(e => e.id === item.employeeId);

    if (!emp) return false;

    if (
      month &&
      item.month !== month
    ) return false;

    if (
      empId &&
      item.employeeId !== empId
    ) return false;

    if (
      department &&
      emp.department !== department
    ) return false;

    if (
      filterStatus &&
      String(item.status || "").toUpperCase() !==
      filterStatus.toUpperCase()
    ) return false;

    if (
      reportMode === "pf" &&
      Number(item.pfAmount || 0) <= 0
    ) return false;

    if (
      reportMode === "esi" &&
      Number(item.esiAmount || 0) <= 0
    ) return false;

    if (
      reportMode === "lwf" &&
      Number(item.lwfAmount || 0) <= 0
    ) return false;

    if (
      reportMode === "canteen" &&
      Number(item.canteenAmount || 0) <= 0
    ) return false;

    if (
      reportMode === "advance" &&
      Number(item.advance || 0) <= 0
    ) return false;

    return true;
  });

  reportRows = records.map(item => {

    const emp =
      employees.find(e => e.id === item.employeeId) || {};

    return {
      month: item.month,
      employee:
        `${emp.code || item.employeeCode || ""} - ` +
        `${emp.name || item.employeeName || ""}`,
      department: emp.department || "",
      payableDays:
        Number(item.payableDays) || 0,
      otHours:
        Number(item.otHours) || 0,
      pf:
        Number(item.pfAmount) || 0,
      esi:
        Number(item.esiAmount) || 0,
      lwf:
        Number(item.lwfAmount) || 0,
      canteen:
        Number(item.canteenAmount) || 0,
      advance:
        Number(item.advance) || 0,
      earnings:
        Number(item.totalEarnings) || 0,
      deduction:
        Number(item.totalDeduction) || 0,
      net:
        Number(item.netSalary) || 0,
      status: item.status || ""
    };
  });

  $("reportTitle").textContent =
    reportName(reportMode);

  $("reportHead").innerHTML = `
    <tr>
      <th>Month</th>
      <th>Employee</th>
      <th>Department</th>
      <th>Payable</th>
      <th>OT</th>
      <th>PF</th>
      <th>ESI</th>
      <th>LWF</th>
      <th>Canteen</th>
      <th>Advance</th>
      <th>Earnings</th>
      <th>Deduction</th>
      <th>Net Salary</th>
      <th>Status</th>
    </tr>
  `;
}

function renderReport(filter = "") {

  const query =
    filter.trim().toLowerCase();

  const rows =
    reportRows.filter(row =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );

  $("reportBody").innerHTML = "";

  if (!rows.length) {

    $("reportBody").innerHTML = `
      <tr>
        <td colspan="14"
        class="empty-row">
        No report records found.
        </td>
      </tr>
    `;

    updateTotals([]);

    return;
  }

  if (
    [
      "payroll",
      "salary",
      "pf",
      "esi",
      "lwf",
      "canteen",
      "advance",
      "salarySummary"
    ].includes(reportMode)
  ) {

    rows.forEach(row => {

      const tr =
        document.createElement("tr");

      tr.innerHTML = `
        <td>${safe(row.month)}</td>
        <td>${safe(row.employee)}</td>
        <td>${safe(row.department)}</td>
        <td>${num(row.payableDays)}</td>
        <td>${num(row.otHours)}</td>
        <td>₹${money(row.pf)}</td>
        <td>₹${money(row.esi)}</td>
        <td>₹${money(row.lwf)}</td>
        <td>₹${money(row.canteen)}</td>
        <td>₹${money(row.advance)}</td>
        <td>₹${money(row.earnings)}</td>
        <td>₹${money(row.deduction)}</td>
        <td><strong>₹${money(row.net)}</strong></td>
        <td>${safe(row.status)}</td>
      `;

      $("reportBody").appendChild(tr);
    });

  } else {

    rows.forEach(row => {

      const tr =
        document.createElement("tr");

      tr.innerHTML = `
        <td>${safe(row.date)}</td>
        <td>${safe(row.employee)}</td>
        <td>${safe(row.department)}</td>
        <td>${safe(row.status)}</td>
        <td>${num(row.workingHours)}</td>
        <td>${num(row.otHours)}</td>
        <td>${safe(row.remarks)}</td>
      `;

      $("reportBody").appendChild(tr);
    });
  }

  updateTotals(rows);
}

function updateTotals(rows) {

  $("totalRecords").textContent =
    rows.length;

  $("totalPayable").textContent =
    num(
      rows.reduce(
        (sum, row) =>
          sum + Number(row.payableDays || 0),
        0
      )
    );

  $("totalOT").textContent =
    num(
      rows.reduce(
        (sum, row) =>
          sum + Number(row.otHours || 0),
        0
      )
    );

  $("totalEarnings").textContent =
    "₹" + money(
      rows.reduce(
        (sum, row) =>
          sum + Number(row.earnings || 0),
        0
      )
    );

  $("totalNet").textContent =
    "₹" + money(
      rows.reduce(
        (sum, row) =>
          sum + Number(row.net || 0),
        0
      )
    );
}

$("reportSearch").addEventListener(
  "input",
  function() {
    renderReport(this.value);
  }
);

function reportName(type) {

  const names = {
    attendance: "Attendance Report",
    present: "Present Report",
    absent: "Absent Report",
    leave: "Leave Report",
    late: "Late Report",
    ot: "Overtime Report",
    payroll: "Payroll Report",
    salary: "Salary Report",
    pf: "PF Report",
    esi: "ESI Report",
    lwf: "LWF Report",
    canteen: "Canteen Report",
    advance: "Advance Report",
    salarySummary: "Salary Summary"
  };

  return names[type] || "Report";
}

function money(value) {

  return Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
}

function num(value) {

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
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

loadFilters();
generateReport();
