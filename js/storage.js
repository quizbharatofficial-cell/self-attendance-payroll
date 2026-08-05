const HRMS = {
  keys: {
    employees: "self_hrms_employees",
    attendance: "self_hrms_attendance",
    leaves: "self_hrms_leaves",
    holidays: "self_hrms_holidays",
    salarySettings: "self_hrms_salary_settings",
    payroll: "self_hrms_payroll",
    salarySlips: "self_hrms_salary_slips",
    companySettings: "self_hrms_company_settings"
  },

  get(type) {
    try {
      return JSON.parse(localStorage.getItem(this.keys[type])) || [];
    } catch (error) {
      return [];
    }
  },

  set(type, data) {
    localStorage.setItem(this.keys[type], JSON.stringify(data));
  },

  getObject(type) {
    try {
      return JSON.parse(localStorage.getItem(this.keys[type])) || {};
    } catch (error) {
      return {};
    }
  },

  setObject(type, data) {
    localStorage.setItem(this.keys[type], JSON.stringify(data));
  },

  generateId(prefix = "ID") {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
};
