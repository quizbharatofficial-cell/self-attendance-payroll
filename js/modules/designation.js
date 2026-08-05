document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "self_hrms_designations";
  const DEPARTMENT_KEY = "self_hrms_departments";

  const form = document.getElementById("designationForm");
  const recordId = document.getElementById("recordId");
  const designationCode = document.getElementById("designationCode");
  const designationName = document.getElementById("designationName");
  const department = document.getElementById("department");
  const grade = document.getElementById("grade");
  const status = document.getElementById("status");
  const description = document.getElementById("description");

  const table = document.getElementById("designationTable");
  const search = document.getElementById("designationSearch");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");
  const message = document.getElementById("message");


  function getData(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function saveDesignations(data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  }


  function loadDepartments() {

    const departments = getData(DEPARTMENT_KEY);

    const selected = department.value;

    department.innerHTML =
      '<option value="">Select Department</option>';

    departments
      .filter(item => item.status !== "Inactive")
      .forEach(item => {

        const option =
          document.createElement("option");

        option.value = item.id;

        option.textContent =
          item.name || item.code;

        department.appendChild(option);

      });

    department.value = selected;
  }


  function getDepartmentName(id) {

    if (!id) return "-";

    const item = getData(DEPARTMENT_KEY)
      .find(dept =>
        String(dept.id) === String(id)
      );

    return item
      ? (item.name || item.code)
      : "-";
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


  function resetForm() {

    form.reset();

    recordId.value = "";

    status.value = "Active";

    saveBtn.textContent =
      "Save Designation";

    message.textContent = "";

    loadDepartments();

    designationCode.focus();
  }


  function renderDesignations(filter = "") {

    const designations =
      getData(STORAGE_KEY);

    const query =
      filter.trim().toLowerCase();

    const filtered =
      designations.filter(item => {

        const text = [
          item.code,
          item.name,
          getDepartmentName(item.department),
          item.grade,
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
          <td colspan="6" style="text-align:center;">
            No designation records found.
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
          ${escapeHTML(
            getDepartmentName(item.department)
          )}
        </td>

        <td>
          ${escapeHTML(item.grade || "-")}
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

      const code =
        designationCode.value
          .trim()
          .toUpperCase();

      const name =
        designationName.value.trim();

      if (!code || !name) {

        message.textContent =
          "Designation Code and Name are required.";

        return;
      }


      const designations =
        getData(STORAGE_KEY);

      const editingId =
        recordId.value;


      const duplicate =
        designations.some(item =>

          String(item.code)
            .toLowerCase() ===
          code.toLowerCase()

          &&

          String(item.id) !==
          String(editingId)

        );


      if (duplicate) {

        message.textContent =
          "Designation Code already exists.";

        designationCode.focus();

        return;
      }


      const designation = {

        id:
          editingId || generateId(),

        code,

        name,

        department:
          department.value,

        grade:
          grade.value.trim(),

        status:
          status.value,

        description:
          description.value.trim()

      };


      if (editingId) {

        const index =
          designations.findIndex(
            item =>
              String(item.id) ===
              String(editingId)
          );

        if (index !== -1) {
          designations[index] =
            designation;
        }

        message.textContent =
          "Designation updated successfully.";

      } else {

        designations.push(
          designation
        );

        message.textContent =
          "Designation saved successfully.";
      }


      saveDesignations(
        designations
      );

      renderDesignations(
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


      const designations =
        getData(STORAGE_KEY);

      const item =
        designations.find(
          designation =>
            String(designation.id) ===
            String(id)
        );


      if (!item) return;


      if (action === "edit") {

        recordId.value =
          item.id;

        designationCode.value =
          item.code || "";

        designationName.value =
          item.name || "";

        loadDepartments();

        department.value =
          item.department || "";

        grade.value =
          item.grade || "";

        status.value =
          item.status || "Active";

        description.value =
          item.description || "";

        saveBtn.textContent =
          "Update Designation";

        message.textContent =
          "Editing designation.";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }


      if (action === "delete") {

        const confirmed =
          confirm(
            `Delete designation "${item.name}"?`
          );

        if (!confirmed) return;


        const updated =
          designations.filter(
            designation =>
              String(designation.id) !==
              String(id)
          );


        saveDesignations(
          updated
        );

        renderDesignations(
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

      renderDesignations(
        search.value
      );

    }
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  loadDepartments();

  renderDesignations();

});
