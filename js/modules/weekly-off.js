document.addEventListener("DOMContentLoaded", () => {

  const WEEKLY_OFF_KEY = "self_hrms_weekly_off";
  const BRANCH_KEY = "self_hrms_branches";

  // Existing Employee Master currently uses this key.
  const EMPLOYEE_KEYS = [
    "employees",
    "self_hrms_employees"
  ];

  const form = document.getElementById("weeklyOffForm");
  const recordId = document.getElementById("recordId");

  const ruleCode = document.getElementById("ruleCode");
  const ruleName = document.getElementById("ruleName");
  const applyTo = document.getElementById("applyTo");

  const branchField = document.getElementById("branchField");
  const employeeField = document.getElementById("employeeField");

  const branch = document.getElementById("branch");
  const employee = document.getElementById("employee");

  const weekDay = document.getElementById("weekDay");
  const weekPattern = document.getElementById("weekPattern");

  const effectiveFrom = document.getElementById("effectiveFrom");
  const effectiveTo = document.getElementById("effectiveTo");

  const status = document.getElementById("status");
  const remarks = document.getElementById("remarks");

  const table = document.getElementById("weeklyOffTable");
  const search = document.getElementById("weeklyOffSearch");

  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const message = document.getElementById("message");


  function getData(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function getEmployees() {

    for (const key of EMPLOYEE_KEYS) {

      const data = getData(key);

      if (Array.isArray(data) && data.length) {
        return data;
      }

    }

    return [];
  }


  function saveRules(data) {

    localStorage.setItem(
      WEEKLY_OFF_KEY,
      JSON.stringify(data)
    );

  }


  function generateId() {

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


  function loadBranches() {

    const selected = branch.value;

    branch.innerHTML =
      '<option value="">Select Branch</option>';

    getData(BRANCH_KEY)
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value =
          item.id ||
          item.code ||
          item.branchCode;

        option.textContent =
          item.name ||
          item.branchName ||
          item.code ||
          item.branchCode ||
          "Branch";

        branch.appendChild(option);

      });

    branch.value = selected;

  }


  function loadEmployees() {

    const selected = employee.value;

    employee.innerHTML =
      '<option value="">Select Employee</option>';

    getEmployees()
      .filter(item =>
        !item.status ||
        item.status === "Active"
      )
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value =
          item.id ||
          item.code ||
          item.employeeCode;

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


  function getBranchName(id) {

    if (!id) return "-";

    const item =
      getData(BRANCH_KEY).find(branchItem =>

        String(
          branchItem.id ||
          branchItem.code ||
          branchItem.branchCode
        ) === String(id)

      );

    if (!item) return "-";

    return (
      item.name ||
      item.branchName ||
      item.code ||
      item.branchCode ||
      "-"
    );

  }


  function getEmployeeName(id) {

    if (!id) return "-";

    const item =
      getEmployees().find(emp =>

        String(
          emp.id ||
          emp.code ||
          emp.employeeCode
        ) === String(id)

      );

    if (!item) return "-";

    const code =
      item.code ||
      item.employeeCode ||
      "";

    const name =
      item.name ||
      item.employeeName ||
      "Employee";

    return code
      ? `${code} - ${name}`
      : name;

  }


  function updateApplyFields() {

    const type = applyTo.value;

    branchField.style.display =
      type === "Branch"
        ? ""
        : "none";

    employeeField.style.display =
      type === "Employee"
        ? ""
        : "none";


    if (type !== "Branch") {
      branch.value = "";
    }

    if (type !== "Employee") {
      employee.value = "";
    }

  }


  function getApplyText(item) {

    if (item.applyTo === "Branch") {
      return `Branch: ${getBranchName(item.branch)}`;
    }

    if (item.applyTo === "Employee") {
      return `Employee: ${getEmployeeName(item.employee)}`;
    }

    return "All Employees";

  }


  function getPatternText(pattern) {

    const names = {
      Every: "Every Week",
      1: "1st Week",
      2: "2nd Week",
      3: "3rd Week",
      4: "4th Week",
      5: "5th Week",
      Odd: "Odd Weeks",
      Even: "Even Weeks"
    };

    return names[pattern] || pattern || "-";

  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    applyTo.value = "All";
    weekDay.value = "Sunday";
    weekPattern.value = "Every";
    status.value = "Active";

    saveBtn.textContent =
      "Save Weekly Off";

    message.textContent = "";

    loadBranches();
    loadEmployees();

    updateApplyFields();

    ruleCode.focus();

  }


  function renderRules(filter = "") {

    const rules =
      getData(WEEKLY_OFF_KEY);

    const query =
      filter.trim().toLowerCase();


    const filtered =
      rules.filter(item => {

        const text = [
          item.code,
          item.name,
          getApplyText(item),
          item.weekDay,
          getPatternText(item.weekPattern),
          item.effectiveFrom,
          item.effectiveTo,
          item.status,
          item.remarks
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(query);

      });


    table.innerHTML = "";


    if (!filtered.length) {

      table.innerHTML = `
        <tr>
          <td
            colspan="8"
            style="text-align:center;"
          >
            No weekly off rules found.
          </td>
        </tr>
      `;

      return;
    }


    filtered.forEach(item => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          ${escapeHTML(item.code)}
        </td>

        <td>
          ${escapeHTML(item.name)}
        </td>

        <td>
          ${escapeHTML(getApplyText(item))}
        </td>

        <td>
          ${escapeHTML(item.weekDay)}
        </td>

        <td>
          ${escapeHTML(
            getPatternText(item.weekPattern)
          )}
        </td>

        <td>
          ${escapeHTML(item.effectiveFrom)}
        </td>

        <td>
          ${escapeHTML(item.status)}
        </td>

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


  applyTo.addEventListener(
    "change",
    updateApplyFields
  );


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const code =
        ruleCode.value
          .trim()
          .toUpperCase();

      const name =
        ruleName.value.trim();


      if (!code || !name) {

        message.textContent =
          "Rule Code and Rule Name are required.";

        return;
      }


      if (
        applyTo.value === "Branch" &&
        !branch.value
      ) {

        message.textContent =
          "Please select a Branch.";

        return;
      }


      if (
        applyTo.value === "Employee" &&
        !employee.value
      ) {

        message.textContent =
          "Please select an Employee.";

        return;
      }


      if (!effectiveFrom.value) {

        message.textContent =
          "Effective From date is required.";

        return;
      }


      if (
        effectiveTo.value &&
        effectiveTo.value < effectiveFrom.value
      ) {

        message.textContent =
          "Effective To cannot be before Effective From.";

        return;
      }


      const rules =
        getData(WEEKLY_OFF_KEY);

      const editingId =
        recordId.value;


      const duplicateCode =
        rules.some(item =>

          String(item.code)
            .toLowerCase() ===
          code.toLowerCase()

          &&

          String(item.id) !==
          String(editingId)

        );


      if (duplicateCode) {

        message.textContent =
          "Rule Code already exists.";

        return;
      }


      const rule = {

        id:
          editingId || generateId(),

        code,

        name,

        applyTo:
          applyTo.value,

        branch:
          applyTo.value === "Branch"
            ? branch.value
            : "",

        employee:
          applyTo.value === "Employee"
            ? employee.value
            : "",

        weekDay:
          weekDay.value,

        weekPattern:
          weekPattern.value,

        effectiveFrom:
          effectiveFrom.value,

        effectiveTo:
          effectiveTo.value,

        status:
          status.value,

        remarks:
          remarks.value.trim()

      };


      if (editingId) {

        const index =
          rules.findIndex(
            item =>
              String(item.id) ===
              String(editingId)
          );


        if (index !== -1) {
          rules[index] = rule;
        }


        message.textContent =
          "Weekly Off updated successfully.";

      } else {

        rules.push(rule);

        message.textContent =
          "Weekly Off saved successfully.";

      }


      saveRules(rules);

      renderRules(search.value);


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


      const id =
        button.dataset.id;

      const action =
        button.dataset.action;

      const rules =
        getData(WEEKLY_OFF_KEY);

      const item =
        rules.find(rule =>
          String(rule.id) === String(id)
        );


      if (!item) return;


      if (action === "edit") {

        recordId.value =
          item.id;

        ruleCode.value =
          item.code || "";

        ruleName.value =
          item.name || "";

        applyTo.value =
          item.applyTo || "All";

        loadBranches();
        loadEmployees();

        branch.value =
          item.branch || "";

        employee.value =
          item.employee || "";

        weekDay.value =
          item.weekDay || "Sunday";

        weekPattern.value =
          item.weekPattern || "Every";

        effectiveFrom.value =
          item.effectiveFrom || "";

        effectiveTo.value =
          item.effectiveTo || "";

        status.value =
          item.status || "Active";

        remarks.value =
          item.remarks || "";

        updateApplyFields();

        saveBtn.textContent =
          "Update Weekly Off";

        message.textContent =
          "Editing Weekly Off.";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }


      if (action === "delete") {

        const confirmed =
          confirm(
            `Delete Weekly Off rule "${item.name}"?`
          );


        if (!confirmed) return;


        const updated =
          rules.filter(rule =>
            String(rule.id) !== String(id)
          );


        saveRules(updated);

        renderRules(search.value);


        if (
          String(recordId.value) ===
          String(id)
        ) {
          resetForm();
        }

      }

    }
  );


  search.addEventListener(
    "input",
    () => {
      renderRules(search.value);
    }
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  loadBranches();
  loadEmployees();
  updateApplyFields();
  renderRules();

});
