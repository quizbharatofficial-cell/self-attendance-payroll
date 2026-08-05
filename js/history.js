const table =
  document.getElementById("historyTable");

const search =
  document.getElementById("historySearch");

function renderHistory(filter = "") {

  const query =
    filter.trim().toLowerCase();

  const records =
    HRMS.get("payroll")
      .slice()
      .sort((a,b) =>
        b.month.localeCompare(a.month)
      )
      .filter(item => {

        return [
          item.month,
          item.employeeCode,
          item.employeeName,
          item.status
        ]
        .join(" ")
        .toLowerCase()
        .includes(query);
      });

  table.innerHTML = "";

  if (!records.length) {

    table.innerHTML = `
      <tr>
        <td colspan="9"
        class="empty-row">
        No payroll history found.
        </td>
      </tr>
    `;

    return;
  }

  records.forEach(item => {

    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td>${safe(item.month)}</td>

      <td>
      ${safe(item.employeeCode)}
      -
      ${safe(item.employeeName)}
      </td>

      <td>${number(item.payableDays)}</td>

      <td>${number(item.otHours)}</td>

      <td>₹${money(item.totalEarnings)}</td>

      <td>₹${money(item.totalDeduction)}</td>

      <td>
      <strong>
      ₹${money(item.netSalary)}
      </strong>
      </td>

      <td>${safe(item.status)}</td>

      <td class="action-buttons">

      <button
      class="btn-small"
      onclick="viewSlip('${item.id}')">
      Slip
      </button>

      <button
      class="btn-small"
      onclick="editPayroll('${item.id}')">
      Edit
      </button>

      <button
      class="btn-small danger"
      onclick="deletePayroll('${item.id}')">
      Delete
      </button>

      </td>
    `;

    table.appendChild(row);
  });
}

function viewSlip(id) {

  const record =
    HRMS.get("payroll")
      .find(item => item.id === id);

  if (!record) return;

  sessionStorage.setItem(
    "self_hrms_slip_employee",
    record.employeeId
  );

  sessionStorage.setItem(
    "self_hrms_slip_month",
    record.month
  );

  window.location.href =
    "salary-slip.html";
}

function editPayroll(id) {

  const record =
    HRMS.get("payroll")
      .find(item => item.id === id);

  if (!record) return;

  /*
    Current payroll page recalculates from
    latest attendance and settings.

    Remove old payroll after confirmation,
    then regenerate it.
  */

  if (
    !confirm(
      "Editing payroll will require recalculation. Continue?"
    )
  ) {
    return;
  }

  HRMS.set(
    "payroll",
    HRMS.get("payroll")
      .filter(item => item.id !== id)
  );

  sessionStorage.setItem(
    "self_hrms_payroll_employee",
    record.employeeId
  );

  sessionStorage.setItem(
    "self_hrms_payroll_month",
    record.month
  );

  window.location.href =
    "payroll.html";
}

function deletePayroll(id) {

  if (
    !confirm(
      "Delete this payroll record?"
    )
  ) {
    return;
  }

  HRMS.set(
    "payroll",
    HRMS.get("payroll")
      .filter(item => item.id !== id)
  );

  notify(
    "Payroll deleted.",
    "success"
  );

  renderHistory(search.value);
}

search.addEventListener(
  "input",
  function() {
    renderHistory(this.value);
  }
);

function money(value) {

  return Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
}

function number(value) {

  return Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );
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

  const toast =
    document.getElementById("toast");

  toast.textContent = message;

  toast.className =
    `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

renderHistory();
