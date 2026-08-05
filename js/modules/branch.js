document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "self_hrms_branches";

  const form = document.getElementById("branchForm");
  const recordId = document.getElementById("recordId");

  const branchCode = document.getElementById("branchCode");
  const branchName = document.getElementById("branchName");
  const contactPerson = document.getElementById("contactPerson");
  const branchPhone = document.getElementById("branchPhone");
  const branchEmail = document.getElementById("branchEmail");
  const branchGST = document.getElementById("branchGST");
  const branchStatus = document.getElementById("branchStatus");
  const branchState = document.getElementById("branchState");
  const branchCity = document.getElementById("branchCity");
  const branchPin = document.getElementById("branchPin");
  const branchAddress = document.getElementById("branchAddress");

  const branchTable = document.getElementById("branchTable");
  const branchSearch = document.getElementById("branchSearch");
  const cancelBtn = document.getElementById("cancelBtn");
  const toast = document.getElementById("toast");


  function getBranches() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      return [];
    }
  }


  function saveBranches(branches) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(branches)
    );
  }


  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }


  function generateId() {
    return (
      Date.now().toString() +
      Math.random().toString(16).slice(2)
    );
  }


  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function clearForm() {

    form.reset();

    recordId.value = "";

    branchStatus.value = "Active";

    branchCode.disabled = false;

    branchCode.focus();
  }


  function renderBranches(search = "") {

    const branches = getBranches();

    const query = search
      .trim()
      .toLowerCase();

    const filtered = branches.filter(branch => {

      return [
        branch.code,
        branch.name,
        branch.city,
        branch.state,
        branch.phone,
        branch.gst,
        branch.status
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    });


    if (filtered.length === 0) {

      branchTable.innerHTML = `
        <tr>
          <td colspan="8">
            No branch records found.
          </td>
        </tr>
      `;

      return;
    }


    branchTable.innerHTML = filtered
      .map(branch => `

        <tr>

          <td>${escapeHTML(branch.code)}</td>

          <td>${escapeHTML(branch.name)}</td>

          <td>${escapeHTML(branch.city)}</td>

          <td>${escapeHTML(branch.state)}</td>

          <td>${escapeHTML(branch.phone)}</td>

          <td>${escapeHTML(branch.gst)}</td>

          <td>${escapeHTML(branch.status)}</td>

          <td>

            <button
              type="button"
              class="btn btn-secondary"
              data-action="edit"
              data-id="${branch.id}">
              Edit
            </button>

            <button
              type="button"
              class="btn btn-danger"
              data-action="delete"
              data-id="${branch.id}">
              Delete
            </button>

          </td>

        </tr>

      `)
      .join("");
  }


  form.addEventListener("submit", event => {

    event.preventDefault();

    const code = branchCode.value
      .trim()
      .toUpperCase();

    const name = branchName.value.trim();


    if (!code || !name) {

      showToast(
        "Branch Code and Branch Name are required."
      );

      return;
    }


    let branches = getBranches();

    const editingId = recordId.value;


    const duplicate = branches.some(branch =>

      branch.code.toUpperCase() === code &&
      branch.id !== editingId

    );


    if (duplicate) {

      showToast(
        "Branch Code already exists."
      );

      return;
    }


    const branch = {

      id: editingId || generateId(),

      code: code,

      name: name,

      contactPerson:
        contactPerson.value.trim(),

      phone:
        branchPhone.value.trim(),

      email:
        branchEmail.value.trim(),

      gst:
        branchGST.value.trim().toUpperCase(),

      status:
        branchStatus.value,

      state:
        branchState.value.trim(),

      city:
        branchCity.value.trim(),

      pin:
        branchPin.value.trim(),

      address:
        branchAddress.value.trim(),

      updatedAt:
        new Date().toISOString()

    };


    if (editingId) {

      const index = branches.findIndex(
        item => item.id === editingId
      );

      if (index !== -1) {

        branch.createdAt =
          branches[index].createdAt ||
          new Date().toISOString();

        branches[index] = branch;
      }

      showToast(
        "Branch updated successfully."
      );

    } else {

      branch.createdAt =
        new Date().toISOString();

      branches.push(branch);

      showToast(
        "Branch saved successfully."
      );
    }


    saveBranches(branches);

    clearForm();

    renderBranches(
      branchSearch.value
    );

  });


  branchTable.addEventListener("click", event => {

    const button =
      event.target.closest("button[data-action]");

    if (!button) return;


    const id = button.dataset.id;

    const action = button.dataset.action;

    let branches = getBranches();

    const branch = branches.find(
      item => item.id === id
    );


    if (!branch) return;


    if (action === "edit") {

      recordId.value = branch.id;

      branchCode.value =
        branch.code || "";

      branchName.value =
        branch.name || "";

      contactPerson.value =
        branch.contactPerson || "";

      branchPhone.value =
        branch.phone || "";

      branchEmail.value =
        branch.email || "";

      branchGST.value =
        branch.gst || "";

      branchStatus.value =
        branch.status || "Active";

      branchState.value =
        branch.state || "";

      branchCity.value =
        branch.city || "";

      branchPin.value =
        branch.pin || "";

      branchAddress.value =
        branch.address || "";

      branchCode.disabled = true;

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      showToast(
        "Branch loaded for editing."
      );

    }


    if (action === "delete") {

      const confirmed = confirm(
        `Delete branch "${branch.name}"?`
      );

      if (!confirmed) return;


      branches = branches.filter(
        item => item.id !== id
      );

      saveBranches(branches);

      renderBranches(
        branchSearch.value
      );

      clearForm();

      showToast(
        "Branch deleted successfully."
      );

    }

  });


  branchSearch.addEventListener(
    "input",
    () => {

      renderBranches(
        branchSearch.value
      );

    }
  );


  cancelBtn.addEventListener(
    "click",
    () => {

      clearForm();

      showToast(
        "Form cleared."
      );

    }
  );


  renderBranches();

});
