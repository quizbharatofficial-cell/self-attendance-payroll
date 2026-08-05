document.addEventListener("DOMContentLoaded", () => {

  const EMPLOYEE_KEY = "self_hrms_employees";
  const BRANCH_KEY = "self_hrms_branches";
  const DEPARTMENT_KEY = "self_hrms_departments";
  const DESIGNATION_KEY = "self_hrms_designations";
  const SHIFT_KEY = "self_hrms_shifts";

  const form = document.getElementById("employeeForm");
  const recordId = document.getElementById("recordId");

  const employeeCode = document.getElementById("employeeCode");
  const employeeName = document.getElementById("employeeName");
  const fatherSpouseName = document.getElementById("fatherSpouseName");
  const dob = document.getElementById("dob");
  const gender = document.getElementById("gender");
  const mobile = document.getElementById("mobile");
  const email = document.getElementById("email");
  const joiningDate = document.getElementById("joiningDate");

  const branch = document.getElementById("branch");
  const department = document.getElementById("department");
  const designation = document.getElementById("designation");
  const shift = document.getElementById("shift");
  const employmentType = document.getElementById("employmentType");
  const status = document.getElementById("status");

  const monthlySalary = document.getElementById("monthlySalary");
  const paymentMode = document.getElementById("paymentMode");
  const uan = document.getElementById("uan");
  const pfApplicable = document.getElementById("pfApplicable");
  const esiNumber = document.getElementById("esiNumber");
  const esiApplicable = document.getElementById("esiApplicable");

  const accountHolder = document.getElementById("accountHolder");
  const bankName = document.getElementById("bankName");
  const accountNumber = document.getElementById("accountNumber");
  const ifsc = document.getElementById("ifsc");

  const state = document.getElementById("state");
  const city = document.getElementById("city");
  const pin = document.getElementById("pin");
  const address = document.getElementById("address");

  const table = document.getElementById("employeeTable");
  const search = document.getElementById("employeeSearch");
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


  function saveEmployees(data) {
    localStorage.setItem(
      EMPLOYEE_KEY,
      JSON.stringify(data)
    );

    /*
      Compatibility copy for older modules
      that may still read "employees".
    */
    localStorage.setItem(
      "employees",
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


  function loadBranches(selected = "") {

    branch.innerHTML =
      '<option value="">Select Branch</option>';

    getData(BRANCH_KEY)
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option = document.createElement("option");

        option.value = item.id;

        option.textContent =
          item.name || item.code || "Branch";

        branch.appendChild(option);
      });

    branch.value = selected;
  }


  function loadDepartments(selected = "") {

    department.innerHTML =
      '<option value="">Select Department</option>';

    const selectedBranch = branch.value;

    getData(DEPARTMENT_KEY)
      .filter(item => {

        if (item.status === "Inactive") {
          return false;
        }

        /*
          Department with no branch remains available.
          Branch-linked departments are filtered.
        */
        return (
          !item.branch ||
          !selectedBranch ||
          String(item.branch) === String(selectedBranch)
        );
      })
      .forEach(item => {

        const option = document.createElement("option");

        option.value = item.id;

        option.textContent =
          item.name || item.code || "Department";

        department.appendChild(option);
      });

    department.value = selected;
  }


  function loadDesignations(selected = "") {

    designation.innerHTML =
      '<option value="">Select Designation</option>';

    const selectedDepartment = department.value;

    getData(DESIGNATION_KEY)
      .filter(item => {

        if (item.status === "Inactive") {
          return false;
        }

        return (
          !item.department ||
          !selectedDepartment ||
          String(item.department) ===
          String(selectedDepartment)
        );
      })
      .forEach(item => {

        const option = document.createElement("option");

        option.value = item.id;

        option.textContent =
          item.name || item.code || "Designation";

        designation.appendChild(option);
      });

    designation.value = selected;
  }


  function loadShifts(selected = "") {

    shift.innerHTML =
      '<option value="">Select Shift</option>';

    getData(SHIFT_KEY)
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option = document.createElement("option");

        option.value = item.id;

        option.textContent =
          item.name || item.code || "Shift";

        shift.appendChild(option);
      });

    shift.value = selected;
  }


  function getMasterName(key, id) {

    if (!id) return "-";

    const item = getData(key).find(
      record => String(record.id) === String(id)
    );

    if (!item) return "-";

    return item.name || item.code || "-";
  }


  function validateForm() {

    if (
      !employeeCode.value.trim() ||
      !employeeName.value.trim()
    ) {
      return "Employee Code and Employee Name are required.";
    }

    if (!joiningDate.value) {
      return "Date of Joining is required.";
    }

    if (!branch.value) {
      return "Please select Branch.";
    }

    if (!department.value) {
      return "Please select Department.";
    }

    if (!designation.value) {
      return "Please select Designation.";
    }

    if (
      dob.value &&
      joiningDate.value &&
      dob.value >= joiningDate.value
    ) {
      return "Date of Birth must be before Date of Joining.";
    }

    if (
      monthlySalary.value &&
      Number(monthlySalary.value) < 0
    ) {
      return "Monthly Salary cannot be negative.";
    }

    return "";
  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    employmentType.value = "Permanent";
    status.value = "Active";
    paymentMode.value = "Bank";
    pfApplicable.value = "No";
    esiApplicable.value = "No";

    saveBtn.textContent = "Save Employee";
    message.textContent = "";

    loadBranches();
    loadDepartments();
    loadDesignations();
    loadShifts();

    employeeCode.disabled = false;
    employeeCode.focus();
  }


  function renderEmployees(filter = "") {

    const employees = getData(EMPLOYEE_KEY);

    const query = filter.trim().toLowerCase();

    const filtered = employees.filter(item => {

      const text = [
        item.code,
        item.name,
        getMasterName(BRANCH_KEY, item.branch),
        getMasterName(DEPARTMENT_KEY, item.department),
        getMasterName(DESIGNATION_KEY, item.designation),
        item.mobile,
        item.joiningDate,
        item.status
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });


    table.innerHTML = "";


    if (!filtered.length) {

      table.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;">
            No employee records found.
          </td>
        </tr>
      `;

      return;
    }


    filtered.forEach(item => {

      const row = document.createElement("tr");

      row.innerHTML = `

        <td>${escapeHTML(item.code)}</td>

        <td>${escapeHTML(item.name)}</td>

        <td>
          ${escapeHTML(
            getMasterName(BRANCH_KEY, item.branch)
          )}
        </td>

        <td>
          ${escapeHTML(
            getMasterName(DEPARTMENT_KEY, item.department)
          )}
        </td>

        <td>
          ${escapeHTML(
            getMasterName(DESIGNATION_KEY, item.designation)
          )}
        </td>

        <td>${escapeHTML(item.mobile || "-")}</td>

        <td>${escapeHTML(item.joiningDate)}</td>

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


  branch.addEventListener("change", () => {

    loadDepartments();
    loadDesignations();

  });


  department.addEventListener("change", () => {

    loadDesignations();

  });


  form.addEventListener("submit", event => {

    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      message.textContent = validationError;
      return;
    }


    const employees = getData(EMPLOYEE_KEY);

    const editingId = recordId.value;

    const code =
      employeeCode.value.trim().toUpperCase();


    const duplicate = employees.some(item =>

      String(item.code).toLowerCase() ===
      code.toLowerCase()

      &&

      String(item.id) !== String(editingId)

    );


    if (duplicate) {

      message.textContent =
        "Employee Code already exists.";

      employeeCode.focus();

      return;
    }


    const oldEmployee = employees.find(
      item => String(item.id) === String(editingId)
    );


    const employeeData = {

      id:
        editingId || generateId(),

      code,

      name:
        employeeName.value.trim(),

      fatherSpouseName:
        fatherSpouseName.value.trim(),

      dob:
        dob.value,

      gender:
        gender.value,

      mobile:
        mobile.value.trim(),

      email:
        email.value.trim(),

      joiningDate:
        joiningDate.value,

      branch:
        branch.value,

      department:
        department.value,

      designation:
        designation.value,

      shift:
        shift.value,

      employmentType:
        employmentType.value,

      status:
        status.value,

      monthlySalary:
        Number(monthlySalary.value) || 0,

      paymentMode:
        paymentMode.value,

      uan:
        uan.value.trim(),

      pfApplicable:
        pfApplicable.value,

      esiNumber:
        esiNumber.value.trim(),

      esiApplicable:
        esiApplicable.value,

      accountHolder:
        accountHolder.value.trim(),

      bankName:
        bankName.value.trim(),

      accountNumber:
        accountNumber.value.trim(),

      ifsc:
        ifsc.value.trim().toUpperCase(),

      state:
        state.value.trim(),

      city:
        city.value.trim(),

      pin:
        pin.value.trim(),

      address:
        address.value.trim(),

      createdAt:
        oldEmployee?.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };


    if (editingId) {

      const index = employees.findIndex(
        item => String(item.id) === String(editingId)
      );

      if (index !== -1) {
        employees[index] = employeeData;
      }

      message.textContent =
        "Employee updated successfully.";

    } else {

      employees.push(employeeData);

      message.textContent =
        "Employee saved successfully.";
    }


    saveEmployees(employees);

    renderEmployees(search.value);


    setTimeout(
      resetForm,
      700
    );

  });


  table.addEventListener("click", event => {

    const button =
      event.target.closest("button[data-action]");

    if (!button) return;


    const id = button.dataset.id;
    const action = button.dataset.action;

    const employees = getData(EMPLOYEE_KEY);

    const item = employees.find(
      employee =>
        String(employee.id) === String(id)
    );


    if (!item) return;


    if (action === "edit") {

      recordId.value = item.id;

      employeeCode.value = item.code || "";
      employeeName.value = item.name || "";
      fatherSpouseName.value = item.fatherSpouseName || "";
      dob.value = item.dob || "";
      gender.value = item.gender || "";
      mobile.value = item.mobile || "";
      email.value = item.email || "";
      joiningDate.value = item.joiningDate || "";

      loadBranches(item.branch || "");
      loadDepartments(item.department || "");
      loadDesignations(item.designation || "");
      loadShifts(item.shift || "");

      employmentType.value =
        item.employmentType || "Permanent";

      status.value =
        item.status || "Active";

      monthlySalary.value =
        item.monthlySalary ?? "";

      paymentMode.value =
        item.paymentMode || "Bank";

      uan.value =
        item.uan || "";

      pfApplicable.value =
        item.pfApplicable || "No";

      esiNumber.value =
        item.esiNumber || "";

      esiApplicable.value =
        item.esiApplicable || "No";

      accountHolder.value =
        item.accountHolder || "";

      bankName.value =
        item.bankName || "";

      accountNumber.value =
        item.accountNumber || "";

      ifsc.value =
        item.ifsc || "";

      state.value =
        item.state || "";

      city.value =
        item.city || "";

      pin.value =
        item.pin || "";

      address.value =
        item.address || "";

      employeeCode.disabled = true;

      saveBtn.textContent =
        "Update Employee";

      message.textContent =
        "Editing Employee.";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }


    if (action === "delete") {

      const confirmed = confirm(
        `Delete employee "${item.name}"?`
      );

      if (!confirmed) return;


      const updated = employees.filter(
        employee =>
          String(employee.id) !== String(id)
      );


      saveEmployees(updated);

      renderEmployees(search.value);


      if (
        String(recordId.value) === String(id)
      ) {
        resetForm();
      }

    }

  });


  search.addEventListener("input", () => {

    renderEmployees(search.value);

  });


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  loadBranches();
  loadDepartments();
  loadDesignations();
  loadShifts();

  renderEmployees();

});
