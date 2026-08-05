const leaveForm = document.getElementById("leaveForm");
const leaveId = document.getElementById("leaveId");
const employeeField = document.getElementById("leaveEmployee");
const typeField = document.getElementById("leaveType");
const fromField = document.getElementById("leaveFrom");
const toField = document.getElementById("leaveTo");
const daysField = document.getElementById("leaveDays");
const statusField = document.getElementById("leaveStatus");
const reasonField = document.getElementById("leaveReason");
const leaveTable = document.getElementById("leaveTable");
const leaveSearch = document.getElementById("leaveSearch");

function loadEmployees() {
  employeeField.innerHTML =
    '<option value="">Select Employee</option>';

  HRMS.get("employees")
    .filter(emp => !emp.status || emp.status === "Active")
    .forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.id;
      option.textContent = `${emp.code} - ${emp.name}`;
      employeeField.appendChild(option);
    });
}

function calculateDays() {
  if (!fromField.value || !toField.value) {
    daysField.value = "";
    return;
  }

  const from = new Date(fromField.value + "T00:00:00");
  const to = new Date(toField.value + "T00:00:00");

  if (to < from) {
    daysField.value = "";
    return;
  }

  daysField.value =
    Math.floor((to - from) / 86400000) + 1;
}

fromField.addEventListener("change", calculateDays);
toField.addEventListener("change", calculateDays);

leaveForm.addEventListener("submit", e => {
  e.preventDefault();

  calculateDays();

  if (!employeeField.value) {
    notify("Select employee.", "error");
    return;
  }

  if (!fromField.value || !toField.value) {
    notify("Select leave dates.", "error");
    return;
  }

  if (!daysField.value) {
    notify("Invalid leave date range.", "error");
    return;
  }

  const records = HRMS.get("leaves");

  const record = {
    id: leaveId.value || HRMS.generateId("LEV"),
    employeeId: employeeField.value,
    type: typeField.value,
    from: fromField.value,
    to: toField.value,
    days: Number(daysField.value),
    reason: reasonField.value.trim(),
    status: statusField.value,
    updatedAt: new Date().toISOString()
  };

  const index =
    records.findIndex(x => x.id === record.id);

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  HRMS.set("leaves", records);

  if (record.status === "Approved") {
    applyApprovedLeave(record);
  }

  notify(
    index >= 0 ? "Leave updated." : "Leave saved.",
    "success"
  );

  resetLeave();
  renderLeaves(leaveSearch.value);
});

function applyApprovedLeave(leave) {
  const attendance = HRMS.get("attendance");

  let date = new Date(leave.from + "T00:00:00");
  const end = new Date(leave.to + "T00:00:00");

  const status =
    leave.type === "Unpaid"
      ? "A"
      : ["EL", "CL", "SL"].includes(leave.type)
        ? leave.type
        : "EL";

  while (date <= end) {
    const dateString = localDate(date);

    const existing = attendance.find(item =>
      item.employeeId === leave.employeeId &&
      item.date === dateString
    );

    if (!existing) {
      attendance.push({
        id: HRMS.generateId("ATT"),
        employeeId: leave.employeeId,
        date: dateString,
        shift: "",
        shiftHours: 0,
        inTime: "",
        outTime: "",
        breakMinutes: 0,
        workingHours: 0,
        otHours: 0,
        status,
        remarks: `Approved Leave: ${leave.type}`,
        leaveId: leave.id,
        updatedAt: new Date().toISOString()
      });
    } else if (existing.leaveId === leave.id) {
      existing.status = status;
      existing.remarks = `Approved Leave: ${leave.type}`;
    }

    date.setDate(date.getDate() + 1);
  }

  HRMS.set("attendance", attendance);
}

function removeGeneratedLeaveAttendance(id) {
  const attendance = HRMS.get("attendance");

  HRMS.set(
    "attendance",
    attendance.filter(item => item.leaveId !== id)
  );
}

function editLeave(id) {
  const record =
    HRMS.get("leaves").find(x => x.id === id);

  if (!record) return;

  removeGeneratedLeaveAttendance(id);

  leaveId.value = record.id;
  employeeField.value = record.employeeId;
  typeField.value = record.type;
  fromField.value = record.from;
  toField.value = record.to;
  daysField.value = record.days;
  reasonField.value = record.reason || "";
  statusField.value = record.status || "Pending";

  document.getElementById("leaveSave").textContent =
    "Update Leave";

  window.scrollTo({top: 0, behavior: "smooth"});
}

function deleteLeave(id) {
  if (!confirm("Delete this leave record?")) return;

  removeGeneratedLeaveAttendance(id);

  HRMS.set(
    "leaves",
    HRMS.get("leaves").filter(x => x.id !== id)
  );

  notify("Leave deleted.", "success");
  renderLeaves(leaveSearch.value);
}

function renderLeaves(filter = "") {
  const employees = HRMS.get("employees");
  const query = filter.toLowerCase();

  const records = HRMS.get("leaves")
    .slice()
    .sort((a,b) => b.from.localeCompare(a.from))
    .filter(record => {
      const emp =
        employees.find(e => e.id === record.employeeId);

      return [
        emp?.code,
        emp?.name,
        record.type,
        record.status,
        record.reason
      ].join(" ").toLowerCase().includes(query);
    });

  leaveTable.innerHTML = "";

  if (!records.length) {
    leaveTable.innerHTML =
      '<tr><td colspan="8" class="empty-row">No leave records found.</td></tr>';
    return;
  }

  records.forEach(record => {
    const emp =
      employees.find(e => e.id === record.employeeId);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${safe(emp ? `${emp.code} - ${emp.name}` : "")}</td>
      <td>${safe(record.type)}</td>
      <td>${safe(record.from)}</td>
      <td>${safe(record.to)}</td>
      <td>${record.days}</td>
      <td>${safe(record.reason)}</td>
      <td>${safe(record.status)}</td>
      <td class="action-buttons">
        <button class="btn-small"
          onclick="editLeave('${record.id}')">Edit</button>
        <button class="btn-small danger"
          onclick="deleteLeave('${record.id}')">Delete</button>
      </td>
    `;

    leaveTable.appendChild(row);
  });
}

function resetLeave() {
  leaveForm.reset();
  leaveId.value = "";
  daysField.value = "";
  statusField.value = "Pending";
  document.getElementById("leaveSave").textContent =
    "Save Leave";
}

document.getElementById("leaveClear")
  .addEventListener("click", resetLeave);

leaveSearch.addEventListener("input", () =>
  renderLeaves(leaveSearch.value)
);

function localDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function safe(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
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
renderLeaves();
