// Civic engravings match the existing instrument plates: contour, fine hatch, construction marks.
const H=s=>`<g stroke-width=".5" opacity=".56">${s}</g>`;
const scroll='<path d="M7 3h12v15H8M7 3a2 2 0 0 0-2 2v13a2 2 0 0 0 4 0H5M9 7h7M9 10h7M9 13h4"/>';
const columns='<path d="M3 9l9-6 9 6zM5 10v9M9 10v9M15 10v9M19 10v9M3 20h18"/>';
const crown='<path d="M3 8l5 4 4-8 4 8 5-4-2 11H5zM5 21h14"/>';
const cog='<path d="M9 3h6l1 4 4 1v8l-4 1-1 4H9l-1-4-4-1V8l4-1z"/><circle cx="12" cy="12" r="4"/>';
const book='<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14"/>';
const handshake='<path d="M2 9l4-3 6 2 5-2 5 4-7 9h-4L4 13M8 10l4-2 4 4-3 2-3-2M6 16l3-3M9 19l3-3"/>';
export const CIVIC_PLATES={
 code:scroll+H('<path d="M10 16h6M6 5v9M20 5v12"/>'),
 craftsmanship:'<path d="M5 20l9-12M9 5l3-3 7 6-3 3zM3 21h9M15 17l3-4 3 7h-7z"/>'+H('<path d="M13 5l3 3M6 17l2 1M16 19h3"/>'),
 trade:'<path d="M3 18h18M6 18V9h12v9M4 9l2-5h12l2 5M5 9v3M9 9v3M13 9v3M17 9v3M10 18v-4h4v4"/>'+H('<path d="M2 21h20M7 6h10"/>'),
 mysticism:'<path d="M12 3v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/><circle cx="12" cy="12" r="5"/><path d="M9 12l3-3 3 3-3 3z"/>',
 empire:columns+H('<path d="M6 22h12M12 3v-2M7 12v5M17 12v5"/>'),
 state:handshake+H('<path d="M4 3h16M7 4v1M17 4v1M5 22h14"/>'),
 drama:'<path d="M3 5c5-2 8 0 10 2v8c-3 5-6 6-9 1zM11 4c4-2 7-2 10-1v10c-2 4-5 5-8 4"/><path d="M5 9l2 1M10 10l1-1M6 15c1 2 3 2 4 0M15 7h1M19 7h1M15 12c1-1 3-1 4 0"/>',
 theology:book+'<path d="M12 2v5M10 4h4"/>'+H('<path d="M5 8h4M15 8h4M5 11h4M15 11h4"/>'),
 feudalism:'<path d="M3 20V8l3-3 3 3v4h6V8l3-3 3 3v12zM9 20v-5h6v5M2 22h20"/>'+H('<path d="M5 10v5M18 10v5M11 3h4v4h-4z"/>'),
 civilservice:scroll+'<path d="M14 15l3 2v4l-3-1-3 1v-4z"/>'+H('<path d="M10 4h6M7 8v5"/>'),
 exploration:'<circle cx="12" cy="12" r="8"/><path d="M15 6l-2 8-5 4 2-8zM12 1v3M12 20v3M1 12h3M20 12h3"/>'+H('<path d="M4 5l2 2M18 17l2 2M4 19l2-2"/>'),
 humanism:'<circle cx="12" cy="6" r="2.5"/><path d="M12 9v8M4 10l8 2 8-2M8 22l4-5 4 5"/><circle cx="12" cy="12" r="10"/>'+H('<path d="M3 3h18v18H3z"/>'),
 nationalism:'<path d="M5 22V2M6 3h14l-4 5 4 5H6M9 22h10M12 17v5"/>'+H('<path d="M8 5h7M8 8h5M8 11h7"/>'),
 economy:'<path d="M3 19h18M6 16V9M12 16V5M18 16V2M3 14l7-5 4 1 7-7"/>'+H('<path d="M6 20v2M12 20v2M18 20v2"/>'),
 ideology:'<path d="M4 21V3h8l4 4v14zM12 3v5h4M7 11h6M7 14h6M7 17h3M19 5v13l2 3"/>'+H('<circle cx="19" cy="3" r="1"/>'),
 media:'<rect x="3" y="7" width="18" height="12" rx="1"/><path d="M7 7L5 3M7 3h10M17 3l-2 4M6 10h8v6H6zM17 10h1M17 13h1M17 16h1M6 21h12"/>',
 globalization:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M4 8h16M3 12h18M4 16h16"/>'+H('<path d="M5 4L2 2M19 20l3 2"/>'),
 militarytradition:'<path d="M4 3l15 18M20 3L5 21M4 3l4 1-3 3zM20 3l-4 1 3 3zM2 16l6 5M16 21l6-5"/>'+H('<path d="M9 9l2 2M15 9l-2 2"/>'),
 workforce:'<path d="M3 21v-8l5 2V8l6 4V7h4l2 14zM3 21h19M16 7V3h3v4"/>'+H('<path d="M6 18h2M11 17h2M16 17h2M17 1h3"/>'),
 games:'<path d="M3 10c4-5 14-5 18 0v10H3zM3 14h18M7 12v8M12 12v8M17 12v8M7 5l2-3 3 3 3-3 2 3"/>'+H('<path d="M5 22h14M7 17h1M12 17h1M17 17h1"/>'),
 defensive:'<path d="M12 2l8 3v7c0 5-4 8-8 10-4-2-8-5-8-10V5zM12 5v13M8 10h8"/>'+H('<path d="M6 6v5M17 7v5M7 16l3 3"/>'),
 recordedhistory:book+'<path d="M8 2h8M10 2v3M14 2v3"/>'+H('<path d="M5 9h4M15 9h4M5 12h4M15 12h4M5 15h4"/>'),
 training:'<path d="M3 21h18M7 21V3h3v18M9 6h10v8H9M15 6v8M12 10h5"/>'+H('<path d="M4 17l2-3M17 17l3 3M11 3h8"/>'),
 navaltradition:'<path d="M5 16h14l-3 5H8zM12 2v14M11 4L5 14h6M14 5l5 9h-5M2 23c2-2 4 1 6-1s4 1 6 0 4 1 8-1"/>',
 mercenaries:'<path d="M4 19l13-13M15 3l6 6M4 16l5 5"/><circle cx="7" cy="7" r="4"/><path d="M7 5v4M5 7h4M15 17h6M18 14v7"/>',
 guilds:'<path d="M2 8l5-5 4 5-4 5zM13 8l4-5 5 5-5 5zM7 13v8M17 13v8M4 18h6M14 18h6"/>'+H('<path d="M7 5v5M17 5v5M3 23h18"/>'),
 monarchy:crown+H('<circle cx="12" cy="15" r="1.6"/><path d="M7 14l2 2M17 14l-2 2"/>'),
 divine:crown+'<path d="M12 1v6M10 3h4"/>'+H('<path d="M7 16h2M15 16h2"/>'),
 reform:'<path d="M12 3v18M7 7h10M4 21h16M4 3l3 3M20 3l-3 3M3 12h4M17 12h4"/>'+H('<path d="M8 11l-3 5M16 11l3 5M9 18h6"/>'),
 diplomacy:handshake+'<path d="M8 4h8M10 2v2M14 2v2"/>'+H('<path d="M4 21h4M16 21h4"/>'),
 enlightenment:'<path d="M8 15c-6-6-2-13 4-13s10 7 4 13l-1 4H9zM9 21h6M10 23h4M12 6v8M9 9l3 3 3-3"/>'+H('<path d="M2 6l2 1M20 7l2-1M2 15l2-1M20 14l2 1"/>'),
 opera:'<path d="M4 21V6l8-4 8 4v15M2 21h20M4 8h16M8 20v-8h8v8M8 12c3 4 5 4 8 0M12 8v4"/>'+H('<path d="M6 10v8M18 10v8"/>'),
 colonialism:'<path d="M5 22V2M6 3h13l-3 4 3 4H6M10 15l-4 7M10 15l10 7M8 18h9"/><circle cx="13" cy="16" r="3"/>',
 urbanization:'<path d="M2 22V9h6v13M8 22V3h7v19M15 22V12h7v10"/>'+H('<path d="M4 12h2M4 15h2M4 18h2M10 6h3M10 9h3M10 12h3M10 15h3M18 15h2M18 18h2"/>'),
 engineeringcorps:cog+'<path d="M8 12h8M12 8v8"/>'+H('<path d="M9 4l1 2M19 10l-2 1M14 19l-1-2"/>'),
 conservation:'<path d="M12 22V9M12 16C2 17 1 6 3 3c8-1 12 4 9 13M12 18c8 0 11-7 9-12-5 0-9 4-9 12"/>'+H('<path d="M5 6l5 8M18 9l-4 7"/>'),
 mobilization:'<path d="M3 20V8h6v12M9 20V4h6v16M15 20V8h6v12M2 22h20M5 8V4M19 8V4"/>'+H('<path d="M5 11h2M11 7h2M11 10h2M17 11h2M5 15h2M17 15h2"/>'),
 suffrage:'<path d="M4 12h16v9H4zM3 12l3-5h12l3 5M9 9h6M8 2l6-1 2 6-6 1zM10 4l2 1 2-2"/>'+H('<path d="M7 16h10M7 18h5"/>'),
 classstruggle:'<path d="M3 20l11-11M11 4l3-2 7 7-3 3zM3 18l3 3M8 3c-4 7-2 15 9 17"/>'+H('<path d="M7 6l2-2M15 16l4 2"/>'),
 totalitarian:'<path d="M12 2l8 5-2 12-6 3-6-3L4 7zM7 8h10M8 12h8M9 16h6M12 5v14"/>'+H('<path d="M2 20l2-4M22 20l-2-4"/>'),
 coldwar:'<path d="M3 2l8 20M21 2l-8 20M4 6l5-2M15 4l5 2M7 13l4-2M13 11l4 2"/><circle cx="12" cy="7" r="2"/>'+H('<path d="M10 1h4M3 21h5M16 21h5"/>'),
 spacepolicy:'<path d="M12 2c5 4 6 10 4 16H8C6 12 7 6 12 2zM8 12l-4 5v4l4-3M16 12l4 5v4l-4-3M10 20l2 3 2-3"/><circle cx="12" cy="9" r="2"/>',
 environmentalism:'<circle cx="12" cy="12" r="9"/><path d="M12 20V9M12 15c-6-1-7-5-6-9 5 0 7 4 6 9M12 17c5 0 7-4 6-7-4 0-6 3-6 7"/>'+H('<path d="M4 17l3 2M17 4l2 3"/>'),
 rapiddeployment:'<path d="M3 12l8-2 2-7 2 7 7 2-7 2-2 7-2-7zM2 4h6M1 7h5M2 19h6"/>'+H('<path d="M17 3h4M19 17h3"/>'),
 nearfuture:'<path d="M3 21V10h5v11M8 21V3h8v18M16 21V8h5v13M10 6h4M10 10h4M10 14h4M2 23h20"/>'+H('<path d="M4 4h2M18 3h3M5 13v5M18 12v6"/>'),
 futurecivic:'<path d="M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/><circle cx="12" cy="7" r="2"/>'+H('<path d="M7 11v5M17 11v5M8 18l2 1M14 19l2-1"/>')
};
CIVIC_PLATES.professional='<path d="M3 20h18M5 19V7l7-4 7 4v12M8 19v-7h8v7M8 8h8M12 12v7"/>'+H('<path d="M3 22h18M7 6l1 2M17 6l-1 2M10 14h4"/>');
CIVIC_PLATES.socialmedia='<circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="19" r="3"/><path d="M8 6h8M6 9l4 7M18 9l-4 7"/>'+H('<path d="M2 15l3-3M19 12l3 3M10 2h4"/>');
export const CIVIC_PLATE_SYMBOLS=Object.fromEntries(Object.entries(CIVIC_PLATES).map(([key,d])=>['v-'+key,d]));
