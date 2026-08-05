document.addEventListener("DOMContentLoaded", () => {

  const HOLIDAY_KEY = "self_hrms_holidays";
  const BRANCH_KEY = "self_hrms_branches";

  const form = document.getElementById("holidayForm");
  const recordId = document.getElementById("recordId");
  const holidayDate = document.getElementById("holidayDate");
  const holidayName = document.getElementById("holidayName");
  const holidayType = document.getElementById("holidayType");
  const branch = document.getElementById("branch");
  const status = document.getElementById("status");
  const description = document.getElementById("description");

  const table = document.getElementById("holidayTable");
  const search = document.getElementById("holidaySearch");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const message = document.getElementById("message");


  function getData(key) {
    try {
      return JSON.parse(
        localStorage.getItem(key)
      ) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function saveHolidays(data) {
    localStorage.setItem(
      HOLIDAY_KEY,
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


  function loadBranches() {

    const selected = branch.value;

    branch.innerHTML =
      '<option value="">All Branches</option>';

    getData(BRANCH_KEY)
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value = item.id;

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


  function getBranchName(id) {

    if (!id) {
      return "All Branches";
    }

    const item =
      getData(BRANCH_KEY).find(
        branchItem =>
          String(branchItem.id) ===
          String(id)
      );

    if (!item) {
      return "-";
    }

    return (
      item.name ||
      item.branchName ||
      item.code ||
      item.branchCode ||
      "-"
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


  function formatDate(date) {

    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    holidayType.value = "National";
    status.value = "Active";

    saveBtn.textContent =
      "Save Holiday";

    message.textContent = "";

    loadBranches();

    holidayDate.focus();
  }


  function renderHolidays(filter = "") {

    const holidays =
      getData(HOLIDAY_KEY);

    const query =
      filter.trim().toLowerCase();


    const filtered =
      holidays
        .filter(item => {

          const text = [
            item.date,
            item.name,
            item.type,
            getBranchName(item.branch),
            item.status,
            item.description
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(query);

        })
        .sort((a, b) =>
          String(a.date).localeCompare(
            String(b.date)
          )
        );


    table.innerHTML = "";


    if (!filtered.length) {

      table.innerHTML = `
        <tr>
          <td
            colspan="6"
            style="text-align:center;"
          >
            No holiday records found.
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
          ${escapeHTML(formatDate(item.date))}
        </td>

        <td>
          ${escapeHTML(item.name)}
        </td>

        <td>
          ${escapeHTML(item.type)}
        </td>

        <td>
          ${escapeHTML(
            getBranchName(item.branch)
          )}
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


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const date =
        holidayDate.value;

      const name =
        holidayName.value.trim();


      if (!date || !name) {

        message.textContent =
          "Holiday Date and Holiday Name are required.";

        return;
      }


      const holidays =
        getData(HOLIDAY_KEY);

      const editingId =
        recordId.value;


      /*
       * Same date is allowed for different branches,
       * but duplicate date + branch is prevented.
       */
      const duplicate =
        holidays.some(item =>

          item.date === date &&

          String(item.branch || "") ===
          String(branch.value || "") &&

          String(item.id) !==
          String(editingId)

        );


      if (duplicate) {

        message.textContent =
          "Holiday already exists for this date and branch.";

        return;
      }


      const holiday = {

        id:
          editingId || generateId(),

        date,

        name,

        type:
          holidayType.value,

        branch:
          branch.value,

        status:
          status.value,

        description:
          description.value.trim()

      };


      if (editingId) {

        const index =
          holidays.findIndex(
            item =>
              String(item.id) ===
              String(editingId)
          );


        if (index !== -1) {
          holidays[index] = holiday;
        }


        message.textContent =
          "Holiday updated successfully.";

      } else {

        holidays.push(holiday);

        message.textContent =
          "Holiday saved successfully.";

      }


      saveHolidays(holidays);

      renderHolidays(
        search.value
      );


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


      const holidays =
        getData(HOLIDAY_KEY);


      const item =
        holidays.find(
          holiday =>
            String(holiday.id) ===
            String(id)
        );


      if (!item) return;


      if (action === "edit") {

        recordId.value =
          item.id;

        holidayDate.value =
          item.date || "";

        holidayName.value =
          item.name || "";

        holidayType.value =
          item.type || "National";

        loadBranches();

        branch.value =
          item.branch || "";

        status.value =
          item.status || "Active";

        description.value =
          item.description || "";

        saveBtn.textContent =
          "Update Holiday";

        message.textContent =
          "Editing holiday.";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }


      if (action === "delete") {

        const confirmed =
          confirm(
            `Delete holiday "${item.name}"?`
          );


        if (!confirmed) return;


        const updated =
          holidays.filter(
            holiday =>
              String(holiday.id) !==
              String(id)
          );


        saveHolidays(updated);

        renderHolidays(
          search.value
        );


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

      renderHolidays(
        search.value
      );

    }
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  loadBranches();

  renderHolidays();

});
