document.addEventListener("DOMContentLoaded", () => {

  const PAYROLL_KEY = "self_hrms_payroll";
  const EMPLOYEE_KEY = "self_hrms_employees";
  const ATTENDANCE_KEY = "self_hrms_attendance";

  const $ = id => document.getElementById(id);

  const form = $("payrollForm");
  const recordId = $("recordId");
  const payrollMonth = $("payrollMonth");
  const employee = $("employee");
  const salaryDivisor = $("salaryDivisor");
  const payableDays = $("payableDays");

  const basicSalary = $("basicSalary");
  const hra = $("hra");
  const monthlyGross = $("monthlyGross");

  const presentDays = $("presentDays");
  const absentDays = $("absentDays");
  const halfDays = $("halfDays");
  const paidLeave = $("paidLeave");
  const unpaidLeave = $("unpaidLeave");
  const weeklyOff = $("weeklyOff");
  const holidayDays = $("holidayDays");

  const shiftHours = $("shiftHours");
  const otHours = $("otHours");
  const otMultiplier = $("otMultiplier");
  const otRate = $("otRate");
  const otAmount = $("otAmount");

  const earnedBasic = $("earnedBasic");
  const earnedHra = $("earnedHra");

  const award = $("award");
  const bonus = $("bonus");
  const incentive = $("incentive");
  const arrear = $("arrear");
  const otherEarnings = $("otherEarnings");
  const totalEarnings = $("totalEarnings");

  const pfDeduction = $("pfDeduction");
  const esiDeduction = $("esiDeduction");
  const lwfDeduction = $("lwfDeduction");
  const canteenDeduction = $("canteenDeduction");
  const advanceDeduction = $("advanceDeduction");
  const loanDeduction = $("loanDeduction");
  const fineDeduction = $("fineDeduction");
  const otherDeduction = $("otherDeduction");
  const totalDeduction = $("totalDeduction");

  const netSalary = $("netSalary");
  const payrollStatus = $("payrollStatus");
  const remarks = $("remarks");

  const calculateBtn = $("calculateBtn");
  const saveBtn = $("saveBtn");
  const cancelBtn = $("cancelBtn");
  const search = $("payrollSearch");
  const table = $("payrollTable");
  const message = $("message");


  function getData(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function savePayroll(data) {
    localStorage.setItem(
      PAYROLL_KEY,
      JSON.stringify(data)
    );
  }


  function getEmployees() {
    let data = getData(EMPLOYEE_KEY);

    if (!data.length) {
      data = getData("employees");
    }

    return data;
  }


  function num(value) {
    return Number(value) || 0;
  }


  function round(value) {
    return Math.round(
      (num(value) + Number.EPSILON) * 100
    ) / 100;
  }


  function uid() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2)
    );
  }


  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function getEmployee(id) {
    return getEmployees().find(
      item => String(item.id) === String(id)
    );
  }


  function getEmployeeName(id) {
    const item = getEmployee(id);

    if (!item) return "-";

    return `${item.code || ""} - ${item.name || ""}`;
  }


  function loadEmployees(selected = "") {

    employee.innerHTML =
      '<option value="">Select Employee</option>';

    getEmployees()
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value = item.id;

        option.textContent =
          `${item.code || ""} - ${item.name || ""}`;

        employee.appendChild(option);
      });

    employee.value = selected;
  }


  function setCurrentMonth() {

    const now = new Date();

    payrollMonth.value =
      `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
  }


  function attendanceSummary() {

    const summary = {
      P: 0,
      A: 0,
      HD: 0,
      PL: 0,
      UL: 0,
      WO: 0,
      H: 0
    };

    if (
      !payrollMonth.value ||
      !employee.value
    ) {
      return summary;
    }

    getData(ATTENDANCE_KEY)
      .filter(item =>
        String(item.employee) ===
          String(employee.value) &&
        String(item.date || "")
          .startsWith(payrollMonth.value)
      )
      .forEach(item => {

        if (
          Object.prototype.hasOwnProperty.call(
            summary,
            item.status
          )
        ) {
          summary[item.status]++;
        }

      });

    return summary;
  }


  function loadAttendance() {

    const summary =
      attendanceSummary();

    presentDays.value = summary.P;
    absentDays.value = summary.A;
    halfDays.value = summary.HD;
    paidLeave.value = summary.PL;
    unpaidLeave.value = summary.UL;
    weeklyOff.value = summary.WO;
    holidayDays.value = summary.H;

    /*
      Attendance suggests payable days only.

      OT is intentionally NOT imported
      from attendance.
    */
    payableDays.value = round(
      summary.P +
      (summary.HD * 0.5) +
      summary.PL +
      summary.WO +
      summary.H
    );
  }


  function loadEmployeeSalary() {

    const emp =
      getEmployee(employee.value);

    /*
      Existing Employee Master currently
      stores Monthly Salary as one value.

      For now it is loaded as Basic.
      HRA remains configurable manually.

      Later Salary Structure Master can
      supply Basic/HRA separately.
    */
    basicSalary.value =
      emp ? num(emp.monthlySalary) : 0;

    hra.value = 0;

    loadAttendance();
    calculatePayroll(false);
  }


  function validate() {

    if (!payrollMonth.value) {
      return "Payroll Month is required.";
    }

    if (!employee.value) {
      return "Please select Employee.";
    }

    if (num(salaryDivisor.value) <= 0) {
      return "Salary Divisor must be greater than 0.";
    }

    if (num(shiftHours.value) <= 0) {
      return "Shift Hours must be greater than 0.";
    }

    if (num(payableDays.value) < 0) {
      return "Payable Days cannot be negative.";
    }

    if (num(otHours.value) < 0) {
      return "OT Hours cannot be negative.";
    }

    if (num(otMultiplier.value) < 0) {
      return "OT Multiplier cannot be negative.";
    }

    return "";
  }


  function calculatePayroll(showMessage = true) {

    const divisor =
      num(salaryDivisor.value);

    const shift =
      num(shiftHours.value);

    if (divisor <= 0 || shift <= 0) {

      monthlyGross.value =
        round(
          num(basicSalary.value) +
          num(hra.value)
        );

      earnedBasic.value = 0;
      earnedHra.value = 0;
      otRate.value = 0;
      otAmount.value = 0;
      totalEarnings.value = 0;
      totalDeduction.value = 0;
      netSalary.value = 0;

      return false;
    }


    const basic =
      num(basicSalary.value);

    const hraAmount =
      num(hra.value);

    const gross =
      basic + hraAmount;

    const days =
      num(payableDays.value);

    const multiplier =
      num(otMultiplier.value);

    const manualOTHours =
      num(otHours.value);


    monthlyGross.value =
      round(gross);


    /*
      Earned Basic =
      Basic / Salary Divisor × Payable Days

      Earned HRA =
      HRA / Salary Divisor × Payable Days
    */

    const calculatedEarnedBasic =
      (basic / divisor) * days;

    const calculatedEarnedHra =
      (hraAmount / divisor) * days;


    earnedBasic.value =
      round(calculatedEarnedBasic);

    earnedHra.value =
      round(calculatedEarnedHra);


    /*
      OT Rate =
      Gross / Salary Divisor / Shift Hours
      × OT Multiplier
    */

    const calculatedOtRate =
      (gross / divisor / shift) *
      multiplier;

    const calculatedOtAmount =
      calculatedOtRate *
      manualOTHours;


    otRate.value =
      round(calculatedOtRate);

    otAmount.value =
      round(calculatedOtAmount);


    const earnings =
      calculatedEarnedBasic +
      calculatedEarnedHra +
      calculatedOtAmount +
      num(award.value) +
      num(bonus.value) +
      num(incentive.value) +
      num(arrear.value) +
      num(otherEarnings.value);


    totalEarnings.value =
      round(earnings);


    const deductions =
      num(pfDeduction.value) +
      num(esiDeduction.value) +
      num(lwfDeduction.value) +
      num(canteenDeduction.value) +
      num(advanceDeduction.value) +
      num(loanDeduction.value) +
      num(fineDeduction.value) +
      num(otherDeduction.value);


    totalDeduction.value =
      round(deductions);


    netSalary.value =
      round(earnings - deductions);


    if (showMessage) {
      message.textContent =
        "Payroll calculated successfully.";
    }

    return true;
  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    setCurrentMonth();

    salaryDivisor.value = "26";
    payableDays.value = "0";

    basicSalary.value = "0";
    hra.value = "0";
    monthlyGross.value = "0";

    presentDays.value = "0";
    absentDays.value = "0";
    halfDays.value = "0";
    paidLeave.value = "0";
    unpaidLeave.value = "0";
    weeklyOff.value = "0";
    holidayDays.value = "0";

    shiftHours.value = "";
    otHours.value = "0";
    otMultiplier.value = "1";
    otRate.value = "0";
    otAmount.value = "0";

    earnedBasic.value = "0";
    earnedHra.value = "0";

    award.value = "0";
    bonus.value = "0";
    incentive.value = "0";
    arrear.value = "0";
    otherEarnings.value = "0";
    totalEarnings.value = "0";

    pfDeduction.value = "0";
    esiDeduction.value = "0";
    lwfDeduction.value = "0";
    canteenDeduction.value = "0";
    advanceDeduction.value = "0";
    loanDeduction.value = "0";
    fineDeduction.value = "0";
    otherDeduction.value = "0";

    totalDeduction.value = "0";
    netSalary.value = "0";

    payrollStatus.value = "Draft";

    saveBtn.textContent =
      "Save Payroll";

    message.textContent = "";

    loadEmployees();
  }


  function renderPayroll() {

    const query =
      search.value
        .trim()
        .toLowerCase();

    const records =
      getData(PAYROLL_KEY)
        .filter(item => {

          const text = [
            item.month,
            getEmployeeName(item.employee),
            item.status
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(query);
        })
        .sort(
          (a, b) =>
            String(b.month)
              .localeCompare(
                String(a.month)
              )
        );


    table.innerHTML = "";


    if (!records.length) {

      table.innerHTML = `
        <tr>
          <td colspan="11" style="text-align:center;">
            No payroll records found.
          </td>
        </tr>
      `;

      return;
    }


    records.forEach(item => {

      const row =
        document.createElement("tr");

      row.innerHTML = `

        <td>${escapeHTML(item.month)}</td>

        <td>
          ${escapeHTML(
            getEmployeeName(item.employee)
          )}
        </td>

        <td>${escapeHTML(item.payableDays)}</td>

        <td>${escapeHTML(item.monthlyGross)}</td>

        <td>${escapeHTML(item.otHours)}</td>

        <td>${escapeHTML(item.otAmount)}</td>

        <td>${escapeHTML(item.totalEarnings)}</td>

        <td>${escapeHTML(item.totalDeduction)}</td>

        <td>${escapeHTML(item.netSalary)}</td>

        <td>${escapeHTML(item.status)}</td>

        <td>

          <button
            type="button"
            class="btn btn-secondary"
            data-action="edit"
            data-id="${escapeHTML(item.id)}"
          >
            Edit
          </button>

          <button
            type="button"
            class="btn btn-danger"
            data-action="delete"
            data-id="${escapeHTML(item.id)}"
          >
            Delete
          </button>

        </td>
      `;

      table.appendChild(row);
    });
  }


  calculateBtn.addEventListener(
    "click",
    () => {

      const error = validate();

      if (error) {
        message.textContent = error;
        return;
      }

      calculatePayroll();

    }
  );


  employee.addEventListener(
    "change",
    loadEmployeeSalary
  );


  payrollMonth.addEventListener(
    "change",
    () => {

      loadAttendance();
      calculatePayroll(false);

    }
  );


  /*
    Instant recalculation
  */

  [
    salaryDivisor,
    payableDays,
    basicSalary,
    hra,
    shiftHours,
    otHours,
    otMultiplier,
    award,
    bonus,
    incentive,
    arrear,
    otherEarnings,
    pfDeduction,
    esiDeduction,
    lwfDeduction,
    canteenDeduction,
    advanceDeduction,
    loanDeduction,
    fineDeduction,
    otherDeduction
  ].forEach(field => {

    field.addEventListener(
      "input",
      () => calculatePayroll(false)
    );

  });


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const error =
        validate();

      if (error) {
        message.textContent = error;
        return;
      }


      calculatePayroll(false);


      const records =
        getData(PAYROLL_KEY);

      const editingId =
        recordId.value;


      /*
        Employee + Payroll Month must be unique.
      */

      const duplicate =
        records.some(item =>

          item.month ===
            payrollMonth.value &&

          String(item.employee) ===
            String(employee.value) &&

          String(item.id) !==
            String(editingId)

        );


      if (duplicate) {

        message.textContent =
          "Payroll already exists for this employee and month.";

        return;
      }


      const oldRecord =
        records.find(
          item =>
            String(item.id) ===
            String(editingId)
        );


      const data = {

        id:
          editingId || uid(),

        month:
          payrollMonth.value,

        employee:
          employee.value,

        salaryDivisor:
          num(salaryDivisor.value),

        payableDays:
          num(payableDays.value),

        basicSalary:
          num(basicSalary.value),

        hra:
          num(hra.value),

        monthlyGross:
          num(monthlyGross.value),

        presentDays:
          num(presentDays.value),

        absentDays:
          num(absentDays.value),

        halfDays:
          num(halfDays.value),

        paidLeave:
          num(paidLeave.value),

        unpaidLeave:
          num(unpaidLeave.value),

        weeklyOff:
          num(weeklyOff.value),

        holidayDays:
          num(holidayDays.value),

        shiftHours:
          num(shiftHours.value),

        otHours:
          num(otHours.value),

        otMultiplier:
          num(otMultiplier.value),

        otRate:
          num(otRate.value),

        otAmount:
          num(otAmount.value),

        earnedBasic:
          num(earnedBasic.value),

        earnedHra:
          num(earnedHra.value),

        award:
          num(award.value),

        bonus:
          num(bonus.value),

        incentive:
          num(incentive.value),

        arrear:
          num(arrear.value),

        otherEarnings:
          num(otherEarnings.value),

        totalEarnings:
          num(totalEarnings.value),

        pfDeduction:
          num(pfDeduction.value),

        esiDeduction:
          num(esiDeduction.value),

        lwfDeduction:
          num(lwfDeduction.value),

        canteenDeduction:
          num(canteenDeduction.value),

        advanceDeduction:
          num(advanceDeduction.value),

        loanDeduction:
          num(loanDeduction.value),

        fineDeduction:
          num(fineDeduction.value),

        otherDeduction:
          num(otherDeduction.value),

        totalDeduction:
          num(totalDeduction.value),

        netSalary:
          num(netSalary.value),

        status:
          payrollStatus.value,

        remarks:
          remarks.value.trim(),

        createdAt:
          oldRecord?.createdAt ||
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()
      };


      if (editingId) {

        const index =
          records.findIndex(
            item =>
              String(item.id) ===
              String(editingId)
          );

        if (index !== -1) {
          records[index] = data;
        }

        message.textContent =
          "Payroll updated successfully.";

      } else {

        records.push(data);

        message.textContent =
          "Payroll saved successfully.";
      }


      savePayroll(records);

      renderPayroll();


      setTimeout(
        resetForm,
        700
      );

    }
  );


  table.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "button[data-action]"
        );

      if (!button) return;


      const records =
        getData(PAYROLL_KEY);

      const item =
        records.find(
          record =>
            String(record.id) ===
            String(button.dataset.id)
        );

      if (!item) return;


      if (
        button.dataset.action ===
        "delete"
      ) {

        const confirmed =
          confirm(
            `Delete payroll for ${getEmployeeName(item.employee)} - ${item.month}?`
          );

        if (!confirmed) return;


        savePayroll(
          records.filter(
            record =>
              String(record.id) !==
              String(item.id)
          )
        );

        renderPayroll();

        return;
      }


      if (
        button.dataset.action ===
        "edit"
      ) {

        recordId.value = item.id;

        payrollMonth.value =
          item.month;

        loadEmployees(
          item.employee
        );

        salaryDivisor.value =
          item.salaryDivisor;

        payableDays.value =
          item.payableDays;

        basicSalary.value =
          item.basicSalary;

        hra.value =
          item.hra;

        monthlyGross.value =
          item.monthlyGross;

        presentDays.value =
          item.presentDays;

        absentDays.value =
          item.absentDays;

        halfDays.value =
          item.halfDays;

        paidLeave.value =
          item.paidLeave;

        unpaidLeave.value =
          item.unpaidLeave;

        weeklyOff.value =
          item.weeklyOff;

        holidayDays.value =
          item.holidayDays;

        shiftHours.value =
          item.shiftHours;

        otHours.value =
          item.otHours;

        otMultiplier.value =
          item.otMultiplier;

        otRate.value =
          item.otRate;

        otAmount.value =
          item.otAmount;

        earnedBasic.value =
          item.earnedBasic;

        earnedHra.value =
          item.earnedHra;

        award.value =
          item.award;

        bonus.value =
          item.bonus;

        incentive.value =
          item.incentive;

        arrear.value =
          item.arrear;

        otherEarnings.value =
          item.otherEarnings;

        totalEarnings.value =
          item.totalEarnings;

        pfDeduction.value =
          item.pfDeduction;

        esiDeduction.value =
          item.esiDeduction;

        lwfDeduction.value =
          item.lwfDeduction;

        canteenDeduction.value =
          item.canteenDeduction;

        advanceDeduction.value =
          item.advanceDeduction;

        loanDeduction.value =
          item.loanDeduction;

        fineDeduction.value =
          item.fineDeduction;

        otherDeduction.value =
          item.otherDeduction;

        totalDeduction.value =
          item.totalDeduction;

        netSalary.value =
          item.netSalary;

     

        payrollStatus.value =
          item.status || "Draft";

        remarks.value =
          item.remarks || "";

        saveBtn.textContent =
          "Update Payroll";

        message.textContent =
          "Editing Payroll.";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

    }
  );


  search.addEventListener(
    "input",
    renderPayroll
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  loadEmployees();
  setCurrentMonth();
  renderPayroll();

});
