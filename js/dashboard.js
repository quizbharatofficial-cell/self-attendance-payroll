document.addEventListener("DOMContentLoaded", loadDashboard);

function loadDashboard() {

  const get = key => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  };

  const selfProfiles = get("selfPayrollProfiles");

  const employees =
    get("self_hrms_employees").length
      ? get("self_hrms_employees")
      : (get("employees").length ? get("employees") : selfProfiles.map(profile => ({
          id: profile.employeeId || profile.id,
          name: profile.employeeName || profile.profileName,
          status: "Active"
        })));

  let attendance =
    get("self_hrms_attendance").length
      ? get("self_hrms_attendance")
      : get("attendance");

  if (!attendance.length && selfProfiles.length) {
    attendance = selfProfiles.flatMap(profile =>
      Object.values(profile.attendance || {}).map(record => ({
        ...record,
        employeeId: profile.employeeId || profile.id,
        status: String(record.status || "").toLowerCase() === "present" ? "P" : record.status
      }))
    );
  }

  const payroll =
    get("self_hrms_payroll").length
      ? get("self_hrms_payroll")
      : get("payroll");

  const today = localToday();
  const month = today.slice(0, 7);

  const active = employees.filter(emp =>
    String(emp.status || "Active").toLowerCase() !== "inactive"
  );

  const todayRecords = attendance.filter(item =>
    String(item.date || "") === today
  );

  const status = value =>
    String(value || "").trim().toUpperCase();

  const present = todayRecords.filter(item =>
    status(item.status) === "P"
  ).length;

  const absent = todayRecords.filter(item =>
    status(item.status) === "A"
  ).length;

  const leave = todayRecords.filter(item =>
    ["PL", "UL", "EL", "CL", "SL"].includes(status(item.status))
  ).length;

  const wo = todayRecords.filter(item =>
    status(item.status) === "WO"
  ).length;

  const holiday = todayRecords.filter(item =>
    ["H", "HOLIDAY"].includes(status(item.status))
  ).length;

  const late = todayRecords.filter(item =>
    item.late === true ||
    Number(item.lateMinutes || 0) > 0
  ).length;

  /*
    OT is manual in Payroll.
    Dashboard OT therefore comes from
    current-month saved payroll records,
    not Attendance.
  */
  const monthPayroll = payroll.filter(item =>
    String(item.month || "") === month
  );

  const ot = monthPayroll.reduce(
    (sum, item) =>
      sum + Math.max(0, Number(item.otHours) || 0),
    0
  );

  const generatedIds = new Set(
    monthPayroll.map(item =>
      String(item.employee ?? item.employeeId ?? "")
    )
  );

  const pending = active.filter(emp =>
    !generatedIds.has(String(emp.id))
  ).length;

  setValue("totalEmployees", active.length);
  setValue("presentCount", present);
  setValue("absentCount", absent);
  setValue("leaveCount", leave);
  setValue("woCount", wo);
  setValue("holidayCount", holiday);
  setValue("lateCount", late);
  setValue("otCount", formatNumber(ot));
  setValue("payrollGenerated", generatedIds.size);
  setValue("payrollPending", pending);
}

function localToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month =
    String(date.getMonth() + 1).padStart(2, "0");
  const day =
    String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function setValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(
    "en-IN",
    { maximumFractionDigits: 2 }
  );
}
