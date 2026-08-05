document.addEventListener("DOMContentLoaded", () => {

  const COMPONENT_KEY = "self_hrms_salary_components";
  const EMPLOYEE_KEY = "self_hrms_employees";

  const TYPES = [
    ["pf", "PF"],
    ["esi", "ESI"],
    ["lwf", "LWF"],
    ["canteen", "CANTEEN"],
    ["advance", "ADVANCE"],
    ["loan", "LOAN"],
    ["fine", "FINE"],
    ["other", "OTHER"]
  ];

  const $ = id => document.getElementById(id);
  const num = v => Number(v) || 0;
  const round = v => Math.round((num(v) + Number.EPSILON) * 100) / 100;

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function employee() {
    const id = $("employee")?.value;
    return read(EMPLOYEE_KEY).find(x => String(x.id) === String(id));
  }

  function findRule(code) {
    return read(COMPONENT_KEY).find(x =>
      String(x.componentType).toLowerCase() === "deduction" &&
      String(x.status || "Active").toLowerCase() === "active" &&
      (
        String(x.code || "").trim().toUpperCase() === code ||
        String(x.name || "").trim().toUpperCase() === code
      )
    );
  }

  function applicable(code) {
    const emp = employee();

    if (!emp) return false;

    if (code === "PF") {
      return String(emp.pfApplicable || "No").toLowerCase() === "yes";
    }

    if (code === "ESI") {
      return String(emp.esiApplicable || "No").toLowerCase() === "yes";
    }

    return true;
  }

  function baseAmount(rule) {

    if (rule.basedOn === "Basic") {
      return num($("earnedBasic")?.value);
    }

    if (rule.basedOn === "Gross") {
      return num($("totalEarnings")?.value);
    }

    return 0;
  }

  function autoAmount(rule) {

    if (!rule) return 0;

    if (rule.calculationType === "Percentage") {
      return round(
        baseAmount(rule) *
        num(rule.percentage) / 100
      );
    }

    if (rule.calculationType === "Fixed") {
      return round(rule.defaultAmount);
    }

    return 0;
  }

  function ruleText(rule, code) {

    if (!rule) {
      return `No ${code} rule configured in Salary Component Master`;
    }

    if (rule.calculationType === "Percentage") {
      return `${rule.percentage || 0}% of ${rule.basedOn || "-"}`;
    }

    if (rule.calculationType === "Fixed") {
      return `Fixed ₹${round(rule.defaultAmount)}`;
    }

    return "Manual component";
  }

  function processOne(prefix, code) {

    const mode = $(`${prefix}Mode`);
    const amount = $(`${prefix}Deduction`);
    const info = $(`${prefix}Rule`);

    if (!mode || !amount) return;

    const rule = findRule(code);

    if (info) {
      info.textContent = ruleText(rule, code);
    }

    if (mode.value === "Off") {
      amount.value = 0;
      amount.readOnly = true;
      return;
    }

    if (mode.value === "Manual") {
      amount.readOnly = false;
      return;
    }

    amount.readOnly = true;

    if (!applicable(code)) {
      amount.value = 0;

      if (info && (code === "PF" || code === "ESI")) {
        info.textContent =
          `${code} not applicable for selected employee`;
      }

      return;
    }

    amount.value = autoAmount(rule);
  }

  function update() {

    TYPES.forEach(([prefix, code]) =>
      processOne(prefix, code)
    );

    /*
      Existing payroll.js already calculates
      Total Deduction and Net Salary from these fields.
      Trigger input so it recalculates after Auto values change.
    */
    const pf = $("pfDeduction");

    if (pf) {
      pf.dispatchEvent(
        new Event("input", { bubbles: true })
      );
    }
  }

  TYPES.forEach(([prefix]) => {

    const mode = $(`${prefix}Mode`);
    const amount = $(`${prefix}Deduction`);

    if (mode) {
      mode.addEventListener("change", update);
    }

    if (amount) {
      amount.addEventListener("input", () => {
        if ($(`${prefix}Mode`)?.value === "Manual") {
          setTimeout(update, 0);
        }
      });
    }

  });

  [
    "employee",
    "payrollMonth",
    "salaryDivisor",
    "payableDays",
    "basicSalary",
    "hra",
    "shiftHours",
    "otHours",
    "otMultiplier",
    "award",
    "bonus",
    "incentive",
    "arrear",
    "otherEarnings"
  ].forEach(id => {

    const element = $(id);

    if (element) {
      element.addEventListener(
        id === "employee" || id === "payrollMonth"
          ? "change"
          : "input",
        () => setTimeout(update, 0)
      );
    }

  });

  $("calculateBtn")?.addEventListener(
    "click",
    () => setTimeout(update, 0)
  );

  setTimeout(update, 100);

});
