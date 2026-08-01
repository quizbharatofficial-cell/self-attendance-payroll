/* =====================================================
   OFFLINE LOGIN PROTECTION
===================================================== */

const AUTH_USER_KEY =
    "selfAttendanceOfflineUser";

const AUTH_SESSION_KEY =
    "selfAttendanceLoginSession";


/* =====================================================
   CHECK LOGIN
===================================================== */

function isUserLoggedIn(){

    const session =
        sessionStorage.getItem(
            AUTH_SESSION_KEY
        );

    if(!session){
        return false;
    }

    try{

        const data =
            JSON.parse(session);

        return (
            data &&
            data.loggedIn === true &&
            data.username
        );

    }catch(error){

        sessionStorage.removeItem(
            AUTH_SESSION_KEY
        );

        return false;
    }
}


/* =====================================================
   PROTECT APP
===================================================== */

function protectApp(){

    const page =
        window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();


    /*
      Login & Signup pages ko
      protection se exclude karna hai.
    */

    if(
page === "login.html" ||
page === "signup.html" ||
page === "mpin.html" ||
page === "setup-mpin.html"
    ){
        return;
    }


    /*
      Account hi nahi hai:
      Signup page.
    */

    const account =
        localStorage.getItem(
            AUTH_USER_KEY
        );


    if(!account){

        window.location.replace(
            "./signup.html"
        );

        return;
    }


    /*
      Account hai but login nahi hai.
    */

    if(!isUserLoggedIn()){

        window.location.replace(
            "./login.html"
        );
    }
}


/* =====================================================
   CURRENT LOGIN USER
===================================================== */

function getLoggedInUsername(){

    const session =
        sessionStorage.getItem(
            AUTH_SESSION_KEY
        );

    if(!session){
        return "";
    }


    try{

        const data =
            JSON.parse(session);

        return data.username || "";

    }catch(error){

        return "";
    }
}


/* =====================================================
   LOGOUT
===================================================== */

/* =====================================================
   LOCK APP
===================================================== */

function lockApp(){

    sessionStorage.removeItem(
        AUTH_SESSION_KEY
    );

    window.location.replace(
        "./mpin.html"
    );
}


/* =====================================================
   FULL LOGOUT
===================================================== */

function logoutUser(){

    const yes = confirm(
        "Full logout karna hai?\n\nNext login me username/password required hoga."
    );

    if(!yes){
        return;
    }

    sessionStorage.removeItem(
        AUTH_SESSION_KEY
    );

    localStorage.removeItem(
        "selfAttendanceMpin"
    );

    sessionStorage.removeItem(
        "selfAttendanceResetMpin"
    );

    window.location.replace(
        "./login.html"
    );
}


/* =====================================================
   RUN LOGIN PROTECTION IMMEDIATELY
===================================================== */

protectApp();/* =====================================================
   SELF ATTENDANCE & PAYROLL
   MULTI PROFILE VERSION
===================================================== */


/* =====================================================
   STORAGE KEYS
===================================================== */

const PROFILES_KEY = "selfPayrollProfiles";
const ACTIVE_PROFILE_KEY = "selfPayrollActiveProfile";
const AUTO_BACKUP_KEY = "selfPayrollAutoBackups";

const MAX_BACKUPS = 10;


/* =====================================================
   OLD STORAGE KEYS
   Migration ke liye
===================================================== */

const OLD_PROFILE_KEY = "selfAttendanceProfile";
const OLD_ATTENDANCE_KEY = "selfAttendanceRecords";
const OLD_SALARY_KEY = "selfSalaryRecords";


/* =====================================================
   BASIC STORAGE
===================================================== */

function getJSON(key, fallback = {}) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "Storage error:",
            key,
            error
        );

        return fallback;
    }
}


function saveJSON(key, value) {

    try {

      
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "Save error:",
            key,
            error
        );

        return false;
    }
}


/* =====================================================
   ID GENERATOR
===================================================== */

function createProfileId() {

    return (
        "profile_" +
        Date.now() +
        "_" +
        Math.random()
        .toString(36)
        .slice(2, 7)
    );
}


/* =====================================================
   DEFAULT PROFILE STRUCTURE
===================================================== */

function createEmptyProfile(name = "Profile 1") {

    return {

        id: createProfileId(),

        profileName: name,

        employeeName: "",

        employeeId: "",

        designation: "",

        department: "",

        doj: "",

        location: "",


        /* SHIFT */

        defaultShift: "day",

        dayDutyHours: 8,

        nightDutyHours: 8,

        nightAllowance: 0,


        /* SALARY */

        monthlySalary: 0,

        salaryDays: 26,

        otRate: 0,

        pfPercent: 12,

        esicPercent: 0.75,

        canteenPerDay: 0,


        /* BANK */

        bankName: "",

        accountNumber: "",

        ifsc: "",

        uan: "",

        esicNumber: "",

        pan: "",


        /* DATA */

        attendance: {},

        salaries: {},


        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    };
}


/* =====================================================
   OLD DATA MIGRATION

   Current single-profile data ko automatically
   Profile 1 me transfer karega.
===================================================== */

function migrateOldData() {

    const existingProfiles =
        getJSON(
            PROFILES_KEY,
            []
        );


    /*
      Multi-profile data already exists.
    */

    if (
        Array.isArray(existingProfiles) &&
        existingProfiles.length > 0
    ) {

        return;
    }


    const oldProfile =
        getJSON(
            OLD_PROFILE_KEY,
            {}
        );


    const oldAttendance =
        getJSON(
            OLD_ATTENDANCE_KEY,
            {}
        );


    const oldSalary =
        getJSON(
            OLD_SALARY_KEY,
            {}
        );


    const profile =
        createEmptyProfile(
            oldProfile.employeeName
            ? oldProfile.employeeName
            : "Profile 1"
        );


    /*
      Existing settings copy.
    */

    Object.keys(oldProfile)
    .forEach(key => {

        profile[key] =
            oldProfile[key];

    });


    /*
      Ensure new profile ID
      old data se overwrite na ho.
    */

    profile.id =
        profile.id ||
        createProfileId();


    profile.profileName =
        oldProfile.profileName ||
        oldProfile.employeeName ||
        "Profile 1";


    profile.attendance =
        oldAttendance || {};


    profile.salaries =
        oldSalary || {};


    profile.createdAt =
        profile.createdAt ||
        new Date().toISOString();


    profile.updatedAt =
        new Date().toISOString();


    saveJSON(
        PROFILES_KEY,
        [profile]
    );


    localStorage.setItem(
        ACTIVE_PROFILE_KEY,
        profile.id
    );


    console.log(
        "Old data migrated to Multi Profile."
    );
}


/* =====================================================
   GET ALL PROFILES
===================================================== */

function getProfiles() {

    let profiles =
        getJSON(
            PROFILES_KEY,
            []
        );


    if (!Array.isArray(profiles)) {

        profiles = [];
    }


    return profiles;
}


/* =====================================================
   SAVE ALL PROFILES
===================================================== */

function saveProfiles(profiles) {

    return saveJSON(
        PROFILES_KEY,
        profiles
    );
}


/* =====================================================
   ACTIVE PROFILE ID
===================================================== */

function getActiveProfileId() {

    let id =
        localStorage.getItem(
            ACTIVE_PROFILE_KEY
        );


    const profiles =
        getProfiles();


    /*
      Check whether stored ID
      actually exists.
    */

    const exists =
        profiles.some(
            profile =>
                profile.id === id
        );


    if (!exists) {

        if (profiles.length > 0) {

            id =
                profiles[0].id;


            localStorage.setItem(
                ACTIVE_PROFILE_KEY,
                id
            );

        } else {

            return null;
        }
    }


    return id;
}


/* =====================================================
   ACTIVE PROFILE
===================================================== */

function getActiveProfile() {

    const id =
        getActiveProfileId();


    if (!id) {
        return null;
    }


    const profiles =
        getProfiles();


    return (
        profiles.find(
            profile =>
                profile.id === id
        ) || null
    );
}


/* =====================================================
   SAVE ACTIVE PROFILE
===================================================== */

function saveActiveProfile(updatedProfile) {

    const profiles =
        getProfiles();


    const index =
        profiles.findIndex(
            profile =>
                profile.id ===
                updatedProfile.id
        );


    if (index === -1) {

        return false;
    }


    updatedProfile.updatedAt =
        new Date().toISOString();


    profiles[index] =
        updatedProfile;


    saveProfiles(
        profiles
    );


    return true;
}


/* =====================================================
   SWITCH PROFILE
===================================================== */

function switchProfile(profileId) {

    const profiles =
        getProfiles();


    const profile =
        profiles.find(
            item =>
                item.id === profileId
        );


    if (!profile) {

        alert(
            "Profile not found."
        );

        return false;
    }


    /*
      Current state backup.
    */

    createAutoBackup(
        "Before Profile Switch"
    );


    localStorage.setItem(
        ACTIVE_PROFILE_KEY,
        profileId
    );


    /*
      Selected salary slip reset.
    */

    localStorage.removeItem(
        "selectedSalaryMonth"
    );

    updateDashboard();


    return true;
}


/* =====================================================
   ADD NEW PROFILE
===================================================== */

function addNewProfile(
    profileName = ""
) {

    const profiles =
        getProfiles();


    const number =
        profiles.length + 1;


    const profile =
        createEmptyProfile(
            profileName ||
            (
                "Profile " +
                number
            )
        );


    profiles.push(
        profile
    );


    saveProfiles(
        profiles
    );


    localStorage.setItem(
        ACTIVE_PROFILE_KEY,
        profile.id
    );


    createAutoBackup(
        "New Profile Added"
    );


    return profile;
}


/* =====================================================
   DELETE PROFILE
===================================================== */

function deleteProfile(profileId) {

    let profiles =
        getProfiles();


    if (profiles.length <= 1) {

        alert(
            "At least one profile is required."
        );

        return false;
    }


    const profile =
        profiles.find(
            item =>
                item.id === profileId
        );


    if (!profile) {

        alert(
            "Profile not found."
        );

        return false;
    }


    const name =
        profile.profileName ||
        profile.employeeName ||
        "Profile";


    const yes =
        confirm(
            "Delete " +
            name +
            "?\n\n" +
            "Its Attendance and Salary records will also be deleted."
        );


    if (!yes) {
        return false;
    }


    createAutoBackup(
        "Before Profile Delete"
    );


    profiles =
        profiles.filter(
            item =>
                item.id !== profileId
        );


    saveProfiles(
        profiles
    );


    /*
      Deleted profile active tha
      to first remaining profile activate.
    */

    if (
        getActiveProfileId() ===
        profileId
    ) {

        localStorage.setItem(
            ACTIVE_PROFILE_KEY,
            profiles[0].id
        );
    }


    createAutoBackup(
        "Profile Deleted"
    );


    updateDashboard();


    return true;
}


/* =====================================================
   COMPATIBILITY HELPERS

   Purane pages me getJSON(PROFILE_KEY) etc.
   use hua tha.

   New replacement pages profile functions
   use karenge.
===================================================== */

const PROFILE_KEY = "ACTIVE_PROFILE";
const ATTENDANCE_KEY = "ACTIVE_ATTENDANCE";
const SALARY_KEY = "ACTIVE_SALARY";


function getProfile() {

    return (
        getActiveProfile() ||
        createEmptyProfile()
    );
}


function getAttendanceRecords() {

    const profile =
        getActiveProfile();


    if (!profile) {
        return {};
    }


    return (
        profile.attendance ||
        {}
    );
}


function saveAttendanceRecords(records) {

    const profile =
        getActiveProfile();


    if (!profile) {

        return false;
    }


    profile.attendance =
        records;


    return saveActiveProfile(
        profile
    );
}


function getSalaryRecords() {

    const profile =
        getActiveProfile();


    if (!profile) {
        return {};
    }


    return (
        profile.salaries ||
        {}
    );
}


function saveSalaryRecords(records) {

    const profile =
        getActiveProfile();


    if (!profile) {

        return false;
    }


    profile.salaries =
        records;


    return saveActiveProfile(
        profile
    );
}


/* =====================================================
   getJSON / saveJSON COMPATIBILITY

   Isse current pages immediately break
   nahi honge jab tak unke replacement
   versions add kar rahe hain.
===================================================== */

const originalGetJSON =
    getJSON;


const originalSaveJSON =
    saveJSON;


getJSON = function(
    key,
    fallback = {}
) {

    if (key === PROFILE_KEY) {

        return (
            getActiveProfile() ||
            {}
        );
    }


    if (key === ATTENDANCE_KEY) {

        return getAttendanceRecords();
    }


    if (key === SALARY_KEY) {

        return getSalaryRecords();
    }


    return originalGetJSON(
        key,
        fallback
    );
};


saveJSON = function(
    key,
    value
) {

    if (key === PROFILE_KEY) {

        /*
          Preserve attendance/salaries
          if profile page sends only settings.
        */

        const current =
            getActiveProfile();


        if (!current) {
            return false;
        }


        const attendance =
            current.attendance || {};


        const salaries =
            current.salaries || {};


        Object.assign(
            current,
            value
        );


        current.attendance =
            attendance;


        current.salaries =
            salaries;


        return saveActiveProfile(
            current
        );
    }


    if (key === ATTENDANCE_KEY) {

        return saveAttendanceRecords(
            value
        );
    }


    if (key === SALARY_KEY) {

        return saveSalaryRecords(
            value
        );
    }


    return originalSaveJSON(
        key,
        value
    );
};


/* =====================================================
   DATE
===================================================== */

function getDateKey(
    date = new Date()
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


function getMonthKey(
    date = new Date()
) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        )
    );
}


/* =====================================================
   TIME
===================================================== */

function formatTime(date) {

    if (!date) {

        return "--:--";
    }


    return new Date(date)
    .toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function formatTimeWithSeconds(
    date
) {

    return new Date(date)
    .toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}


function minutesToText(
    minutes
) {

    minutes =
        Math.max(
            0,
            Math.floor(
                Number(
                    minutes || 0
                )
            )
        );


    const hours =
        Math.floor(
            minutes / 60
        );


    const mins =
        minutes % 60;


    return (
        hours +
        "h " +
        mins +
        "m"
    );
}


/* =====================================================
   SHIFT
===================================================== */

function getDefaultShift() {

    const profile =
        getActiveProfile();


    if (!profile) {

        return "day";
    }


    return (
        profile.defaultShift ||
        "day"
    );
}


function getDutyHours(shift) {

    const profile =
        getActiveProfile();


    if (!profile) {

        return 8;
    }


    if (shift === "night") {

        return Number(
            profile.nightDutyHours ||
            profile.dutyHours ||
            8
        );
    }


    return Number(
        profile.dayDutyHours ||
        profile.dutyHours ||
        8
    );
}


function getShiftName(shift) {

    return (
        shift === "night"
        ? "Night Shift"
        : "Day Shift"
    );
}


/* =====================================================
   CLOCK
===================================================== */

function updateClock() {

    const now =
        new Date();


    const clock =
        document.getElementById(
            "liveTime"
        );


    if (clock) {

        clock.textContent =
            formatTimeWithSeconds(
                now
            );
    }


    const date =
        document.getElementById(
            "currentDate"
        );


    if (date) {

        date.textContent =
            now.toLocaleDateString(
                "en-IN",
                {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );
    }


    updateLiveWorkingTime();
}


/* =====================================================
   EMPLOYEE NAME
===================================================== */

function loadEmployeeName() {

    const profile =
        getActiveProfile();


    const element =
        document.getElementById(
            "employeeName"
        );


    if (!element) {
        return;
    }


    element.textContent =
        profile?.employeeName ||
        profile?.profileName ||
        "Employee";
}


/* =====================================================
   ACTIVE PROFILE LABEL
===================================================== */

function loadActiveProfileLabel() {

    const profile =
        getActiveProfile();


    const element =
        document.getElementById(
            "activeProfileName"
        );


    if (!element || !profile) {

        return;
    }


    element.textContent =
        profile.profileName ||
        profile.employeeName ||
        "Profile";
}


/* =====================================================
   PUNCH IN
===================================================== */

function punchIn() {

    const profile =
        getActiveProfile();


    if (!profile) {

        alert(
            "Please create a profile first."
        );

        return;
    }


    const records =
        profile.attendance ||
        {};


    const today =
        getDateKey();


    /*
      Existing active attendance.
    */

    const active =
        findActivePunch();


    if (active) {

        alert(
            "Punch In already active for " +
            getShiftName(
                active.record.shift ||
                "day"
            ) +
            "."
        );

        return;
    }


    /*
      Today's completed attendance.
    */

    if (
        records[today] &&
        records[today].punchOut
    ) {

        alert(
            "Today's attendance is already completed."
        );

        return;
    }


    /*
      Leave / Weekly Off.
    */

    if (
        records[today] &&
        !records[today].punchIn
    ) {

        const status =
            records[today].status;


        if (
            status === "paid-leave" ||
            status === "unpaid-leave" ||
            status === "weekly-off"
        ) {

            const yes =
                confirm(
                    "Today's record is marked as " +
                    status +
                    ".\n\nReplace it with Present?"
                );


            if (!yes) {

                return;
            }
        }
    }


    createAutoBackup(
        "Before Punch In"
    );


    const now =
        new Date();


    const shift =
        profile.defaultShift ||
        "day";


    records[today] = {

        date: today,

        status: "present",

        shift: shift,

        punchIn:
            now.toISOString(),

        punchOut: null,

        workingMinutes: 0,

        overtimeMinutes: 0,

        manual: false
    };


    profile.attendance =
        records;


    saveActiveProfile(
        profile
    );


    createAutoBackup(
        getShiftName(shift) +
        " Punch In"
    );


    updateDashboard();


    alert(
        (
            profile.employeeName ||
            profile.profileName
        ) +
        "\n" +
        getShiftName(shift) +
        "\n\nPunch In: " +
        formatTime(now)
    );
}


/* =====================================================
   FIND ACTIVE PUNCH

   Previous-day Night Shift bhi find karega.
===================================================== */

function findActivePunch() {

    const profile =
        getActiveProfile();


    if (!profile) {

        return null;
    }


    const records =
        profile.attendance ||
        {};


    const now =
        new Date();


    const today =
        getDateKey(now);


    if (
        records[today] &&
        records[today].punchIn &&
        !records[today].punchOut
    ) {

        return {

            date: today,

            record:
                records[today]
        };
    }


    const yesterday =
        new Date(now);


    yesterday.setDate(
        yesterday.getDate() - 1
    );


    const yesterdayKey =
        getDateKey(
            yesterday
        );


    if (
        records[yesterdayKey] &&
        records[yesterdayKey].punchIn &&
        !records[yesterdayKey].punchOut
    ) {

        return {

            date:
                yesterdayKey,

            record:
                records[
                    yesterdayKey
                ]
        };
    }


    return null;
}


/* =====================================================
   PUNCH OUT
===================================================== */

function punchOut() {

    const profile =
        getActiveProfile();


    if (!profile) {

        return;
    }


    const active =
        findActivePunch();


    if (!active) {

        alert(
            "No active Punch In found."
        );

        return;
    }


    createAutoBackup(
        "Before Punch Out"
    );


    const records =
        profile.attendance ||
        {};


    const record =
        records[
            active.date
        ];


    const now =
        new Date();


    const punchInTime =
        new Date(
            record.punchIn
        );


    let workingMinutes =
        Math.floor(
            (
                now.getTime() -
                punchInTime.getTime()
            ) / 60000
        );


    workingMinutes =
        Math.max(
            0,
            workingMinutes
        );


    const shift =
        record.shift ||
        "day";


    const dutyHours =
        getDutyHours(
            shift
        );


    const overtimeMinutes =
        Math.max(
            0,
            workingMinutes -
            (
                dutyHours *
                60
            )
        );


    record.punchOut =
        now.toISOString();


    record.workingMinutes =
        workingMinutes;


    record.overtimeMinutes =
        overtimeMinutes;


    record.shift =
        shift;


    record.status =
        record.status ||
        "present";


    records[
        active.date
    ] = record;


    profile.attendance =
        records;


    saveActiveProfile(
        profile
    );


    createAutoBackup(
        getShiftName(shift) +
        " Punch Out"
    );


    updateDashboard();


    alert(
        getShiftName(shift) +
        "\n\nWorking: " +
        minutesToText(
            workingMinutes
        ) +
        "\nOT: " +
        minutesToText(
            overtimeMinutes
        )
    );
}


/* =====================================================
   LIVE WORKING
===================================================== */

function updateLiveWorkingTime() {

    const box =
        document.getElementById(
            "liveWorkingBox"
        );


    const text =
        document.getElementById(
            "liveWorkingTime"
        );


    if (!box || !text) {

        return;
    }


    const active =
        findActivePunch();


    if (!active) {

        box.style.display =
            "none";

        return;
    }


    const start =
        new Date(
            active.record.punchIn
        );


    const minutes =
        Math.max(
            0,
            Math.floor(
                (
                    Date.now() -
                    start.getTime()
                ) / 60000
            )
        );


    const shift =
        active.record.shift ||
        "day";


    text.textContent =
        getShiftName(shift) +
        " • " +
        minutesToText(
            minutes
        );


    box.style.display =
        "block";
}


/* =====================================================
   TODAY ATTENDANCE
===================================================== */

function updateTodayAttendance() {

    const inElement =
        document.getElementById(
            "punchInTime"
        );


    if (!inElement) {

        return;
    }


    const outElement =
        document.getElementById(
            "punchOutTime"
        );


    const statusElement =
        document.getElementById(
            "attendanceStatus"
        );


    const inButton =
        document.getElementById(
            "punchInBtn"
        );


    const outButton =
        document.getElementById(
            "punchOutBtn"
        );


    const profile =
        getActiveProfile();


    if (!profile) {

        return;
    }


    const records =
        profile.attendance ||
        {};


    const active =
        findActivePunch();


    if (active) {

        const shift =
            active.record.shift ||
            "day";


        inElement.textContent =
            formatTime(
                active.record.punchIn
            );


        outElement.textContent =
            "--:--";


        statusElement.textContent =
            shift === "night"
            ? "🌙 Night Working"
            : "☀️ Day Working";


        statusElement.className =
            "status working";


        inButton.disabled =
            true;


        outButton.disabled =
            false;


        return;
    }


    const today =
        getDateKey();


    const record =
        records[today];


    if (
        record &&
        record.punchIn
    ) {

        const shift =
            record.shift ||
            "day";


        inElement.textContent =
            formatTime(
                record.punchIn
            );


        outElement.textContent =
            record.punchOut
            ? formatTime(
                record.punchOut
            )
            : "--:--";


        statusElement.textContent =
            shift === "night"
            ? "🌙 Night Completed"
            : "☀️ Day Completed";


        statusElement.className =
            "status completed";


        inButton.disabled =
            true;


        outButton.disabled =
            true;


        return;
    }


    inElement.textContent =
        "--:--";


    outElement.textContent =
        "--:--";


    statusElement.textContent =
        record?.status ===
        "paid-leave"

        ? "Paid Leave"

        : record?.status ===
          "unpaid-leave"

        ? "Unpaid Leave"

        : record?.status ===
          "weekly-off"

        ? "Weekly Off"

        : "Not Punched";


    statusElement.className =
        "status";


    inButton.disabled =
        false;


    outButton.disabled =
        true;
}


/* =====================================================
   MONTH SUMMARY
===================================================== */

function updateMonthlySummary() {

    const presentElement =
        document.getElementById(
            "presentDays"
        );


    if (!presentElement) {

        return;
    }


    const profile =
        getActiveProfile();


    if (!profile) {

        return;
    }


    const records =
        profile.attendance ||
        {};


    const month =
        getMonthKey();


    let present = 0;

    let workingMinutes = 0;

    let overtimeMinutes = 0;


    Object.keys(records)
    .forEach(date => {

        if (
            !date.startsWith(
                month
            )
        ) {

            return;
        }


        const record =
            records[date];


        const status =
            record.status ||
            (
                record.punchIn
                ? "present"
                : ""
            );


        if (
            status === "present"
        ) {

            present++;
        }


        workingMinutes +=
            Number(
                record.workingMinutes ||
                0
            );


        overtimeMinutes +=
            Number(
                record.overtimeMinutes ||
                0
            );
    });


    presentElement.textContent =
        present;


    const hours =
        document.getElementById(
            "totalHours"
        );


    if (hours) {

        hours.textContent =
            (
                workingMinutes /
                60
            ).toFixed(1);
    }


    const ot =
        document.getElementById(
            "overtime"
        );


    if (ot) {

        ot.textContent =
            (
                overtimeMinutes /
                60
            ).toFixed(1);
    }
}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

    loadEmployeeName();

    loadActiveProfileLabel();

    updateTodayAttendance();

    updateMonthlySummary();

    updateLiveWorkingTime();
}


/* =====================================================
   SALARY SLIP
===================================================== */

function openSalarySlip() {

    const profile =
        getActiveProfile();


    if (!profile) {

        return;
    }


    const salaries =
        profile.salaries ||
        {};


    const currentMonth =
        getMonthKey();


    if (
        salaries[currentMonth]
    ) {

        localStorage.setItem(
            "selectedSalaryMonth",
            currentMonth
        );


        location.href =
            "salary-slip.html";

        return;
    }


    const months =
        Object.keys(
            salaries
        )
        .sort()
        .reverse();


    if (
        months.length > 0
    ) {

        const latest =
            months[0];


        const yes =
            confirm(
                "Current month salary slip is not saved.\n\nOpen latest saved slip (" +
                latest +
                ")?"
            );


        if (yes) {

            localStorage.setItem(
                "selectedSalaryMonth",
                latest
            );


            location.href =
                "salary-slip.html";
        }


        return;
    }


    alert(
        "No salary slip found for this profile."
    );


    location.href =
        "salary.html";
}


/* =====================================================
   COMPLETE BACKUP
===================================================== */

function collectAppData() {

    return {

        version: 4,

        appType:
            "Multi Profile",

        createdAt:
            new Date()
            .toISOString(),

        activeProfileId:
            getActiveProfileId(),

        profiles:
            getProfiles(),

selectedSalaryMonth:
    localStorage.getItem(
        "selectedSalaryMonth"
    ) || "",

autoLockSetting:
    localStorage.getItem(
        "selfAttendanceAutoLock"
    ) || "5"
    };
}


/* =====================================================
   GET BACKUPS
===================================================== */

function getAutoBackups() {

    try {

        const backups =
            JSON.parse(
                localStorage.getItem(
                    AUTO_BACKUP_KEY
                )
            );


        return Array.isArray(
            backups
        )
        ? backups
        : [];

    } catch {

        return [];
    }
}


/* =====================================================
   AUTO BACKUP
===================================================== */

function createAutoBackup(
    reason = "Automatic Backup"
) {

    try {

        let backups =
            getAutoBackups();


        backups.unshift({

            id:
                Date.now(),

            reason:
                reason,

            createdAt:
                new Date()
                .toISOString(),

            data:
                collectAppData()
        });


        backups =
            backups.slice(
                0,
                MAX_BACKUPS
            );


        localStorage.setItem(
            AUTO_BACKUP_KEY,
            JSON.stringify(
                backups
            )
        );


        localStorage.setItem(
            "lastAutoBackup",
            new Date()
            .toISOString()
        );
      /* Account page open ho to
   Security Status live refresh */

if(
    typeof updateSecurityStatus === "function"
){
    updateSecurityStatus();
}


        return true;

    } catch (error) {

        console.error(
            "Backup failed:",
            error
        );


        return false;
    }
}


/* =====================================================
   RESTORE MULTI PROFILE BACKUP
===================================================== */

function restoreAutoBackup(backupId) {

    const backups =
        getAutoBackups();

    const backup =
        backups.find(
            item =>
                Number(item.id) ===
                Number(backupId)
        );

    if (!backup) {

        alert(
            "Backup not found."
        );

        return false;
    }


    if (
        !backup.data ||
        !Array.isArray(
            backup.data.profiles
        ) ||
        backup.data.profiles.length === 0
    ) {

        alert(
            "Invalid backup data."
        );

        return false;
    }


    const yes =
        confirm(
            "Restore this backup?\n\n" +
            "Current Profiles, Attendance and Salary data will be replaced."
        );


    if (!yes) {

        return false;
    }


    try {

        /*
          Current data ka safety backup.
        */

        createAutoBackup(
            "Before Backup Restore"
        );


        /*
          Restore all profiles.
        */

        const restoredProfiles =
            JSON.parse(
                JSON.stringify(
                    backup.data.profiles
                )
            );


        const saved =
            saveProfiles(
                restoredProfiles
            );


        if (!saved) {

            alert(
                "Backup could not be restored."
            );

            return false;
        }


        /*
          Active profile restore.
        */

        const requestedActiveId =
            backup.data.activeProfileId;


        const activeExists =
            restoredProfiles.some(
                profile =>
                    profile.id ===
                    requestedActiveId
            );


        if (
            requestedActiveId &&
            activeExists
        ) {

            localStorage.setItem(
                ACTIVE_PROFILE_KEY,
                requestedActiveId
            );

        } else {

            localStorage.setItem(
                ACTIVE_PROFILE_KEY,
                restoredProfiles[0].id
            );
        }


        /*
          Selected salary month restore.
        */

        if (
            backup.data.selectedSalaryMonth
        ) {

            localStorage.setItem(
                "selectedSalaryMonth",
                backup.data.selectedSalaryMonth
            );

        } else {

            localStorage.removeItem(
                "selectedSalaryMonth"
            );
        }


        /*
          Old selected salary profile
          remove kar denge.
        */

        localStorage.removeItem(
            "selectedSalaryProfileId"
        );


        updateDashboard();


        alert(
            "Backup restored successfully."
        );


        window.location.reload();


        return true;


    } catch (error) {

        console.error(
            "Restore error:",
            error
        );


        alert(
            "Backup restore failed."
        );


        return false;
    }
}


/* =====================================================
   APP INITIALIZATION
===================================================== */

function initializeApp() {

    /*
      Old single-profile data ko
      multi-profile me migrate karega.
    */

    migrateOldData();


    /*
      Agar kisi reason se profile
      available nahi hai to first
      default profile create karega.
    */

    let profiles =
        getProfiles();


    if (
        !Array.isArray(profiles) ||
        profiles.length === 0
    ) {

        const firstProfile =
            createEmptyProfile(
                "Profile 1"
            );


        saveProfiles(
            [firstProfile]
        );


        localStorage.setItem(
            ACTIVE_PROFILE_KEY,
            firstProfile.id
        );
    }


    /*
      Active Profile ID validation.
    */

    getActiveProfileId();


    /*
      Dashboard elements available
      honge to update ho jayenge.
    */

    updateDashboard();


    /*
      Clock immediately start.
    */

    updateClock();
}


/* =====================================================
   PAGE READY
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();
}


/* =====================================================
   CLOCK TIMER
===================================================== */

setInterval(
    updateClock,
    1000
);


/* =====================================================
   STORAGE CHANGE

   Same browser me kisi dusre tab me
   profile data change ho to dashboard
   refresh karega.
===================================================== */

window.addEventListener(
    "storage",
    function(event) {

        if (
            event.key === PROFILES_KEY ||
            event.key === ACTIVE_PROFILE_KEY
        ) {

            updateDashboard();
        }
    }
);
/* =====================================================
   AUTO LOCK SYSTEM
===================================================== */

const AUTO_LOCK_STORAGE_KEY =
    "selfAttendanceAutoLock";

let autoLockTimer = null;


/* Start / Reset Timer */

function resetAutoLockTimer(){

    if(autoLockTimer){
        clearTimeout(autoLockTimer);
    }

    const setting =
        localStorage.getItem(
            AUTO_LOCK_STORAGE_KEY
        ) || "5";


    /* Never selected */

    if(setting === "never"){
        return;
    }


    const minutes =
        parseInt(setting,10);


    if(
        isNaN(minutes) ||
        minutes <= 0
    ){
        return;
    }


    autoLockTimer =
        setTimeout(
            function(){

                autoLockNow();

            },
            minutes * 60 * 1000
        );
}


/* Auto Lock */

function autoLockNow(){

    const page =
        window.location.pathname
        .split("/")
        .pop();


    /*
       Login / MPIN related pages
       ko auto-lock nahi karna.
    */

    if(
        page === "login.html" ||
        page === "signup.html" ||
        page === "mpin.html" ||
        page === "setup-mpin.html"
    ){
        return;
    }


    const session =
        sessionStorage.getItem(
            AUTH_SESSION_KEY
        );


    if(!session){
        return;
    }


    /*
       Sirf unlocked session remove hoga.
       MPIN aur app data safe rahenge.
    */

    sessionStorage.removeItem(
        AUTH_SESSION_KEY
    );


    window.location.replace(
        "./mpin.html"
    );
}


/* User Activity */

[
    "click",
    "touchstart",
    "keydown",
    "scroll"
].forEach(function(eventName){

    document.addEventListener(
        eventName,
        resetAutoLockTimer,
        {passive:true}
    );

});


/* Start Timer */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        resetAutoLockTimer();

    }
);