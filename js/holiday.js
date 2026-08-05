const form = document.getElementById("holidayForm");
const idField = document.getElementById("holidayId");
const nameField = document.getElementById("holidayName");
const dateField = document.getElementById("holidayDate");
const paidField = document.getElementById("holidayPaid");
const descriptionField =
  document.getElementById("holidayDescription");

const table = document.getElementById("holidayTable");
const search = document.getElementById("holidaySearch");

form.addEventListener("submit", e => {
  e.preventDefault();

  const records = HRMS.get("holidays");

  const duplicate = records.find(x =>
    x.date === dateField.value &&
    x.id !== idField.value
  );

  if (duplicate) {
    notify(
      "A holiday already exists on this date.",
      "error"
    );
    return;
  }

  const record = {
    id: idField.value || HRMS.generateId("HOL"),
    name: nameField.value.trim(),
    date: dateField.value,
    paid: paidField.value,
    description: descriptionField.value.trim()
  };

  const index =
    records.findIndex(x => x.id === record.id);

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  HRMS.set("holidays", records);

  notify(
    index >= 0 ? "Holiday updated." : "Holiday saved.",
    "success"
  );

  resetForm();
  render(search.value);
});

function editHoliday(id) {
  const record =
    HRMS.get("holidays").find(x => x.id === id);

  if (!record) return;

  idField.value = record.id;
  nameField.value = record.name;
  dateField.value = record.date;
  paidField.value = record.paid;
  descriptionField.value = record.description || "";

  document.getElementById("holidaySave").textContent =
    "Update Holiday";

  window.scrollTo({top:0, behavior:"smooth"});
}

function deleteHoliday(id) {
  if (!confirm("Delete this holiday?")) return;

  HRMS.set(
    "holidays",
    HRMS.get("holidays").filter(x => x.id !== id)
  );

  notify("Holiday deleted.", "success");
  render(search.value);
}

function render(filter = "") {
  const query = filter.toLowerCase();

  const records = HRMS.get("holidays")
    .slice()
    .sort((a,b) => a.date.localeCompare(b.date))
    .filter(x =>
      [
        x.date,
        x.name,
        x.paid,
        x.description
      ].join(" ").toLowerCase().includes(query)
    );

  table.innerHTML = "";

  if (!records.length) {
    table.innerHTML =
      '<tr><td colspan="5" class="empty-row">No holidays found.</td></tr>';
    return;
  }

  records.forEach(record => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${safe(record.date)}</td>
      <td>${safe(record.name)}</td>
      <td>${safe(record.paid)}</td>
      <td>${safe(record.description)}</td>
      <td class="action-buttons">
        <button class="btn-small"
          onclick="editHoliday('${record.id}')">
          Edit
        </button>

        <button class="btn-small danger"
          onclick="deleteHoliday('${record.id}')">
          Delete
        </button>
      </td>
    `;

    table.appendChild(row);
  });
}

function resetForm() {
  form.reset();
  idField.value = "";
  paidField.value = "Paid";

  document.getElementById("holidaySave").textContent =
    "Save Holiday";
}

document.getElementById("holidayClear")
  .addEventListener("click", resetForm);

search.addEventListener("input", () =>
  render(search.value)
);

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

render();
