// r6 — "instrument plate" tech icons and era emblems, drawn in the manner of Renaissance engineering
// manuscripts: a main contour (stroke from CSS) plus a fine hatch / construction layer (fixed thin stroke).
// Inline SVG only; no image assets. One distinct drawing per technology.
const H=s=>`<g stroke-width=".55" opacity=".62">${s}</g>`;             // hatching / detail
const C=s=>`<g stroke-width=".45" opacity=".5" stroke-dasharray="1 1.4">${s}</g>`; // construction lines
export const TECH_PLATES={
pottery:'<path d="M9.5 4h5M10.5 4v2.2C7.5 7.4 6 10 6 13c0 4 2.7 7 6 7s6-3 6-7c0-3-1.5-5.6-4.5-6.8V4"/><path d="M7.2 9.5c-1.6 0-2.2 2.4-.6 3M16.8 9.5c1.6 0 2.2 2.4.6 3"/>'+H('<path d="M6.6 12h10.8M6.4 15h11.2M15.2 16.6l1.6-1.6M14 18l2.4-2.4M12.6 19.2l2.6-2.6"/>'),
animal:'<path d="M5 6.5c1.2 2 3.6 3 7 3s5.8-1 7-3M8 9.5v4.5c0 3.2 2 6 4 6s4-2.8 4-6V9.5"/><path d="M6 12.5h2M16 12.5h2"/>'+H('<path d="M10.4 17.4h.2M13.4 17.4h.2M10 12v1.5M14 12v1.5M9.5 15.2c1.6.8 3.4.8 5 0"/>')+C('<circle cx="12" cy="13" r="8.6"/>'),
mining:'<path d="M5 19.5l9.5-9.5M9.5 5.5c3.2-1.4 6.6-.6 9 2-2.2-.6-4.6 0-6.6 1.6"/><path d="M12.6 20.5l2.8-4.2 3.2.8 2 3.4z"/>'+H('<path d="M14.6 18.6l1.4.6M16.6 18.4l.8 1.4M7 18l1 1M9 16l1 1"/>')+C('<path d="M3 20.5h18"/>'),
sailing:'<path d="M4 16.5h16l-2.5 3h-11zM12 3.5v13M12 4.5l6 10h-6M11 6.5l-5 8h5"/>'+H('<path d="M12.8 7.5l3 5M12.8 10l1.6 2.6M3 21.3c1.5-.9 3-.9 4.5 0s3 .9 4.5 0 3-.9 4.5 0 3 .9 4.5 0"/>'),
writing:'<path d="M19 3c-5.2 1.8-9.4 6.6-11.6 13.6l1 1C15.4 15.4 19.8 11 21 4.6zM7.4 16.6L4 21"/>'+H('<path d="M16 5.6l1.6 1.6M14 7.6l1.6 1.6M12 10l1.6 1.6M10.4 12.6l1.4 1.4M10 21h10M13 18.6h7"/>'),
archery:'<path d="M7 3c6.4 3 6.4 15 0 18M7 3v18M3 12h17M17.2 9.6L20.4 12l-3.2 2.4M4.6 10.4L3.4 12l1.2 1.6"/>'+C('<path d="M7 3a9 9 0 0 1 0 18"/>')+H('<path d="M6 12l1-1M6 12l1 1"/>'),
irrigation:'<path d="M3 9.5h6.5v10.5M21 9.5h-6.5v10.5M9.5 13h5"/>'+H('<path d="M9.5 15.5h5M9.5 17.6h5M3 6c1.5-.9 3-.9 4.5 0s3 .9 4.5 0 3-.9 4.5 0 3 .9 4.5 0M4.5 12.5h3M4.5 15.5h3M16.5 12.5h3M16.5 15.5h3"/>'),
masonry:'<path d="M3 20h12M3 16h12M3 12h9M3 20V9M7 20v-4M11.5 20v-4M5.5 16v-4M9.5 16v-4"/><path d="M15.5 4.5l4 4-3 1-2-2zM14.6 8.4l-2.6 2.6"/>'+H('<path d="M4.4 18h.2M8.8 18.4h.2M6.8 14h.2M10.8 13.8h.2M17 6.5l1 1"/>'),
bronze:'<path d="M8.5 3.5h7l-1 6 4 6c-2 3-4.4 4.5-6.5 4.5S7.5 18.5 5.5 15.5l4-6z"/>'+H('<path d="M9.4 11.8h5.2M8.4 14.6h7.2M7.6 17h8.8"/>')+C('<path d="M12 2v20"/>'),
currency:'<circle cx="12" cy="12" r="8.5"/><path d="M10.4 10.4h3.2v3.2h-3.2z"/>'+C('<circle cx="12" cy="12" r="6.8"/>')+H('<path d="M12 5.6v2.4M12 16v2.4M5.6 12H8M16 12h2.4M8.2 8.2l1.2 1.2M14.6 14.6l1.2 1.2"/>'),
horseback:'<path d="M7 20.5c0-4 1-7.2 3-9.4l-1.2-4 3.2 2c3.2 0 6 2 7.2 5.2l-2 1-2.2-1-1 2c-1 1.2-1 3-1 4.2"/>'+H('<path d="M10.4 7.4L8.4 9.2M11.4 7l-1.6 2.8M12.4 7.2l-1 2.6M16.6 12.2h.2M9 14.5l1.4.6M8.6 17l1.6.4"/>'),
ironwork:'<path d="M4 10h11c0 2 2 3 5 3v1h-4l-1 2h2v3H7v-3h2l-1-2c-2.6-.4-4-2-4-4z"/><path d="M14 3h5v3h-5zM16.5 6v3"/>'+H('<path d="M8 7.2l-1-2M10 6.6v-2.2M12 7.2l1-2M6 12h8"/>'),
engineering:'<circle cx="12" cy="4.5" r="1.3"/><path d="M11.4 5.8L7 20M12.6 5.8L17 20M8.6 15h6.8"/>'+C('<path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>')+H('<path d="M3 20.5h18M6.8 18.5l.8.4M17.2 18.5l-.8.4"/>'),
celestial:'<path d="M5 17.5L12 4l7 13.5M5 17.5a8 8 0 0 0 14 0M12 4v10.5"/><path d="M18.6 3.4l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z"/>'+H('<path d="M6.6 19.8l.6-1M9.2 21l.3-1.1M12 21.4v-1.2M14.8 21l-.3-1.1M17.4 19.8l-.6-1M12 14.5l3 3.4"/>'),
education:'<path d="M3 6c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1zM12 7v14"/>'+H('<path d="M5.4 9.5h4.2M5.4 12h4.2M5.4 14.5h4.2M14.4 9.5h4.2M14.4 12h4.2M14.4 14.5h2.6"/>'),
apprenticeship:'<path d="M5 3.5v15.5h15.5M5 15h11.5V19"/><path d="M14 4l5 5-2 2-5-5z"/>'+H('<path d="M5 6.5h1.6M5 9h1.6M5 11.5h1.6M8 19v-1.6M10.6 19v-1.6M13.2 19v-1.6M15.4 5.4l-1 1M16.6 6.6l-1 1M17.8 7.8l-1 1"/>'),
machinery:'<circle cx="9" cy="9.5" r="4.6"/><circle cx="16.4" cy="16.4" r="3.2"/><path d="M9 3.6v1.3M9 14.1v1.3M3.1 9.5h1.3M13.6 9.5h1.3M4.8 5.3l.9.9M12.3 12.8l.9.9M13.2 5.3l-.9.9M5.7 12.8l-.9.9M16.4 12v1.2M16.4 19.6v1.2M12 16.4h1.2M19.6 16.4h1.2"/>'+H('<circle cx="9" cy="9.5" r="1.4"/><circle cx="16.4" cy="16.4" r="1"/><path d="M9 9.5l7.4 6.9"/>'),
stirrups:'<path d="M12 2v3M9.5 5h5M10 5C6.5 8 5.5 12.5 6 17h12c.5-4.5-.5-9-4-12M5.5 17h13v2.4h-13z"/>'+H('<path d="M8.4 9.6c.8-1.4 1.6-2.4 2.4-3M7.4 14c.2-1 .4-2 .8-3M7.5 18.2h.2M10 18.2h.2M12.5 18.2h.2M15 18.2h.2"/>'),
printing:'<path d="M5 3h14M7 3v18M17 3v18M5 21h14M12 3v6M9 9h6v3H9zM8.5 15h7"/>'+H('<path d="M11 4.4l2 .9M11 5.9l2 .9M11 7.4l2 .9M9 17.2h6M9 18.8h4.4M3.5 9.5h3.5"/>'),
gunpowder:'<path d="M7 5c3-1 7-1 10 0 1 5 1 9 0 14-3 1-7 1-10 0-1-5-1-9 0-14z"/><path d="M6.4 9.5c3.6 1 7.6 1 11.2 0M6.4 14.5c3.6 1 7.6 1 11.2 0"/>'+H('<path d="M10 5.2v13.6M14 5.2v13.6M17 4.6l2.6-2.6M20.4 1.6l.8 1.2M20.6 3.4l1.2-.4"/>'),
astronomy:'<path d="M4 11.4l12.6-6 1.6 3.2-12.6 6zM10.4 12.6L7.4 21M10.4 12.6l3 8.4M10.4 12.6V21"/>'+H('<path d="M15 6.2l1.4 3M19.6 3.6l.4.8M21 7.4h.2M3.6 5h.2M6 3.4h.2"/>')+C('<circle cx="17.4" cy="7" r="3.4"/>'),
industrial:'<path d="M3 20v-9l5 3v-3l5 3v-3l5 3V5h3v15zM2 20h20"/>'+H('<path d="M18.6 3.4c.9-1 2-.4 2.8-1.2M5 16h1.6M10 16h1.6M15 16h1.6M5 17.8h1.6M10 17.8h1.6M15 17.8h1.6"/>'),
ballistics:'<path d="M4 13.4l14-6 1.2 3-14 6z"/><circle cx="8.4" cy="16.6" r="3.6"/>'+H('<path d="M8.4 13v7.2M4.8 16.6H12M6 14.2l4.8 4.8M10.8 14.2L6 19"/>')+C('<path d="M19.6 8.4c1.8-1.8 2.4-4 2.4-6"/>'),
steam:'<path d="M3.5 9h11.5v7H3.5zM15 6h3.5v10M5.5 9V6h3v3"/><circle cx="7" cy="18.2" r="2"/><circle cx="13" cy="18.2" r="2"/>'+H('<path d="M6.4 4.2c-1-1 0-2.2 1.2-2 .4-1 2-1 2.2.2M3 16h17M7 18.2h6M5 11.4h8M5 13.4h8"/>'),
electricity:'<path d="M8 8h8v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM12 8V3.5M10 3.5h4"/>'+H('<path d="M8 13h8M8 15h8M16.6 4.2l2.2-1.2-1 2.2 2.2-1"/>')+C('<circle cx="12" cy="3.5" r="2.4"/>'),
combustion:'<path d="M8 3h8v9H8zM12 12v3.5M9 15.5h6l-1 5h-4z"/>'+H('<path d="M10 9l1-2 1 2 1-2 1 2M7 5h1M7 7.5h1M16 5h1M16 7.5h1"/>')+C('<circle cx="12" cy="18" r="4.4"/>'),
flight:'<path d="M3 9h18M3 13.4h18M6 9v4.4M12 9v4.4M18 9v4.4M20 11.2h2.2"/>'+H('<path d="M6 9l6 4.4M12 9l-6 4.4M12 9l6 4.4M18 9l-6 4.4M2 7.6v7.2"/>'),
rocketry:'<path d="M12 2c3 3 4 7 4 12H8c0-5 1-9 4-12zM8 14l-3 4h3M16 14l3 4h-3M10 18h4"/><circle cx="12" cy="8.6" r="1.6"/>'+H('<path d="M11 19.8l-.5 2.2M13 19.8l.5 2.2M12 20v2.6M9 12h6"/>'),
atomic:'<ellipse cx="12" cy="12" rx="9" ry="3.4"/><ellipse cx="12" cy="12" rx="9" ry="3.4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.4" transform="rotate(-60 12 12)"/>'+H('<circle cx="12" cy="12" r="1.5"/><circle cx="20.6" cy="12" r=".6"/>'),
computers:'<path d="M4 4.5h16v11H4zM9 20h6M12 15.5V20"/>'+H('<path d="M6.6 8.4h4v3h3.4M16.6 7v5.6M6.6 13h2M15 13h2.6"/>')+C('<path d="M2.5 18h19"/>'),
nanotech:'<path d="M12 4l6.4 3.7v7.4L12 18.8l-6.4-3.7V7.7z"/><circle cx="12" cy="4" r="1"/><circle cx="18.4" cy="15.1" r="1"/><circle cx="5.6" cy="15.1" r="1"/>'+H('<path d="M12 4v7.4M12 11.4l6.4 3.7M12 11.4l-6.4 3.7M12 18.8v2.8M18.4 7.7l2.4-1.4M5.6 7.7L3.2 6.3"/>'),
astrology:'<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="5.2"/>'+H('<path d="M12 3.4v3.4M12 17.2v3.4M3.4 12h3.4M17.2 12h3.4M5.9 5.9l2.4 2.4M15.7 15.7l2.4 2.4M18.1 5.9l-2.4 2.4M8.3 15.7l-2.4 2.4M12 9.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z"/>'),
wheel:'<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="2"/><path d="M12 3.6V10M12 14v6.4M4.7 7.8l5.6 3.2M13.7 13l5.6 3.2M19.3 7.8L13.7 11M10.3 13l-5.6 3.2"/>'+C('<circle cx="12" cy="12" r="6.8"/>')+H('<path d="M1.6 9.5h1.6M1.4 12h1.4M1.6 14.5h1.6"/>'),
mathematics:'<path d="M4 19L12 5l8 14z"/>'+C('<circle cx="12" cy="14.4" r="4.4"/><path d="M12 5v14"/>')+H('<path d="M6.4 17.2a2.4 2.4 0 0 1 1.8 1.8M17.6 17.2a2.4 2.4 0 0 0-1.8 1.8M12 19v-1.4h1.4V19"/>'),
construction:'<path d="M4.5 21L11 3.5l8.5 12M11 3.5L9.4 21M14.4 8.6V15"/><circle cx="6.8" cy="17.6" r="3.2"/>'+H('<path d="M14.4 15c.6 0 1 .5 1 1s-.4 1-1 1M6.8 14.4v6.4M3.6 17.6H10M12.4 5.6l2 3"/>'),
shipbuilding:'<path d="M3 12h18l-3 6H6zM7 12V8M10 12V6M13 12V5M16 12V7"/>'+H('<path d="M2 21.2l20-2M5 15h14M4 13.6h16"/>')+C('<path d="M6 8c2-3 8-4 11-1"/>'),
militarytactics:'<path d="M4 4h16v16H4zM6.6 16.4l4-5 3 3 4-6M15 8.2h3v3"/>'+H('<path d="M9.3 4v16M14.6 4v16M4 9.3h16M4 14.6h16"/>'),
buttress:'<path d="M3 21V8l4-4 4 4v13M11 12c4 0 7 3 8 9M19 21v-6h2v6"/>'+H('<path d="M3 11h8M3 14h8M3 17h8M5 4.5v3M12.6 14.8l1.2-1.2M14.6 16.4l1.4-1M16 18.6l1.6-.8"/>'),
castles:'<path d="M6 21V8h12v13M6 8V5h2v2h2V5h4v2h2V5h2v3M10 21v-4a2 2 0 0 1 4 0v4"/>'+H('<path d="M6 11h12M6 14h12M9 8v3M15 8v3M8 14v3M16 14v3"/>'),
cartography:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>'+H('<path d="M4.4 10c1.6-.6 2.6.6 3.4 1.6M10.4 9.4c1.4 1 2.6.6 3.4-.4M17 9.4l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>'),
banking:'<path d="M3 9l9-5 9 5zM5 9v9M9 9v9M15 9v9M19 9v9M3 18h18M2 21h20"/>'+H('<path d="M6.4 10v7M10.4 10v7M13.6 10v7M17.6 10v7"/>')+C('<circle cx="12" cy="6.8" r="1.2"/>'),
massproduction:'<path d="M3 17h18a2 2 0 0 1 0 4H3a2 2 0 0 1 0-4zM5 11h4v6H5zM10.5 11h4v6h-4zM16 11h4v6h-4z"/>'+H('<circle cx="5" cy="19" r=".8"/><circle cx="12" cy="19" r=".8"/><circle cx="19" cy="19" r=".8"/><path d="M6 6h12M15.6 4.4L18 6l-2.4 1.6"/>'),
siege:'<path d="M3 10l9-5 9 5M5 10v7.6M19 10v7.6M3 14h17l2 1-2 1H3"/><circle cx="7" cy="19.4" r="1.8"/><circle cx="17" cy="19.4" r="1.8"/>'+H('<path d="M5 12h14M8 7.4l1.4 2.6M16 7.4l-1.4 2.6M6 15h12"/>'),
metalcasting:'<path d="M4 5.5h9l-1 5H5zM13 6.6l6-3M6 15.5h12v5H6z"/><path d="M9.6 10.5c0 2 1 3 1 5"/>'+H('<path d="M8 17.6h8M9 19.2h6M5.6 7.4h6M15 11c.6-.6.6-1.4 0-2M17 12c.8-.8.8-2 0-2.8"/>'),
scientifictheory:'<path d="M12 5l7 13H5zM2 12.2h6.4"/>'+H('<path d="M15.8 11.6l6-2M16.4 12.8l5.6 1M17 14l4.2 3"/>')+C('<path d="M12 5v13M8.4 12.2h7.4"/>'),
militaryscience:'<circle cx="7.6" cy="15" r="3.6"/><circle cx="16.4" cy="15" r="3.6"/><path d="M5.4 12l1.2-6h4l.4 6M18.6 12l-1.2-6h-4l-.4 6M11 9.6h2"/>'+H('<path d="M6 14l1.4-1.4M14.8 14l1.4-1.4M7.6 7.4h2.4M14 7.4h2.4"/>'),
sanitation:'<path d="M3 7.5h9a3.5 3.5 0 0 1 3.5 3.5v2.5M11.5 4.5v3M9.5 4.5h4M3 10.5h8a1 1 0 0 1 1 1v2"/><path d="M15.5 17c0 2.2-1.1 3.5-2.2 3.5S11 19.2 11 17s2.3-3.5 2.3-3.5S15.5 14.8 15.5 17z"/>'+H('<path d="M5 7.5v3M8 7.5v3M12.4 18.4c.2.6.6 1 1.2 1"/>'),
rifling:'<path d="M2 12.6h13l3-2h3.5v3.2h-4l-2 2H9l-2 3.2H5l1-3.2H2z"/>'+H('<path d="M3.6 12.6l1.2 1.4M6 12.6l1.2 1.4M8.4 12.6l1.2 1.4M10.8 12.6l1.2 1.4M13 12.6l1.2 1.4"/>')+C('<path d="M1 11h14"/>'),
economics:'<path d="M12 4v16M8 20h8M5 7h14M5 7l-3 6h6zM19 7l-3 6h6z"/>'+H('<path d="M2 13c.8 1.4 5.2 1.4 6 0M16 13c.8 1.4 5.2 1.4 6 0M12 2.6v1.4M10.6 4h2.8"/>'),
steel:'<path d="M5 4h14v3h-5v10h5v3H5v-3h5V7H5z"/>'+H('<path d="M10 9l4 2M10 11.6l4 2M10 14.2l4 2M6.6 5.5h.2M17.4 5.5h.2M6.6 18.5h.2M17.4 18.5h.2"/>'),
refining:'<path d="M8 21L12 3l4 18M9.5 14h5M10.5 9h3M6 21h12"/>'+H('<path d="M9.5 14l3.6-5M14.5 14l-3.6-5M8.8 17.6l6.2-3.6M15.2 17.6L9 14M19 9.6c0 1.2-.7 2-1.4 2s-1.4-.8-1.4-2 1.4-2.2 1.4-2.2S19 8.4 19 9.6z"/>'),
radio:'<path d="M12 9l-4 12M12 9l4 12M9.5 16h5M12 9V7"/><path d="M8.6 5.2a4.6 4.6 0 0 1 6.8 0M6.4 3a8 8 0 0 1 11.2 0"/>'+H('<path d="M10.8 12.6h2.4M9 18.6l6-2.6M15 18.6l-6-2.6"/>')+C('<circle cx="12" cy="7" r="1.2"/>'),
advflight:'<path d="M12 2c1 0 1.5 1 1.5 3v5l7 4v2l-7-2v4l2 2v1L12 20l-3.5 1v-1l2-2v-4l-7 2v-2l7-4V5c0-2 .5-3 1.5-3z"/>'+H('<path d="M12 4.6v9.4M7 13.4l1.6-.9M17 13.4l-1.6-.9"/>'),
combinedarms:'<path d="M3 15h18l-2 4H5zM6 15v-3h10v3M16 12.8h6"/>'+H('<circle cx="7" cy="17" r=".9"/><circle cx="10.4" cy="17" r=".9"/><circle cx="13.6" cy="17" r=".9"/><circle cx="17" cy="17" r=".9"/><path d="M8 13.4h6"/>'),
advballistics:'<path d="M9 21V9c0-3 1.5-5 3-7 1.5 2 3 4 3 7v12z"/>'+H('<path d="M9 12h6M9 13.4h6M9 18h6M10.6 21v-2.8M13.4 21v-2.8"/>')+C('<path d="M12 1v21"/>'),
nuclearfission:'<circle cx="9" cy="12" r="4"/><circle cx="17.6" cy="6.4" r="2.4"/><circle cx="17.6" cy="17.6" r="2.4"/><path d="M1.6 12h2.6M3 10.8L4.2 12 3 13.2"/>'+H('<path d="M12.4 9.8l3.2-2M12.4 14.2l3.2 2M7.6 10.4l2.8 3.2M10.4 10.4l-2.8 3.2"/>'),
telecommunications:'<path d="M6 4c-2 2-2 5 0 8l6 6c3 2 6 2 8 0l-2.5-2.5-3 1-6-6 1-3z"/>'+H('<path d="M15 3.4a6 6 0 0 1 5.6 5.6M15 6.2a3.2 3.2 0 0 1 2.8 2.8M7 6.6l1.2 1.2"/>'),
satellites:'<path d="M10 10h4v4h-4zM3 9h5v6H3zM16 9h5v6h-5zM8 12h2M14 12h2M12 10V7.4M10 5.6a2.8 2.8 0 0 0 4 0"/>'+H('<path d="M5.5 9v6M18.5 9v6M3 12h5M16 12h5"/>')+C('<path d="M2 20c6-3 14-3 20 0"/>'),
lasers:'<path d="M3 10h7v4H3zM10 12h11"/><ellipse cx="13.4" cy="12" rx="1" ry="3.2"/>'+H('<path d="M14.6 12l6.4-3M14.6 12l6.4 3M5 10V8.4M8 10V8.4M4.6 12h3.6"/>'),
robotics:'<path d="M3.5 21h7.5M7 21v-4l5-6 5 3M17 14l2-4M17 14l3 2"/><circle cx="7" cy="17" r="1.2"/><circle cx="12" cy="11" r="1.2"/><circle cx="17" cy="14" r="1.2"/>'+H('<path d="M8.6 15.2l2.4-2.8M13.4 11.8l2.4 1.4M19.4 9.4l1 .4"/>'),
fusion:'<ellipse cx="12" cy="12" rx="9" ry="4.2"/><ellipse cx="12" cy="12" rx="4" ry="1.6"/>'+H('<path d="M5 8.6v6.8M8 8v8M16 8v8M19 8.6v6.8M3.6 12h4.4M16 12h4.4"/>'),
futuretech:'<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-20 12 12)"/>'+H('<path d="M9 10.4c1.6-.8 4.2-.8 6 .2M4 4.4h.2M19.6 4.4l.4.8M20 20h.2M3.6 19.4h.2"/>'),
composites:'<path d="M4 15l8-4 8 4-8 4zM4 12l8-4 8 4M4 9l8-4 8 4"/>'+H('<path d="M7 16.6l5-2.4M9 17.6l5-2.4M10 13l4 2M8 14l4 2"/>'),
guidance:'<circle cx="12" cy="12" r="7.4"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/>'+H('<circle cx="12" cy="12" r="1"/><path d="M12 6.2v.8M12 17v.8M6.2 12H7M17 12h.8M7.6 7.6l.6.6M15.8 15.8l.6.6"/>')+C('<circle cx="12" cy="12" r="4"/>')
};
// Era emblems (viewBox 200) — very faint, line-drawn, one per era index (ERAS order).
const T=s=>`<g stroke-width=".5" opacity=".7">${s}</g>`, K=s=>`<g stroke-width=".4" opacity=".55" stroke-dasharray="2 3">${s}</g>`;
export const ERA_EMBLEMS=[
// 0 Ancient — hammer and spear, crossed
K('<circle cx="100" cy="100" r="82"/><path d="M18 100h164M100 18v164"/>')+'<path d="M42 174L166 36"/><path d="M176 24l-26 6 16 16z"/><path d="M58 40l96 124"/><path d="M36 60l36-36 16 16-36 36z"/>'+T('<path d="M44 52l20-20M48 58l20-20M54 62l20-20M154 34l8 8M150 40l6 6M40 182h120M52 182l6-8 8 8M120 182l5-6 7 6"/>'),
// 1 Classical — Ionic column before an aqueduct
K('<path d="M10 120h180"/><circle cx="100" cy="100" r="84"/>')+'<path d="M66 46h68M70 54h60M80 60v112M120 60v112M70 172h60M64 182h72"/><circle cx="72" cy="56" r="7"/><circle cx="128" cy="56" r="7"/><path d="M14 150v-24a12 12 0 0 1 24 0v24M38 150v-24a12 12 0 0 1 24 0M138 126a12 12 0 0 1 24 0v24M162 126a12 12 0 0 1 24 0v24M14 114h48M138 114h48"/>'+T('<path d="M88 62v108M96 62v108M104 62v108M112 62v108M72 56l-2 2M128 56l2 2M18 120h40M142 120h40"/>'),
// 2 Medieval — castle keep with banner
K('<circle cx="100" cy="104" r="84"/><path d="M16 182h168"/>')+'<path d="M28 182V92h26v90M146 182V92h26v90M54 124h92v58M28 92v-10h6v6h6v-6h6v6h6v-6h2v10M146 92v-10h6v6h6v-6h6v6h6v-6h2v10M84 182v-26a16 16 0 0 1 32 0v26M100 124V58M100 58l30 9-30 9"/>'+T('<path d="M54 140h92M54 156h30M116 156h30M28 112h26M28 132h26M28 152h26M146 112h26M146 132h26M146 152h26M90 166v16M100 162v20M110 166v16"/>'),
// 3 Renaissance — astrolabe
K('<path d="M100 10v180M10 100h180"/>')+'<circle cx="100" cy="104" r="72"/><circle cx="100" cy="104" r="60"/><circle cx="100" cy="22" r="8"/><path d="M100 30v2M40 140c30-40 90-40 120 0M52 70c24 28 72 28 96 0M30 116L170 92"/><circle cx="100" cy="104" r="4"/>'+T('<circle cx="100" cy="104" r="66" stroke-dasharray="1 4.6"/><circle cx="100" cy="120" r="30"/><circle cx="100" cy="92" r="44"/><path d="M60 46l8 10M140 46l-8 10"/>'),
// 4 Industrial — gear with steam cylinder
K('<circle cx="100" cy="100" r="86"/>')+'<circle cx="86" cy="108" r="46"/><circle cx="86" cy="108" r="53" stroke-width="6" stroke-dasharray="8 9.4" opacity=".8"/><circle cx="86" cy="108" r="10"/><path d="M86 62v36M86 118v36M40 108h36M96 108h36M54 76l25 25M93 115l25 25M118 76l-25 25M79 115l-25 25"/><path d="M140 34h40v40h-40zM160 74v34M138 108h44"/>'+T('<path d="M144 44h32M144 54h32M144 64h32M150 26c-4-6 2-12 8-8 2-6 12-4 10 4"/>'),
// 5 Modern — early biplane
K('<circle cx="100" cy="100" r="84"/><path d="M14 100h172"/>')+'<path d="M20 78h160M20 118h160M44 78v40M76 78v40M124 78v40M156 78v40M86 98h28M100 98v-12"/><circle cx="100" cy="98" r="22"/><path d="M90 140l10 20 10-20"/>'+T('<path d="M44 78l32 40M76 78l-32 40M124 78l32 40M156 78l-32 40M78 98h-4M126 98h-4M100 120v20"/>'),
// 6 Atomic — atom
K('<circle cx="100" cy="100" r="86"/>')+'<ellipse cx="100" cy="100" rx="80" ry="28"/><ellipse cx="100" cy="100" rx="80" ry="28" transform="rotate(60 100 100)"/><ellipse cx="100" cy="100" rx="80" ry="28" transform="rotate(-60 100 100)"/><circle cx="100" cy="100" r="9"/><circle cx="180" cy="100" r="4"/><circle cx="60" cy="31" r="4"/><circle cx="60" cy="169" r="4"/>'+T('<circle cx="96" cy="97" r="4"/><circle cx="104" cy="103" r="4"/><circle cx="104" cy="96" r="3"/>'),
// 7 Information — satellite above circuit traces
K('<path d="M10 150c50-30 130-30 180 0"/>')+'<path d="M86 72h28v28H86zM30 66h46v40H30zM124 66h46v40h-46zM76 86h10M114 86h10M100 72V54M86 44a14 14 0 0 0 28 0"/>'+T('<path d="M41.5 66v40M53 66v40M64.5 66v40M30 86h46M135.5 66v40M147 66v40M158.5 66v40M124 86h46M30 170h40v-14h30M100 156v24h40M140 180h30M60 186h20"/><circle cx="170" cy="180" r="3"/><circle cx="100" cy="156" r="3"/>'),
// 8 Future — ringed station
K('<circle cx="100" cy="100" r="88"/>')+'<ellipse cx="100" cy="100" rx="78" ry="26"/><ellipse cx="100" cy="100" rx="62" ry="20"/><circle cx="100" cy="100" r="16"/><path d="M100 84V40M100 116v44M84 100H38M116 100h46"/>'+T('<path d="M30 30h2M170 40h2M160 170h2M40 160h2M96 96l8 8M104 96l-8 8"/>')
];
export const PLATE_SYMBOLS=Object.fromEntries(Object.entries(TECH_PLATES).map(([k,v])=>['p-'+k,v]));
