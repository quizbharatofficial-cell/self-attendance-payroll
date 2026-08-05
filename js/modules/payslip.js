document.addEventListener("DOMContentLoaded", () => {

  const PAYROLL_KEY = "self_hrms_payroll";
  const EMPLOYEE_KEY = "self_hrms_employees";
  const BRANCH_KEY = "self_hrms_branches";
  const DEPARTMENT_KEY = "self_hrms_departments";
  const DESIGNATION_KEY = "self_hrms_designations";

  const $ = id => document.getElementById(id);

  const salaryMonth = $("salaryMonth");
  const employee = $("employee");
  const viewBtn = $("viewBtn");
  const printBtn = $("printBtn");
  const message = $("message");

  const emptySlip = $("emptySlip");
  const slipContent = $("slipContent");


  function getData(key) {
    try {
      return JSON.parse(
        localStorage.getItem(key)
      ) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function getEmployees() {

    let employees =
      getData(EMPLOYEE_KEY);

    /*
      Compatibility with older Employee Master.
    */
    if (!employees.length) {
      employees = getData("employees");
    }

    return employees;
  }


  function setText(id, value) {

    const element = $(id);

    if (element) {
      element.textContent =
        value ?? "-";
    }
  }


  function number(value) {

    return Number(value) || 0;
  }


  function money(value) {

    return number(value)
      .toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );
  }


  function getMasterName(key, id) {

    if (!id) {
      return "-";
    }

    const item =
      getData(key).find(
        record =>
          String(record.id) ===
          String(id)
      );

    if (!item) {
      return "-";
    }

    return (
      item.name ||
      item.branchName ||
      item.departmentName ||
      item.designationName ||
      item.code ||
      "-"
    );
  }


  function getEmployee(id) {

    return getEmployees().find(
      item =>
        String(item.id) ===
        String(id)
    );

  }


  function loadEmployees(selected = "") {

    employee.innerHTML =
      '<option value="">Select Employee</option>';

    getEmployees()
      .filter(item =>
        item.status !== "Inactive"
      )
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value =
          item.id;

        const code =
          item.code ||
          item.employeeCode ||
          "";

        const name =
          item.name ||
          item.employeeName ||
          "Employee";

        option.textContent =
          code
            ? `${code} - ${name}`
            : name;

        employee.appendChild(option);

      });

    employee.value = selected;

  }


  function setCurrentMonth() {

    const now =
      new Date();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    salaryMonth.value =
      `${now.getFullYear()}-${month}`;

  }


  function formatMonth(value) {

    if (!value) {
      return "-";
    }

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


  function formatDate(value) {

    if (!value) {
      return "-";
    }

    const parts =
      value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    return (
      `${parts[2]}-${parts[1]}-${parts[0]}`
    );

  }


  function hideSlip() {

    emptySlip.style.display =
      "";

    slipContent.style.display =
      "none";

    printBtn.disabled =
      true;

  }


  function showSlip() {

    emptySlip.style.display =
      "none";

    slipContent.style.display =
      "";

    printBtn.disabled =
      false;

  }


  function findPayroll() {

    if (!salaryMonth.value) {

      message.textContent =
        "Please select Salary Month.";

      return null;
    }


    if (!employee.value) {

      message.textContent =
        "Please select Employee.";

      return null;
    }


    const payroll =
      getData(PAYROLL_KEY).find(
        item =>

          item.month ===
            salaryMonth.value

          &&

          String(item.employee) ===
            String(employee.value)

      );


    if (!payroll) {

      message.textContent =
        "No saved payroll found for this employee and month.";

      hideSlip();

      return null;
    }


    return payroll;

  }


  function renderPayslip() {

    const payroll =
      findPayroll();

    if (!payroll) {
      return;
    }


    const emp =
      getEmployee(
        payroll.employee
      );


    if (!emp) {

      message.textContent =
        "Employee record not found.";

      hideSlip();

      return;
    }


    const employeeCode =
      emp.code ||
      emp.employeeCode ||
      "-";

    const employeeName =
      emp.name ||
      emp.employeeName ||
      "-";


    setText(
      "slipMonth",
      formatMonth(payroll.month)
    );


    setText(
      "slipEmployeeCode",
      employeeCode
    );

    setText(
      "slipEmployeeName",
      employeeName
    );


    setText(
      "slipDesignation",
      getMasterName(
        DESIGNATION_KEY,
        emp.designation
      )
    );


    setText(
      "slipDepartment",
      getMasterName(
        DEPARTMENT_KEY,
        emp.department
      )
    );


    setText(
      "slipBranch",
      getMasterName(
        BRANCH_KEY,
        emp.branch
      )
    );


    setText(
      "slipJoiningDate",
      formatDate(
        emp.joiningDate
      )
    );


    setText(
      "slipUan",
      emp.uan || "-"
    );


    setText(
      "slipEsi",
      emp.esiNumber || "-"
    );


    setText(
      "slipBank",
      emp.bankName || "-"
    );


    setText(
      "slipAccount",
      emp.accountNumber || "-"
    );


    /*
      Attendance Summary
    */

    setText(
      "slipPresent",
      number(payroll.presentDays)
    );

    setText(
      "slipHalfDay",
      number(payroll.halfDays)
    );

    setText(
      "slipPaidLeave",
      number(payroll.paidLeave)
    );

    setText(
      "slipUnpaidLeave",
      number(payroll.unpaidLeave)
    );

    setText(
      "slipWO",
      number(payroll.weeklyOff)
    );

    setText(
      "slipHoliday",
      number(payroll.holidayDays)
    );

    setText(
      "slipPaidDays",
      number(payroll.payableDays ?? payroll.paidDays)
    );

    setText(
      "slipOTHours",
      number(payroll.otHours)
    );


    /*
      Earnings
    */

    setText(
      "slipAttendanceSalary",
      money(
        number(payroll.earnedBasic) +
        number(payroll.earnedHra)
      )
    );


    setText(
      "slipOTAmount",
      money(
        payroll.otAmount
      )
    );


    setText(
      "slipBonus",
      money(
        payroll.bonus
      )
    );


    setText(
      "slipOtherEarnings",
      money(
        payroll.otherEarnings
      )
    );


    setText(
      "slipGross",
      money(
        payroll.totalEarnings
      )
    );


    /*
      Deductions
    */

    setText(
      "slipPF",
      money(
        payroll.pfDeduction
      )
    );


    setText(
      "slipESI",
      money(
        payroll.esiDeduction
      )
    );


    setText(
      "slipAdvance",
      money(
        payroll.advanceDeduction
      )
    );


    setText(
      "slipOtherDeduction",
      money(
        payroll.otherDeduction
      )
    );


    setText(
      "slipTotalDeduction",
      money(
        payroll.totalDeduction
      )
    );


    /*
      Net Salary
    */

    setText(
      "slipNetSalary",
      money(
        payroll.netSalary
      )
    );


    setText(
      "slipStatus",
      payroll.status || "Draft"
    );


    setText(
      "slipRemarks",
      payroll.remarks || "-"
    );


    message.textContent =
      "Salary Slip loaded successfully.";

    showSlip();

  }


  viewBtn.addEventListener(
    "click",
    renderPayslip
  );


  printBtn.addEventListener(
    "click",
    () => {

      if (
        printBtn.disabled
      ) {
        return;
      }

      /*
        Android/Chrome Print dialog can
        save the salary slip as PDF.
      */
      window.print();

    }
  );


  salaryMonth.addEventListener(
    "change",
    hideSlip
  );


  employee.addEventListener(
    "change",
    hideSlip
  );


  loadEmployees();
  setCurrentMonth();
  hideSlip();

});
