const form = document.getElementById("attendanceForm");

const recordId = document.getElementById("recordId");
const employeeId = document.getElementById("employeeId");
const attendanceDate = document.getElementById("attendanceDate");
const shift = document.getElementById("shift");
const shiftHours = document.getElementById("shiftHours");
const inTime = document.getElementById("inTime");
const outTime = document.getElementById("outTime");
const breakMinutes = document.getElementById("breakMinutes");
const workingHours = document.getElementById("workingHours");
const otHours = document.getElementById("otHours");
const attendanceStatus =
  document.getElementById("attendanceStatus");
const remarks = document.getElementById("remarks");

const table = document.getElementById("attendanceTable");
const search = document.getElementById("attendanceSearch");

function loadEmployees() {
  const employees = HRMS.get("employees")
    .filter(emp => !emp.status || emp.status === "Active");

  employeeId.innerHTML =
    '<option value="">Select Employee</option>';

  employees.forEach(emp => {
    const option = document.createElement("option");

    option.value = emp.id;
    option.textContent = `${emp.code} - ${emp.name}`;

    employeeId.appendChild(option);
  });
}

function getAttendanceSettings() {
  const settings = HRMS.getObject("salarySettings");

  return {
    shiftHours:
      Number(settings.shiftHours) || "",
    breakMinutes:
      Number(settings.breakMinutes) || ""
  };
}

function applySettings() {
  const settings = getAttendanceSettings();

  if (!shiftHours.value && settings.shiftHours) {
    shiftHours.value = settings.shiftHours;
  }

  if (!breakMinutes.value && settings.breakMinutes) {
    breakMinutes.value = settings.breakMinutes;
  }
}

function timeToMinutes(value) {
  if (!value) return null;

  const parts = value.split(":");

  return Number(parts[0]) * 60 + Number(parts[1]);
}

function calculateHours() {
  const start = timeToMinutes(inTime.value);
  let end = timeToMinutes(outTime.value);

  if (start === null || end === null) {
    workingHours.value = "";
    otHours.value = "";
    return;
  }

  // Night shift support
  if (end < start) {
    end += 24 * 60;
  }

  const breakMins =
    Math.max(0, Number(breakMinutes.value) || 0);

  const workedMinutes =
    Math.max(0, end - start - breakMins);

  const worked = workedMinutes / 60;

  const required =
    Math.max(0, Number(shiftHours.value) || 0);

  const overtime =
    Math.max(0, worked - required);

  workingHours.value = worked.toFixed(2);
  otHours.value = overtime.toFixed(2);
}

[
  inTime,
  outTime,
  breakMinutes,
  shiftHours
].forEach(field => {
  field.addEventListener("input", calculateHours);
});

attendanceStatus.addEventListener("change", function() {
  const nonWorking =
    ["A", "EL", "CL", "SL", "WO", "HOLIDAY"]
      .includes(this.value.toUpperCase());

  if (nonWorking) {
    inTime.value = "";
    outTime.value = "";
    workingHours.value = "0.00";
    otHours.value = "0.00";
  }
});

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const records = HRMS.get("attendance");

  const empId = employeeId.value;
  const date = attendanceDate.value;

  if (!empId || !date) {
    notify("Employee and Date are required.", "error");
    return;
  }

  const duplicate = records.find(item =>
    item.employeeId === empId &&
    item.date === date &&
    item.id !== recordId.value
  );

  if (duplicate) {
    notify(
      "Attendance already exists for this Employee + Date.",
      "error"
    );
    return;
  }

  calculateHours();

  const statusValue = attendanceStatus.value;

  const record = {
    id: recordId.value ||
        HRMS.generateId("ATT"),

    employeeId: empId,
    date: date,
    shift: shift.value.trim(),

    shiftHours:
      Math.max(0, Number(shiftHours.value) || 0),

    inTime: inTime.value,
    outTime: outTime.value,

    breakMinutes:
      Math.max(0, Number(breakMinutes.value) || 0),

    workingHours:
      Math.max(0, Number(workingHours.value) || 0),

    otHours:
      Math.max(0, Number(otHours.value) || 0),

    status: statusValue,

    remarks: remarks.value.trim(),

    updatedAt: new Date().toISOString()
  };

  const index =
    records.findIndex(item => item.id === record.id);

  const isEdit = index >= 0;

  if (isEdit) {
    records[index] = record;
  } else {
    records.push(record);
  }

  HRMS.set("attendance", records);

  checkExistingPayroll(record);

  notify(
    isEdit
      ? "Attendance updated successfully."
      : "Attendance saved successfully.",
    "success"
  );

  resetForm();
  renderAttendance(search.value);
});

function checkExistingPayroll(record) {
  const month = record.date.slice(0, 7);

  const payroll = HRMS.get("payroll");

  const generated = payroll.some(item =>
    item.employeeId === record.employeeId &&
    item.month === month
  );

  if (generated) {
    setTimeout(() => {
      alert(
        "Warning: Payroll is already generated for " +
        "this employee and month. Recalculate payroll " +
        "to apply the attendance change."
      );
    }, 100);
  }
}

function getEmployee(id) {
  return HRMS.get("employees")
    .find(emp => emp.id === id);
}

function renderAttendance(filter = "") {
  const records = HRMS.get("attendance")
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const query = filter.trim().toLowerCase();

  const filtered = records.filter(item => {
    const emp = getEmployee(item.employeeId);

    const text = [
      item.date,
      emp?.code,
      emp?.name,
      item.shift,
      item.status,
      item.remarks
    ].join(" ").toLowerCase();

    return text.includes(query);
  });

  table.innerHTML = "";

  if (!filtered.length) {
    table.innerHTML = `
      <tr>
        <td colspan="11" class="empty-row">
          No attendance records found.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const emp = getEmployee(item.employeeId);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${safe(item.date)}</td>
      <td>${safe(
        emp
          ? `${emp.code} - ${emp.name}`
          : "Employee not found"
      )}</td>
      <td>${safe(item.shift)}</td>
      <td>${safe(item.inTime)}</td>
      <td>${safe(item.outTime)}</td>
      <td>${num(item.breakMinutes)} min</td>
      <td>${num(item.workingHours)} hrs</td>
      <td>${num(item.otHours)} hrs</td>
      <td>${safe(item.status)}</td>
      <td>${safe(item.remarks)}</td>

      <td class="action-buttons">
        <button class="btn-small"
          onclick="editAttendance('${item.id}')">
          Edit
        </button>

        <button class="btn-small danger"
          onclick="deleteAttendance('${item.id}')">
          Delete
        </button>
      </td>
    `;

    table.appendChild(row);
  });
}

function editAttendance(id) {
  const record = HRMS.get("attendance")
    .find(item => item.id === id);

  if (!record) return;

  recordId.value = record.id;
  employeeId.value = record.employeeId;
  attendanceDate.value = record.date;
  shift.value = record.shift || "";
  shiftHours.value = record.shiftHours ?? "";
  inTime.value = record.inTime || "";
  outTime.value = record.outTime || "";
  breakMinutes.value = record.breakMinutes ?? "";
  workingHours.value =
    Number(record.workingHours || 0).toFixed(2);
  otHours.value =
    Number(record.otHours || 0).toFixed(2);
  attendanceStatus.value = record.status || "P";
  remarks.value = record.remarks || "";

  document.getElementById("saveBtn").textContent =
    "Update Attendance";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function deleteAttendance(id) {
  const records = HRMS.get("attendance");

  const record = records.find(item => item.id === id);

  if (!record) return;

  if (!confirm("Delete this attendance record?")) {
    return;
  }

  HRMS.set(
    "attendance",
    records.filter(item => item.id !== id)
  );

  checkExistingPayroll(record);

  notify("Attendance deleted.", "success");

  renderAttendance(search.value);
}

function resetForm() {
  form.reset();

  recordId.value = "";

  workingHours.value = "";
  otHours.value = "";

  attendanceStatus.value = "P";

  document.getElementById("saveBtn").textContent =
    "Save Attendance";

  applySettings();
}

document
  .getElementById("clearBtn")
  .addEventListener("click", resetForm);

search.addEventListener("input", function() {
  renderAttendance(this.value);
});

function num(value) {
  return Number(value || 0).toLocaleString(
    "en-IN",
    { maximumFractionDigits: 2 }
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
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

loadEmployees();
applySettings();
renderAttendance();
