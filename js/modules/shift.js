document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "self_hrms_shifts";

  const form = document.getElementById("shiftForm");
  const recordId = document.getElementById("recordId");

  const shiftCode = document.getElementById("shiftCode");
  const shiftName = document.getElementById("shiftName");
  const startTime = document.getElementById("startTime");
  const endTime = document.getElementById("endTime");
  const breakMinutes = document.getElementById("breakMinutes");
  const workingHours = document.getElementById("workingHours");
  const graceIn = document.getElementById("graceIn");
  const graceOut = document.getElementById("graceOut");
  const status = document.getElementById("status");
  const description = document.getElementById("description");

  const table = document.getElementById("shiftTable");
  const search = document.getElementById("shiftSearch");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const message = document.getElementById("message");


  function getShifts() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function saveShifts(shifts) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(shifts)
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


  function timeToMinutes(time) {
    if (!time) return null;

    const parts = time.split(":");

    if (parts.length !== 2) return null;

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    return (hours * 60) + minutes;
  }


  function calculateWorkingMinutes() {

    const start = timeToMinutes(startTime.value);
    const end = timeToMinutes(endTime.value);

    if (start === null || end === null) {
      workingHours.value = "";
      return 0;
    }

    let total = end - start;

    // Overnight shift
    if (total <= 0) {
      total += 24 * 60;
    }

    total -= Number(breakMinutes.value) || 0;

    if (total < 0) {
      total = 0;
    }

    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    workingHours.value =
      `${hours}h ${minutes}m`;

    return total;
  }


  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    breakMinutes.value = "0";
    graceIn.value = "0";
    graceOut.value = "0";
    status.value = "Active";
    workingHours.value = "";

    saveBtn.textContent = "Save Shift";

    message.textContent = "";

    shiftCode.focus();
  }


  function renderShifts(filter = "") {

    const shifts = getShifts();

    const query =
      filter.trim().toLowerCase();

    const filtered =
      shifts.filter(item => {

        const text = [
          item.code,
          item.name,
          item.startTime,
          item.endTime,
          item.status,
          item.description
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(query);
      });


    table.innerHTML = "";


    if (!filtered.length) {

      table.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;">
            No shift records found.
          </td>
        </tr>
      `;

      return;
    }


    filtered.forEach(item => {

      const row =
        document.createElement("tr");

      const hours =
        Math.floor(
          Number(item.workingMinutes || 0) / 60
        );

      const minutes =
        Number(item.workingMinutes || 0) % 60;


      row.innerHTML = `

        <td>${escapeHTML(item.code)}</td>

        <td>${escapeHTML(item.name)}</td>

        <td>${escapeHTML(item.startTime)}</td>

        <td>${escapeHTML(item.endTime)}</td>

        <td>
          ${escapeHTML(item.breakMinutes)} min
        </td>

        <td>
          ${hours}h ${minutes}m
        </td>

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


  startTime.addEventListener(
    "input",
    calculateWorkingMinutes
  );

  endTime.addEventListener(
    "input",
    calculateWorkingMinutes
  );

  breakMinutes.addEventListener(
    "input",
    calculateWorkingMinutes
  );


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const code =
        shiftCode.value
          .trim()
          .toUpperCase();

      const name =
        shiftName.value.trim();


      if (
        !code ||
        !name ||
        !startTime.value ||
        !endTime.value
      ) {

        message.textContent =
          "Shift Code, Name, Start Time and End Time are required.";

        return;
      }


      const shifts = getShifts();

      const editingId =
        recordId.value;


      const duplicate =
        shifts.some(item =>

          String(item.code)
            .toLowerCase() ===
          code.toLowerCase()

          &&

          String(item.id) !==
          String(editingId)

        );


      if (duplicate) {

        message.textContent =
          "Shift Code already exists.";

        shiftCode.focus();

        return;
      }


      const workingMinutes =
        calculateWorkingMinutes();


      if (workingMinutes <= 0) {

        message.textContent =
          "Working hours must be greater than zero.";

        return;
      }


      const shift = {

        id:
          editingId || generateId(),

        code,

        name,

        startTime:
          startTime.value,

        endTime:
          endTime.value,

        breakMinutes:
          Number(breakMinutes.value) || 0,

        workingMinutes,

        graceIn:
          Number(graceIn.value) || 0,

        graceOut:
          Number(graceOut.value) || 0,

        status:
          status.value,

        description:
          description.value.trim()

      };


      if (editingId) {

        const index =
          shifts.findIndex(
            item =>
              String(item.id) ===
              String(editingId)
          );

        if (index !== -1) {
          shifts[index] = shift;
        }

        message.textContent =
          "Shift updated successfully.";

      } else {

        shifts.push(shift);

        message.textContent =
          "Shift saved successfully.";
      }


      saveShifts(shifts);

      renderShifts(search.value);


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

      const shifts =
        getShifts();

      const shift =
        shifts.find(
          item =>
            String(item.id) ===
            String(id)
        );


      if (!shift) return;


      if (action === "edit") {

        recordId.value =
          shift.id;

        shiftCode.value =
          shift.code || "";

        shiftName.value =
          shift.name || "";

        startTime.value =
          shift.startTime || "";

        endTime.value =
          shift.endTime || "";

        breakMinutes.value =
          shift.breakMinutes ?? 0;

        graceIn.value =
          shift.graceIn ?? 0;

        graceOut.value =
          shift.graceOut ?? 0;

        status.value =
          shift.status || "Active";

        description.value =
          shift.description || "";

        calculateWorkingMinutes();

        saveBtn.textContent =
          "Update Shift";

        message.textContent =
          "Editing shift.";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }


      if (action === "delete") {

        const confirmed =
          confirm(
            `Delete shift "${shift.name}"?`
          );

        if (!confirmed) return;


        const updated =
          shifts.filter(
            item =>
              String(item.id) !==
              String(id)
          );


        saveShifts(updated);

        renderShifts(
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

      renderShifts(
        search.value
      );

    }
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  renderShifts();

});

