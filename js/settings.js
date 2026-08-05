const form = document.getElementById("settingsForm");

const fields = [
  "companyName",
  "companyContact",
  "companyEmail",
  "companyAddress",
  "shiftStart",
  "shiftEnd",
  "shiftHours",
  "breakMinutes",
  "lateMinutes",
  "halfDayHours",
  "weeklyOff",
  "salaryDivisor",
  "payrollShiftHours",
  "otMultiplier",
  "pfRate",
  "esiRate",
  "lwfAmount",
  "attendanceAward",
  "canteenRule",
  "canteenAmount",
  "roundingRule",
  "payableP",
  "payableA",
  "payableHD",
  "payableEL",
  "payableCL",
  "payableSL",
  "payableWO",
  "payableHoliday"
];

let logoData = "";

function loadSettings() {
  const settings = HRMS.getObject("salarySettings");

  fields.forEach(id => {
    const element = document.getElementById(id);

    if (
      element &&
      settings[id] !== undefined &&
      settings[id] !== null
    ) {
      element.value = settings[id];
    }
  });

  logoData = settings.companyLogo || "";

  showLogo();

  /*
    Only payable-day defaults are initialized when
    no saved settings exist. Salary/rate fields remain
    empty until configured by the user.
  */

  setDefault("payableP", 1);
  setDefault("payableA", 0);
  setDefault("payableHD", 0.5);
  setDefault("payableEL", 1);
  setDefault("payableCL", 1);
  setDefault("payableSL", 1);
  setDefault("payableWO", 1);
  setDefault("payableHoliday", 1);
}

function setDefault(id, value) {
  const element = document.getElementById(id);

  if (element.value === "") {
    element.value = value;
  }
}

document
  .getElementById("companyLogo")
  .addEventListener("change", function() {

    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please select an image file.", "error");
      this.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
      logoData = event.target.result;
      showLogo();
    };

    reader.readAsDataURL(file);
  });

function showLogo() {
  const preview = document.getElementById("logoPreview");

  if (!logoData) {
    preview.innerHTML = "No Logo";
    return;
  }

  preview.innerHTML =
    `<img src="${logoData}" alt="Company Logo">`;
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const salaryDivisor =
    Number(document.getElementById("salaryDivisor").value);

  const payrollShiftHours =
    Number(document.getElementById("payrollShiftHours").value);

  const otMultiplier =
    Number(document.getElementById("otMultiplier").value);

  if (salaryDivisor <= 0) {
    notify("Salary Divisor must be greater than 0.", "error");
    return;
  }

  if (payrollShiftHours <= 0) {
    notify("Payroll Shift Hours must be greater than 0.", "error");
    return;
  }

  if (otMultiplier < 0) {
    notify("OT Multiplier cannot be negative.", "error");
    return;
  }

  const settings = {};

  fields.forEach(id => {
    const element = document.getElementById(id);

    if (!element) return;

    if (
      element.type === "number"
    ) {
      settings[id] =
        element.value === ""
          ? ""
          : Number(element.value);
    } else {
      settings[id] = element.value;
    }
  });

  settings.companyLogo = logoData;

  /*
    Attendance page uses these same settings.
  */

  settings.shiftHours =
    Number(settings.shiftHours) || "";

  settings.breakMinutes =
    Number(settings.breakMinutes) || 0;

  settings.updatedAt =
    new Date().toISOString();

  HRMS.setObject("salarySettings", settings);

  notify("Settings saved successfully.", "success");
});

function notify(message, type) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

loadSettings();
