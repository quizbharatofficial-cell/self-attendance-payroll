/* =====================================================
   SELF ATTENDANCE PWA SERVICE WORKER
===================================================== */

const CACHE_NAME = "self-hrms-production-v1";


/* =====================================================
   OFFLINE FILES
===================================================== */

const APP_FILES = [
    "./",
    "./login.html",
    "./signup.html",
    "./setup-mpin.html",
    "./mpin.html",
    "./index.html",
    "./self-attendance-home.html",
    "./account.html",
    "./backup.html",
    "./profile.html",
    "./monthly-attendance.html",
    "./leave.html",
    "./holiday.html",
    "./history.html",
    "./reports.html",
    "./settings.html",
    "./masters/branch.html",
    "./masters/department.html",
    "./masters/designation.html",
    "./masters/shift.html",
    "./masters/salary-component.html",
    "./masters/employee.html",
    "./masters/company.html",
    "./masters/holiday.html",
    "./masters/leave-type.html",
    "./masters/weekly-off.html",
    "./attendance/attendance.html",
    "./payroll/payroll.html",
    "./payroll/payslip.html",
    "./css/style.css",
    "./style.css",
    "./app.js",
    "./js/auth-guard.js",
    "./js/storage.js",
    "./js/dashboard.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];


/* =====================================================
   INSTALL
===================================================== */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
            .open(CACHE_NAME)

            .then(cache => {

                return cache.addAll(
                    APP_FILES
                );

            })

            .then(() => {

                return self.skipWaiting();

            })

        );

    }
);


/* =====================================================
   ACTIVATE
===================================================== */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
            .keys()

            .then(cacheNames => {

                return Promise.all(

                    cacheNames.map(
                        cacheName => {

                            if(
                                cacheName !==
                                CACHE_NAME
                            ){

                                return caches.delete(
                                    cacheName
                                );
                            }

                        }
                    )

                );

            })

            .then(() => {

                return self.clients.claim();

            })

        );

    }
);


/* =====================================================
   FETCH
===================================================== */

self.addEventListener(
    "fetch",
    event => {

        if(
            event.request.method !==
            "GET"
        ){
            return;
        }


        event.respondWith(

            caches
            .match(
                event.request
            )

            .then(cachedResponse => {

                /*
                  Cached file available.
                */

                if(cachedResponse){

                    return cachedResponse;
                }


                /*
                  Otherwise network/local server.
                */

                return fetch(
                    event.request
                )

                .then(response => {

                    if(
                        !response ||
                        response.status !== 200
                    ){

                        return response;
                    }


                    const responseCopy =
                        response.clone();


                    caches
                    .open(CACHE_NAME)

                    .then(cache => {

                        cache.put(
                            event.request,
                            responseCopy
                        );

                    });


                    return response;

                })

                .catch(() => {

                    /*
                      Navigation fallback.
                    */

                    if(
                        event.request.mode ===
                        "navigate"
                    ){

                        return caches.match(
                            "./login.html"
                        );
                    }


                    return new Response(
                        "Offline",
                        {
                            status:503,
                            statusText:"Offline"
                        }
                    );

                });

            })

        );

    }
);