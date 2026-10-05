/* ============================================================
   SewaConnect — Booking Create Page
   ============================================================ */

// (function () {
//   if (!requireAuth() || !requireRole("customer")) return;

//   const form = document.getElementById("booking-form");
//   const categorySelect = document.getElementById("booking-category");
//   const serviceSelect = document.getElementById("booking-service");
//   const providerSelect = document.getElementById("booking-provider");
//   const dateInput = document.getElementById("booking-date");
//   const timeInput = document.getElementById("booking-time");
//   const addressInput = document.getElementById("booking-address");
//   const latInput = document.getElementById("booking-latitude");
//   const lonInput = document.getElementById("booking-longitude");
//   const searchInput = document.getElementById("location-search");
//   const notesInput = document.getElementById("booking-notes");
//   const priceDisplay = document.getElementById("booking-price");
//   const submitBtn = document.getElementById("booking-submit");
//   const submitText = document.getElementById("submit-text");
//   const submitSpinner = document.getElementById("submit-spinner");
//   const getLocationBtn = document.getElementById("get-location-btn");

//   let categories = [];
//   let services = [];
//   let providers = [];
//   let selectedServicePrice = 0;
//   let map;
//   let marker;

//   function initMap() {
//     map = L.map("booking-map").setView([27.7172, 85.324], 13); // Kathmandu

//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       attribution: "&copy; OpenStreetMap contributors",
//     }).addTo(map);

//     map.on("click", async function (e) {
//       const { lat, lng } = e.latlng;

//       if (marker) {
//         marker.setLatLng(e.latlng);
//       } else {
//         marker = L.marker(e.latlng, { draggable: true }).addTo(map);

//         marker.on("dragend", async function () {
//           const pos = marker.getLatLng();
//           latInput.value = pos.lat.toFixed(6);
//           lonInput.value = pos.lng.toFixed(6);
//           const addr = await reverseGeocode(pos.lat, pos.lng);
//           if (addr) addressInput.value = addr;
//         });
//       }

//       latInput.value = lat.toFixed(6);
//       lonInput.value = lng.toFixed(6);

//       const address = await reverseGeocode(lat, lng);
//       if (address) addressInput.value = address;
//     });
//   }

//   async function init() {
//     setMinDate();
//     loadUrlParams();
//     initMap();
//     await loadCategories();
//     setupEvents();
//   }

//   function setMinDate() {
//     const today = new Date().toISOString().split("T")[0];
//     dateInput.min = today;
//     dateInput.value = today;
//   }

//   // function loadUrlParams() {
//   //   const params = new URLSearchParams(window.location.search);
//   //   const providerId = params.get("provider");
//   //   const categoryId = params.get("category");
//   //   if (categoryId) {
//   //     categorySelect.value = categoryId;
//   //   }
//   // }
//   function loadUrlParams() {
//     const params = new URLSearchParams(window.location.search);

//     const providerId = params.get("provider");
//     const categoryId = params.get("category");
//     const serviceId = params.get("service");

//     console.log("BOOKING URL PARAMETERS:", {
//       providerId,
//       categoryId,
//       serviceId,
//     });

//     return {
//       providerId,
//       categoryId,
//       serviceId,
//     };
//   }

//   async function loadCategories() {
//     const data = await apiFetch("/categories/");
//     if (!data || data.error) return;

//     categories = data.results || data.data || data;
//     if (!Array.isArray(categories)) return;

//     categories.forEach((cat) => {
//       const option = document.createElement("option");
//       option.value = cat.id;
//       option.textContent = cat.name;
//       categorySelect.appendChild(option);
//     });

//     const params = new URLSearchParams(window.location.search);
//     const categoryId = params.get("category");
//     if (categoryId) {
//       categorySelect.value = categoryId;
//       await loadServices(categoryId);
//     }
//   }

//   async function loadServices(categoryId) {
//     serviceSelect.innerHTML = '<option value="">Loading services...</option>';
//     serviceSelect.disabled = true;
//     providerSelect.innerHTML =
//       '<option value="">Any available provider</option>';

//     const data = await apiFetch(`/services/?category=${categoryId}`);
//     if (!data || data.error) {
//       serviceSelect.innerHTML =
//         '<option value="">No services available</option>';
//       return;
//     }

//     services = data.results || data.data || data;
//     if (!Array.isArray(services)) services = [];

//     serviceSelect.innerHTML = '<option value="">Select a service</option>';
//     services.forEach((s) => {
//       const option = document.createElement("option");
//       option.value = s.id;
//       option.textContent = `${s.title || s.name}${s.price ? ` — ${formatCurrency(s.price)}` : ""}`;
//       serviceSelect.appendChild(option);
//     });
//     serviceSelect.disabled = false;

//     await loadProviders(categoryId);
//   }

//   async function loadProviders(categoryId) {
//     providerSelect.innerHTML = '<option value="">Loading providers...</option>';

//     const data = await apiFetch(`/providers/?category=${categoryId}`);
//     if (!data || data.error) {
//       providerSelect.innerHTML =
//         '<option value="">Any available provider</option>';
//       return;
//     }

//     providers = data.results || data.data || data;
//     if (!Array.isArray(providers)) providers = [];

//     providerSelect.innerHTML =
//       '<option value="">Any available provider</option>';
//     providers.forEach((p) => {
//       const name = p.user_full_name || "Provider";
//       const option = document.createElement("option");
//       option.value = p.id;
//       option.textContent = `${name} — ${formatCurrency(p.hourly_rate || 0)}/hr`;
//       providerSelect.appendChild(option);
//     });

//     const params = new URLSearchParams(window.location.search);
//     const providerId = params.get("provider");
//     if (providerId) {
//       providerSelect.value = providerId;
//     }
//   }

//   function updatePrice() {
//     const serviceId = serviceSelect.value;
//     if (!serviceId) {
//       selectedServicePrice = 0;
//       priceDisplay.textContent = "Rs. 0";
//       return;
//     }
//     const service = services.find((s) => String(s.id) === String(serviceId));
//     selectedServicePrice = service
//       ? Number(service.price || service.base_price || 0)
//       : 0;
//     priceDisplay.textContent = formatCurrency(selectedServicePrice);
//   }

//   function setupEvents() {
//     categorySelect.addEventListener("change", async () => {
//       const categoryId = categorySelect.value;
//       if (categoryId) {
//         await loadServices(categoryId);
//       } else {
//         serviceSelect.innerHTML = '<option value="">Select a service</option>';
//         serviceSelect.disabled = true;
//         providerSelect.innerHTML =
//           '<option value="">Any available provider</option>';
//       }
//       updatePrice();
//     });

//     serviceSelect.addEventListener("change", updatePrice);

//     getLocationBtn.addEventListener("click", async () => {
//       getLocationBtn.disabled = true;
//       getLocationBtn.textContent = "Getting location...";

//       const pos = await getCurrentPosition();
//       if (pos) {
//         latInput.value = Number(pos.lat).toFixed(6);
//         lonInput.value = Number(pos.lon).toFixed(6);

//         map.setView([pos.lat, pos.lon], 16);

//         if (marker) {
//           marker.setLatLng([pos.lat, pos.lon]);
//         } else {
//           marker = L.marker([pos.lat, pos.lon], { draggable: true }).addTo(map);
//           marker.on("dragend", async function () {
//             const p = marker.getLatLng();
//             latInput.value = p.lat.toFixed(6);
//             lonInput.value = p.lng.toFixed(6);
//             const addr = await reverseGeocode(p.lat, p.lng);
//             if (addr) addressInput.value = addr;
//           });
//         }

//         const address = await reverseGeocode(pos.lat, pos.lon);
//         if (address) addressInput.value = address;

//         showToast("Location retrieved successfully.", "success");
//       } else {
//         showToast(
//           "Could not get your location. Please enter your address manually.",
//           "warning",
//         );
//       }

//       getLocationBtn.disabled = false;
//       getLocationBtn.innerHTML = "&#128205; Use My Current Location";
//     });
//     async function handleSearch() {
//       const query = searchInput.value.trim();
//       if (!query) return;

//       const places = await searchLocation(query);

//       if (!places.length) {
//         showToast("Location not found.", "warning");
//         return;
//       }

//       const place = places[0];
//       const lat = Number(place.lat);
//       const lon = Number(place.lon);

//       addressInput.value = place.display_name;
//       latInput.value = lat.toFixed(6);
//       lonInput.value = lon.toFixed(6);

//       map.setView([lat, lon], 16);

//       if (marker) {
//         marker.setLatLng([lat, lon]);
//       } else {
//         marker = L.marker([lat, lon], { draggable: true }).addTo(map);
//         marker.on("dragend", async function () {
//           const p = marker.getLatLng();
//           latInput.value = p.lat.toFixed(6);
//           lonInput.value = p.lng.toFixed(6);
//           const addr = await reverseGeocode(p.lat, p.lng);
//           if (addr) addressInput.value = addr;
//         });
//       }

//       showToast("Location selected.", "success");
//     }

//     searchInput.addEventListener("change", handleSearch);
//     searchInput.addEventListener("keydown", (e) => {
//       if (e.key === "Enter") {
//         e.preventDefault();
//         handleSearch();
//       }
//     });

//     form.addEventListener("submit", handleSubmit);
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();

//     const categoryId = categorySelect.value;
//     const serviceId = serviceSelect.value;
//     const providerId = providerSelect.value;
//     const date = dateInput.value;
//     const time = timeInput.value;
//     const address = addressInput.value.trim();
//     const notes = notesInput.value.trim();

//     if (!categoryId || !date || !time || !address) {
//       showToast("Please fill in all required fields.", "error");
//       return;
//     }

//     if (!latInput.value || !lonInput.value) {
//       showToast("Please get your location or enter coordinates.", "error");
//       return;
//     }

//     setLoading(true);

//     const payload = {
//       category_id: Number(categoryId),
//       service_id: serviceId ? Number(serviceId) : null,
//       provider_id: providerId ? Number(providerId) : null,
//       booking_date: date,
//       booking_time: time,
//       address,
//       latitude: latInput.value ? Number(Number(latInput.value).toFixed(6)) : 0,

//       longitude: lonInput.value ? Number(Number(lonInput.value).toFixed(6)) : 0,
//       note: notes,
//     };

//     const data = await apiFetch("/bookings/", {
//       method: "POST",
//       body: JSON.stringify(payload),
//     });

//     setLoading(false);

//     if (data && !data.error) {
//       showToast("Booking created successfully!", "success");
//       setTimeout(() => {
//         window.location.href = "customer-bookings.html";
//       }, 1000);
//     }
//   }

//   function setLoading(isLoading) {
//     submitBtn.disabled = isLoading;
//     submitText.textContent = isLoading ? "Booking..." : "Book Now";
//     submitSpinner.classList.toggle("hidden", !isLoading);
//   }

//   init();
// })();

/* ============================================================
   SewaConnect — Booking Create Page
   Supports:
   booking.html?provider=8&service=12&category=3
   ============================================================ */

// (function () {
//   if (!requireAuth() || !requireRole("customer")) return;

//   const form = document.getElementById("booking-form");
//   const categorySelect = document.getElementById("booking-category");
//   const serviceSelect = document.getElementById("booking-service");
//   const providerSelect = document.getElementById("booking-provider");
//   const dateInput = document.getElementById("booking-date");
//   const timeInput = document.getElementById("booking-time");
//   const addressInput = document.getElementById("booking-address");
//   const latInput = document.getElementById("booking-latitude");
//   const lonInput = document.getElementById("booking-longitude");
//   const searchInput = document.getElementById("location-search");
//   const notesInput = document.getElementById("booking-notes");
//   const priceDisplay = document.getElementById("booking-price");
//   const submitBtn = document.getElementById("booking-submit");
//   const submitText = document.getElementById("submit-text");
//   const submitSpinner = document.getElementById("submit-spinner");
//   const getLocationBtn = document.getElementById("get-location-btn");

//   let categories = [];
//   let services = [];
//   let providers = [];

//   let selectedServicePrice = 0;

//   let map;
//   let marker;

//   // ============================================================
//   // URL PARAMETERS
//   // ============================================================

//   const urlParams = new URLSearchParams(window.location.search);

//   const urlProviderId = urlParams.get("provider");
//   const urlServiceId = urlParams.get("service");
//   const urlCategoryId = urlParams.get("category");

//   console.log("BOOKING URL PARAMETERS");
//   console.log("Provider ID:", urlProviderId);
//   console.log("Service ID:", urlServiceId);
//   console.log("Category ID:", urlCategoryId);

//   // ============================================================
//   // MAP
//   // ============================================================

//   function initMap() {
//     map = L.map("booking-map").setView([27.7172, 85.324], 13);

//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       attribution: "&copy; OpenStreetMap contributors",
//     }).addTo(map);

//     map.on("click", async function (e) {
//       const { lat, lng } = e.latlng;

//       setMarker(lat, lng);

//       latInput.value = lat.toFixed(6);
//       lonInput.value = lng.toFixed(6);

//       const address = await reverseGeocode(lat, lng);

//       if (address) {
//         addressInput.value = address;
//       }
//     });
//   }

//   function setMarker(lat, lng) {
//     if (marker) {
//       marker.setLatLng([lat, lng]);
//     } else {
//       marker = L.marker([lat, lng], {
//         draggable: true,
//       }).addTo(map);

//       marker.on("dragend", async function () {
//         const pos = marker.getLatLng();

//         latInput.value = pos.lat.toFixed(6);
//         lonInput.value = pos.lng.toFixed(6);

//         const address = await reverseGeocode(
//           pos.lat,
//           pos.lng
//         );

//         if (address) {
//           addressInput.value = address;
//         }
//       });
//     }
//   }

//   // ============================================================
//   // INITIALIZATION
//   // ============================================================

//   async function init() {
//     setMinDate();

//     initMap();

//     await loadCategories();

//     setupEvents();

//     // If URL has category, provider or service,
//     // initialize everything automatically.
//     await initializeFromUrl();
//   }

//   // ============================================================
//   // DATE
//   // ============================================================

//   function setMinDate() {
//     const today = new Date()
//       .toISOString()
//       .split("T")[0];

//     dateInput.min = today;

//     if (!dateInput.value) {
//       dateInput.value = today;
//     }
//   }

//   // ============================================================
//   // LOAD CATEGORIES
//   // ============================================================

//   async function loadCategories() {
//     const data = await apiFetch("/categories/");

//     if (!data || data.error) {
//       console.error("Failed to load categories");
//       return;
//     }

//     categories = data.results || data.data || data;

//     if (!Array.isArray(categories)) {
//       categories = [];
//       return;
//     }

//     categorySelect.innerHTML =
//       '<option value="">Select a category</option>';

//     categories.forEach((cat) => {
//       const option = document.createElement("option");

//       option.value = cat.id;
//       option.textContent = cat.name;

//       categorySelect.appendChild(option);
//     });
//   }

//   // ============================================================
//   // INITIALIZE FROM URL
//   // ============================================================

//   async function initializeFromUrl() {
//     /*
//       Expected URL:

//       booking.html?provider=8&service=12&category=3
//     */

//     if (!urlCategoryId && !urlProviderId && !urlServiceId) {
//       return;
//     }

//     console.log("Initializing booking from URL...");

//     // ----------------------------------------------------------
//     // CATEGORY
//     // ----------------------------------------------------------

//     if (urlCategoryId) {
//       categorySelect.value = String(urlCategoryId);

//       await loadServices(
//         urlCategoryId,
//         urlServiceId
//       );
//     }

//     // ----------------------------------------------------------
//     // If category was NOT supplied but service exists,
//     // find the service first.
//     // ----------------------------------------------------------

//     else if (urlServiceId) {
//       console.log(
//         "Service ID exists but category ID does not."
//       );

//       await findServiceAndInitialize(
//         urlServiceId
//       );
//     }

//     // ----------------------------------------------------------
//     // If only provider exists
//     // ----------------------------------------------------------

//     else if (urlProviderId) {
//       console.log(
//         "Only provider ID exists."
//       );

//       await loadProviderFromId(
//         urlProviderId
//       );
//     }
//   }

//   // ============================================================
//   // FIND SERVICE WITHOUT CATEGORY
//   // ============================================================

//   async function findServiceAndInitialize(serviceId) {
//     const data = await apiFetch(
//       `/services/${serviceId}/`
//     );

//     if (!data || data.error) {
//       console.error(
//         "Could not load service:",
//         serviceId
//       );
//       return;
//     }

//     const service = data.data || data;

//     console.log(
//       "SERVICE FROM URL:",
//       service
//     );

//     const categoryId =
//       service.category_id ||
//       service.category?.id;

//     if (!categoryId) {
//       console.error(
//         "Service does not contain category ID."
//       );
//       return;
//     }

//     categorySelect.value =
//       String(categoryId);

//     await loadServices(
//       categoryId,
//       serviceId
//     );
//   }

//   // ============================================================
//   // LOAD SERVICES
//   // ============================================================

//   async function loadServices(
//     categoryId,
//     selectedServiceId = null
//   ) {
//     serviceSelect.innerHTML =
//       '<option value="">Loading services...</option>';

//     serviceSelect.disabled = true;

//     providerSelect.innerHTML =
//       '<option value="">Loading providers...</option>';

//     providerSelect.disabled = true;

//     console.log(
//       "Loading services for category:",
//       categoryId
//     );

//     const data = await apiFetch(
//       `/services/?category=${categoryId}`
//     );

//     if (!data || data.error) {
//       serviceSelect.innerHTML =
//         '<option value="">No services available</option>';

//       providerSelect.innerHTML =
//         '<option value="">Any available provider</option>';

//       providerSelect.disabled = false;

//       return;
//     }

//     services =
//       data.results ||
//       data.data ||
//       data;

//     if (!Array.isArray(services)) {
//       services = [];
//     }

//     serviceSelect.innerHTML =
//       '<option value="">Select a service</option>';

//     services.forEach((service) => {
//       const option =
//         document.createElement("option");

//       option.value = service.id;

//       option.textContent =
//         `${service.title || service.name}` +
//         (
//           service.price
//             ? ` — ${formatCurrency(service.price)}`
//             : ""
//         );

//       serviceSelect.appendChild(option);
//     });

//     serviceSelect.disabled = false;

//     // ----------------------------------------------------------
//     // Automatically select service from URL
//     // ----------------------------------------------------------

//     if (selectedServiceId) {
//       const serviceExists = services.some(
//         (service) =>
//           String(service.id) ===
//           String(selectedServiceId)
//       );

//       if (serviceExists) {
//         serviceSelect.value =
//           String(selectedServiceId);

//         console.log(
//           "Automatically selected service:",
//           selectedServiceId
//         );

//         updatePrice();
//       } else {
//         console.warn(
//           "Service from URL was not found in this category."
//         );
//       }
//     }

//     // ----------------------------------------------------------
//     // Load providers
//     // ----------------------------------------------------------

//     await loadProviders(
//       categoryId,
//       urlProviderId
//     );
//   }

//   // ============================================================
//   // LOAD PROVIDERS
//   // ============================================================

//   async function loadProviders(
//     categoryId,
//     selectedProviderId = null
//   ) {
//     providerSelect.innerHTML =
//       '<option value="">Loading providers...</option>';

//     providerSelect.disabled = true;

//     console.log(
//       "Loading providers for category:",
//       categoryId
//     );

//     const data = await apiFetch(
//       `/providers/?category=${categoryId}`
//     );

//     if (!data || data.error) {
//       providerSelect.innerHTML =
//         '<option value="">Any available provider</option>';

//       providerSelect.disabled = false;

//       return;
//     }

//     providers =
//       data.results ||
//       data.data ||
//       data;

//     if (!Array.isArray(providers)) {
//       providers = [];
//     }

//     providerSelect.innerHTML =
//       '<option value="">Any available provider</option>';

//     providers.forEach((provider) => {
//       const name =
//         provider.user_full_name ||
//         "Provider";

//       const option =
//         document.createElement("option");

//       option.value = provider.id;

//       option.textContent =
//         `${name} — ${formatCurrency(
//           provider.hourly_rate || 0
//         )}/hr`;

//       providerSelect.appendChild(option);
//     });

//     providerSelect.disabled = false;

//     // ----------------------------------------------------------
//     // Automatically select provider
//     // ----------------------------------------------------------

//     if (selectedProviderId) {
//       const providerExists =
//         providers.some(
//           (provider) =>
//             String(provider.id) ===
//             String(selectedProviderId)
//         );

//       if (providerExists) {
//         providerSelect.value =
//           String(selectedProviderId);

//         console.log(
//           "Automatically selected provider:",
//           selectedProviderId
//         );
//       } else {
//         console.warn(
//           "Provider from URL was not found in this category."
//         );
//       }
//     }
//   }

//   // ============================================================
//   // LOAD PROVIDER WHEN ONLY PROVIDER ID EXISTS
//   // ============================================================

//   async function loadProviderFromId(providerId) {
//     const data = await apiFetch(
//       `/providers/${providerId}/`
//     );

//     if (!data || data.error) {
//       console.error(
//         "Could not load provider:",
//         providerId
//       );
//       return;
//     }

//     const provider =
//       data.data || data;

//     console.log(
//       "PROVIDER FROM URL:",
//       provider
//     );

//     const categoryId =
//       provider.category_id ||
//       provider.category?.id;

//     if (categoryId) {
//       categorySelect.value =
//         String(categoryId);

//       await loadServices(
//         categoryId
//       );
//     }
//   }

//   // ============================================================
//   // PRICE
//   // ============================================================

//   function updatePrice() {
//     const serviceId =
//       serviceSelect.value;

//     if (!serviceId) {
//       selectedServicePrice = 0;

//       priceDisplay.textContent =
//         "Rs. 0";

//       return;
//     }

//     const service =
//       services.find(
//         (s) =>
//           String(s.id) ===
//           String(serviceId)
//       );

//     selectedServicePrice =
//       service
//         ? Number(
//             service.price ||
//             service.base_price ||
//             0
//           )
//         : 0;

//     priceDisplay.textContent =
//       formatCurrency(
//         selectedServicePrice
//       );
//   }

//   // ============================================================
//   // EVENTS
//   // ============================================================

//   function setupEvents() {

//     // ----------------------------------------------------------
//     // CATEGORY CHANGED
//     // ----------------------------------------------------------

//     categorySelect.addEventListener(
//       "change",
//       async () => {

//         const categoryId =
//           categorySelect.value;

//         if (categoryId) {

//           // When manually changing category,
//           // clear the old URL-based service/provider selection.
//           serviceSelect.value = "";

//           await loadServices(
//             categoryId,
//             null
//           );

//         } else {

//           serviceSelect.innerHTML =
//             '<option value="">Select a service</option>';

//           serviceSelect.disabled = true;

//           providerSelect.innerHTML =
//             '<option value="">Any available provider</option>';

//           providerSelect.disabled = false;
//         }

//         updatePrice();
//       }
//     );

//     // ----------------------------------------------------------
//     // SERVICE CHANGED
//     // ----------------------------------------------------------

//     serviceSelect.addEventListener(
//       "change",
//       updatePrice
//     );

//     // ----------------------------------------------------------
//     // CURRENT LOCATION
//     // ----------------------------------------------------------

//     getLocationBtn.addEventListener(
//       "click",
//       async () => {

//         getLocationBtn.disabled = true;

//         getLocationBtn.textContent =
//           "Getting location...";

//         const pos =
//           await getCurrentPosition();

//         if (pos) {

//           latInput.value =
//             Number(pos.lat).toFixed(6);

//           lonInput.value =
//             Number(pos.lon).toFixed(6);

//           map.setView(
//             [pos.lat, pos.lon],
//             16
//           );

//           setMarker(
//             pos.lat,
//             pos.lon
//           );

//           const address =
//             await reverseGeocode(
//               pos.lat,
//               pos.lon
//             );

//           if (address) {
//             addressInput.value =
//               address;
//           }

//           showToast(
//             "Location retrieved successfully.",
//             "success"
//           );

//         } else {

//           showToast(
//             "Could not get your location. Please enter your address manually.",
//             "warning"
//           );
//         }

//         getLocationBtn.disabled = false;

//         getLocationBtn.innerHTML =
//           "&#128205; Use My Current Location";
//       }
//     );

//     // ----------------------------------------------------------
//     // LOCATION SEARCH
//     // ----------------------------------------------------------

//     async function handleSearch() {

//       const query =
//         searchInput.value.trim();

//       if (!query) return;

//       const places =
//         await searchLocation(query);

//       if (!places.length) {

//         showToast(
//           "Location not found.",
//           "warning"
//         );

//         return;
//       }

//       const place =
//         places[0];

//       const lat =
//         Number(place.lat);

//       const lon =
//         Number(place.lon);

//       addressInput.value =
//         place.display_name;

//       latInput.value =
//         lat.toFixed(6);

//       lonInput.value =
//         lon.toFixed(6);

//       map.setView(
//         [lat, lon],
//         16
//       );

//       setMarker(
//         lat,
//         lon
//       );

//       showToast(
//         "Location selected.",
//         "success"
//       );
//     }

//     searchInput.addEventListener(
//       "change",
//       handleSearch
//     );

//     searchInput.addEventListener(
//       "keydown",
//       (e) => {

//         if (e.key === "Enter") {

//           e.preventDefault();

//           handleSearch();
//         }
//       }
//     );

//     // ----------------------------------------------------------
//     // FORM
//     // ----------------------------------------------------------

//     form.addEventListener(
//       "submit",
//       handleSubmit
//     );
//   }

//   // ============================================================
//   // SUBMIT BOOKING
//   // ============================================================

//   async function handleSubmit(e) {

//     e.preventDefault();

//     const categoryId =
//       categorySelect.value;

//     const serviceId =
//       serviceSelect.value;

//     const providerId =
//       providerSelect.value;

//     const date =
//       dateInput.value;

//     const time =
//       timeInput.value;

//     const address =
//       addressInput.value.trim();

//     const notes =
//       notesInput.value.trim();

//     // ----------------------------------------------------------
//     // VALIDATION
//     // ----------------------------------------------------------

//     if (
//       !categoryId ||
//       !serviceId ||
//       !providerId ||
//       !date ||
//       !time ||
//       !address
//     ) {

//       showToast(
//         "Please select a category, service, provider and fill in all required fields.",
//         "error"
//       );

//       return;
//     }

//     if (
//       !latInput.value ||
//       !lonInput.value
//     ) {

//       showToast(
//         "Please get your location or enter coordinates.",
//         "error"
//       );

//       return;
//     }

//     setLoading(true);

//     // ----------------------------------------------------------
//     // PAYLOAD
//     // ----------------------------------------------------------

//     const payload = {

//       category_id:
//         Number(categoryId),

//       service_id:
//         Number(serviceId),

//       provider_id:
//         Number(providerId),

//       booking_date:
//         date,

//       booking_time:
//         time,

//       address,

//       latitude:
//         Number(
//           Number(
//             latInput.value
//           ).toFixed(6)
//         ),

//       longitude:
//         Number(
//           Number(
//             lonInput.value
//           ).toFixed(6)
//         ),

//       note:
//         notes,
//     };

//     console.log(
//       "BOOKING PAYLOAD:",
//       payload
//     );

//     // ----------------------------------------------------------
//     // CREATE BOOKING
//     // ----------------------------------------------------------

//     const data =
//       await apiFetch(
//         "/bookings/",
//         {
//           method: "POST",

//           body:
//             JSON.stringify(
//               payload
//             ),
//         }
//       );

//     setLoading(false);

//     if (
//       data &&
//       !data.error
//     ) {

//       showToast(
//         "Booking created successfully!",
//         "success"
//       );

//       setTimeout(
//         () => {
//           window.location.href =
//             "customer-bookings.html";
//         },
//         1000
//       );
//     }
//   }

//   // ============================================================
//   // LOADING STATE
//   // ============================================================

//   function setLoading(
//     isLoading
//   ) {

//     submitBtn.disabled =
//       isLoading;

//     submitText.textContent =
//       isLoading
//         ? "Booking..."
//         : "Book Now";

//     submitSpinner.classList.toggle(
//       "hidden",
//       !isLoading
//     );
//   }

//   // ============================================================
//   // START
//   // ============================================================

//   init();

// })();

/* ============================================================
   SewaConnect — Booking Create Page
   ============================================================ */

// (function () {
//   if (!requireAuth() || !requireRole("customer")) return;

//   const form = document.getElementById("booking-form");

//   const categorySelect = document.getElementById("booking-category");
//   const serviceSelect = document.getElementById("booking-service");
//   const providerSelect = document.getElementById("booking-provider");
//   const providerGroup = document.getElementById("provider-group");
//   const providerFixed = document.getElementById("provider-fixed");

//   const dateInput = document.getElementById("booking-date");
//   const timeInput = document.getElementById("booking-time");

//   const addressInput = document.getElementById("booking-address");
//   const latInput = document.getElementById("booking-latitude");
//   const lonInput = document.getElementById("booking-longitude");

//   const searchInput = document.getElementById("location-search");
//   const notesInput = document.getElementById("booking-notes");

//   const priceDisplay = document.getElementById("booking-price");

//   const submitBtn = document.getElementById("booking-submit");
//   const submitText = document.getElementById("submit-text");
//   const submitSpinner = document.getElementById("submit-spinner");

//   const getLocationBtn = document.getElementById("get-location-btn");

//   let categories = [];
//   let services = [];
//   let providers = [];

//   let selectedServicePrice = 0;

//   let map;
//   let marker;

//   /* ============================================================
//      MAP
//      ============================================================ */

//   function initMap() {
//     map = L.map("booking-map").setView([27.7172, 85.324], 13);

//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       attribution: "&copy; OpenStreetMap contributors",
//     }).addTo(map);

//     /* ----------------------------------------------------------
//        Click map
//        ---------------------------------------------------------- */

//     map.on("click", async function (e) {
//       const { lat, lng } = e.latlng;

//       if (marker) {
//         marker.setLatLng(e.latlng);
//       } else {
//         marker = L.marker(e.latlng, {
//           draggable: true,
//         }).addTo(map);

//         marker.on("dragend", async function () {
//           const pos = marker.getLatLng();

//           latInput.value = pos.lat.toFixed(6);

//           lonInput.value = pos.lng.toFixed(6);

//           const addr = await reverseGeocode(pos.lat, pos.lng);

//           if (addr) {
//             addressInput.value = addr;
//           }
//         });
//       }

//       latInput.value = lat.toFixed(6);

//       lonInput.value = lng.toFixed(6);

//       const address = await reverseGeocode(lat, lng);

//       if (address) {
//         addressInput.value = address;
//       }
//     });
//   }

//   /* ============================================================
//      INITIALIZATION
//      ============================================================ */

//   async function init() {
//     setMinDate();

//     const params = loadUrlParams();

//     initMap();

//     await loadCategories(params);

//     setupEvents();
//   }

//   /* ============================================================
//      DATE
//      ============================================================ */

//   function setMinDate() {
//     const today = new Date().toISOString().split("T")[0];

//     dateInput.min = today;
//     dateInput.value = today;
//   }

//   /* ============================================================
//      URL PARAMETERS
     
//      Example:
     
//      booking-create.html?
//        provider=8&
//        service=12&
//        category=3
//      ============================================================ */

//   function loadUrlParams() {
//     const params = new URLSearchParams(window.location.search);

//     const providerId = params.get("provider");

//     const categoryId = params.get("category");

//     const serviceId = params.get("service");

//     console.log("BOOKING URL PARAMETERS:", {
//       providerId,
//       categoryId,
//       serviceId,
//     });

//     return {
//       providerId,
//       categoryId,
//       serviceId,
//     };
//   }

//   /* ============================================================
//      LOAD CATEGORIES
//      ============================================================ */

//   async function loadCategories(params) {
//     const data = await apiFetch("/categories/");

//     if (!data || data.error) {
//       showToast("Could not load categories.", "error");
//       return;
//     }

//     categories = data.results || data.data || data;

//     if (!Array.isArray(categories)) {
//       categories = [];
//     }

//     categorySelect.innerHTML = '<option value="">Select a category</option>';

//     categories.forEach((cat) => {
//       const option = document.createElement("option");

//       option.value = cat.id;

//       option.textContent = cat.name;

//       categorySelect.appendChild(option);
//     });

//     /*
//      * If category came from URL,
//      * automatically select it.
//      */

//     if (params.categoryId) {
//       const categoryExists = categories.some(
//         (cat) => String(cat.id) === String(params.categoryId),
//       );

//       if (categoryExists) {
//         categorySelect.value = params.categoryId;

//         await loadServices(
//           params.categoryId,
//           params.providerId,
//           params.serviceId,
//         );
//       }
//     }
//   }

//   /* ============================================================
//      LOAD SERVICES
//      ============================================================ */

//   async function loadServices(
//     categoryId,
//     selectedProviderId = null,
//     selectedServiceId = null,
//   ) {
//     serviceSelect.innerHTML = '<option value="">Loading services...</option>';

//     serviceSelect.disabled = true;

//     providerSelect.innerHTML = '<option value="">Loading providers...</option>';

//     providerSelect.disabled = true;

//     const data = await apiFetch(`/services/?category=${categoryId}`);

//     // if (!data || data.error) {
//     //   serviceSelect.innerHTML =
//     //     '<option value="">No services available</option>';

//     //   providerSelect.innerHTML =
//     //     '<option value="">Any available provider</option>';

//     //   serviceSelect.disabled = true;
//     //   providerSelect.disabled = false;

//     //   return;
//     // }
//     if (!data || data.error) {
//       serviceSelect.innerHTML =
//         '<option value="">No services available</option>';
//       serviceSelect.disabled = true;
//       return;
//     }

//     services = data.results || data.data || data;

//     if (!Array.isArray(services)) {
//       services = [];
//     }

//     /* ----------------------------------------------------------
//        Populate services
//        ---------------------------------------------------------- */

//     serviceSelect.innerHTML = '<option value="">Select a service</option>';

//     services.forEach((s) => {
//       const option = document.createElement("option");

//       option.value = s.id;

//       const serviceName = s.title || s.name || "Service";

//       const servicePrice = s.price || s.base_price || 0;

//       option.textContent = `${serviceName}${
//         servicePrice ? ` — ${formatCurrency(servicePrice)}` : ""
//       }`;

//       serviceSelect.appendChild(option);
//     });

//     serviceSelect.disabled = false;

//     /* ----------------------------------------------------------
//        Select service from URL
//        ---------------------------------------------------------- */

//     if (selectedServiceId) {
//       const serviceExists = services.some(
//         (s) => String(s.id) === String(selectedServiceId),
//       );

//       if (serviceExists) {
//         serviceSelect.value = selectedServiceId;

//         updatePrice();
//       }
//     }

//     /* ----------------------------------------------------------
//        Load providers
//        ---------------------------------------------------------- */

//     await loadProviders(categoryId, selectedProviderId);
//   }

//   /* ============================================================
//      LOAD PROVIDERS
//      ============================================================ */

//   // async function loadProviders(categoryId, selectedProviderId = null) {
//   //   providerSelect.innerHTML = '<option value="">Loading providers...</option>';

//   //   providerSelect.disabled = true;

//   //   const data = await apiFetch(`/providers/?category=${categoryId}`);

//   //   if (!data || data.error) {
//   //     providerSelect.innerHTML =
//   //       '<option value="">Any available provider</option>';

//   //     providerSelect.disabled = false;

//   //     return;
//   //   }

//   //   providers = data.results || data.data || data;

//   //   if (!Array.isArray(providers)) {
//   //     providers = [];
//   //   }

//   //   providerSelect.innerHTML =
//   //     '<option value="">Any available provider</option>';

//   //   providers.forEach((p) => {
//   //     const name = p.user_full_name || p.name || "Provider";

//   //     const option = document.createElement("option");

//   //     option.value = p.id;

//   //     option.textContent = `${name} — ${formatCurrency(p.hourly_rate || 0)}/hr`;

//   //     providerSelect.appendChild(option);
//   //   });

//   //   providerSelect.disabled = false;

//   //   /* ----------------------------------------------------------
//   //      Select provider from URL
//   //      ---------------------------------------------------------- */

//   //   if (selectedProviderId) {
//   //     const providerExists = providers.some(
//   //       (p) => String(p.id) === String(selectedProviderId),
//   //     );

//   //     if (providerExists) {
//   //       providerSelect.value = selectedProviderId;

//   //       console.log("Provider automatically selected:", selectedProviderId);
//   //     } else {
//   //       console.warn("Provider from URL was not found:", selectedProviderId);
//   //     }
//   //   }
//   // }

//   async function setFixedProvider(providerId) {
//     providerSelect.value = "";
//     providerGroup.style.display = "none";
//     if (!providerId) return;

//     const p = await apiFetch(`/providers/${providerId}/`);
//     if (!p || p.error) {
//       showToast("Provider not found.", "error");
//       return;
//     }

//     providerSelect.value = p.id;
//     providerFixed.textContent = `${p.user_full_name || "Provider"} — ${formatCurrency(p.hourly_rate || 0)}/hr`;
//     providerGroup.style.display = "";
//   }
//   /* ============================================================
//      PRICE
//      ============================================================ */

//   function updatePrice() {
//     const serviceId = serviceSelect.value;

//     if (!serviceId) {
//       selectedServicePrice = 0;

//       priceDisplay.textContent = "Rs. 0";

//       return;
//     }

//     const service = services.find((s) => String(s.id) === String(serviceId));

//     selectedServicePrice = service
//       ? Number(service.price || service.base_price || 0)
//       : 0;

//     priceDisplay.textContent = formatCurrency(selectedServicePrice);
//   }

//   /* ============================================================
//      EVENTS
//      ============================================================ */

//   function setupEvents() {
//     /* ----------------------------------------------------------
//        Category changed
//        ---------------------------------------------------------- */

//     categorySelect.addEventListener("change", async () => {
//       const categoryId = categorySelect.value;

//       if (categoryId) {
//         /*
//          * User manually changed category.
//          *
//          * Therefore don't preserve the old
//          * provider/service from the URL.
//          */

//         await loadServices(categoryId, null, null);
//       } else {
//         serviceSelect.innerHTML = '<option value="">Select a service</option>';

//         serviceSelect.disabled = true;

//         providerSelect.innerHTML =
//           '<option value="">Any available provider</option>';

//         providerSelect.disabled = false;

//         services = [];
//         providers = [];
//       }

//       updatePrice();
//     });

//     /* ----------------------------------------------------------
//        Service changed
//        ---------------------------------------------------------- */

//     serviceSelect.addEventListener("change", updatePrice);

//     /* ----------------------------------------------------------
//        Current location button
//        ---------------------------------------------------------- */

//     getLocationBtn.addEventListener("click", async () => {
//       getLocationBtn.disabled = true;

//       getLocationBtn.textContent = "Getting location...";

//       const pos = await getCurrentPosition();

//       if (pos) {
//         latInput.value = Number(pos.lat).toFixed(6);

//         lonInput.value = Number(pos.lon).toFixed(6);

//         map.setView([pos.lat, pos.lon], 16);

//         if (marker) {
//           marker.setLatLng([pos.lat, pos.lon]);
//         } else {
//           marker = L.marker([pos.lat, pos.lon], {
//             draggable: true,
//           }).addTo(map);

//           marker.on("dragend", async function () {
//             const p = marker.getLatLng();

//             latInput.value = p.lat.toFixed(6);

//             lonInput.value = p.lng.toFixed(6);

//             const addr = await reverseGeocode(p.lat, p.lng);

//             if (addr) {
//               addressInput.value = addr;
//             }
//           });
//         }

//         const address = await reverseGeocode(pos.lat, pos.lon);

//         if (address) {
//           addressInput.value = address;
//         }

//         showToast("Location retrieved successfully.", "success");
//       } else {
//         showToast(
//           "Could not get your location. Please enter your address manually.",
//           "warning",
//         );
//       }

//       getLocationBtn.disabled = false;

//       getLocationBtn.innerHTML = "&#128205; Use My Current Location";
//     });

//     /* ----------------------------------------------------------
//        Location search
//        ---------------------------------------------------------- */

//     async function handleSearch() {
//       const query = searchInput.value.trim();

//       if (!query) return;

//       const places = await searchLocation(query);

//       if (!places.length) {
//         showToast("Location not found.", "warning");

//         return;
//       }

//       const place = places[0];

//       const lat = Number(place.lat);

//       const lon = Number(place.lon);

//       addressInput.value = place.display_name;

//       latInput.value = lat.toFixed(6);

//       lonInput.value = lon.toFixed(6);

//       map.setView([lat, lon], 16);

//       if (marker) {
//         marker.setLatLng([lat, lon]);
//       } else {
//         marker = L.marker([lat, lon], {
//           draggable: true,
//         }).addTo(map);

//         marker.on("dragend", async function () {
//           const p = marker.getLatLng();

//           latInput.value = p.lat.toFixed(6);

//           lonInput.value = p.lng.toFixed(6);

//           const addr = await reverseGeocode(p.lat, p.lng);

//           if (addr) {
//             addressInput.value = addr;
//           }
//         });
//       }

//       showToast("Location selected.", "success");
//     }

//     searchInput.addEventListener("change", handleSearch);

//     searchInput.addEventListener("keydown", (e) => {
//       if (e.key === "Enter") {
//         e.preventDefault();

//         handleSearch();
//       }
//     });

//     /* ----------------------------------------------------------
//        Form submit
//        ---------------------------------------------------------- */

//     form.addEventListener("submit", handleSubmit);
//   }

//   /* ============================================================
//      SUBMIT BOOKING
//      ============================================================ */

//   async function handleSubmit(e) {
//     e.preventDefault();

//     const categoryId = categorySelect.value;

//     const serviceId = serviceSelect.value;

//     const providerId = providerSelect.value;

//     const date = dateInput.value;

//     const time = timeInput.value;

//     const address = addressInput.value.trim();

//     const notes = notesInput.value.trim();

//     /* ----------------------------------------------------------
//        Required fields
//        ---------------------------------------------------------- */

//     if (!categoryId || !date || !time || !address) {
//       showToast("Please fill in all required fields.", "error");

//       return;
//     }

//     if (!latInput.value || !lonInput.value) {
//       showToast("Please get your location or enter coordinates.", "error");

//       return;
//     }

//     setLoading(true);

//     /* ----------------------------------------------------------
//        Booking payload
//        ---------------------------------------------------------- */

//     const payload = {
//       category_id: Number(categoryId),

//       service_id: serviceId ? Number(serviceId) : null,

//       provider_id: providerId ? Number(providerId) : null,

//       booking_date: date,

//       booking_time: time,

//       address: address,

//       latitude: latInput.value ? Number(Number(latInput.value).toFixed(6)) : 0,

//       longitude: lonInput.value ? Number(Number(lonInput.value).toFixed(6)) : 0,

//       note: notes,
//     };

//     console.log("BOOKING PAYLOAD:", payload);

//     const data = await apiFetch("/bookings/", {
//       method: "POST",

//       body: JSON.stringify(payload),
//     });

//     setLoading(false);

//     if (data && !data.error) {
//       showToast("Booking created successfully!", "success");

//       setTimeout(() => {
//         window.location.href = "customer-bookings.html";
//       }, 1000);
//     }
//   }

//   /* ============================================================
//      LOADING STATE
//      ============================================================ */

//   function setLoading(isLoading) {
//     submitBtn.disabled = isLoading;

//     submitText.textContent = isLoading ? "Booking..." : "Book Now";

//     submitSpinner.classList.toggle("hidden", !isLoading);
//   }

//   /* ============================================================
//      START
//      ============================================================ */

//   init();
// })();
(function () {
  if (!requireAuth() || !requireRole("customer")) return;

  const form = document.getElementById("booking-form");

  const categorySelect = document.getElementById("booking-category");
  const serviceSelect = document.getElementById("booking-service");

  // Provider is fixed: hidden input holds the id, a text box shows the name
  const providerInput = document.getElementById("booking-provider");
  const providerFixed = document.getElementById("provider-fixed");

  const dateInput = document.getElementById("booking-date");
  const timeInput = document.getElementById("booking-time");

  const addressInput = document.getElementById("booking-address");
  const latInput = document.getElementById("booking-latitude");
  const lonInput = document.getElementById("booking-longitude");

  const searchInput = document.getElementById("location-search");
  const notesInput = document.getElementById("booking-notes");

  const priceDisplay = document.getElementById("booking-price");

  const submitBtn = document.getElementById("booking-submit");
  const submitText = document.getElementById("submit-text");
  const submitSpinner = document.getElementById("submit-spinner");

  const getLocationBtn = document.getElementById("get-location-btn");

  let services = [];
  let selectedServicePrice = 0;

  let map;
  let marker;

  /* ============================================================
     MAP
     ============================================================ */

  function initMap() {
    map = L.map("booking-map").setView([27.7172, 85.324], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", async function (e) {
      setMarker(e.latlng.lat, e.latlng.lng);
      await applyPosition(e.latlng.lat, e.latlng.lng, true);
    });
  }

  function setMarker(lat, lng) {
    if (marker) {
      marker.setLatLng([lat, lng]);
      return;
    }
    marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("dragend", async function () {
      const p = marker.getLatLng();
      await applyPosition(p.lat, p.lng, true);
    });
  }

  async function applyPosition(lat, lng, geocode) {
    latInput.value = Number(lat).toFixed(6);
    lonInput.value = Number(lng).toFixed(6);

    if (geocode) {
      const address = await reverseGeocode(lat, lng);
      if (address) addressInput.value = address;
    }
  }

  /* ============================================================
     INIT
     ============================================================ */

  async function init() {
    setMinDate();
    initMap();
    setupEvents();

    const params = new URLSearchParams(window.location.search);
    const providerId = params.get("provider");
    const serviceId = params.get("service");

    // A booking always belongs to one specific provider.
    if (!providerId) {
      showToast("Please choose a provider first.", "warning");
      setTimeout(() => {
        window.location.href = "find-providers.html";
      }, 1200);
      return;
    }

    await loadProvider(providerId, serviceId);
  }

  /* ============================================================
     DATE (local date)
     ============================================================ */

  function setMinDate() {
    const d = new Date();
    const today = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");

    dateInput.min = today;
    dateInput.value = today;
  }

  /* ============================================================
     PROVIDER + ITS SERVICES ONLY
     ============================================================ */

  function getCategoryId(s) {
    const c = s.category_id ?? s.category;
    return c && typeof c === "object" ? c.id : c;
  }

  async function loadProvider(providerId, selectedServiceId) {
    serviceSelect.disabled = true;
    serviceSelect.innerHTML = '<option value="">Loading services...</option>';
    providerFixed.textContent = "Loading...";

    const p = await apiFetch(`/providers/${providerId}/`);

    if (!p || p.error) {
      providerFixed.textContent = "Provider not found";
      serviceSelect.innerHTML = '<option value="">No services available</option>';
      showToast("Provider not found.", "error");
      return;
    }

    // Provider: name only
    providerInput.value = p.id;
    providerFixed.textContent = p.user_full_name || "Provider";

    // Services: only this provider's services
    services = (p.services || []).filter((s) => s.is_available !== false);

    if (!services.length) {
      serviceSelect.innerHTML = '<option value="">No services available</option>';
      showToast("This provider has no available services.", "warning");
      return;
    }

    serviceSelect.innerHTML = '<option value="">Select a service</option>';

    services.forEach((s) => {
      const option = document.createElement("option");
      option.value = s.id;

      const name = s.title || s.name || "Service";
      const price = s.price || s.base_price || 0;

      option.textContent = `${name}${price ? ` — ${formatCurrency(price)}` : ""}`;
      serviceSelect.appendChild(option);
    });

    serviceSelect.disabled = false;

    // Preselect from URL, or the only service if there is just one
    if (
      selectedServiceId &&
      services.some((s) => String(s.id) === String(selectedServiceId))
    ) {
      serviceSelect.value = selectedServiceId;
    } else if (services.length === 1) {
      serviceSelect.value = services[0].id;
    }

    await loadCategoryOptions();
    onServiceChange();
  }

  // Category is not chosen by the user: it follows the selected service
  async function loadCategoryOptions() {
    const data = await apiFetch("/categories/");
    let cats = data && !data.error ? data.results || data.data || data : [];
    if (!Array.isArray(cats)) cats = [];

    categorySelect.innerHTML = '<option value="">—</option>';
    cats.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
    categorySelect.disabled = true;
  }

  function onServiceChange() {
    const service = services.find(
      (s) => String(s.id) === String(serviceSelect.value)
    );

    if (service) {
      categorySelect.value = getCategoryId(service) ?? "";
      selectedServicePrice = Number(service.price || service.base_price || 0);
    } else {
      categorySelect.value = "";
      selectedServicePrice = 0;
    }

    priceDisplay.textContent = formatCurrency(selectedServicePrice);
  }

  /* ============================================================
     EVENTS
     ============================================================ */

  function setupEvents() {
    serviceSelect.addEventListener("change", onServiceChange);

    getLocationBtn.addEventListener("click", async () => {
      getLocationBtn.disabled = true;
      getLocationBtn.textContent = "Getting location...";

      const pos = await getCurrentPosition();

      if (pos) {
        map.setView([pos.lat, pos.lon], 16);
        setMarker(pos.lat, pos.lon);
        await applyPosition(pos.lat, pos.lon, true);
        showToast("Location retrieved successfully.", "success");
      } else {
        showToast(
          "Could not get your location. Please enter your address manually.",
          "warning"
        );
      }

      getLocationBtn.disabled = false;
      getLocationBtn.innerHTML = "&#128205; Use My Current Location";
    });

    async function handleSearch() {
      const query = searchInput.value.trim();
      if (!query) return;

      const places = await searchLocation(query);

      if (!places.length) {
        showToast("Location not found.", "warning");
        return;
      }

      const place = places[0];
      const lat = Number(place.lat);
      const lon = Number(place.lon);

      addressInput.value = place.display_name;
      map.setView([lat, lon], 16);
      setMarker(lat, lon);
      await applyPosition(lat, lon, false);

      showToast("Location selected.", "success");
    }

    searchInput.addEventListener("change", handleSearch);

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    });

    form.addEventListener("submit", handleSubmit);
  }

  /* ============================================================
     SUBMIT
     ============================================================ */

  async function handleSubmit(e) {
    e.preventDefault();

    const providerId = providerInput.value;
    const serviceId = serviceSelect.value;
    const categoryId = categorySelect.value;

    const date = dateInput.value;
    const time = timeInput.value;
    const address = addressInput.value.trim();
    const notes = notesInput.value.trim();

    if (!providerId) {
      showToast("Provider is missing. Please go back and choose a provider.", "error");
      return;
    }

    if (!serviceId || !categoryId || !date || !time || !address) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (!latInput.value || !lonInput.value) {
      showToast("Please pick your location on the map.", "error");
      return;
    }

    setLoading(true);

    const payload = {
      category_id: Number(categoryId),
      service_id: Number(serviceId),
      provider_id: Number(providerId),
      booking_date: date,
      booking_time: time,
      address: address,
      latitude: Number(Number(latInput.value).toFixed(6)),
      longitude: Number(Number(lonInput.value).toFixed(6)),
      note: notes,
    };

    const data = await apiFetch("/bookings/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (data && !data.error) {
      showToast("Booking created successfully!", "success");

      setTimeout(() => {
        window.location.href = "customer-bookings.html";
      }, 1000);
    }
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitText.textContent = isLoading ? "Booking..." : "Book Now";
    submitSpinner.classList.toggle("hidden", !isLoading);
  }

  init();
})();