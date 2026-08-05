(function () {
  'use strict';
  const USER_KEY = 'selfAttendanceOfflineUser';
  const SESSION_KEY = 'selfAttendanceLoginSession';
  const MPIN_KEY = 'selfAttendanceMpin';

  function rootPrefix() {
    const path = location.pathname.replace(/\\/g, '/');
    if (path.includes('/masters/') || path.includes('/payroll/') || path.includes('/attendance/')) return '../';
    return './';
  }
  function validSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      return !!(s && s.loggedIn === true && s.username);
    } catch (_) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
  }
  function go(file) { location.replace(rootPrefix() + file); }

  if (!localStorage.getItem(USER_KEY)) return go('signup.html');
  if (validSession()) return;
  if (localStorage.getItem(MPIN_KEY)) return go('mpin.html');
  return go('login.html');
})();
