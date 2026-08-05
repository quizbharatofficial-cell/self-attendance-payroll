const $ = id => document.getElementById(id);

let currentPayroll = null;

function loadEmployees() {

  $("employeeId").innerHTML =
    '<option value="">Select Employee</option>';

  HRMS.get("employees").forEach(emp => {

    const option = document.createElement("option");

    option.value = emp.id;

    option.textContent =
      `${emp.code} - ${emp.name}`;

    $("employeeId").appendChild(option);
  });
}

$("loadSlip").addEventListener("click", () => {

  const employeeId =
    $("employeeId").value;

  const month =
    $("salaryMonth").value;

  if (!employeeId || !month) {

    notify(
      "Select Employee and Month.",
      "error"
    );

    return;
  }

  const payroll =
    HRMS.get("payroll").find(item =>
      item.employeeId === employeeId &&
      item.month === month
    );

  if (!payroll) {

    notify(
      "Payroll not generated for this Employee + Month.",
      "error"
    );

    return;
  }

  currentPayroll = payroll;

  renderSlip(payroll);

  notify(
    "Salary slip loaded.",
    "success"
  );
});

function renderSlip(payroll) {

  const employee =
    HRMS.get("employees")
      .find(emp =>
        emp.id === payroll.employeeId
      ) || {};

  const settings =
    HRMS.getObject("salarySettings");

  $("companyName").textContent =
    settings.companyName || "SELF HRMS";

  $("companyAddress").textContent =
    settings.companyAddress || "";

  $("companyContact").textContent =
    settings.companyContact
      ? `Contact: ${settings.companyContact}`
      : "";

  $("companyEmail").textContent =
    settings.companyEmail || "";

  if (settings.companyLogo) {

    $("slipLogo").innerHTML =
      `<img src="${settings.companyLogo}"
      alt="Company Logo">`;

  } else {

    $("slipLogo").innerHTML = "";
  }

  $("slipMonth").textContent =
    formatMonth(payroll.month);

  $("empCode").textContent =
    employee.code || payroll.employeeCode || "";

  $("empName").textContent =
    employee.name || payroll.employeeName || "";

  $("empDepartment").textContent =
    employee.department || "";

  $("empDesignation").textContent =
    employee.designation || "";

  $("empDOJ").textContent =
    employee.doj || "";

  $("empBank").textContent =
    employee.bank || "";

  $("empAccount").textContent =
    employee.accountNo || "";

  $("empIFSC").textContent =
    employee.ifsc || "";

  $("empUAN").textContent =
    employee.uan || "";

  $("empESIC").textContent =
    employee.esic || "";

  const att =
    payroll.attendanceSummary || {};

  $("attP").textContent = att.P || 0;
  $("attA").textContent = att.A || 0;
  $("attHD").textContent = att.HD || 0;
  $("attEL").textContent = att.EL || 0;
  $("attCL").textContent = att.CL || 0;
  $("attSL").textContent = att.SL || 0;
  $("attWO").textContent = att.WO || 0;
  $("attHoliday").textContent =
    att.HOLIDAY || 0;

  $("payableDays").textContent =
    number(payroll.payableDays);

  $("workingHours").textContent =
    number(payroll.workingHours);

  $("otHours").textContent =
    number(payroll.otHours);

  $("rateBasic").textContent =
    money(payroll.basic);

  $("rateHRA").textContent =
    money(payroll.hra);

  $("rateGross").textContent =
    money(payroll.gross);

  $("rateDivisor").textContent =
    number(payroll.salaryDivisor);

  $("rateShift").textContent =
    number(payroll.shiftHours);

  $("rateOT").textContent =
    money(payroll.otRate);

  const moneyFields = [
    "earnedBasic",
    "earnedHRA",
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
  ];

  moneyFields.forEach(id => {

    $(id).textContent =
      money(payroll[id]);
  });
}

$("printSlip").addEventListener(
  "click",
  () => {

    if (!currentPayroll) {

      notify(
        "Load salary slip first.",
        "error"
      );

      return;
    }

    window.print();
  }
);

function formatMonth(value) {

  if (!value) return "";

  const [year, month] =
    value.split("-");

  const date =
    new Date(
      Number(year),
      Number(month) - 1,
      1
    );

  return date.toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric"
    }
  );
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

function number(value) {

  return Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );
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

const autoEmployee =
  sessionStorage.getItem(
    "self_hrms_slip_employee"
  );

const autoMonth =
  sessionStorage.getItem(
    "self_hrms_slip_month"
  );

if (autoEmployee && autoMonth) {

  $("employeeId").value =
    autoEmployee;

  $("salaryMonth").value =
    autoMonth;

  sessionStorage.removeItem(
    "self_hrms_slip_employee"
  );

  sessionStorage.removeItem(
    "self_hrms_slip_month"
  );

  $("loadSlip").click();
}
