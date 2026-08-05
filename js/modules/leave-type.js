document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "self_hrms_leave_types";

  const form = document.getElementById("leaveTypeForm");
  const recordId = document.getElementById("recordId");

  const leaveCode = document.getElementById("leaveCode");
  const leaveName = document.getElementById("leaveName");
  const leaveCategory = document.getElementById("leaveCategory");

  const annualEntitlement =
    document.getElementById("annualEntitlement");

  const maxDaysRequest =
    document.getElementById("maxDaysRequest");

  const minDaysRequest =
    document.getElementById("minDaysRequest");

  const halfDayAllowed =
    document.getElementById("halfDayAllowed");

  const carryForward =
    document.getElementById("carryForward");

  const maxCarryForward =
    document.getElementById("maxCarryForward");

  const requiresApproval =
    document.getElementById("requiresApproval");

  const status =
    document.getElementById("status");

  const description =
    document.getElementById("description");

  const table =
    document.getElementById("leaveTypeTable");

  const search =
    document.getElementById("leaveTypeSearch");

  const saveBtn =
    document.getElementById("saveBtn");

  const cancelBtn =
    document.getElementById("cancelBtn");

  const message =
    document.getElementById("message");


  function getLeaveTypes() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function saveLeaveTypes(data) {
    localStorage.setItem(
      STORAGE_KEY,
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


  function updateCarryForwardField() {

    if (carryForward.value === "Yes") {

      maxCarryForward.disabled = false;

    } else {

      maxCarryForward.value = "0";
      maxCarryForward.disabled = true;

    }
  }


  function updateCategoryRules() {

    if (leaveCategory.value === "Unpaid") {

      annualEntitlement.value = "0";
      carryForward.value = "No";
      maxCarryForward.value = "0";

      annualEntitlement.disabled = true;
      carryForward.disabled = true;
      maxCarryForward.disabled = true;

    } else {

      annualEntitlement.disabled = false;
      carryForward.disabled = false;

      updateCarryForwardField();
    }
  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    leaveCategory.value = "Paid";
    annualEntitlement.value = "0";
    maxDaysRequest.value = "0";
    minDaysRequest.value = "0.5";
    halfDayAllowed.value = "Yes";
    carryForward.value = "No";
    maxCarryForward.value = "0";
    requiresApproval.value = "Yes";
    status.value = "Active";

    saveBtn.textContent =
      "Save Leave Type";

    message.textContent = "";

    updateCategoryRules();

    leaveCode.focus();
  }


  function renderLeaveTypes(filter = "") {

    const leaveTypes = getLeaveTypes();

    const query =
      filter.trim().toLowerCase();

    const filtered =
      leaveTypes.filter(item => {

        const text = [
          item.code,
          item.name,
          item.category,
          item.annualEntitlement,
          item.halfDayAllowed,
          item.carryForward,
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
          <td
            colspan="8"
            style="text-align:center;"
          >
            No leave type records found.
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
          ${escapeHTML(item.code)}
        </td>

        <td>
          ${escapeHTML(item.name)}
        </td>

        <td>
          ${escapeHTML(item.category)}
        </td>

        <td>
          ${escapeHTML(item.annualEntitlement)}
        </td>

        <td>
          ${escapeHTML(item.halfDayAllowed)}
        </td>

        <td>
          ${escapeHTML(item.carryForward)}
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


  leaveCategory.addEventListener(
    "change",
    updateCategoryRules
  );


  carryForward.addEventListener(
    "change",
    updateCarryForwardField
  );


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const code =
        leaveCode.value
          .trim()
          .toUpperCase();

      const name =
        leaveName.value.trim();


      if (!code || !name) {

        message.textContent =
          "Leave Code and Leave Name are required.";

        return;
      }


      const annual =
        leaveCategory.value === "Paid"
          ? Number(annualEntitlement.value) || 0
          : 0;

      const minimum =
        Number(minDaysRequest.value) || 0;

      const maximum =
        Number(maxDaysRequest.value) || 0;


      if (minimum <= 0) {

        message.textContent =
          "Minimum days must be greater than zero.";

        return;
      }


      if (
        maximum > 0 &&
        minimum > maximum
      ) {

        message.textContent =
          "Minimum days cannot exceed maximum days per request.";

        return;
      }


      const maxCarry =
        carryForward.value === "Yes"
          ? Number(maxCarryForward.value) || 0
          : 0;


      if (
        leaveCategory.value === "Paid" &&
        carryForward.value === "Yes" &&
        maxCarry < 0
      ) {

        message.textContent =
          "Maximum carry forward days are invalid.";

        return;
      }


      const leaveTypes =
        getLeaveTypes();

      const editingId =
        recordId.value;


      const duplicate =
        leaveTypes.some(item =>

          String(item.code)
            .toLowerCase() ===
          code.toLowerCase()

          &&

          String(item.id) !==
          String(editingId)

        );


      if (duplicate) {

        message.textContent =
          "Leave Code already exists.";

        leaveCode.focus();

        return;
      }


      const leaveType = {

        id:
          editingId || generateId(),

        code,

        name,

        category:
          leaveCategory.value,

        annualEntitlement:
          annual,

        maxDaysRequest:
          maximum,

        minDaysRequest:
          minimum,

        halfDayAllowed:
          halfDayAllowed.value,

        carryForward:
          leaveCategory.value === "Paid"
            ? carryForward.value
            : "No",

        maxCarryForward:
          leaveCategory.value === "Paid"
            ? maxCarry
            : 0,

        requiresApproval:
          requiresApproval.value,

        status:
          status.value,

        description:
          description.value.trim()

      };


      if (editingId) {

        const index =
          leaveTypes.findIndex(
            item =>
              String(item.id) ===
              String(editingId)
          );


        if (index !== -1) {
          leaveTypes[index] =
            leaveType;
        }


        message.textContent =
          "Leave Type updated successfully.";

      } else {

        leaveTypes.push(
          leaveType
        );

        message.textContent =
          "Leave Type saved successfully.";
      }


      saveLeaveTypes(
        leaveTypes
      );

      renderLeaveTypes(
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

      const leaveTypes =
        getLeaveTypes();

      const item =
        leaveTypes.find(
          leaveType =>
            String(leaveType.id) ===
            String(id)
        );


      if (!item) return;


      if (action === "edit") {

        recordId.value =
          item.id;

        leaveCode.value =
          item.code || "";

        leaveName.value =
          item.name || "";

        leaveCategory.value =
          item.category || "Paid";

        annualEntitlement.value =
          item.annualEntitlement ?? 0;

        maxDaysRequest.value =
          item.maxDaysRequest ?? 0;

        minDaysRequest.value =
          item.minDaysRequest ?? 0.5;

        halfDayAllowed.value =
          item.halfDayAllowed || "Yes";

        carryForward.value =
          item.carryForward || "No";

        maxCarryForward.value =
          item.maxCarryForward ?? 0;

        requiresApproval.value =
          item.requiresApproval || "Yes";

        status.value =
          item.status || "Active";

        description.value =
          item.description || "";

        updateCategoryRules();

        saveBtn.textContent =
          "Update Leave Type";

        message.textContent =
          "Editing Leave Type.";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }


      if (action === "delete") {

        const confirmed =
          confirm(
            `Delete Leave Type "${item.name}"?`
          );


        if (!confirmed) return;


        const updated =
          leaveTypes.filter(
            leaveType =>
              String(leaveType.id) !==
              String(id)
          );


        saveLeaveTypes(updated);

        renderLeaveTypes(
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
      renderLeaveTypes(
        search.value
      );
    }
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  updateCategoryRules();
  renderLeaveTypes();

});
