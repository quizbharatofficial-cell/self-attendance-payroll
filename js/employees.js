const form = document.getElementById("employeeForm");

const recordId = document.getElementById("recordId");
const employeeCode = document.getElementById("employeeCode");
const employeeName = document.getElementById("employeeName");
const department = document.getElementById("department");
const designation = document.getElementById("designation");
const doj = document.getElementById("doj");
const statusField = document.getElementById("status");
const mobile = document.getElementById("mobile");
const bank = document.getElementById("bank");
const accountNo = document.getElementById("accountNo");
const ifsc = document.getElementById("ifsc");
const uan = document.getElementById("uan");
const esic = document.getElementById("esic");
const basic = document.getElementById("basic");
const hra = document.getElementById("hra");
const gross = document.getElementById("gross");

const table = document.getElementById("employeeTable");
const search = document.getElementById("employeeSearch");

basic.addEventListener("input", calculateGross);
hra.addEventListener("input", calculateGross);

function calculateGross() {
  gross.value =
    (Number(basic.value) || 0) +
    (Number(hra.value) || 0);
}

form.addEventListener("submit", function(event) {

  event.preventDefault();

  const employees = HRMS.get("employees");

  const code = employeeCode.value.trim();

  if (!code) {
    notify("Employee ID / Code is required.", "error");
    return;
  }

  const duplicate = employees.find(emp =>
    String(emp.code).toLowerCase() === code.toLowerCase() &&
    emp.id !== recordId.value
  );

  if (duplicate) {
    notify("Employee ID / Code already exists.", "error");
    return;
  }

  const employee = {
    id: recordId.value || HRMS.generateId("EMP"),

    code: code,

    name: employeeName.value.trim(),

    department: department.value.trim(),

    designation: designation.value.trim(),

    doj: doj.value,

    status: statusField.value,

    mobile: mobile.value.trim(),

    bank: bank.value.trim(),

    accountNo: accountNo.value.trim(),

    ifsc: ifsc.value.trim().toUpperCase(),

    uan: uan.value.trim(),

    esic: esic.value.trim(),

    basic: Number(basic.value) || 0,

    hra: Number(hra.value) || 0,

    gross:
      (Number(basic.value) || 0) +
      (Number(hra.value) || 0)
  };

  const index = employees.findIndex(
    emp => emp.id === employee.id
  );

  if (index >= 0) {
    employees[index] = employee;
    notify("Employee updated successfully.", "success");
  } else {
    employees.push(employee);
    notify("Employee added successfully.", "success");
  }

  HRMS.set("employees", employees);

  resetForm();

  renderEmployees();
});

function renderEmployees(filter = "") {

  const employees = HRMS.get("employees");

  const query = filter.trim().toLowerCase();

  const filtered = employees.filter(emp => {

    const text = [
      emp.code,
      emp.name,
      emp.department,
      emp.designation,
      emp.status
    ]
    .join(" ")
    .toLowerCase();

    return text.includes(query);
  });

  table.innerHTML = "";

  if (!filtered.length) {

    table.innerHTML = `
      <tr>
        <td colspan="9" class="empty-row">
          No employee records found.
        </td>
      </tr>
    `;

    return;
  }

  filtered.forEach(emp => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHTML(emp.code)}</td>

      <td>${escapeHTML(emp.name)}</td>

      <td>${escapeHTML(emp.department)}</td>

      <td>${escapeHTML(emp.designation)}</td>

      <td>${escapeHTML(emp.status)}</td>

      <td>₹${money(emp.basic)}</td>

      <td>₹${money(emp.hra)}</td>

      <td>₹${money(emp.gross)}</td>

      <td class="action-buttons">

        <button
          class="btn-small"
          onclick="viewEmployee('${emp.id}')">
          View
        </button>

        <button
          class="btn-small"
          onclick="editEmployee('${emp.id}')">
          Edit
        </button>

        <button
          class="btn-small danger"
          onclick="deleteEmployee('${emp.id}')">
          Delete
        </button>

      </td>
    `;

    table.appendChild(row);
  });
}

function editEmployee(id) {

  const employee =
    HRMS.get("employees").find(emp => emp.id === id);

  if (!employee) return;

  recordId.value = employee.id;

  employeeCode.value = employee.code || "";
  employeeName.value = employee.name || "";
  department.value = employee.department || "";
  designation.value = employee.designation || "";
  doj.value = employee.doj || "";
  statusField.value = employee.status || "Active";
  mobile.value = employee.mobile || "";
  bank.value = employee.bank || "";
  accountNo.value = employee.accountNo || "";
  ifsc.value = employee.ifsc || "";
  uan.value = employee.uan || "";
  esic.value = employee.esic || "";
  basic.value = employee.basic ?? "";
  hra.value = employee.hra ?? "";

  calculateGross();

  document.getElementById("saveBtn").textContent =
    "Update Employee";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function viewEmployee(id) {

  const employee =
    HRMS.get("employees").find(emp => emp.id === id);

  if (!employee) return;

  alert(
`Employee Details

Code: ${employee.code || ""}
Name: ${employee.name || ""}
Department: ${employee.department || ""}
Designation: ${employee.designation || ""}
DOJ: ${employee.doj || ""}
Status: ${employee.status || ""}
Mobile: ${employee.mobile || ""}

Bank: ${employee.bank || ""}
A/C No: ${employee.accountNo || ""}
IFSC: ${employee.ifsc || ""}
UAN: ${employee.uan || ""}
ESIC: ${employee.esic || ""}

Basic: ₹${money(employee.basic)}
HRA: ₹${money(employee.hra)}
Gross: ₹${money(employee.gross)}`
  );
}

function deleteEmployee(id) {

  const employees = HRMS.get("employees");

  const employee =
    employees.find(emp => emp.id === id);

  if (!employee) return;

  if (
    !confirm(
      `Delete employee ${employee.name} (${employee.code})?`
    )
  ) {
    return;
  }

  const attendance = HRMS.get("attendance");

  const payroll = HRMS.get("payroll");

  const used =
    attendance.some(item => item.employeeId === id) ||
    payroll.some(item => item.employeeId === id);

  if (used) {

    notify(
      "Employee has attendance/payroll records and cannot be deleted.",
      "error"
    );

    return;
  }

  HRMS.set(
    "employees",
    employees.filter(emp => emp.id !== id)
  );

  notify("Employee deleted.", "success");

  renderEmployees(search.value);
}

function resetForm() {

  form.reset();

  recordId.value = "";

  gross.value = "";

  statusField.value = "Active";

  document.getElementById("saveBtn").textContent =
    "Save Employee";
}

document
  .getElementById("cancelBtn")
  .addEventListener("click", resetForm);

search.addEventListener("input", function() {
  renderEmployees(this.value);
});

function money(value) {

  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
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

function notify(message, type) {

  const toast = document.getElementById("toast");

  toast.textContent = message;

  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

renderEmployees();
