/* =====================================================
   SELF ATTENDANCE PWA SERVICE WORKER
===================================================== */

const CACHE_NAME =
    "self-attendance-v8";


/* =====================================================
   OFFLINE FILES
===================================================== */

const APP_FILES = [

    "./",

    "./index.html",

    "./login.html",
    "./signup.html",
  "./mpin.html",
"./setup-mpin.html",
  "./account.html",

    "./attendance.html",
    "./profile.html",

    "./salary.html",
    "./salary-slip.html",

    "./backup.html",

    "./style.css",
    "./app.js",

    "./manifest.json",

    "./icons/icon-192.png",
    "./icons/icon-512.png"

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