document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("departmentForm");
  const recordId = document.getElementById("recordId");
  const departmentCode = document.getElementById("departmentCode");
  const departmentName = document.getElementById("departmentName");
  const branchSelect = document.getElementById("branch");
  const status = document.getElementById("status");
  const description = document.getElementById("description");
  const table = document.getElementById("departmentTable");
  const search = document.getElementById("departmentSearch");
  const cancelBtn = document.getElementById("cancelBtn");
  const message = document.getElementById("message");

  const STORAGE_KEY = "self_hrms_departments";
  const BRANCH_KEY = "self_hrms_branches";

  function getDepartments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function saveDepartments(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getBranches() {
    try {
      return JSON.parse(localStorage.getItem(BRANCH_KEY)) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function loadBranches() {
    const selectedValue = branchSelect.value;

    branchSelect.innerHTML =
      '<option value="">Select Branch</option>';

    getBranches()
      .filter(branch => branch.status !== "Inactive")
      .forEach(branch => {
        const option = document.createElement("option");

        option.value =
          branch.id ||
          branch.branchCode ||
          branch.code ||
          branch.name ||
          branch.branchName;

        option.textContent =
          branch.branchName ||
          branch.name ||
          branch.branchCode ||
          branch.code ||
          "Branch";

        branchSelect.appendChild(option);
      });

    branchSelect.value = selectedValue;
  }

  function getBranchName(value) {
    if (!value) return "-";

    const branch = getBranches().find(item =>
      String(
        item.id ||
        item.branchCode ||
        item.code ||
        item.name ||
        item.branchName
      ) === String(value)
    );

    if (!branch) return value;

    return (
      branch.branchName ||
      branch.name ||
      branch.branchCode ||
      branch.code ||
      value
    );
  }

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderDepartments(filter = "") {
    const departments = getDepartments();

    const keyword = filter.trim().toLowerCase();

    const filtered = departments.filter(item => {
      const text = [
        item.code,
        item.name,
        getBranchName(item.branch),
        item.status,
        item.description
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });

    table.innerHTML = "";

    if (!filtered.length) {
      table.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;">
            No department records found
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(item => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHTML(item.code)}</td>
        <td>${escapeHTML(item.name)}</td>
        <td>${escapeHTML(getBranchName(item.branch))}</td>
        <td>${escapeHTML(item.status)}</td>
        <td>${escapeHTML(item.description || "-")}</td>
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

  function clearForm() {
    form.reset();
    recordId.value = "";
    status.value = "Active";
    message.textContent = "";
    loadBranches();
    departmentCode.focus();
  }

  function createId() {
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

  form.addEventListener("submit", event => {
    event.preventDefault();

    const code = departmentCode.value.trim();
    const name = departmentName.value.trim();

    if (!code || !name) {
      message.textContent =
        "Department Code and Department Name are required.";
      return;
    }

    const departments = getDepartments();
    const editingId = recordId.value;

    const duplicate = departments.some(item =>
      item.code.toLowerCase() === code.toLowerCase() &&
      String(item.id) !== String(editingId)
    );

    if (duplicate) {
      message.textContent =
        "Department Code already exists.";
      departmentCode.focus();
      return;
    }

    const department = {
      id: editingId || createId(),
      code,
      name,
      branch: branchSelect.value,
      status: status.value,
      description: description.value.trim()
    };

    if (editingId) {
      const index = departments.findIndex(
        item => String(item.id) === String(editingId)
      );

      if (index !== -1) {
        departments[index] = department;
      }
    } else {
      departments.push(department);
    }

    saveDepartments(departments);

    message.textContent = editingId
      ? "Department updated successfully."
      : "Department saved successfully.";

    renderDepartments(search.value);

    setTimeout(() => {
      clearForm();
    }, 700);
  });

  table.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    const departments = getDepartments();
    const department = departments.find(
      item => String(item.id) === String(id)
    );

    if (!department) return;

    if (action === "edit") {
      recordId.value = department.id;
      departmentCode.value = department.code;
      departmentName.value = department.name;

      loadBranches();
      branchSelect.value = department.branch || "";

      status.value = department.status || "Active";
      description.value = department.description || "";

      message.textContent = "Editing department.";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    if (action === "delete") {
      const confirmed = confirm(
        `Delete department "${department.name}"?`
      );

      if (!confirmed) return;

      const updated = departments.filter(
        item => String(item.id) !== String(id)
      );

      saveDepartments(updated);
      renderDepartments(search.value);

      if (String(recordId.value) === String(id)) {
        clearForm();
      }
    }
  });

  search.addEventListener("input", () => {
    renderDepartments(search.value);
  });

  cancelBtn.addEventListener("click", clearForm);

  loadBranches();
  renderDepartments();
});
