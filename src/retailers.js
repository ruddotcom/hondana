/**
 * honDana — retailers, prices and outbound links.
 *
 * This is the only file you edit to add affiliate tags. Every shop has a
 * `search` template with two placeholders:
 *
 *     {isbn}   the ISBN-13, when we know it
 *     {q}      the search text ("Chainsaw Man Vol. 7"), URL-encoded
 *
 * To monetise a shop, append its tag to the template. Examples:
 *
 *     "https://www.amazon.com.au/s?k={isbn}&tag=hondana-22"
 *     "https://t.cfjump.com/12345/t/54321?url=https://www.qbd.com.au/search/?searchTerm={q}"
 *
 * Shops without a template fall back to a search that finds the book but earns
 * nothing — replace those as you sign up to each network. Nothing else in the
 * app needs to change when you do.
 *
 * Networks worth joining: Commission Factory (most Australian shops),
 * Impact and Awin (UK/US/EU), Amazon Associates (per-locale, one tag each).
 */

/** Shops that will ship a Japanese edition anywhere. */
export const IMPORT_SHOPS = ["Kinokuniya", "Amazon JP", "CDJapan"];

/** Anywhere without a curated list still gets something local-first. */
export const FALLBACK_SHOPS = ["Local comic shop", "Kinokuniya", "CDJapan"];

/**
 * [currency symbol, typical single-volume price, shops, decimals]
 * Prices are the honest local shelf price for a standard tankōbon; the app
 * varies them per shop. Adjust if your market has drifted.
 */
export const STOREFRONTS = {
  Australia: ["A$", 16.95, ["QBD Books", "Amazon AU", "Dymocks", "Kinokuniya", "Angus & Robertson"]],
  "New Zealand": ["NZ$", 19.99, ["Mighty Ape", "Whitcoulls", "Paper Plus", "Amazon AU"]],
  "United States": ["US$", 11.99, ["Amazon US", "Barnes & Noble", "Books-A-Million", "Target", "Walmart", "Kinokuniya USA"]],
  Canada: ["C$", 15.99, ["Amazon CA", "Indigo", "Coles", "Kinokuniya"]],
  "United Kingdom": ["£", 9.99, ["Amazon UK", "Waterstones", "Forbidden Planet", "WHSmith", "Blackwell's"]],
  Ireland: ["€", 11.5, ["Easons", "Dubray Books", "Forbidden Planet", "Amazon UK"]],
  Japan: ["¥", 550, ["Amazon JP", "紀伊國屋書店", "honto", "楽天ブックス", "TSUTAYA"], 0],
  Singapore: ["S$", 15.9, ["Kinokuniya", "Amazon SG", "Popular", "Times Bookstores"]],
  Malaysia: ["RM", 42, ["Kinokuniya", "MPH Bookstores", "Popular", "Shopee"], 0],
  Philippines: ["₱", 480, ["National Book Store", "Fully Booked", "Comic Odyssey", "Lazada"], 0],
  Indonesia: ["Rp", 95000, ["Gramedia", "Periplus", "Tokopedia", "Shopee"], 0],
  Thailand: ["฿", 260, ["Kinokuniya", "Asia Books", "SE-ED", "Shopee"], 0],
  Vietnam: ["₫", 190000, ["Fahasa", "Tiki", "Shopee"], 0],
  India: ["₹", 799, ["Amazon IN", "Flipkart", "Crossword", "Bookswagon"], 0],
  "Sri Lanka": ["LKR", 3200, ["Sarasavi Bookshop", "Vijitha Yapa", "Makeen Books", "Kapruka"], 0],
  Pakistan: ["PKR", 2400, ["Liberty Books", "Readings", "Daraz"], 0],
  Bangladesh: ["৳", 900, ["Rokomari", "Baatighar", "Daraz"], 0],
  "United Arab Emirates": ["AED", 55, ["Amazon AE", "Kinokuniya Dubai", "Magrudy's", "Noon"]],
  "Saudi Arabia": ["SAR", 55, ["Amazon SA", "Jarir Bookstore", "Noon"]],
  Israel: ["₪", 45, ["Steimatzky", "Tzomet Sfarim"]],
  Turkey: ["₺", 165, ["D&R", "Kitapyurdu", "Idefix"], 0],
  "South Africa": ["R", 260, ["Takealot", "Exclusive Books", "Loot", "Readers Warehouse"], 0],
  Nigeria: ["₦", 12000, ["Roving Heights", "Laterna Books", "Jumia"], 0],
  Kenya: ["KSh", 1900, ["Text Book Centre", "Prestige Bookshop", "Jumia"], 0],
  Egypt: ["EGP", 480, ["Diwan", "Alef Bookstores", "Jumia"], 0],
  Germany: ["€", 8.99, ["Amazon DE", "Thalia", "Hugendubel", "Osiander"]],
  Austria: ["€", 9.3, ["Thalia", "Morawa", "Amazon DE"]],
  Switzerland: ["CHF", 14.9, ["Orell Füssli", "Ex Libris", "Amazon DE"]],
  France: ["€", 8.95, ["Amazon FR", "Fnac", "Cultura", "Momie"]],
  Belgium: ["€", 9.99, ["Standaard Boekhandel", "Fnac", "Amazon BE"]],
  Netherlands: ["€", 9.99, ["Bol.com", "Bruna", "Amazon NL"]],
  Spain: ["€", 9.5, ["Amazon ES", "Casa del Libro", "Fnac España", "Norma Comics"]],
  Portugal: ["€", 9.9, ["Bertrand", "Wook", "Fnac"]],
  Italy: ["€", 7.9, ["Amazon IT", "Feltrinelli", "Mondadori Store", "Star Shop"]],
  Greece: ["€", 9.9, ["Public", "Politeia", "Fantasticon"]],
  Poland: ["zł", 39.99, ["Empik", "Allegro", "Amazon PL"]],
  Czechia: ["Kč", 249, ["Knihy Dobrovský", "Martinus", "Crew"], 0],
  Hungary: ["Ft", 3200, ["Libri", "Bookline", "Fumax"], 0],
  Romania: ["lei", 45, ["Cărturești", "eMAG", "Libris"], 0],
  Sweden: ["kr", 129, ["Adlibris", "Bokus", "SF-Bokhandeln"], 0],
  Norway: ["kr", 149, ["Norli", "Ark", "Outland"], 0],
  Denmark: ["kr", 119, ["Saxo", "Bog & idé", "Faraos Cigarer"], 0],
  Finland: ["€", 12.9, ["Suomalainen Kirjakauppa", "Adlibris", "Fantasiapelit"]],
  Russia: ["₽", 700, ["Chitai-Gorod", "Ozon", "Wildberries"], 0],
  Ukraine: ["₴", 320, ["Yakaboo", "Book24", "Nasha Idea"], 0],
  Brazil: ["R$", 24.9, ["Amazon BR", "Panini Store", "Livraria Cultura", "Americanas"]],
  Mexico: ["MX$", 149, ["Amazon MX", "Gandhi", "Panini México", "Sanborns"], 0],
  Argentina: ["AR$", 6500, ["Mercado Libre", "Cúspide", "Ivrea Store"], 0],
  Chile: ["CLP", 8900, ["Buscalibre", "Antártica", "Ripley"], 0],
  Colombia: ["COP", 38000, ["Panamericana", "Buscalibre", "Librería Nacional"], 0],
  Peru: ["S/", 39, ["Crisol", "Ibero Librerías", "Buscalibre"], 0],
  "South Korea": ["₩", 6500, ["Kyobo Book Centre", "YES24", "Aladin"], 0],
  China: ["CN¥", 45, ["Dangdang", "JD.com", "Taobao"], 0],
  "Hong Kong SAR": ["HK$", 68, ["Kinokuniya", "Eslite", "HKTVmall"], 0],
  Taiwan: ["NT$", 120, ["博客來", "Eslite", "Kinokuniya"], 0],
};

/**
 * Where each shop's search lives. Add your affiliate tag right here.
 * Anything missing from this map falls back to a plain web search, which still
 * finds the book — it just doesn't pay you.
 */
export const SHOP_LINKS = {
  // ---- Australia ----
  "QBD Books": "https://www.qbd.com.au/search/?q={isbn}",
  "Amazon AU": "https://www.amazon.com.au/s?k={isbn}",
  Dymocks: "https://www.dymocks.com.au/catalogsearch/result/?q={isbn}",
  Kinokuniya: "https://australia.kinokuniya.com/products?utf8=%E2%9C%93&is_searching=true&restrictBy%5Bavailable_only%5D=1&keywords={isbn}",
  "Angus & Robertson": "https://www.angusrobertson.com.au/search?text={isbn}",

  // ---- New Zealand ----
  "Mighty Ape": "https://www.mightyape.co.nz/search?q={isbn}",
  Whitcoulls: "https://www.whitcoulls.co.nz/search?q={isbn}",
  "Paper Plus": "https://www.paperplus.co.nz/search?q={isbn}",
  "The Warehouse": "https://www.thewarehouse.co.nz/search?q={isbn}",

  // ---- United States / Canada ----
  "Amazon US": "https://www.amazon.com/s?k={isbn}",
  "Barnes & Noble": "https://www.barnesandnoble.com/s/{isbn}",
  "Books-A-Million": "https://www.booksamillion.com/search?query={isbn}",
  Target: "https://www.target.com/s?searchTerm={isbn}",
  Walmart: "https://www.walmart.com/search?q={isbn}",
  "Kinokuniya USA": "https://united-states.kinokuniya.com/products?keyword={q}",
  "Amazon CA": "https://www.amazon.ca/s?k={isbn}",
  Indigo: "https://www.indigo.ca/en-ca/search?q={isbn}",

  // ---- United Kingdom / Ireland ----
  "Amazon UK": "https://www.amazon.co.uk/s?k={isbn}",
  Waterstones: "https://www.waterstones.com/books/search/term/{isbn}",
  "Forbidden Planet": "https://forbiddenplanet.com/catalog/?q={isbn}",
  WHSmith: "https://www.whsmith.co.uk/search?q={isbn}",
  "Blackwell's": "https://blackwells.co.uk/bookshop/search/?keyword={isbn}",
  Easons: "https://www.easons.com/search?q={isbn}",
  "Dubray Books": "https://www.dubraybooks.ie/search?q={isbn}",

  // ---- Japan / imports ----
  "Amazon JP": "https://www.amazon.co.jp/s?k={isbn}",
  "紀伊國屋書店": "https://www.kinokuniya.co.jp/disp/CSfDispListPage_001.jsp?qs=true&ptk=01&q={q}",
  honto: "https://honto.jp/netstore/search.html?k={q}",
  "楽天ブックス": "https://books.rakuten.co.jp/search?sitem={q}",
  CDJapan: "https://www.cdjapan.co.jp/searchuni?term.media_format=&q={q}",

  // ---- Europe ----
  "Amazon DE": "https://www.amazon.de/s?k={isbn}",
  Thalia: "https://www.thalia.de/suche?sq={isbn}",
  Hugendubel: "https://www.hugendubel.de/de/suchergebnis?searchString={isbn}",
  "Amazon FR": "https://www.amazon.fr/s?k={isbn}",
  Fnac: "https://www.fnac.com/SearchResult/ResultList.aspx?Search={isbn}",
  Cultura: "https://www.cultura.com/search?q={isbn}",
  "Amazon ES": "https://www.amazon.es/s?k={isbn}",
  "Casa del Libro": "https://www.casadellibro.com/busqueda-generica?busqueda={isbn}",
  "Amazon IT": "https://www.amazon.it/s?k={isbn}",
  Feltrinelli: "https://www.lafeltrinelli.it/ricerca?query={isbn}",
  "Bol.com": "https://www.bol.com/nl/nl/s/?searchtext={isbn}",
  Empik: "https://www.empik.com/szukaj/produkt?q={isbn}",
  Adlibris: "https://www.adlibris.com/se/sok?q={isbn}",
  Saxo: "https://www.saxo.com/dk/products/search?query={isbn}",

  // ---- Rest of world ----
  "Amazon IN": "https://www.amazon.in/s?k={isbn}",
  Flipkart: "https://www.flipkart.com/search?q={isbn}",
  Crossword: "https://www.crossword.in/search?q={isbn}",
  "Amazon SG": "https://www.amazon.sg/s?k={isbn}",
  "Amazon AE": "https://www.amazon.ae/s?k={isbn}",
  "Amazon SA": "https://www.amazon.sa/s?k={isbn}",
  "Amazon BR": "https://www.amazon.com.br/s?k={isbn}",
  "Amazon MX": "https://www.amazon.com.mx/s?k={isbn}",
  "Amazon PL": "https://www.amazon.pl/s?k={isbn}",
  "Amazon NL": "https://www.amazon.nl/s?k={isbn}",
  "Amazon BE": "https://www.amazon.com.be/s?k={isbn}",
  Takealot: "https://www.takealot.com/all?qsearch={q}",
  "Exclusive Books": "https://www.exclusivebooks.co.za/search?q={isbn}",
  Rokomari: "https://www.rokomari.com/search?term={q}",
  Kapruka: "https://www.kapruka.com/search?q={q}",
  "National Book Store": "https://www.nationalbookstore.com/search?q={q}",
  "Fully Booked": "https://www.fullybookedonline.com/catalogsearch/result/?q={isbn}",
  Gramedia: "https://www.gramedia.com/search?q={q}",
  Fahasa: "https://www.fahasa.com/catalogsearch/result/?q={q}",
  "Kyobo Book Centre": "https://search.kyobobook.co.kr/search?keyword={isbn}",
  YES24: "https://www.yes24.com/product/search?query={isbn}",
  "博客來": "https://search.books.com.tw/search/query/key/{isbn}",
  Eslite: "https://www.eslite.com/Search?query={isbn}",
  Buscalibre: "https://www.buscalibre.com/libros/search?q={q}",
  "Mercado Libre": "https://listado.mercadolibre.com.ar/{q}",
  Gandhi: "https://www.gandhi.com.mx/catalogsearch/result/?q={q}",
};

/** Everything the app needs to know about one country's shops. */
export function storefront(country) {
  const row = STOREFRONTS[country];
  if (row) {
    const shops = [...row[2]];
    // Countries without their own Amazon storefront still get the ships-here option.
    if (!shops.some((sh) => sh.startsWith("Amazon"))) shops.push(`Amazon (ships to ${country})`);
    return { currency: row[0], base: row[1], shops, dec: row[3] ?? 2 };
  }
  return {
    currency: "US$", base: 12.99, dec: 2,
    shops: [...FALLBACK_SHOPS, `Amazon (ships to ${country || "you"})`],
  };
}

/**
 * The outbound URL for one shop and one volume. Prefers the ISBN when we have
 * it, since that lands on the exact book rather than a series page.
 */
export function shopUrl(shop, { isbn, title, volume, country } = {}) {
  const q = encodeURIComponent(`${title || ""}${volume ? ` Vol. ${volume}` : ""}`.trim());
  const template = SHOP_LINKS[shop];
  if (template) {
    // {isbn} lands on the exact book; {q} is the title search, which is what
    // general retailers (Kmart, Target, Big W) actually index.
    return template.replace("{isbn}", isbn || q).replace("{q}", q);
  }
  // No template yet — a plain search still gets the customer to the book.
  const where = shop.startsWith("Amazon (ships to")
    ? "amazon"
    : encodeURIComponent(shop);
  return `https://duckduckgo.com/?q=${q}+${where}${country ? `+${encodeURIComponent(country)}` : ""}`;
}