document.addEventListener("DOMContentLoaded", () => {

  const ATTENDANCE_KEY = "self_hrms_attendance";
  const EMPLOYEE_KEY = "self_hrms_employees";
  const SHIFT_KEY = "self_hrms_shifts";

  const form = document.getElementById("attendanceForm");
  const recordId = document.getElementById("recordId");
  const attendanceDate = document.getElementById("attendanceDate");
  const employee = document.getElementById("employee");
  const attendanceStatus = document.getElementById("attendanceStatus");
  const shift = document.getElementById("shift");
  const inTime = document.getElementById("inTime");
  const outTime = document.getElementById("outTime");
  const otHours = document.getElementById("otHours");
  const lateMinutes = document.getElementById("lateMinutes");
  const earlyOutMinutes = document.getElementById("earlyOutMinutes");
  const remarks = document.getElementById("remarks");

  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const message = document.getElementById("message");

  const table = document.getElementById("attendanceTable");
  const search = document.getElementById("attendanceSearch");
  const filterFrom = document.getElementById("filterFrom");
  const filterTo = document.getElementById("filterTo");
  const statusFilter = document.getElementById("statusFilter");


  function getData(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function saveAttendance(data) {
    localStorage.setItem(
      ATTENDANCE_KEY,
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


  function loadEmployees(selected = "") {

    employee.innerHTML =
      '<option value="">Select Employee</option>';

    getData(EMPLOYEE_KEY)
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value = item.id;

        option.textContent =
          `${item.code || ""} - ${item.name || "Employee"}`;

        employee.appendChild(option);
      });

    employee.value = selected;
  }


  function loadShifts(selected = "") {

    shift.innerHTML =
      '<option value="">Select Shift</option>';

    getData(SHIFT_KEY)
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value = item.id;

        option.textContent =
          item.name || item.code || "Shift";

        shift.appendChild(option);
      });

    shift.value = selected;
  }


  function getEmployeeName(id) {

    const item = getData(EMPLOYEE_KEY).find(
      emp => String(emp.id) === String(id)
    );

    if (!item) return "-";

    return `${item.code || ""} - ${item.name || ""}`;
  }


  function getShiftName(id) {

    if (!id) return "-";

    const item = getData(SHIFT_KEY).find(
      record => String(record.id) === String(id)
    );

    if (!item) return "-";

    return item.name || item.code || "-";
  }


  function getStatusName(code) {

    const names = {
      P: "Present",
      A: "Absent",
      HD: "Half Day",
      PL: "Paid Leave",
      UL: "Unpaid Leave",
      WO: "Weekly Off",
      H: "Holiday"
    };

    return names[code] || code;
  }


  function setToday() {

    const today = new Date();

    const year = today.getFullYear();

    const month =
      String(today.getMonth() + 1).padStart(2, "0");

    const day =
      String(today.getDate()).padStart(2, "0");

    attendanceDate.value =
      `${year}-${month}-${day}`;
  }


  function updateStatusFields() {

    const presentStatuses = ["P", "HD"];

    const enabled =
      presentStatuses.includes(attendanceStatus.value);

    inTime.disabled = !enabled;
    outTime.disabled = !enabled;

    /*
      OT remains manual.
      It is only available for Present attendance.
    */
    otHours.disabled =
      attendanceStatus.value !== "P";

    lateMinutes.disabled = !enabled;
    earlyOutMinutes.disabled = !enabled;


    if (!enabled) {
      inTime.value = "";
      outTime.value = "";
      lateMinutes.value = "0";
      earlyOutMinutes.value = "0";
    }

    if (attendanceStatus.value !== "P") {
      otHours.value = "0";
    }
  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    setToday();

    attendanceStatus.value = "P";

    otHours.value = "0";
    lateMinutes.value = "0";
    earlyOutMinutes.value = "0";

    saveBtn.textContent =
      "Save Attendance";

    message.textContent = "";

    loadEmployees();
    loadShifts();

    updateStatusFields();

    employee.focus();
  }


  function validateForm() {

    if (!attendanceDate.value) {
      return "Attendance Date is required.";
    }

    if (!employee.value) {
      return "Please select Employee.";
    }

    if (!attendanceStatus.value) {
      return "Attendance Status is required.";
    }

    if (Number(otHours.value) < 0) {
      return "OT Hours cannot be negative.";
    }

    if (Number(lateMinutes.value) < 0) {
      return "Late Minutes cannot be negative.";
    }

    if (Number(earlyOutMinutes.value) < 0) {
      return "Early Out Minutes cannot be negative.";
    }

    return "";
  }


  function renderAttendance() {

    const records = getData(ATTENDANCE_KEY);

    const query =
      search.value.trim().toLowerCase();

    const from = filterFrom.value;
    const to = filterTo.value;
    const statusValue = statusFilter.value;


    const filtered = records
      .filter(item => {

        if (from && item.date < from) {
          return false;
        }

        if (to && item.date > to) {
          return false;
        }

        if (
          statusValue &&
          item.status !== statusValue
        ) {
          return false;
        }

        const text = [
          item.date,
          getEmployeeName(item.employee),
          getStatusName(item.status),
          getShiftName(item.shift),
          item.inTime,
          item.outTime,
          item.otHours,
          item.remarks
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(query);
      })
      .sort((a, b) => {

        const dateCompare =
          String(b.date).localeCompare(String(a.date));

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return getEmployeeName(a.employee)
          .localeCompare(getEmployeeName(b.employee));
      });


    table.innerHTML = "";


    if (!filtered.length) {

      table.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center;">
            No attendance records found.
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
          ${escapeHTML(item.date)}
        </td>

        <td>
          ${escapeHTML(
            getEmployeeName(item.employee)
          )}
        </td>

        <td>
          ${escapeHTML(
            getStatusName(item.status)
          )}
        </td>

        <td>
          ${escapeHTML(
            getShiftName(item.shift)
          )}
        </td>

        <td>
          ${escapeHTML(item.inTime || "-")}
        </td>

        <td>
          ${escapeHTML(item.outTime || "-")}
        </td>

        <td>
          ${escapeHTML(item.otHours ?? 0)}
        </td>

        <td>
          ${escapeHTML(item.lateMinutes ?? 0)}
        </td>

        <td>
          ${escapeHTML(item.earlyOutMinutes ?? 0)}
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


  employee.addEventListener("change", () => {

    /*
      Employee's assigned shift is only suggested.
      User can still manually change the shift.
    */

    const selectedEmployee =
      getData(EMPLOYEE_KEY).find(
        item =>
          String(item.id) ===
          String(employee.value)
      );

    if (
      selectedEmployee &&
      selectedEmployee.shift
    ) {
      shift.value =
        selectedEmployee.shift;
    }
  });


  attendanceStatus.addEventListener(
    "change",
    updateStatusFields
  );


  form.addEventListener("submit", event => {

    event.preventDefault();

    const error = validateForm();

    if (error) {
      message.textContent = error;
      return;
    }


    const records =
      getData(ATTENDANCE_KEY);

    const editingId =
      recordId.value;


    /*
      Only one attendance record per
      employee per date is allowed.
    */
    const duplicate =
      records.some(item =>

        item.date === attendanceDate.value &&

        String(item.employee) ===
        String(employee.value)

        &&

        String(item.id) !==
        String(editingId)

      );


    if (duplicate) {

      message.textContent =
        "Attendance already exists for this employee on this date.";

      return;
    }


    const oldRecord =
      records.find(
        item =>
          String(item.id) ===
          String(editingId)
      );


    const attendance = {

      id:
        editingId || generateId(),

      date:
        attendanceDate.value,

      employee:
        employee.value,

      status:
        attendanceStatus.value,

      shift:
        shift.value,

      inTime:
        inTime.disabled
          ? ""
          : inTime.value,

      outTime:
        outTime.disabled
          ? ""
          : outTime.value,

      /*
        OT is intentionally stored exactly
        as manually entered by the user.
      */
      otHours:
        otHours.disabled
          ? 0
          : Number(otHours.value) || 0,

      lateMinutes:
        lateMinutes.disabled
          ? 0
          : Number(lateMinutes.value) || 0,

      earlyOutMinutes:
        earlyOutMinutes.disabled
          ? 0
          : Number(earlyOutMinutes.value) || 0,

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
        records[index] = attendance;
      }

      message.textContent =
        "Attendance updated successfully.";

    } else {

      records.push(attendance);

      message.textContent =
        "Attendance saved successfully.";
    }


    saveAttendance(records);

    renderAttendance();


    setTimeout(
      resetForm,
      700
    );

  });


  table.addEventListener("click", event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );

    if (!button) return;


    const id =
      button.dataset.id;

    const action =
      button.dataset.action;

    const records =
      getData(ATTENDANCE_KEY);

    const item =
      records.find(
        record =>
          String(record.id) ===
          String(id)
      );


    if (!item) return;


    if (action === "edit") {

      recordId.value = item.id;

      attendanceDate.value =
        item.date || "";

      loadEmployees(
        item.employee || ""
      );

      attendanceStatus.value =
        item.status || "P";

      loadShifts(
        item.shift || ""
      );

      updateStatusFields();

      inTime.value =
        item.inTime || "";

      outTime.value =
        item.outTime || "";

      otHours.value =
        item.otHours ?? 0;

      lateMinutes.value =
        item.lateMinutes ?? 0;

      earlyOutMinutes.value =
        item.earlyOutMinutes ?? 0;

      remarks.value =
        item.remarks || "";

      saveBtn.textContent =
        "Update Attendance";

      message.textContent =
        "Editing Attendance.";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }


    if (action === "delete") {

      const confirmed =
        confirm(
          `Delete attendance for ${getEmployeeName(item.employee)} on ${item.date}?`
        );

      if (!confirmed) return;


      const updated =
        records.filter(
          record =>
            String(record.id) !==
            String(id)
        );


      saveAttendance(updated);

      renderAttendance();


      if (
        String(recordId.value) ===
        String(id)
      ) {
        resetForm();
      }
    }

  });


  search.addEventListener(
    "input",
    renderAttendance
  );

  filterFrom.addEventListener(
    "change",
    renderAttendance
  );

  filterTo.addEventListener(
    "change",
    renderAttendance
  );

  statusFilter.addEventListener(
    "change",
    renderAttendance
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  loadEmployees();
  loadShifts();

  setToday();
  updateStatusFields();
  renderAttendance();

});
