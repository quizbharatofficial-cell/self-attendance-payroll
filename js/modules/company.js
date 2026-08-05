document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("companyForm");
  const logoInput = document.getElementById("companyLogo");
  const message = document.getElementById("saveMessage");

  const fields = {
    name: document.getElementById("companyName"),
    code: document.getElementById("companyCode"),
    address: document.getElementById("companyAddress"),
    phone: document.getElementById("companyPhone"),
    email: document.getElementById("companyEmail"),
    gst: document.getElementById("companyGST"),
    pf: document.getElementById("companyPF"),
    esi: document.getElementById("companyESI")
  };

  // Load already saved company details
  const savedCompany = JSON.parse(
    localStorage.getItem("self_hrms_company") || "{}"
  );

  Object.keys(fields).forEach((key) => {
    if (savedCompany[key] !== undefined) {
      fields[key].value = savedCompany[key];
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const company = {
      name: fields.name.value.trim(),
      code: fields.code.value.trim(),
      address: fields.address.value.trim(),
      phone: fields.phone.value.trim(),
      email: fields.email.value.trim(),
      gst: fields.gst.value.trim(),
      pf: fields.pf.value.trim(),
      esi: fields.esi.value.trim(),
      logo: savedCompany.logo || ""
    };

    if (!company.name) {
      message.textContent = "Company Name is required.";
      return;
    }

    const file = logoInput.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        company.logo = reader.result;
        saveCompany(company);
      };

      reader.readAsDataURL(file);
    } else {
      saveCompany(company);
    }
  });

  function saveCompany(company) {
    try {
      localStorage.setItem(
        "self_hrms_company",
        JSON.stringify(company)
      );

      message.textContent = "Company details saved successfully.";
    } catch (error) {
      console.error(error);
      message.textContent = "Unable to save company details.";
    }
  }
});
