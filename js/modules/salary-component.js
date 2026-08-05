document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "self_hrms_salary_components";

  const form = document.getElementById("componentForm");
  const recordId = document.getElementById("recordId");

  const componentCode = document.getElementById("componentCode");
  const componentName = document.getElementById("componentName");
  const componentType = document.getElementById("componentType");
  const calculationType = document.getElementById("calculationType");

  const amountField = document.getElementById("amountField");
  const percentageField = document.getElementById("percentageField");
  const basedOnField = document.getElementById("basedOnField");

  const defaultAmount = document.getElementById("defaultAmount");
  const percentage = document.getElementById("percentage");
  const basedOn = document.getElementById("basedOn");

  const attendanceLinked = document.getElementById("attendanceLinked");
  const includeInGross = document.getElementById("includeInGross");
  const includeInNet = document.getElementById("includeInNet");

  const pfApplicable = document.getElementById("pfApplicable");
  const esiApplicable = document.getElementById("esiApplicable");

  const displayOrder = document.getElementById("displayOrder");
  const status = document.getElementById("status");
  const description = document.getElementById("description");

  const table = document.getElementById("componentTable");
  const search = document.getElementById("componentSearch");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const message = document.getElementById("message");


  function getComponents() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  function saveComponents(data) {
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


  function updateCalculationFields() {

    const type = calculationType.value;

    amountField.style.display =
      type === "Fixed" ? "" : "none";

    percentageField.style.display =
      type === "Percentage" ? "" : "none";

    basedOnField.style.display =
      type === "Percentage" ? "" : "none";


    if (type !== "Fixed") {
      defaultAmount.value = "0";
    }

    if (type !== "Percentage") {
      percentage.value = "0";
      basedOn.value = "";
    }
  }


  function updateComponentRules() {

    /*
      Deductions are not part of Gross Earnings.
    */
    if (componentType.value === "Deduction") {
      includeInGross.value = "No";
      includeInGross.disabled = true;
    } else {
      includeInGross.disabled = false;
    }
  }


  function calculationText(item) {

    if (item.calculationType === "Fixed") {
      return "Fixed";
    }

    if (item.calculationType === "Percentage") {
      return `${item.percentage || 0}% of ${item.basedOn || "-"}`;
    }

    return "Manual";
  }


  function resetForm() {

    form.reset();

    recordId.value = "";

    componentType.value = "Earning";
    calculationType.value = "Fixed";

    defaultAmount.value = "0";
    percentage.value = "0";
    basedOn.value = "";

    attendanceLinked.value = "Yes";
    includeInGross.value = "Yes";
    includeInNet.value = "Yes";

    pfApplicable.value = "No";
    esiApplicable.value = "No";

    displayOrder.value = "0";
    status.value = "Active";

    saveBtn.textContent = "Save Component";
    message.textContent = "";

    updateCalculationFields();
    updateComponentRules();

    componentCode.focus();
  }


  function renderComponents(filter = "") {

    const components = getComponents();

    const query =
      filter.trim().toLowerCase();

    const filtered =
      components
        .filter(item => {

          const text = [
            item.code,
            item.name,
            item.componentType,
            calculationText(item),
            item.attendanceLinked,
            item.pfApplicable,
            item.esiApplicable,
            item.status,
            item.description
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(query);
        })
        .sort(
          (a, b) =>
            Number(a.displayOrder || 0) -
            Number(b.displayOrder || 0)
        );


    table.innerHTML = "";


    if (!filtered.length) {

      table.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;">
            No salary component records found.
          </td>
        </tr>
      `;

      return;
    }


    filtered.forEach(item => {

      const row =
        document.createElement("tr");

      row.innerHTML = `

        <td>${escapeHTML(item.code)}</td>

        <td>${escapeHTML(item.name)}</td>

        <td>${escapeHTML(item.componentType)}</td>

        <td>${escapeHTML(calculationText(item))}</td>

        <td>${escapeHTML(item.attendanceLinked)}</td>

        <td>${escapeHTML(item.pfApplicable)}</td>

        <td>${escapeHTML(item.esiApplicable)}</td>

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


  calculationType.addEventListener(
    "change",
    updateCalculationFields
  );


  componentType.addEventListener(
    "change",
    updateComponentRules
  );


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const code =
        componentCode.value
          .trim()
          .toUpperCase();

      const name =
        componentName.value.trim();


      if (!code || !name) {

        message.textContent =
          "Component Code and Component Name are required.";

        return;
      }


      if (
        calculationType.value === "Percentage" &&
        !basedOn.value
      ) {

        message.textContent =
          "Please select Percentage Based On.";

        return;
      }


      const percent =
        Number(percentage.value) || 0;


      if (
        calculationType.value === "Percentage" &&
        percent < 0
      ) {

        message.textContent =
          "Percentage cannot be negative.";

        return;
      }


      const components =
        getComponents();

      const editingId =
        recordId.value;


      const duplicate =
        components.some(item =>

          String(item.code)
            .toLowerCase() ===
          code.toLowerCase()

          &&

          String(item.id) !==
          String(editingId)

        );


      if (duplicate) {

        message.textContent =
          "Component Code already exists.";

        componentCode.focus();

        return;
      }


      const component = {

        id:
          editingId || generateId(),

        code,

        name,

        componentType:
          componentType.value,

        calculationType:
          calculationType.value,

        defaultAmount:
          calculationType.value === "Fixed"
            ? Number(defaultAmount.value) || 0
            : 0,

        percentage:
          calculationType.value === "Percentage"
            ? percent
            : 0,

        basedOn:
          calculationType.value === "Percentage"
            ? basedOn.value
            : "",

        attendanceLinked:
          attendanceLinked.value,

        includeInGross:
          componentType.value === "Deduction"
            ? "No"
            : includeInGross.value,

        includeInNet:
          includeInNet.value,

        pfApplicable:
          pfApplicable.value,

        esiApplicable:
          esiApplicable.value,

        displayOrder:
          Number(displayOrder.value) || 0,

        status:
          status.value,

        description:
          description.value.trim()

      };


      if (editingId) {

        const index =
          components.findIndex(
            item =>
              String(item.id) ===
              String(editingId)
          );


        if (index !== -1) {
          components[index] = component;
        }


        message.textContent =
          "Salary Component updated successfully.";

      } else {

        components.push(component);

        message.textContent =
          "Salary Component saved successfully.";
      }


      saveComponents(components);

      renderComponents(search.value);


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

      const components =
        getComponents();

      const item =
        components.find(
          component =>
            String(component.id) ===
            String(id)
        );


      if (!item) return;


      if (action === "edit") {

        recordId.value = item.id;

        componentCode.value =
          item.code || "";

        componentName.value =
          item.name || "";

        componentType.value =
          item.componentType || "Earning";

        calculationType.value =
          item.calculationType || "Fixed";

        defaultAmount.value =
          item.defaultAmount ?? 0;

        percentage.value =
          item.percentage ?? 0;

        basedOn.value =
          item.basedOn || "";

        attendanceLinked.value =
          item.attendanceLinked || "Yes";

        includeInGross.value =
          item.includeInGross || "No";

        includeInNet.value =
          item.includeInNet || "Yes";

        pfApplicable.value =
          item.pfApplicable || "No";

        esiApplicable.value =
          item.esiApplicable || "No";

        displayOrder.value =
          item.displayOrder ?? 0;

        status.value =
          item.status || "Active";

        description.value =
          item.description || "";

        updateCalculationFields();
        updateComponentRules();

        saveBtn.textContent =
          "Update Component";

        message.textContent =
          "Editing Salary Component.";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }


      if (action === "delete") {

        const confirmed =
          confirm(
            `Delete Salary Component "${item.name}"?`
          );


        if (!confirmed) return;


        const updated =
          components.filter(
            component =>
              String(component.id) !==
              String(id)
          );


        saveComponents(updated);

        renderComponents(search.value);


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
      renderComponents(search.value);
    }
  );


  cancelBtn.addEventListener(
    "click",
    resetForm
  );


  updateCalculationFields();
  updateComponentRules();
  renderComponents();

});
