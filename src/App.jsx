/**
 * honDana (本棚) — a home for the manga you actually own.
 *
 * FRONT-END PROTOTYPE. All data below is mock data held in React state.
 * No backend, no auth, no third-party APIs, no camera hardware, no real
 * checkout — every one of those is simulated so the UX can be evaluated.
 *
 * Visual direction: dimmed oat-paper base, indigo-ink primary and bengara
 * iron-oxide red secondary — the two pigments of Japanese bookbinding — over
 * walnut shelving. Literata (a reading face) for headings, Inter for UI.
 */

import React, {
  useState, useMemo, useRef, useEffect, useCallback,
} from "react";
import { STOREFRONTS, IMPORT_SHOPS, storefront, shopUrl } from "./retailers.js";
import {
  Bell, Crown, Search, ScanLine, Share2, Upload, GripVertical, ChevronUp, Users, Settings as SettingsIcon, Moon, Sun, Plus, Home,
  Check, Heart, X, ChevronRight, ChevronDown, Camera, ArrowLeft, UserPlus,
  Bookmark, Loader2, Library, Globe, Mail, Lock, User as UserIcon, LogOut,
  SlidersHorizontal, Sparkles, Trash2, ShoppingBag, ExternalLink, Pencil, Star,
} from "lucide-react";
import { useUser, useClerk, SignIn, SignUp } from "@clerk/clerk-react";

/* ------------------------------------------------------------------ *
 * MOCK DATA
 *
 * In a real build, series metadata (titles, authors, genres, volume counts,
 * status) would come from AniList's GraphQL API — the best free source for
 * manga metadata. Its weak spot is *physical* data: per-volume ISBNs, regional
 * publishers, English-release progress and release dates are patchy. That half
 * needs a books API (Google Books / Open Library) cross-referenced by ISBN,
 * which is also what makes barcode scanning and the retailer prices below
 * possible. `enVols` = how far the official English release has reached;
 * anything past it is Japanese-only and flagged JP throughout the UI.
 * ------------------------------------------------------------------ */

const SERIES = [
  { id: "jjk", title: "Jujutsu Kaisen", jp: "呪術廻戦", author: "Gege Akutami", publisher: "Shueisha", en: "Viz Media", genres: ["Action", "Supernatural", "Dark Fantasy"], volumes: 30, enVols: 30, status: "Completed", year: 2018, color: "#3B4A5E", blurb: "A high-schooler swallows a cursed finger and enrols in a secret school for sorcerers who exorcise the curses born from human fear.", next: null },
  { id: "mha", title: "My Hero Academia", jp: "僕のヒーローアカデミア", author: "Kohei Horikoshi", publisher: "Shueisha", en: "Viz Media", genres: ["Action", "Adventure", "Superhero"], volumes: 42, enVols: 42, status: "Completed", year: 2014, color: "#8A5C39", blurb: "In a world where nearly everyone has a superpower, a boy born with none is handed the greatest one of all.", next: null },
  { id: "csm", title: "Chainsaw Man", jp: "チェンソーマン", author: "Tatsuki Fujimoto", publisher: "Shueisha", en: "Viz Media", genres: ["Action", "Horror", "Comedy"], volumes: 24, enVols: 21, status: "Completed", year: 2018, ended: "March 2026", color: "#9D4636", blurb: "A devil-hunting teenager in debt to the yakuza fuses with his chainsaw dog and gets drafted into public safety. The serialisation closed in March 2026 at 24 volumes.", next: null },
  { id: "vinland", title: "Vinland Saga", jp: "ヴィンランド・サガ", author: "Makoto Yukimura", publisher: "Kodansha", en: "Kodansha USA", genres: ["Historical", "Drama", "Action"], volumes: 28, enVols: 26, status: "Ongoing", year: 2005, color: "#4C6150", blurb: "A young Viking chases revenge across eleventh-century Europe, then spends the rest of his life trying to put down the sword.", next: { num: 29, date: "12 Sep 2026" } },
  { id: "bluep", title: "Blue Period", jp: "ブルーピリオド", author: "Tsubasa Yamaguchi", publisher: "Kodansha", en: "Kodansha USA", genres: ["Drama", "Slice of Life"], volumes: 17, enVols: 15, status: "Ongoing", year: 2017, color: "#42557B", blurb: "A high-achieving delinquent falls for oil painting at seventeen and sets himself at Japan's hardest art school.", next: { num: 18, date: "3 Oct 2026" } },
  { id: "monster", title: "Monster", jp: "モンスター", author: "Naoki Urasawa", publisher: "Shogakukan", en: "Viz Media", genres: ["Crime", "Thriller", "Drama"], volumes: 18, enVols: 18, status: "Completed", year: 1994, color: "#5A4A56", blurb: "A brilliant surgeon saves a boy's life, then spends a decade across Germany hunting the man that boy became.", next: null },
  { id: "witch", title: "Witch Hat Atelier", jp: "とんがり帽子のアトリエ", author: "Kamome Shirahama", publisher: "Kodansha", en: "Kodansha USA", genres: ["Fantasy", "Adventure"], volumes: 13, enVols: 12, status: "Ongoing", year: 2016, color: "#625589", blurb: "Magic is drawn, not spoken — and a girl who was never meant to hold a pen is taken in by a reclusive witch.", next: { num: 14, date: "24 Sep 2026" } },
  { id: "kaguya", title: "Kaguya-sama: Love Is War", jp: "かぐや様は告らせたい", author: "Aka Akasaka", publisher: "Shueisha", en: "Viz Media", genres: ["Romance", "Comedy"], volumes: 28, enVols: 28, status: "Completed", year: 2015, color: "#95606D", blurb: "Two student council prodigies are hopelessly in love and would each rather die than confess first.", next: null },
  { id: "dungeon", title: "Delicious in Dungeon", jp: "ダンジョン飯", author: "Ryoko Kui", publisher: "Kadokawa", en: "Yen Press", genres: ["Fantasy", "Comedy", "Adventure"], volumes: 14, enVols: 14, status: "Completed", year: 2014, color: "#86682F", blurb: "A broke adventuring party descends to rescue their swallowed swordswoman, eating every monster they meet on the way down.", next: null },
  { id: "frieren", title: "Frieren: Beyond Journey's End", jp: "葬送のフリーレン", author: "Kanehito Yamada", publisher: "Shogakukan", en: "Viz Media", genres: ["Fantasy", "Adventure", "Drama"], volumes: 14, enVols: 12, status: "Ongoing", year: 2020, color: "#487872", blurb: "An elf mage outlives the party she saved the world with, and sets out to understand the people she never bothered to know.", next: { num: 15, date: "18 Nov 2026" } },
  { id: "yotsuba", title: "Yotsuba&!", jp: "よつばと！", author: "Kiyohiko Azuma", publisher: "Kadokawa", en: "Yen Press", genres: ["Comedy", "Slice of Life"], volumes: 16, enVols: 15, status: "Ongoing", year: 2003, color: "#78864A", blurb: "A very small green-haired girl discovers doorbells, cicadas, air conditioning and the ocean, in roughly that order.", next: { num: 17, date: "5 Dec 2026" } },
  { id: "koe", title: "A Silent Voice", jp: "聲の形", author: "Yoshitoki Ōima", publisher: "Kodansha", en: "Kodansha USA", genres: ["Drama", "Romance"], volumes: 7, enVols: 7, status: "Completed", year: 2013, color: "#6A7A86", blurb: "The boy who bullied a deaf classmate out of school finds her again six years later, and tries to learn her language.", next: null },

  { id: "berserk", title: "Berserk", jp: "ベルセルク", author: "Kentaro Miura", publisher: "Hakusensha", en: "Dark Horse", genres: ["Dark Fantasy", "Action", "Horror"], volumes: 43, enVols: 42, status: "Ongoing", year: 1989, color: "#463D35", blurb: "A branded mercenary carries an impossible sword across a world that has already decided how his story ends.", next: { num: 44, date: "27 Oct 2026" } },
  { id: "lotl", title: "Land of the Lustrous", jp: "宝石の国", author: "Haruko Ichikawa", publisher: "Kodansha", en: "Kodansha USA", genres: ["Fantasy", "Sci-Fi", "Drama"], volumes: 13, enVols: 13, status: "Completed", year: 2012, color: "#51707E", blurb: "Immortal gem people defend their shore from moon-dwellers who want to grind them into ornaments.", next: null },
  { id: "punpun", title: "Goodnight Punpun", jp: "おやすみプンプン", author: "Inio Asano", publisher: "Shogakukan", en: "Viz Media", genres: ["Drama", "Psychological"], volumes: 7, enVols: 7, status: "Completed", year: 2007, color: "#5C6757", blurb: "A boy drawn as a small bird grows up in a Japan that keeps not ending. Collected in seven two-in-one volumes.", next: null },
  { id: "spy", title: "Spy × Family", jp: "スパイファミリー", author: "Tatsuya Endo", publisher: "Shueisha", en: "Viz Media", genres: ["Action", "Comedy", "Slice of Life"], volumes: 15, enVols: 13, status: "Ongoing", year: 2019, color: "#86606E", blurb: "A spy, an assassin and a telepath build a fake family, and each of them is the only one who doesn't know.", next: { num: 16, date: "4 Sep 2026" } },
  { id: "oshi", title: "Oshi no Ko", jp: "推しの子", author: "Aka Akasaka", publisher: "Shueisha", en: "Yen Press", genres: ["Drama", "Psychological", "Mystery"], volumes: 16, enVols: 15, status: "Completed", year: 2020, color: "#755477", blurb: "A doctor is reborn as the son of the idol he adored, and grows up inside the industry that killed her.", next: null },
  { id: "dandadan", title: "Dandadan", jp: "ダンダダン", author: "Yukinobu Tatsu", publisher: "Shueisha", en: "Viz Media", genres: ["Action", "Comedy", "Supernatural"], volumes: 19, enVols: 16, status: "Ongoing", year: 2021, color: "#4B6688", blurb: "She believes in aliens, he believes in ghosts, and they are both about to be extremely correct.", next: { num: 20, date: "20 Oct 2026" } },
  { id: "bluelock", title: "Blue Lock", jp: "ブルーロック", author: "Muneyuki Kaneshiro", publisher: "Kodansha", en: "Kodansha USA", genres: ["Sports", "Drama", "Action"], volumes: 32, enVols: 27, status: "Ongoing", year: 2018, color: "#3D5867", blurb: "Japan locks up three hundred strikers in a facility to manufacture one perfect egoist.", next: { num: 33, date: "9 Sep 2026" } },
  { id: "akira", title: "Akira", jp: "アキラ", author: "Katsuhiro Otomo", publisher: "Kodansha", en: "Kodansha USA", genres: ["Sci-Fi", "Action", "Cyberpunk"], volumes: 6, enVols: 6, status: "Completed", year: 1982, color: "#9C513E", blurb: "Neo-Tokyo is rebuilt on the crater of the last psychic, and a biker gang kid starts showing the same symptoms.", next: null },
  { id: "c20th", title: "20th Century Boys", jp: "20世紀少年", author: "Naoki Urasawa", publisher: "Shogakukan", en: "Viz Media", genres: ["Mystery", "Sci-Fi", "Thriller"], volumes: 22, enVols: 22, status: "Completed", year: 1999, color: "#665847", blurb: "A cult is following the doomsday plan a group of children invented in a field in 1969.", next: null },
  { id: "sakamoto", title: "Sakamoto Days", jp: "サカモトデイズ", author: "Yuto Suzuki", publisher: "Shueisha", en: "Viz Media", genres: ["Action", "Comedy"], volumes: 22, enVols: 19, status: "Ongoing", year: 2020, color: "#4A6353", blurb: "The greatest hitman alive retired to run a corner shop, and the profession would like a word.", next: { num: 23, date: "1 Dec 2026" } },

  { id: "vagabond", title: "Vagabond", jp: "バガボンド", author: "Takehiko Inoue", publisher: "Kodansha", en: "Viz Media", genres: ["Historical", "Drama", "Action"], volumes: 37, enVols: 37, status: "On hiatus", year: 1998, color: "#6B5B45", blurb: "Miyamoto Musashi walks out of a losing battle and spends the rest of his life trying to work out what strength is for.", next: null },
  { id: "souleater", title: "Soul Eater", jp: "ソウルイーター", author: "Atsushi Ōkubo", publisher: "Square Enix", en: "Yen Press", genres: ["Action", "Comedy", "Supernatural"], volumes: 25, enVols: 25, status: "Completed", year: 2004, color: "#4A4560", blurb: "Students at a school for weapon-meisters hunt corrupted souls under a moon that will not stop grinning.", next: null },

  // ---- collected editions: same work, different physical product, its own
  // ISBNs and its own run on the shelf. `work` links them together. ----
  { id: "berserk-deluxe", work: "berserk", edition: "Deluxe Edition", format: "3-in-1 hardcover", title: "Berserk", jp: "ベルセルク", author: "Kentaro Miura", publisher: "Hakusensha", en: "Dark Horse", genres: ["Dark Fantasy", "Action", "Horror"], volumes: 14, enVols: 14, status: "Ongoing", year: 2019, color: "#2F2B28", blurb: "Three tankōbon per oversized hardcover, on heavier stock. The edition most people are collecting now.", next: { num: 15, date: "17 Nov 2026" } },
  { id: "vagabond-vizbig", work: "vagabond", edition: "VIZBIG Edition", format: "3-in-1", title: "Vagabond", jp: "バガボンド", author: "Takehiko Inoue", publisher: "Kodansha", en: "Viz Media", genres: ["Historical", "Drama", "Action"], volumes: 12, enVols: 12, status: "Completed", year: 2008, color: "#7A6248", blurb: "Three volumes per book with colour pages restored — the only way to buy Vagabond new in English.", next: null },
  { id: "souleater-perfect", work: "souleater", edition: "Perfect Edition", format: "Hardcover", title: "Soul Eater", jp: "ソウルイーター", author: "Atsushi Ōkubo", publisher: "Square Enix", en: "Square Enix Manga", genres: ["Action", "Comedy", "Supernatural"], volumes: 13, enVols: 13, status: "Ongoing", year: 2020, color: "#3E3A55", blurb: "Larger hardcovers with new colour art. Two tankōbon per book, more or less.", next: { num: 14, date: "3 Nov 2026" } },
  { id: "monster-perfect", work: "monster", edition: "Complete Edition", format: "2-in-1", title: "Monster", jp: "モンスター", author: "Naoki Urasawa", publisher: "Shogakukan", en: "Viz Media", genres: ["Crime", "Thriller", "Drama"], volumes: 9, enVols: 9, status: "Completed", year: 2014, color: "#463A44", blurb: "The nine-volume reissue, with the original colour pages and a larger trim.", next: null },

  // Titles with no tankōbon release — filtered out of search results.
  { id: "web1", title: "Jujutsu Kaisen: Sorcerer's Break", jp: "", author: "Gege Akutami", publisher: "Shueisha", en: "—", genres: ["Comedy"], volumes: 0, enVols: 0, status: "Web extra", year: 2021, color: "#3B4A5E", blurb: "Bonus web strips. Never collected in print.", next: null },
  { id: "web2", title: "Frieren: Traveller's Notes", jp: "", author: "Kanehito Yamada", publisher: "Shogakukan", en: "—", genres: ["Fantasy"], volumes: 0, enVols: 0, status: "Web extra", year: 2023, color: "#487872", blurb: "Magazine-only side chapters. Never collected in print.", next: null },
  { id: "web3", title: "Blue Period: Sketchbook", jp: "", author: "Tsubasa Yamaguchi", publisher: "Kodansha", en: "—", genres: ["Slice of Life"], volumes: 0, enVols: 0, status: "Web extra", year: 2022, color: "#42557B", blurb: "Afternoon magazine bonus pages. Never collected in print.", next: null },
];

/* More works, and the editions collectors actually argue about. Compact rows:
   [id, work, edition, format, title, jp, author, publisher, en, genres,
    volumes, enVols, status, year, colour, blurb]. In production this table is
    generated by ingest-covers.mjs rather than hand-written. */
const EXTRA = [
  ["onepiece", null, null, null, "One Piece", "ワンピース", "Eiichiro Oda", "Shueisha", "Viz Media", "Action|Adventure|Comedy", 110, 108, "Ongoing", 1997, "#B4703A", "A boy of rubber sails for the crown of the pirates. The longest run on anyone's shelf."],
  ["onepiece-omni", "onepiece", "3-in-1 Omnibus", "3-in-1", "One Piece", "ワンピース", "Eiichiro Oda", "Shueisha", "Viz Media", "Action|Adventure|Comedy", 34, 34, "Ongoing", 2009, "#A5622F", "Three volumes a book. The only sane way to start 110 volumes late."],
  ["naruto", null, null, null, "Naruto", "ナルト", "Masashi Kishimoto", "Shueisha", "Viz Media", "Action|Adventure", 72, 72, "Completed", 1999, "#B96A34", "An outcast ninja with a fox sealed inside him wants the village's top job."],
  ["naruto-omni", "naruto", "3-in-1 Omnibus", "3-in-1", "Naruto", "ナルト", "Masashi Kishimoto", "Shueisha", "Viz Media", "Action|Adventure", 24, 24, "Completed", 2011, "#A85E2C", "Twenty-four books instead of seventy-two, at roughly half the price."],
  ["bleach", null, null, null, "Bleach", "ブリーチ", "Tite Kubo", "Shueisha", "Viz Media", "Action|Supernatural", 74, 74, "Completed", 2001, "#5B6675", "A teenager who sees ghosts inherits a soul reaper's sword and her whole job."],
  ["bleach-omni", "bleach", "3-in-1 Omnibus", "3-in-1", "Bleach", "ブリーチ", "Tite Kubo", "Shueisha", "Viz Media", "Action|Supernatural", 25, 25, "Completed", 2011, "#4F5A69", "The Soul Society arc in eight books rather than twenty-four."],
  ["dragonball", null, null, null, "Dragon Ball", "ドラゴンボール", "Akira Toriyama", "Shueisha", "Viz Media", "Action|Adventure|Comedy", 42, 42, "Completed", 1984, "#C08A32", "The one everything else is downstream of."],
  ["dragonball-fc", "dragonball", "Full Color Edition", "Full colour", "Dragon Ball", "ドラゴンボール", "Akira Toriyama", "Shueisha", "Viz Media", "Action|Adventure|Comedy", 20, 20, "Ongoing", 2013, "#C99A3C", "Every page recoloured, arc by arc. Expensive and worth it."],
  ["deathnote", null, null, null, "Death Note", "デスノート", "Tsugumi Ohba", "Shueisha", "Viz Media", "Mystery|Psychological|Thriller", 12, 12, "Completed", 2003, "#3A3742", "A notebook that kills, and the two smartest people alive circling it."],
  ["deathnote-black", "deathnote", "Black Edition", "2-in-1", "Death Note", "デスノート", "Tsugumi Ohba", "Shueisha", "Viz Media", "Mystery|Psychological|Thriller", 6, 6, "Completed", 2010, "#2D2A34", "Two volumes a book, black-edged pages, matte covers."],
  ["deathnote-aio", "deathnote", "All-in-One Edition", "Omnibus brick", "Death Note", "デスノート", "Tsugumi Ohba", "Shueisha", "Viz Media", "Mystery|Psychological|Thriller", 1, 1, "Completed", 2011, "#26232C", "The entire series in one 2,400-page brick."],
  ["fma", null, null, null, "Fullmetal Alchemist", "鋼の錬金術師", "Hiromu Arakawa", "Square Enix", "Viz Media", "Action|Adventure|Fantasy", 27, 27, "Completed", 2001, "#8A6A44", "Two brothers pay for a resurrection with a body and an arm."],
  ["fma-fullmetal", "fma", "Fullmetal Edition", "Hardcover 2-in-1", "Fullmetal Alchemist", "鋼の錬金術師", "Hiromu Arakawa", "Square Enix", "Viz Media", "Action|Adventure|Fantasy", 20, 20, "Completed", 2018, "#7C5C38", "Oversized hardcovers with restored colour pages and new jackets."],
  ["aot", null, null, null, "Attack on Titan", "進撃の巨人", "Hajime Isayama", "Kodansha", "Kodansha USA", "Action|Dark Fantasy|Drama", 34, 34, "Completed", 2009, "#6B6350", "Humanity behind three walls, and the things outside them."],
  ["aot-colossal", "aot", "Colossal Edition", "5-in-1", "Attack on Titan", "進撃の巨人", "Hajime Isayama", "Kodansha", "Kodansha USA", "Action|Dark Fantasy|Drama", 7, 7, "Completed", 2014, "#5C5647", "Five volumes a book. Heavy enough to be a doorstop."],
  ["sailormoon", null, null, null, "Sailor Moon", "美少女戦士セーラームーン", "Naoko Takeuchi", "Kodansha", "Kodansha USA", "Fantasy|Romance|Action", 12, 12, "Completed", 1991, "#9A6484", "The blueprint for every magical girl series since."],
  ["sailormoon-eternal", "sailormoon", "Eternal Edition", "Oversized", "Sailor Moon", "美少女戦士セーラームーン", "Naoko Takeuchi", "Kodansha", "Kodansha USA", "Fantasy|Romance|Action", 10, 10, "Completed", 2018, "#8D5A79", "Larger trim, foil covers, colour pages restored."],
  ["fruitsbasket", null, null, null, "Fruits Basket", "フルーツバスケット", "Natsuki Takaya", "Hakusensha", "Yen Press", "Romance|Drama|Comedy", 23, 23, "Completed", 1998, "#7E8A63", "A family cursed to turn into the zodiac, and the girl who won't leave."],
  ["fruitsbasket-collectors", "fruitsbasket", "Collector's Edition", "2-in-1", "Fruits Basket", "フルーツバスケット", "Natsuki Takaya", "Hakusensha", "Yen Press", "Romance|Drama|Comedy", 12, 12, "Completed", 2016, "#71805A", "Twelve books with new covers and colour inserts."],
  ["nausicaa", null, null, null, "Nausicaä of the Valley of the Wind", "風の谷のナウシカ", "Hayao Miyazaki", "Tokuma Shoten", "Viz Media", "Fantasy|Sci-Fi|Adventure", 7, 7, "Completed", 1982, "#6E7F5C", "Miyazaki's own manga, denser and bleaker than the film."],
  ["nausicaa-box", "nausicaa", "Deluxe Box Set", "2-volume box", "Nausicaä of the Valley of the Wind", "風の谷のナウシカ", "Hayao Miyazaki", "Tokuma Shoten", "Viz Media", "Fantasy|Sci-Fi|Adventure", 2, 2, "Completed", 2012, "#61735A", "Two hardcovers in a slipcase, with a poster nobody hangs."],
  ["botim", null, null, null, "Blade of the Immortal", "無限の住人", "Hiroaki Samura", "Kodansha", "Dark Horse", "Historical|Action|Drama", 31, 31, "Completed", 1993, "#5A5150", "An immortal swordsman owes a girl a hundred heads."],
  ["botim-deluxe", "botim", "Deluxe Edition", "3-in-1 hardcover", "Blade of the Immortal", "無限の住人", "Hiroaki Samura", "Kodansha", "Dark Horse", "Historical|Action|Drama", 10, 10, "Completed", 2018, "#4E4645", "Right-to-left at last, on better paper, in hardcover."],
  ["lonewolf", null, null, null, "Lone Wolf and Cub", "子連れ狼", "Kazuo Koike", "Shogakukan", "Dark Horse", "Historical|Drama|Action", 28, 28, "Completed", 1970, "#6A5F4E", "A disgraced executioner walks the assassin's road with his infant son."],
  ["lonewolf-omni", "lonewolf", "Omnibus Edition", "3-in-1", "Lone Wolf and Cub", "子連れ狼", "Kazuo Koike", "Shogakukan", "Dark Horse", "Historical|Drama|Action", 12, 12, "Completed", 2013, "#5D5344", "Twelve fat paperbacks instead of twenty-eight small ones."],
  ["alita", null, null, null, "Battle Angel Alita", "銃夢", "Yukito Kishiro", "Shueisha", "Kodansha USA", "Sci-Fi|Action|Cyberpunk", 9, 9, "Completed", 1990, "#4F6270", "A cyborg pulled from a scrapheap turns out to be a weapon."],
  ["alita-deluxe", "alita", "Deluxe Edition", "2-in-1 hardcover", "Battle Angel Alita", "銃夢", "Yukito Kishiro", "Shueisha", "Kodansha USA", "Sci-Fi|Action|Cyberpunk", 6, 6, "Completed", 2017, "#465966", "Hardcover, larger trim, the better translation."],
  ["gits", null, null, null, "Ghost in the Shell", "攻殻機動隊", "Masamune Shirow", "Kodansha", "Kodansha USA", "Sci-Fi|Cyberpunk|Action", 3, 3, "Completed", 1989, "#3F5C63", "Dense, footnoted cyberpunk that the films simplified."],
  ["gits-deluxe", "gits", "Deluxe Edition", "Hardcover", "Ghost in the Shell", "攻殻機動隊", "Masamune Shirow", "Kodansha", "Kodansha USA", "Sci-Fi|Cyberpunk|Action", 3, 3, "Completed", 2017, "#375157", "Hardcover reissues with the colour pages back where they belong."],
  ["kenshin", null, null, null, "Rurouni Kenshin", "るろうに剣心", "Nobuhiro Watsuki", "Shueisha", "Viz Media", "Historical|Action|Drama", 28, 28, "Completed", 1994, "#8A5057", "A wandering swordsman who has sworn off killing keeps being asked to."],
  ["kenshin-omni", "kenshin", "3-in-1 Omnibus", "3-in-1", "Rurouni Kenshin", "るろうに剣心", "Nobuhiro Watsuki", "Shueisha", "Viz Media", "Historical|Action|Drama", 9, 9, "Completed", 2017, "#7D474E", "The whole series in nine books."],
  ["inuyasha", null, null, null, "Inuyasha", "犬夜叉", "Rumiko Takahashi", "Shogakukan", "Viz Media", "Fantasy|Adventure|Romance", 56, 56, "Completed", 1996, "#6A7A88", "A schoolgirl falls down a well into the Sengoku era."],
  ["inuyasha-vizbig", "inuyasha", "VIZBIG Edition", "3-in-1", "Inuyasha", "犬夜叉", "Rumiko Takahashi", "Shogakukan", "Viz Media", "Fantasy|Adventure|Romance", 19, 19, "Completed", 2009, "#5F6E7B", "Nineteen large-format books, colour pages included."],
  ["hxh", null, null, null, "Hunter × Hunter", "ハンター×ハンター", "Yoshihiro Togashi", "Shueisha", "Viz Media", "Action|Adventure|Fantasy", 38, 38, "On hiatus", 1998, "#4C7360", "A boy hunts for his father through the most elaborate rule-set in shonen."],
  ["pluto", null, null, null, "Pluto", "プルートウ", "Naoki Urasawa", "Shogakukan", "Viz Media", "Sci-Fi|Mystery|Drama", 8, 8, "Completed", 2003, "#4A5566", "Urasawa retells Tezuka's Astro Boy as a murder investigation."],
  ["uzumaki", null, null, null, "Uzumaki", "うずまき", "Junji Ito", "Shogakukan", "Viz Media", "Horror|Mystery", 3, 3, "Completed", 1998, "#57545C", "A town infected by the shape of a spiral."],
  ["uzumaki-hc", "uzumaki", "Deluxe Hardcover", "3-in-1 hardcover", "Uzumaki", "うずまき", "Junji Ito", "Shogakukan", "Viz Media", "Horror|Mystery", 1, 1, "Completed", 2013, "#4B4850", "All three volumes in one hardcover, and the one to own."],
  ["slamdunk", null, null, null, "Slam Dunk", "スラムダンク", "Takehiko Inoue", "Shueisha", "Viz Media", "Sports|Comedy|Drama", 31, 31, "Completed", 1990, "#9A5340", "A delinquent joins the basketball team to impress a girl. It works out."],
  ["tokyoghoul", null, null, null, "Tokyo Ghoul", "東京喰種", "Sui Ishida", "Shueisha", "Viz Media", "Horror|Action|Psychological", 14, 14, "Completed", 2011, "#4B4550", "A student survives a transplant and wakes up needing to eat people."],
  ["c20th-perfect", "c20th", "Perfect Edition", "2-in-1", "20th Century Boys", "20世紀少年", "Naoki Urasawa", "Shogakukan", "Viz Media", "Mystery|Sci-Fi|Thriller", 11, 11, "Completed", 2018, "#5E5142", "Eleven books, including the 21st Century Boys coda."],
  ["ccs", null, null, null, "Cardcaptor Sakura", "カードキャプターさくら", "CLAMP", "Kodansha", "Kodansha USA", "Fantasy|Romance|Comedy", 12, 12, "Completed", 1996, "#8E6A84", "A girl scatters a deck of magic cards and has to fetch them all back."],
  ["ccs-collectors", "ccs", "Collector's Edition", "Hardcover", "Cardcaptor Sakura", "カードキャプターさくら", "CLAMP", "Kodansha", "Kodansha USA", "Fantasy|Romance|Comedy", 9, 9, "Completed", 2019, "#815E77", "Hardcover, larger, with all the colour art CLAMP drew for it."],
  ["nana", null, null, null, "Nana", "ナナ", "Ai Yazawa", "Shueisha", "Viz Media", "Romance|Drama|Music", 21, 21, "On hiatus", 2000, "#8E4A5E", "Two women called Nana share a Tokyo flat and ruin each other's lives beautifully."],
  ["kimi", null, null, null, "Kimi ni Todoke", "君に届け", "Karuho Shiina", "Shueisha", "Viz Media", "Romance|Drama|Slice of Life", 30, 30, "Completed", 2005, "#A46A80", "A girl everyone mistakes for a ghost story is befriended by the most popular boy in school."],
  ["vagabond-perfect", "vagabond", "Definitive Edition", "Kanzenban hardcover", "Vagabond", "バガボンド", "Takehiko Inoue", "Kodansha", "Viz Media", "Historical|Drama|Action", 22, 22, "Completed", 2013, "#8A6A44", "The 完全版 reissue: larger trim, restored colour plates, twenty-two volumes."],
  ["yyh", null, null, null, "Yu Yu Hakusho", "幽遊白書", "Yoshihiro Togashi", "Shueisha", "Viz Media", "Action|Supernatural|Comedy", 19, 19, "Completed", 1990, "#5C6E4E", "A delinquent dies saving a child and gets a job in the afterlife."],
];
SERIES.push(...EXTRA.map(([id, work, edition, format, title, jp, author, publisher, en, genres, volumes, enVols, status, year, color, blurb]) => ({
  id, work: work || id, edition: edition || "Standard", format: format || null,
  title, jp, author, publisher, en, genres: genres.split("|"),
  volumes, enVols, status, year, color, blurb, next: null,
})));

// Every entry belongs to a `work`; standard tankōbon runs are their own work.
SERIES.forEach((s) => { if (!s.work) s.work = s.id; if (!s.edition) s.edition = "Standard"; });
const SERIES_BY_ID = Object.fromEntries(SERIES.map((s) => [s.id, s]));
const editionsOf = (s) => SERIES.filter((x) => x.work === s.work && x.volumes > 0);
const fullTitle = (s) => (s.edition === "Standard" ? s.title : `${s.title} · ${s.edition}`);
const PUBLISHERS = ["Shueisha", "Kodansha", "Shogakukan", "Kadokawa", "Hakusensha"];
const GENRES = ["Action", "Adventure", "Comedy", "Crime", "Cyberpunk", "Dark Fantasy", "Drama", "Fantasy", "Historical", "Horror", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Superhero", "Supernatural", "Thriller"];
const AUTHORS = Array.from(new Set(SERIES.filter((s) => s.volumes > 0).map((s) => s.author))).sort();
const jpOnly = (s, vol) => vol > (s.enVols ?? s.volumes);

const COUNTRIES = ("Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cabo Verde|Cambodia|Cameroon|Canada|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo|Congo (DRC)|Costa Rica|Côte d'Ivoire|Croatia|Cuba|Cyprus|Czechia|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hong Kong SAR|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kosovo|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Macao SAR|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Mexico|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Puerto Rico|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Vatican City|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe").split("|");

/* ---- retailers & pricing -------------------------------------------
 * The shop list, the prices and every outbound link live in ./retailers.js —
 * that's the one file to edit when you add affiliate tags. Nothing in here
 * needs to change when you do.
 * ------------------------------------------------------------------- */

function money(currency, n, dec = 2) {
  return dec === 0
    ? `${currency}${Math.round(n).toLocaleString()}`
    : `${currency}${n.toFixed(2)}`;
}
/** Deterministic mock offer for one shop. */
function offerFor(country, series, vol, shop, isImport) {
  const { currency, base, dec } = storefront(country);
  const h = hash(series.id + "|" + vol + "|" + shop);
  const factor = 0.8 + (h % 42) / 100;
  let price = base * factor * (isImport ? 1.6 : 1);
  if (dec === 0) price = base >= 10000 ? Math.round(price / 500) * 500 : Math.round(price / 10) * 10;
  else price = Math.max(3.95, Math.round(price) - 0.05);
  return {
    shop, price, currency, dec,
    stock: hash(shop + series.id + vol + "s") % 9 !== 0,
    url: shopUrl(shop, { isbn: ISBN_FOR(series, vol), title: series.title, volume: vol, country }),
  };
}
function offersFor(country, series, vol) {
  const isImport = jpOnly(series, vol);
  const shops = isImport
    ? (country === "Japan" ? storefront(country).shops.slice(0, 4) : IMPORT_SHOPS)
    : storefront(country).shops;
  return shops.map((shop) => offerFor(country, series, vol, shop, isImport && country !== "Japan"))
    .sort((a, b) => (a.stock === b.stock ? a.price - b.price : a.stock ? -1 : 1));
}
/** Simulated price history. A real build diffs today's feed against yesterday's. */
function priceDrop(country, series, vol, offer) {
  if (!offer) return null;
  const h = hash("drop|" + country + series.id + vol);
  if (h % 4 !== 0) return null;
  const { dec } = storefront(country);
  const raw = offer.price * (1.16 + (h % 15) / 100);
  const was = dec === 0 ? Math.round(raw / 10) * 10 : Math.round(raw) - 0.05;
  if (was <= offer.price) return null;
  return { was, pct: Math.round((1 - offer.price / was) * 100) };
}
const bestOffer = (country, series, vol) => offersFor(country, series, vol).find((o) => o.stock) || null;

/** owned = 1..upTo minus `missing`. Mirrors a real, gappy collection. */
function buildCollection(config) {
  const out = {};
  config.forEach((c, i) => {
    const s = SERIES_BY_ID[c.id];
    if (!s) return;
    const upTo = Math.min(c.upTo ?? s.volumes, s.volumes);
    const missing = new Set(c.missing || []);
    const owned = [];
    for (let v = 1; v <= upTo; v++) if (!missing.has(v)) owned.push(v);
    out[c.id] = { owned, wishlist: c.wishlist || [], followed: !!c.followed, coverOut: c.coverOut ?? null, added: i };
  });
  return out;
}

// 209 volumes across 12 series — enough to push the shelf past the point where
// naive rendering would start to stutter.
const MY_COLLECTION = [
  { id: "jjk", upTo: 30, missing: [12, 30], coverOut: 28, wishlist: [12, 30] },
  { id: "mha", upTo: 38, missing: [7, 19], wishlist: [39] },
  { id: "csm", upTo: 18, coverOut: 11, wishlist: [19, 20, 22] },
  { id: "vinland", upTo: 24, missing: [3], followed: true, wishlist: [25, 26] },
  { id: "bluep", upTo: 17, missing: [11], followed: true },
  { id: "monster", upTo: 18 },
  { id: "witch", upTo: 12, followed: true },
  { id: "kaguya", upTo: 20, missing: [4, 17], wishlist: [21] },
  { id: "dungeon", upTo: 14, missing: [6], wishlist: [6] },
  { id: "frieren", upTo: 11, followed: true, coverOut: 5, wishlist: [12] },
  { id: "yotsuba", upTo: 9, followed: true },
  { id: "koe", upTo: 7 },
  { id: "berserk-deluxe", upTo: 8, followed: true, coverOut: 8 },
  { id: "vagabond-vizbig", upTo: 5, wishlist: [6] },
];

const FRIENDS = [
  { id: "f1", name: "Aiko Mizuno", handle: "aiko.reads", country: "Japan", joined: "March 2024",
    bio: "Reading Urasawa in publication order, again. Will trade Monster doubles.",
    profile: { avatarColor: "#5B4B57", favourites: ["monster", "c20th", "punpun", "frieren"], favouriteVolume: { id: "monster", vol: 12 } },
    friendIds: ["f3", "f4"], blurb: "Urasawa completionist", premium: true,
    collection: buildCollection([
      { id: "monster", upTo: 18, coverOut: 18 }, { id: "c20th", upTo: 22 }, { id: "punpun", upTo: 7 },
      { id: "frieren", upTo: 14 }, { id: "koe", upTo: 7 }, { id: "lotl", upTo: 9, missing: [4] },
    ]) },
  { id: "f2", name: "Devon Aluko", handle: "shonenshelf", country: "United States", joined: "August 2023",
    bio: "Jump devotee. If it ran in WSJ I probably own it in two languages.",
    profile: { avatarColor: "#9A4634", favourites: ["jjk", "mha", "csm", "dandadan"], favouriteVolume: { id: "csm", vol: 11 } },
    friendIds: ["f4", "f5"], blurb: "Shonen Jump, front to back",
    collection: buildCollection([
      { id: "jjk", upTo: 30 }, { id: "mha", upTo: 42, missing: [30], coverOut: 42 }, { id: "csm", upTo: 21 },
      { id: "dandadan", upTo: 16 }, { id: "sakamoto", upTo: 19, missing: [2, 3] }, { id: "spy", upTo: 13 },
    ]) },
  { id: "f3", name: "Priya Raman", handle: "priya.tankobon", country: "Australia", joined: "January 2025",
    bio: "Two volumes a month, no more. Shelf has to stay beautiful.",
    profile: { avatarColor: "#5A6E4C", favourites: ["witch", "dungeon", "yotsuba", "bluep"], favouriteVolume: { id: "witch", vol: 12 } },
    friendIds: ["f1", "f5"], blurb: "Slow reader, nice shelves",
    collection: buildCollection([
      { id: "witch", upTo: 12, coverOut: 12 }, { id: "dungeon", upTo: 14 }, { id: "yotsuba", upTo: 15 },
      { id: "bluep", upTo: 15 }, { id: "vinland", upTo: 12 },
    ]) },
  { id: "f4", name: "Tomás Vidal", handle: "seinen.tom", country: "Mexico", joined: "June 2022",
    bio: "Won't start anything still running. Berserk was a mistake in that regard.",
    profile: { avatarColor: "#7C5730", favourites: ["berserk", "akira", "monster", "oshi"], favouriteVolume: { id: "akira", vol: 6 } },
    friendIds: ["f1", "f2"], blurb: "Only reads finished series",
    collection: buildCollection([
      { id: "berserk", upTo: 41, missing: [22] }, { id: "akira", upTo: 6, coverOut: 6 }, { id: "monster", upTo: 12 },
      { id: "oshi", upTo: 15 }, { id: "bluelock", upTo: 24 },
    ]) },
  { id: "f5", name: "Hana Okafor", handle: "hana.shelf", country: "United Kingdom", joined: "November 2024",
    bio: "Romance, slice of life, and one sports manga I refuse to explain.",
    profile: { avatarColor: "#42557B", favourites: ["kaguya", "koe", "spy", "yotsuba"], favouriteVolume: { id: "kaguya", vol: 14 } },
    friendIds: ["f2", "f3"], blurb: "Romance and slice of life",
    collection: buildCollection([
      { id: "kaguya", upTo: 28 }, { id: "koe", upTo: 7 }, { id: "spy", upTo: 13, coverOut: 13 }, { id: "yotsuba", upTo: 11 },
    ]) },
];
const MORE_PEOPLE = [
  { id: "f6", name: "Marcus Bell", handle: "panelbypanel", country: "United States", joined: "May 2023",
    bio: "Deluxe editions only. My shelf is shorter and heavier than yours.",
    profile: { avatarColor: "#2E4A63", favourites: ["berserk-deluxe", "vagabond-vizbig", "monster-perfect", "akira"], favouriteVolume: { id: "berserk-deluxe", vol: 5 } },
    friendIds: ["f2", "f4"], blurb: "Hardcovers or nothing", followsYou: true, premium: true,
    collection: buildCollection([{ id: "berserk-deluxe", upTo: 14 }, { id: "vagabond-vizbig", upTo: 12 }, { id: "monster-perfect", upTo: 9 }, { id: "akira", upTo: 6 }]) },
  { id: "f7", name: "Yuki Tanaka", handle: "yuki.vol", country: "Japan", joined: "July 2025",
    bio: "Buys the Japanese release, waits for the English one anyway.",
    profile: { avatarColor: "#5A6E4C", favourites: ["frieren", "dandadan", "sakamoto", "jjk"], favouriteVolume: { id: "frieren", vol: 13 } },
    friendIds: ["f1"], blurb: "Reads it first in Japanese", followsYou: true,
    collection: buildCollection([{ id: "frieren", upTo: 14 }, { id: "dandadan", upTo: 19 }, { id: "sakamoto", upTo: 22 }, { id: "jjk", upTo: 30 }]) },
  { id: "f8", name: "Sofia Reyes", handle: "sofia.reads", country: "Mexico", joined: "October 2024",
    bio: "Shoujo, seinen, and whatever the shop had on sale.",
    profile: { avatarColor: "#9A4634", favourites: ["koe", "bluep", "oshi", "kaguya"], favouriteVolume: { id: "bluep", vol: 6 } },
    friendIds: ["f5"], blurb: "Reads two at a time",
    collection: buildCollection([{ id: "koe", upTo: 7 }, { id: "bluep", upTo: 12 }, { id: "oshi", upTo: 10 }, { id: "kaguya", upTo: 14 }]) },
  { id: "f9", name: "Liam O'Brien", handle: "liamshelves", country: "Ireland", joined: "February 2026",
    bio: "New to this. Started with Chainsaw Man like everyone else.",
    profile: { avatarColor: "#665889", favourites: ["csm", "dandadan", "spy"], favouriteVolume: { id: "csm", vol: 4 } },
    friendIds: [], blurb: "Six months in", private: true,
    collection: buildCollection([{ id: "csm", upTo: 11 }, { id: "dandadan", upTo: 6 }, { id: "spy", upTo: 4 }]) },
  { id: "f10", name: "Ananya Nair", handle: "ananya.manga", country: "India", joined: "September 2025",
    bio: "Fantasy only. Witch Hat Atelier is the best-drawn manga going.",
    profile: { avatarColor: "#86682F", favourites: ["witch", "dungeon", "frieren", "lotl"], favouriteVolume: { id: "witch", vol: 9 } },
    friendIds: ["f3"], blurb: "Fantasy shelf", followsYou: true, premium: true,
    collection: buildCollection([{ id: "witch", upTo: 12 }, { id: "dungeon", upTo: 14 }, { id: "frieren", upTo: 12 }, { id: "lotl", upTo: 13 }]) },
  { id: "f11", name: "Chen Wei", handle: "weishelf", country: "Singapore", joined: "April 2024",
    bio: "Kinokuniya membership card is the most used thing in my wallet.",
    profile: { avatarColor: "#5B4B57", favourites: ["monster", "c20th", "vagabond", "berserk"], favouriteVolume: { id: "vagabond", vol: 22 } },
    friendIds: ["f1", "f6"], blurb: "Seinen and long runs",
    collection: buildCollection([{ id: "monster", upTo: 18 }, { id: "c20th", upTo: 22 }, { id: "vagabond", upTo: 24 }, { id: "berserk", upTo: 30 }]) },
];
FRIENDS.push(...MORE_PEOPLE);
const FRIEND_BY_ID = Object.fromEntries(FRIENDS.map((f) => [f.id, f]));

const AVATAR_COLORS = ["#2E4A63", "#9A4634", "#5A6E4C", "#7C5730", "#5B4B57", "#42557B", "#86682F", "#665889"];

/* ---------------------------- small helpers ---------------------------- */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function rgbParts(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex, amt) {
  const ch = rgbParts(hex).map((c) =>
    Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)))));
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}
/** Shift a series colour around the wheel so each volume reads as its own book. */
function tone(hex, dh = 0, dl = 0, ds = 0) {
  let [r, g, b] = rgbParts(hex).map((c) => c / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `hsl(${(h + dh + 360) % 360} ${Math.max(4, Math.min(70, s * 100 + ds))}% ${Math.max(10, Math.min(78, l * 100 + dl))}%)`;
}
const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);
function gapsIn(owned, total) {
  const set = new Set(owned);
  const out = [];
  for (let v = 1; v <= total; v++) if (!set.has(v)) out.push(v);
  return out;
}
function listGaps(gaps) {
  if (!gaps.length) return "Complete";
  const head = gaps.slice(0, 4).map((v) => `#${v}`).join(", ");
  return gaps.length > 4 ? `Missing ${head} +${gaps.length - 4} more` : `Missing ${head}`;
}
const EMPTY_ENTRY = { owned: [], wishlist: [], followed: false, coverOut: null, added: 0, targets: {} };
const entryOf = (col, id) => col[id] || EMPTY_ENTRY;

/* ------------------------------------------------------------------ *
 * DESIGN TOKENS
 * Light mode sits at oat/manila rather than white — closer to the paper a
 * tankōbon is actually printed on, and easy on the eyes for long browsing.
 * Dark mode is a lamplit reading nook: warm near-black, ink lifted to dusty
 * blue, paper tones kept warm rather than inverted to grey.
 * ------------------------------------------------------------------ */
const Styles = React.memo(function Styles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600&family=Inter:wght@400;450;500;600&display=swap');

.hd-root{
  --serif:'Literata','Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;
  --sans:'Inter',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --bg:#E6DCC8; --bg2:#DED2BB; --surface:#F0E7D5; --surface2:#E3D8C1;
  --ink:#2B2620; --ink2:#615848; --ink3:#7F7563;
  --line:#D0C3A9; --line2:#BCAC8E;
  --accent:#2E4A63; --accent-hi:#3A5C7A; --on-accent:#F3EBDA; --accent-soft:#CBD6E0;
  --bengara:#96422F; --bengara-soft:#E1CCC3; --persimmon:#C2542A; --scrim:246,241,229; --moss:#556B47; --moss-soft:#D2DBC4;
  --shelf-bar:#B4753E; --field:#F3EBDA;
  --shadow:0 1px 2px rgba(60,44,20,.10),0 10px 24px -14px rgba(60,44,20,.35);
  background:var(--bg); color:var(--ink); font-family:var(--sans);
  -webkit-font-smoothing:antialiased;
}
.hd-root[data-theme="dark"]{
  --bg:#16130E; --bg2:#1C1813; --surface:#221E17; --surface2:#2B251C;
  --ink:#EFE6D4; --ink2:#AEA391; --ink3:#877C6B;
  --line:#332C22; --line2:#463C2F;
  --accent:#8FB2CC; --accent-hi:#A6C4DA; --on-accent:#15120D; --accent-soft:#26313B;
  --bengara:#C9705A; --bengara-soft:#3A241E; --persimmon:#C05A2C; --scrim:16,13,9; --moss:#93A87F; --moss-soft:#242C1E;
  --shelf-bar:#4A3626; --field:#1A160F;
  --shadow:0 1px 2px rgba(0,0,0,.5),0 10px 26px -14px rgba(0,0,0,.7);
}
.hd-root *{box-sizing:border-box}
.hd-app{height:100vh;height:100dvh;display:flex;flex-direction:column}
.hd-serif{font-family:var(--serif)}
.hd-muted{color:var(--ink2)}
.hd-faint{color:var(--ink3)}

.hd-card{background:var(--surface);border:1px solid var(--line);border-radius:12px}
.hd-panel{background:var(--bg2);border:1px solid var(--line);border-radius:12px}

.hd-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;
  border-radius:9px;padding:9px 15px;font-size:13.5px;font-weight:500;line-height:1;
  border:1px solid transparent;cursor:pointer;transition:background .16s,border-color .16s,color .16s,transform .12s;
  font-family:var(--sans);white-space:nowrap}
.hd-btn:active{transform:translateY(1px)}
.hd-btn-primary{background:var(--accent);color:var(--on-accent)}
.hd-btn-primary:hover{background:var(--accent-hi)}
.hd-btn-buy{background:var(--bengara);color:#F6EDE6}
.hd-btn-buy:hover{filter:brightness(1.08)}
.hd-btn-quiet{background:var(--surface);color:var(--ink);border-color:var(--line2)}
.hd-btn-quiet:hover{background:var(--surface2)}
.hd-btn-ghost{background:transparent;color:var(--ink2)}
.hd-btn-ghost:hover{background:var(--surface2);color:var(--ink)}
.hd-btn-sm{padding:6px 11px;font-size:12.5px;border-radius:8px}
.hd-btn[disabled]{opacity:.45;cursor:not-allowed}

.hd-input,.hd-select{width:100%;background:var(--field);border:1px solid var(--line2);
  border-radius:9px;padding:10px 12px;font-size:14px;color:var(--ink);font-family:var(--sans);outline:none}
.hd-select{appearance:none;padding-right:30px;cursor:pointer}
.hd-input:focus,.hd-select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.hd-input::placeholder{color:var(--ink3)}
.hd-err{color:var(--bengara);font-size:11.5px;margin-top:5px}
.hd-label{font-size:12px;font-weight:500;color:var(--ink2);letter-spacing:.02em;margin-bottom:6px;display:block}
.hd-root :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:6px}

.hd-tag{display:inline-block;border:1px solid var(--line);background:var(--surface2);
  color:var(--ink2);border-radius:5px;padding:2.5px 8px;font-size:11.5px}
.hd-eyebrow{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--ink3);font-weight:500}
.hd-jp{position:absolute;top:2px;right:3px;font-size:8.5px;font-weight:600;letter-spacing:.03em;line-height:1;
  padding:1.5px 2.5px;border-radius:3px;background:var(--bengara);color:#F7EFE9}

/* --- shelving -------------------------------------------------------- */
/* Shelves are plain rounded bars the books stand on — no case, no walls, no
   grain. Same language as the landing page: quiet furniture, loud books. */
.hd-books{position:relative}
.hd-plank{position:relative;border-radius:10px;background:var(--shelf-bar);
  box-shadow:0 16px 26px -18px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.35)}
.hd-root[data-theme="dark"] .hd-plank{box-shadow:0 16px 26px -18px rgba(0,0,0,.8)}

.hd-spine{position:absolute;bottom:0;border-radius:3px 3px 1px 1px;overflow:hidden;cursor:pointer;
  transform-origin:50% 100%;contain:layout paint;
  transition:transform .26s cubic-bezier(.2,.8,.25,1),opacity .22s,filter .22s;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.42)}
.hd-spine .hd-sheen{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;
  background:linear-gradient(90deg,rgba(255,255,255,.10),rgba(255,255,255,0) 26%,rgba(0,0,0,0) 70%,rgba(0,0,0,.16))}
/* On the shelf a hovered series simply lifts — tipping is a landing-page move. */
.hd-lift{transform:translateY(-10px);filter:brightness(1.07)}
.hd-dim{opacity:.34;filter:saturate(.75)}
.hd-coverwrap{transition:transform .22s cubic-bezier(.2,.75,.3,1),opacity .22s}

.hd-addslot{position:absolute;bottom:0;border:1.5px dashed var(--line2);border-radius:3px;
  background:transparent;cursor:pointer;opacity:.28;transition:opacity .2s,border-color .2s,background .2s;
  display:flex;align-items:center;justify-content:center;color:var(--ink2);padding:0}
.hd-addslot:hover,.hd-addslot[data-near="1"]{opacity:1;border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}

.hd-cover{position:relative;overflow:hidden;border-radius:2px 4px 4px 2px;
  box-shadow:-1px 0 0 rgba(0,0,0,.3),0 12px 18px -10px rgba(0,0,0,.6)}
.hd-cover-edge{position:absolute;left:0;top:0;bottom:0;width:5%;min-width:3px;
  background:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,.05))}
.hd-cover-fold{position:absolute;left:0;right:0;top:0;bottom:0;
  background:linear-gradient(105deg,rgba(255,255,255,.09),rgba(255,255,255,0) 42%,rgba(0,0,0,.18))}

.hd-pop{position:fixed;z-index:60;width:240px;background:var(--surface);border:1px solid var(--line2);
  border-radius:11px;box-shadow:var(--shadow);padding:12px 13px;pointer-events:none;animation:hd-pop .14s ease-out}
.hd-pop[data-pinned="1"]{pointer-events:auto}
@keyframes hd-pop{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

.hd-bar{height:5px;border-radius:999px;background:var(--line);overflow:hidden}
.hd-bar>span{display:block;height:100%;border-radius:999px;background:var(--bengara)}
.hd-bar[data-done="1"]>span{background:var(--moss)}

.hd-vol{border:1px solid var(--line2);background:var(--surface);color:var(--ink2);
  border-radius:7px;height:40px;font-size:12.5px;font-weight:500;cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:all .14s;font-family:var(--sans);position:relative}
.hd-vol:hover{border-color:var(--ink3);color:var(--ink)}
.hd-vol[data-state="owned"]{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.hd-vol[data-state="wish"]{background:var(--bengara);border-color:var(--bengara);color:#FAF1EB}
.hd-seg{display:inline-flex;border:1px solid var(--line2);border-radius:8px;overflow:hidden}
.hd-seg button{background:var(--surface);border:none;padding:6px 11px;font-size:12px;cursor:pointer;
  color:var(--ink2);font-family:var(--sans)}
.hd-seg button[data-on="1"]{background:var(--accent);color:var(--on-accent);font-weight:500}
.hd-seg button[data-on="1"][data-kind="wish"]{background:var(--bengara);color:#FAF1EB}

.hd-overlay{position:fixed;left:0;right:0;top:0;bottom:0;z-index:70;background:rgba(24,17,8,.55);
  backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;animation:hd-fade .16s ease-out}
@media(min-width:768px){.hd-overlay{align-items:center;padding:24px}}
@keyframes hd-fade{from{opacity:0}to{opacity:1}}
.hd-sheet{background:var(--surface);border:1px solid var(--line2);width:100%;max-width:680px;
  max-height:92vh;overflow-y:auto;border-radius:16px 16px 0 0;animation:hd-rise .22s cubic-bezier(.2,.8,.3,1)}
@media(min-width:768px){.hd-sheet{border-radius:14px;max-height:86vh}}
@keyframes hd-rise{from{transform:translateY(18px);opacity:.6}to{transform:none;opacity:1}}

.hd-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:65;min-width:186px;background:var(--surface);
  border:1px solid var(--line2);border-radius:11px;box-shadow:var(--shadow);padding:6px;animation:hd-pop .12s ease-out}
.hd-menu button{display:flex;align-items:center;gap:9px;width:100%;background:none;border:none;cursor:pointer;
  padding:9px 10px;border-radius:8px;font-size:13.5px;color:var(--ink);font-family:var(--sans);text-align:left}
.hd-menu button:hover{background:var(--surface2)}

.hd-scanbox{position:relative;overflow:hidden;border-radius:12px;background:#100E0B;
  border:1px solid var(--line2);aspect-ratio:4/3}
.hd-scanline{position:absolute;left:6%;right:6%;height:2px;background:var(--bengara);
  box-shadow:0 0 14px 2px rgba(150,66,47,.8);animation:hd-scan 1.5s ease-in-out infinite}
@keyframes hd-scan{0%{top:14%}50%{top:84%}100%{top:14%}}
.hd-bracket{position:absolute;width:26px;height:26px;border:2px solid rgba(255,246,232,.75)}

.hd-toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:90;
  background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:999px;font-size:13px;
  box-shadow:0 8px 24px -8px rgba(0,0,0,.5);animation:hd-toast .2s ease-out;max-width:88vw;text-align:center}
@media(min-width:768px){.hd-toast{bottom:28px}}
@keyframes hd-toast{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}

.hd-tab{position:relative;padding:8px 12px;font-size:13.5px;color:var(--ink2);border-radius:8px;
  cursor:pointer;background:transparent;border:none;font-family:var(--sans);display:inline-flex;align-items:center;gap:7px}
.hd-tab:hover{color:var(--ink);background:var(--surface2)}
.hd-tab[data-on="1"]{color:var(--ink);font-weight:500;background:var(--surface)}
.hd-tab[data-on="1"]::after{content:"";position:absolute;left:12px;right:12px;bottom:-9px;height:2px;background:var(--bengara);border-radius:2px}

.hd-switch{width:40px;height:23px;border-radius:999px;background:var(--line2);position:relative;
  cursor:pointer;transition:background .18s;border:none;padding:0;flex:none}
.hd-switch[data-on="1"]{background:var(--accent)}
.hd-switch span{position:absolute;top:3px;left:3px;width:17px;height:17px;border-radius:50%;
  background:var(--surface);transition:transform .18s;box-shadow:0 1px 2px rgba(0,0,0,.3)}
.hd-switch[data-on="1"] span{transform:translateX(17px)}

/* --- landing ---------------------------------------------------------- */
.hd-landing{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden;
  background:var(--persimmon);color:#FFF6EA}
.hd-root[data-theme="dark"] .hd-landing{background:#131110;color:var(--ink)}
.hd-landing-wide{display:none}
.hd-landing-narrow{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:10px 22px 44px}
@media(min-width:900px){
  .hd-landing-wide{display:flex;flex:1;flex-direction:column;justify-content:space-between;
    padding:clamp(8px,3vh,36px) 24px 0;gap:clamp(14px,3vh,34px);overflow:hidden}
  .hd-landing-narrow{display:none}
}

.hd-landing-words{display:flex;flex-direction:column;align-items:flex-start}
.hd-hero-word{font-size:clamp(42px,6.4vw,80px);line-height:.94;letter-spacing:-.02em;color:#FFF7EC;margin:0}
.hd-hero-jp{font-size:clamp(12px,1.4vw,16px);letter-spacing:.42em;margin-top:8px;color:rgba(255,247,236,.72);padding-left:.42em}
.hd-hero-tag{font-size:clamp(14px,1.4vw,17px);margin:14px 0 0;line-height:1.45;color:rgba(255,247,236,.9)}
.hd-root[data-theme="dark"] .hd-hero-word{color:var(--persimmon)}
.hd-root[data-theme="dark"] .hd-hero-jp,
.hd-root[data-theme="dark"] .hd-hero-tag{color:var(--ink2)}
.hd-hero-cta{background:#FFF7EC;color:var(--persimmon);padding:12px 22px;font-size:14.5px}
.hd-hero-cta:hover{background:#fff}
.hd-root[data-theme="dark"] .hd-hero-cta{background:var(--persimmon);color:#17130F}
.hd-hero-ghost{background:transparent;color:#FFF7EC;border-color:rgba(255,247,236,.42)}
.hd-hero-ghost:hover{background:rgba(255,247,236,.14)}
.hd-root[data-theme="dark"] .hd-hero-ghost{color:var(--ink);border-color:var(--line2)}
.hd-root[data-theme="dark"] .hd-hero-ghost:hover{background:var(--surface2)}

/* the row of standing books */
.hd-lrow-wrap{margin-top:auto;padding-bottom:clamp(10px,3vh,26px);flex:none}
/* Fixed heights below: opening a book must not move the shelf, whatever the
   length of its blurb. */
.hd-lrow{display:flex;align-items:flex-end;justify-content:center;gap:9px;
  perspective:1500px;perspective-origin:50% 70%;height:290px}
.hd-lshelf{height:18px;margin:0 auto;width:min(900px,90%);border-radius:9px;
  background:rgba(255,247,236,.92);box-shadow:0 16px 26px -16px rgba(0,0,0,.55)}
.hd-root[data-theme="dark"] .hd-lshelf{background:#2A2620}

.hd-lbook{background:none;border:none;padding:0;cursor:pointer;flex:none;
  transition:margin-right .5s cubic-bezier(.2,.8,.25,1)}
.hd-lbook-3d{display:block;position:relative;width:100%;height:100%;transform-style:preserve-3d;
  transform-origin:50% 100%;transform:rotateX(0deg);
  transition:transform .5s cubic-bezier(.2,.8,.25,1)}
/* Hover tips the book out of the shelf on its bottom edge. */
.hd-lbook:hover .hd-lbook-3d{transform:rotateX(-15deg) translateZ(26px)}
.hd-lbook.is-open .hd-lbook-3d,
.hd-lbook.is-open:hover .hd-lbook-3d{transform:rotateX(-4deg) rotateY(-72deg) translateZ(20px)}
.hd-lbook-spine{position:absolute;left:0;top:0;display:block;border-radius:2px 0 0 2px;overflow:hidden;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.5);backface-visibility:hidden}
.hd-lbook-title{position:absolute;top:10%;bottom:16%;left:0;right:0;writing-mode:vertical-rl;
  text-orientation:mixed;white-space:nowrap;overflow:hidden;color:rgba(252,247,238,.96);letter-spacing:.015em}
.hd-lbook-vol{position:absolute;left:0;right:0;bottom:3.5%;text-align:center;font-size:11px;font-weight:600;
  color:rgba(252,247,238,.9)}
.hd-lbook-cover{position:absolute;top:0;left:100%;transform-origin:0 50%;transform:rotateY(90deg);
  backface-visibility:hidden;filter:brightness(.94)}
.hd-lbook.is-open .hd-lbook-cover{filter:none}
/* Paper. The top face rotates *away* from the viewer (-90deg) so it stays
   inside the book's own footprint however far the book is turned. */
.hd-lbook-top{position:absolute;left:0;top:0;transform-origin:50% 0;transform:rotateX(-90deg);
  background:repeating-linear-gradient(90deg,#F2E9D6 0 1.5px,#D9CDB4 1.5px 3px);
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}

.hd-ldetail{max-width:660px;margin:14px auto 0;text-align:center;
  height:126px;overflow:hidden;transition:opacity .35s ease}
.hd-ldetail-jp{font-size:12.5px;letter-spacing:.06em;margin-top:6px;color:rgba(255,247,236,.72)}
.hd-ldetail-meta{font-size:11.5px;letter-spacing:.04em;margin-top:8px;color:rgba(255,247,236,.6)}
.hd-ldetail-blurb{font-size:12.5px;line-height:1.55;margin:8px 0 0;color:rgba(255,247,236,.82);
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.hd-root[data-theme="dark"] .hd-ldetail-jp,
.hd-root[data-theme="dark"] .hd-ldetail-meta{color:var(--ink3)}
.hd-root[data-theme="dark"] .hd-ldetail-blurb{color:var(--ink2)}

/* mobile: a pile of boxes, seen from above and to one side */
.hd-stackwrap{perspective:1100px;height:330px;display:flex;align-items:center;justify-content:center;width:100%}
.hd-stack3d{position:relative;width:210px;height:210px;transform-style:preserve-3d;
  transform:rotateX(62deg) rotateZ(-38deg)}
.hd-stackshadow{position:absolute;left:50%;top:50%;width:190px;height:190px;transform:translate(-50%,-50%);
  background:radial-gradient(ellipse at center,rgba(0,0,0,.34),rgba(0,0,0,0) 68%);filter:blur(6px)}
.hd-stackitem{position:absolute;left:50%;top:50%;background:none;border:none;padding:0;cursor:pointer;
  transform-style:preserve-3d;
  transition:transform 1.7s cubic-bezier(.19,.78,.22,1),visibility 0s}
.hd-stackitem[data-leaving="1"]{transition:transform 1.4s cubic-bezier(.5,.02,.66,.5),visibility 0s}
.hd-book3d{position:relative;transform-style:preserve-3d}
.hd-b3-pages{position:absolute;box-shadow:inset 0 0 0 1px rgba(0,0,0,.10)}
.hd-b3-board{position:absolute;left:0;top:0;border-radius:2px}
.hd-b3-spine{position:absolute;left:0;top:0;transform-origin:0 50%;
  display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:1px}
.hd-b3-spine span{font-size:8px;letter-spacing:.02em;color:rgba(252,247,238,.94);white-space:nowrap;
  writing-mode:vertical-rl;text-orientation:mixed}

/* wishlist rows: two lines on a phone, one line once there's room */
.hd-wishrow{display:grid;gap:8px 11px;align-items:center;
  grid-template-columns:auto 1fr;
  grid-template-areas:"cover title" "price price" "acts acts"}
.hd-wishrow .cover{grid-area:cover}
.hd-wishrow .title{grid-area:title}
.hd-wishrow .price{grid-area:price}
.hd-wishrow .acts{grid-area:acts;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
@media(min-width:680px){
  .hd-wishrow{grid-template-columns:auto 1fr auto auto;
    grid-template-areas:"cover title price acts"}
  .hd-wishrow .price{text-align:right}
  .hd-wishrow .acts{flex-wrap:nowrap;justify-content:flex-end}
}
.hd-favgrid{display:grid;gap:12px;grid-template-columns:repeat(2,1fr)}
@media(min-width:760px){.hd-favgrid{grid-template-columns:repeat(4,1fr)}}
.hd-premgrid{display:grid;gap:12px;grid-template-columns:1fr;flex:1 1 auto;min-height:0}
@media(min-width:860px){.hd-premgrid{grid-template-columns:1fr 1fr}}
.hd-premperks{display:grid;gap:2px 18px;grid-template-columns:1fr}
@media(min-width:700px){.hd-premperks{grid-template-columns:1fr 1fr}}
/* on short screens the perk titles carry it alone, so the page still fits */
@media(max-height:720px){.hd-perkcopy{display:none}}
.hd-stats{display:flex;flex-wrap:wrap;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-top:18px}
.hd-stats>div{flex:1 1 88px;padding:12px 8px;text-align:center;border-right:1px solid var(--line)}
.hd-stats>div:last-child{border-right:none}
.hd-fav{position:relative;display:inline-block}
.hd-favx{position:absolute;top:-8px;right:-8px;width:22px;height:22px;border-radius:50%;
  background:var(--ink);color:var(--bg);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
  opacity:0;transition:opacity .15s;z-index:2;padding:0;box-shadow:0 2px 6px rgba(0,0,0,.35)}
.hd-fav:hover .hd-favx,.hd-favx:focus-visible{opacity:1}
@media (hover:none){.hd-favx{opacity:.94}}
.hd-slot{border-radius:4px;border:1.5px dashed var(--line2);background:transparent;cursor:pointer;
  color:var(--ink3);display:flex;align-items:center;justify-content:center;transition:border-color .15s,color .15s}
.hd-slot:hover{border-color:var(--accent);color:var(--accent)}
.hd-chipbtn{display:inline-flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--line);
  border-radius:999px;padding:6px 13px 6px 6px;cursor:pointer;font-family:var(--sans);font-size:13px;color:var(--ink);
  transition:border-color .15s,background .15s}
.hd-chipbtn:hover{border-color:var(--ink3);background:var(--surface2)}
/* Anything marked data-nocapture is dropped from print and PDF captures. */
@media print{[data-nocapture]{display:none !important}}
.hd-scroll{scrollbar-width:thin;scrollbar-color:var(--line2) transparent}
.hd-scroll::-webkit-scrollbar{width:9px;height:9px}
.hd-scroll::-webkit-scrollbar-thumb{background:var(--line2);border-radius:6px}
.hd-scroll::-webkit-scrollbar-track{background:transparent}

@media (prefers-reduced-motion:reduce){
  .hd-root *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
}
`}</style>
  );
});

/* ------------------------------------------------------------------ *
 * BOOK ART
 * Real cover scans are licensed art and would be pulled per-ISBN from the
 * metadata provider. Until then each volume gets its own generated cover:
 * the composition, hue and layout are seeded from the series id *and* the
 * volume number, so vol. 3 never looks like vol. 4 and a run reads as a run.
 * ------------------------------------------------------------------ */
/**
 * Where a real build gets the actual artwork: AniList returns a coverImage URL
 * per *series*, and Google Books / Open Library return a per-*volume* thumbnail
 * keyed by ISBN — that ISBN is the same one the barcode scanner reads. Wire
 * this function up to that lookup and every book below switches to the real
 * cover with no other change. Offline, it returns null and the generated art
 * (seeded per series + volume) stands in.
 */
/** Filled by the catalogue ingest (volumes.json). Empty until then. */
const VOLUME_ISBNS = {};            // "seriesId:vol" -> "9781974709939"
const ISBN_FOR = (series, vol) => VOLUME_ISBNS[series.id + ":" + vol] || null;

const REAL_COVERS = new Map();      // "seriesId:vol" -> https URL
function coverImage(series, vol) { return REAL_COVERS.get(series.id + ":" + vol) || null; }

/** Volume titles are published as "One Piece, Vol. 61" almost universally. */
function titleMatchesVolume(candidate, seriesTitle, vol) {
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const c = norm(candidate);
  if (!c.startsWith(norm(seriesTitle).slice(0, 10))) return false;
  const m = c.match(/vol(?:ume)?\s*(\d+)/) || c.match(/\b(\d{1,3})\b\s*$/);
  return m ? Number(m[1]) === vol : false;
}

/**
 * Pulls the real cover art for a handful of volumes at runtime.
 * Google Books returns a thumbnail per ISBN and allows browser requests, so no
 * artwork is bundled — it's fetched from the source and falls straight back to
 * the generated art if the request fails or the volume isn't matched.
 * For production, do this once in ingest-covers.mjs and serve from your own R2
 * bucket instead: Google's terms limit how long you may cache their images.
 */
function useRealCovers(picks) {
  const [, bump] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const p of picks) {
        const key = p.id + ":" + p.vol;
        if (REAL_COVERS.has(key)) continue;
        const s = SERIES_BY_ID[p.id];
        if (!s) continue;
        const q = `intitle:"${s.title}" ${p.vol}`;
        try {
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books`);
          if (!res.ok) continue;
          const data = await res.json();
          const item = (data.items || []).find((it) =>
            it.volumeInfo?.imageLinks?.thumbnail && titleMatchesVolume(it.volumeInfo.title || "", s.title, p.vol));
          const url = item?.volumeInfo?.imageLinks?.thumbnail
            ?.replace("http://", "https://").replace("&edge=curl", "").replace(/zoom=\d/, "zoom=3");
          if (url && !cancelled) { REAL_COVERS.set(key, url); bump((v) => v + 1); }
        } catch { /* offline or blocked — generated art stands in */ }
        await new Promise((r) => setTimeout(r, 120));
      }
    })();
    return () => { cancelled = true; };
  }, [picks]);
}

const Cover = React.memo(function Cover({ s, vol, w, h, className = "", style = {} }) {
  const height = h ?? Math.round(w * 1.45);
  const [failed, setFailed] = useState(false);
  const src = failed ? null : coverImage(s, vol);
  if (src) {
    return (
      <div className={"hd-cover " + className} style={{ width: w, height, ...style }}>
        <img src={src} alt={`${s.title} volume ${vol}`} onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div className="hd-cover-edge" />
      </div>
    );
  }
  const seed = hash(s.id + "cover" + vol);
  const variant = seed % 4;
  const dh = ((seed >> 3) % 30) - 15;
  const dl = ((seed >> 8) % 14) - 7;
  const base = tone(s.color, dh, dl);
  const deep = tone(s.color, dh, dl - 18, -4);
  const glow = tone(s.color, dh + 14, dl + 30, -8);
  const paper = "#F0E7D5";
  const fs = Math.max(6.5, w * 0.108);
  const onPaper = variant >= 2;
  const isJP = jpOnly(s, vol);

  return (
    <div className={"hd-cover " + className}
      style={{ width: w, height, background: `linear-gradient(${150 + variant * 20}deg, ${base}, ${deep})`, ...style }}>
      {variant === 0 && (
        <>
          <div style={{ position: "absolute", right: -w * 0.24, top: height * 0.24, width: w * 0.86, height: w * 0.86, borderRadius: "50%", background: glow, opacity: .5 }} />
          <div style={{ position: "absolute", left: -w * 0.18, bottom: height * 0.16, width: w * 0.7, height: w * 0.7, borderRadius: "50%", border: `1px solid ${glow}`, opacity: .7 }} />
        </>
      )}
      {variant === 1 && (
        <>
          <div style={{ position: "absolute", left: -w * 0.3, top: height * 0.34, width: w * 1.7, height: height * 0.16, background: glow, opacity: .55, transform: "rotate(-24deg)" }} />
          <div style={{ position: "absolute", left: -w * 0.3, top: height * 0.56, width: w * 1.7, height: height * 0.045, background: paper, opacity: .35, transform: "rotate(-24deg)" }} />
        </>
      )}
      {variant === 2 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.3, height: height * 0.3, background: glow, opacity: .45 }} />
          <div style={{ position: "absolute", left: "12%", top: height * 0.36, width: w * 0.34, height: w * 0.34, borderRadius: "50%", background: deep, opacity: .75 }} />
        </>
      )}
      {variant === 3 && (
        <>
          <div style={{ position: "absolute", left: -w * 0.45, bottom: -height * 0.1, width: w * 1.25, height: w * 1.25, borderRadius: "50%", background: glow, opacity: .42 }} />
          <div style={{ position: "absolute", right: "12%", top: height * 0.16, width: w * 0.16, height: w * 0.16, borderRadius: "50%", background: paper, opacity: .7 }} />
        </>
      )}

      <div style={{
        position: "absolute", left: "9%", right: "8%", top: "7%",
        ...(onPaper ? { background: paper, padding: `${Math.max(3, w * 0.05)}px ${Math.max(4, w * 0.06)}px`, borderRadius: 2 } : null),
      }}>
        <div className="hd-serif" style={{
          fontSize: fs * 1.12, lineHeight: 1.14,
          color: onPaper ? "#2B2620" : "rgba(255,250,241,.97)",
          textShadow: onPaper ? "none" : "0 1px 2px rgba(0,0,0,.35)",
        }}>{s.title}</div>
      </div>

      <div style={{ position: "absolute", left: "9%", right: "8%", bottom: "6%" }}>
        <div style={{ height: 1, background: "rgba(255,255,255,.4)", marginBottom: Math.max(3, w * 0.045) }} />
        <div className="flex items-end justify-between">
          <div style={{ minWidth: 0 }}>
            {s.author.split(" ").length > 1 && (
              <div style={{ fontSize: fs * 0.5, color: "rgba(255,247,235,.62)", letterSpacing: ".08em", lineHeight: 1.1 }}>
                {s.author.split(" ").slice(0, -1).join(" ").toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: fs * 0.66, color: "rgba(255,247,235,.82)", letterSpacing: ".05em", lineHeight: 1.15 }}>
              {s.author.split(" ").slice(-1)[0].toUpperCase()}
            </div>
          </div>
          <div className="hd-serif" style={{ fontSize: fs * 1.65, lineHeight: .88, color: "rgba(255,250,241,.97)" }}>{vol}</div>
        </div>
      </div>

      <div className="hd-cover-fold" />
      <div className="hd-cover-edge" />
      {isJP && w >= 40 && (
        <div style={{
          position: "absolute", top: Math.max(3, w * 0.04), right: Math.max(3, w * 0.04),
          background: "#96422F", color: "#F7EFE9", fontSize: Math.max(6, fs * 0.62), fontWeight: 600,
          padding: "1.5px 3px", borderRadius: 3, letterSpacing: ".04em",
        }}>JP</div>
      )}
    </div>
  );
}, (a, b) => a.s === b.s && a.vol === b.vol && a.w === b.w && a.h === b.h && a.className === b.className);

/* ---- spine geometry: series have their own trim size, like real books ---- */
const METRICS = {
  wide:    { bookH: 192, plank: 16, below: 44, spine: 35, jitter: 10, gap: 24, pad: 28 },
  compact: { bookH: 142, plank: 13, below: 30, spine: 28, jitter: 7, gap: 16, pad: 16 },
};
const rowHeight = (m) => m.bookH + m.plank + m.below;
const seriesHeight = (s, m) => Math.round(m.bookH * (0.86 + (hash(s.id + "trim") % 15) / 100));
const volumeHeight = (s, vol, m) => Math.min(m.bookH, seriesHeight(s, m) + (hash(s.id + "h" + vol) % 3));
const coverWidth = (s, m) => Math.round(seriesHeight(s, m) / 1.45);
const spineWidth = (s, vol, m) => m.spine + (hash(s.id + "v" + vol) % m.jitter);

/** Sizes a spine's title to the space it has, and only shortens as a last
 *  resort — a spine you can't read is just a coloured bar. */
function fitSpineTitle(title, avail, w) {
  const max = Math.min(15, Math.max(10, w * 0.4));
  const min = 8.5;
  const per = 0.6;                                  // glyph advance as a share of size
  let fs = Math.min(max, avail / (title.length * per));
  if (fs >= min) return { text: title, fs };
  fs = min;
  const room = Math.floor(avail / (min * per));
  return { text: title.length > room ? title.slice(0, Math.max(1, room - 1)).trimEnd() + "…" : title, fs };
}

const Spine = React.memo(function Spine({ s, vol, w, h, x, lift, dim, drag, grab, onOpen }) {
  const seed = hash(s.id + "spine" + vol);
  const base = tone(s.color, (seed % 11) - 5, ((seed >> 5) % 7) - 3);
  const ink = "rgba(252,247,238,.96)";
  const showText = w >= 17;
  const isJP = jpOnly(s, vol);
  const top = isJP ? 26 : 15;
  const fitted = fitSpineTitle(s.title, h - top - 30, w);
  return (
    <div
      data-series={s.id}
      {...(drag || {})}
      className={"hd-spine " + (lift ? "hd-lift " : "") + (dim ? "hd-dim" : "")}
      style={{ left: x, width: w, height: h, background: base, cursor: grab ? "grab" : "pointer" }}
      onClick={onOpen}
      title={`${fullTitle(s)}, vol. ${vol}${isJP ? " (Japanese edition)" : ""}`}
    >
      {isJP && (
        <div style={{
          position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)",
          fontSize: Math.min(8, w * 0.26), fontWeight: 700, letterSpacing: ".06em",
          color: "#F7EFE9", background: "#96422F", padding: "1.5px 3px", borderRadius: 2, lineHeight: 1,
        }}>JP</div>
      )}
      {showText && (
        <div className="hd-serif" style={{
          position: "absolute", top, bottom: 28, left: 0, right: 0,
          writingMode: "vertical-rl", textOrientation: "mixed",
          fontSize: fitted.fs, lineHeight: `${w}px`, whiteSpace: "nowrap", fontWeight: 500,
          color: ink, letterSpacing: ".01em", textShadow: "0 1px 1px rgba(0,0,0,.22)",
        }}>{fitted.text}</div>
      )}
      <div style={{ position: "absolute", left: "22%", right: "22%", bottom: 22, height: 1, background: "rgba(255,255,255,.34)" }} />
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 6, textAlign: "center",
        fontSize: Math.min(11, Math.max(8.5, w * 0.3)), fontWeight: 600, letterSpacing: ".02em",
        color: ink, fontVariantNumeric: "tabular-nums",
      }}>{vol}</div>
      <div className="hd-sheen" />
    </div>
  );
}, (a, b) => a.s === b.s && a.vol === b.vol && a.w === b.w && a.h === b.h && a.x === b.x
  && a.lift === b.lift && a.dim === b.dim && a.grab === b.grab);

/** Packs the collection onto shelves the way text wraps: books go on in order
 *  and simply continue on the next shelf when they run out of room, so no shelf
 *  is left half empty. A run stays contiguous — it just carries over. */
function packRows(groups, width, m) {
  const rows = [];
  let cur = [], x = 0;
  const flush = () => { if (cur.length) rows.push(cur); cur = []; x = 0; };
  for (const g of groups) {
    for (const it of g.items) {
      if (x + it.w > width && cur.length) flush();
      cur.push({ ...it, g, x });
      x += it.w;
    }
    x += m.gap;                       // breathing space before the next series
    if (x >= width) flush();
  }
  flush();
  return rows;
}

/** Subscribers get a small crown beside their name, wherever the name appears. */
function PremiumMark({ size = 13 }) {
  return <Crown size={size} style={{ color: "var(--bengara)", flex: "none" }} aria-label="Premium member" />;
}

function Avatar({ name, size = 38, profile, locked }) {
  const initials = (name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const bg = profile?.avatarColor || AVATAR_COLORS[hash(name || "x") % AVATAR_COLORS.length];
  if (locked) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size, borderRadius: "50%", flex: "none",
        background: "var(--surface2)", border: "1px solid var(--line2)", color: "var(--ink3)" }}>
        <Lock size={size * 0.42} />
      </div>
    );
  }
  if (profile?.avatarImage) {
    return <img src={profile.avatarImage} alt="" style={{ width: size, height: size, borderRadius: "50%", flex: "none", objectFit: "cover" }} />;
  }
  return (
    <div className="hd-serif flex items-center justify-center" style={{
      width: size, height: size, borderRadius: "50%", flex: "none",
      background: bg, color: "#F6EFE2", fontSize: size * 0.36, letterSpacing: ".02em", overflow: "hidden",
    }}>{initials}</div>
  );
}

/** Take a profile photo with the device camera. Square, centre-cropped. */
function PhotoCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      } catch (err) {
        setError(err?.name === "NotAllowedError" ? "Camera permission was declined." : "No camera available here.");
      }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const snap = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.translate(256, 0); ctx.scale(-1, 1);      // un-mirror the selfie view
    ctx.drawImage(video, (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side, 0, 0, 256, 256);
    onCapture(canvas.toDataURL("image/jpeg", 0.82));
  };

  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="hd-serif" style={{ fontSize: 17 }}>Take a photo</div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: 18 }}>
          {error ? (
            <div className="hd-muted" style={{ fontSize: 13, textAlign: "center", padding: "24px 0" }}>{error}</div>
          ) : (
            <>
              <div style={{ position: "relative", borderRadius: "50%", overflow: "hidden", width: 220, height: 220, margin: "0 auto", background: "#100E0B" }}>
                <video ref={videoRef} playsInline muted autoPlay
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              </div>
              <button className="hd-btn hd-btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={snap}>
                <Camera size={14} /> Capture
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** A shareable snapshot of a profile: name, picture, volumes, four favourites. */
function ShareSheet({ owner, profile, collection, onClose, notify }) {
  const groups = Object.entries(collection).map(([id, e]) => ({ s: SERIES_BY_ID[id], e })).filter((g) => g.s && g.e.owned.length);
  const vols = groups.reduce((n, g) => n + g.e.owned.length, 0);
  const favs = profile.favourites.map((id) => (id ? SERIES_BY_ID[id] : null));
  const favSeries = profile.favouriteVolume ? SERIES_BY_ID[profile.favouriteVolume.id] : null;
  const url = `${SITE_URL}/@${owner.handle}`;
  const text = `${owner.name} has ${vols} volumes on honDana`;

  const open = (href) => { try { window.open(href, "_blank", "noopener"); } catch { notify("Couldn't open that here"); } };
  const copy = async (value, label) => {
    try { await navigator.clipboard.writeText(value); notify(label); }
    catch { notify("Copy blocked here — the link is " + url); }
  };

  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet hd-scroll" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="hd-serif" style={{ fontSize: 17 }}>Share your shelf</div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div style={{ padding: 18 }}>
          {/* This is the card the link preview renders too — the server draws the
              same layout to a PNG for og:image, so pasted links look like this. */}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--line2)", borderRadius: 12, padding: 16 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <Avatar name={owner.name} size={46} profile={profile} />
              <div style={{ minWidth: 0 }}>
                <div className="hd-serif flex items-center" style={{ fontSize: 17, gap: 7 }}>
                  {owner.name}{owner.premium && <PremiumMark size={13} />}
                </div>
                <div className="hd-faint" style={{ fontSize: 12, marginTop: 2 }}>
                  @{owner.handle} · {vols} volumes · {groups.length} series
                </div>
              </div>
              <div className="hd-serif" style={{ marginLeft: "auto", fontSize: 13, color: "var(--bengara)" }}>honDana</div>
            </div>
            <div className="flex" style={{ gap: 8, marginTop: 14 }}>
              {favs.map((s, i) => (
                <div key={i} style={{ flex: 1 }}>
                  {s ? <Cover s={s} vol={Math.max(...(collection[s.id]?.owned || [1]))} w={72} style={{ width: "100%", height: 104 }} />
                     : <div className="hd-slot" style={{ height: 104 }} />}
                </div>
              ))}
            </div>
            {favSeries && (
              <div className="flex items-center" style={{ gap: 11, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <Cover s={favSeries} vol={profile.favouriteVolume.vol} w={38} />
                <div style={{ minWidth: 0 }}>
                  <div className="hd-eyebrow">Favourite volume</div>
                  <div className="hd-serif" style={{ fontSize: 14, marginTop: 3 }}>
                    {favSeries.title} · vol. {profile.favouriteVolume.vol}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", marginTop: 16 }}>
            <button className="hd-btn hd-btn-quiet" onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)}>
              Share on X
            </button>
            <button className="hd-btn hd-btn-quiet" onClick={() => open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`)}>
              Share on Reddit
            </button>
            <button className="hd-btn hd-btn-quiet" onClick={() => copy(`${text} — ${url}`, "Caption copied — paste it into your story")}>
              Instagram
            </button>
            <button className="hd-btn hd-btn-primary" onClick={() => copy(url, "Link copied")}>
              Copy link
            </button>
          </div>
          <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>
            Instagram has no web share target, so we copy the caption and link for you to paste.
            Pasted links unfurl with the card above.
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="hd-card" style={{ padding: "13px 14px" }}>
      <div className="hd-eyebrow">{label}</div>
      <div className="hd-serif" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 5 }}>{value}</div>
      {sub && <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ShelfPopup({ pos, series, entry, pinned, compact, onOpen, onAdd }) {
  const total = series.volumes;
  const have = entry.owned.length;
  const gaps = gapsIn(entry.owned, total);
  const pct = pctOf(have, total);
  const next = gaps[0];
  const style = {
    left: Math.max(10, Math.min(pos.x - 120, (typeof window !== "undefined" ? window.innerWidth : 1200) - 250)),
    top: pos.y - (pinned ? 210 : 172) < 12 ? pos.y + 22 : pos.y - (pinned ? 210 : 172),
  };
  return (
    <div className="hd-pop" data-pinned={pinned ? "1" : "0"} style={style}>
      <div className="hd-serif" style={{ fontSize: 15, lineHeight: 1.2 }}>{series.title}</div>
      <div className="hd-muted" style={{ fontSize: 12, marginTop: 3 }}>
        {series.author}{series.edition !== "Standard" ? ` · ${series.edition}` : ""}
      </div>
      <div style={{ fontSize: 12.5, marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <span className="hd-muted">Collected</span>
        <span style={{ fontWeight: 500 }}>{have}/{total} · {pct}%</span>
      </div>
      <div className="hd-bar" data-done={gaps.length ? "0" : "1"} style={{ marginTop: 6 }}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 8 }}>{listGaps(gaps)}</div>
      {pinned && (
        <div className="flex" style={{ gap: 6, marginTop: 10 }}>
          {next && onAdd && (
            <button className="hd-btn hd-btn-primary hd-btn-sm" style={{ flex: 1 }} onClick={() => onAdd(series.id, next)}>
              <Plus size={13} /> Vol. {next}
            </button>
          )}
          <button className="hd-btn hd-btn-quiet hd-btn-sm" style={{ flex: 1 }} onClick={onOpen}>
            Open <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function Breakdown({ groups }) {
  const stats = useMemo(() => {
    let owned = 0, slots = 0, complete = 0, wish = 0;
    const byPublisher = {};
    groups.forEach(({ s, e }) => {
      owned += e.owned.length; slots += s.volumes; wish += e.wishlist.length;
      if (e.owned.length === s.volumes) complete += 1;
      byPublisher[s.publisher] = (byPublisher[s.publisher] || 0) + e.owned.length;
    });
    const rank = [...groups].sort((a, b) =>
      pctOf(b.e.owned.length, b.s.volumes) - pctOf(a.e.owned.length, a.s.volumes) || b.e.owned.length - a.e.owned.length);
    return { owned, slots, complete, wish, byPublisher, rank, avg: pctOf(owned, slots) };
  }, [groups]);

  const pubs = Object.entries(stats.byPublisher).sort((a, b) => b[1] - a[1]);
  const pubColors = ["var(--accent)", "var(--bengara)", "var(--moss)", "var(--ink3)", "var(--line2)"];

  return (
    <div style={{ padding: "4px 0 16px" }}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Volumes" value={stats.owned} sub={`of ${stats.slots} published`} />
        <StatCard label="Series" value={groups.length} sub={`${stats.complete} complete`} />
        <StatCard label="Shelf filled" value={`${stats.avg}%`} sub="across all series" />
        <StatCard label="Wishlist" value={stats.wish} sub="volumes tracked" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="hd-card" style={{ padding: "14px 15px" }}>
          <div className="hd-eyebrow" style={{ marginBottom: 11 }}>Closest to finished</div>
          {stats.rank.slice(0, 6).map(({ s, e }) => {
            const pct = pctOf(e.owned.length, s.volumes);
            return (
              <div key={s.id} style={{ marginBottom: 10 }}>
                <div className="flex items-baseline justify-between" style={{ gap: 10 }}>
                  <span className="hd-serif" style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                  <span className="hd-faint" style={{ fontSize: 11.5, flex: "none" }}>{e.owned.length}/{s.volumes}</span>
                </div>
                <div className="hd-bar" data-done={pct === 100 ? "1" : "0"} style={{ marginTop: 5 }}><span style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="hd-card" style={{ padding: "14px 15px" }}>
          <div className="hd-eyebrow" style={{ marginBottom: 11 }}>Where they come from</div>
          <div style={{ display: "flex", height: 9, borderRadius: 999, overflow: "hidden", background: "var(--line)" }}>
            {pubs.map(([p, n], i) => (
              <div key={p} style={{ width: `${(n / stats.owned) * 100}%`, background: pubColors[i % pubColors.length] }} />
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            {pubs.map(([p, n], i) => (
              <div key={p} className="flex items-center justify-between" style={{ fontSize: 12.5, marginBottom: 7 }}>
                <span className="flex items-center" style={{ gap: 8 }}>
                  <i style={{ width: 9, height: 9, borderRadius: 2, background: pubColors[i % pubColors.length], display: "inline-block" }} />
                  {p}
                </span>
                <span className="hd-faint">{n} vols</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Bulk reordering — drag rows on desktop, arrows on touch. */
function ReorganiseSheet({ order, collection, onMove, onClose }) {
  const dragFrom = useRef(null);
  const rows = order.map((id) => ({ id, s: SERIES_BY_ID[id], e: collection[id] })).filter((r) => r.s && r.e?.owned.length);

  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet hd-scroll" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="hd-serif" style={{ fontSize: 17 }}>Arrange the shelf</div>
            <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>Drag a row, or use the arrows.</div>
          </div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: "10px 18px 18px" }}>
          {rows.map((r, i) => (
            <div key={r.id} draggable
              onDragStart={() => { dragFrom.current = r.id; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (dragFrom.current && dragFrom.current !== r.id) onMove(dragFrom.current, r.id); dragFrom.current = null; }}
              className="flex items-center" style={{ gap: 11, padding: "9px 0", borderBottom: "1px solid var(--line)", cursor: "grab" }}>
              <GripVertical size={15} style={{ color: "var(--ink3)", flex: "none" }} />
              <Cover s={r.s} vol={Math.max(...r.e.owned)} w={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hd-serif" style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.s.title}</div>
                <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>
                  {r.s.edition !== "Standard" ? `${r.s.edition} · ` : ""}{r.e.owned.length} volumes
                </div>
              </div>
              <button className="hd-btn hd-btn-ghost hd-btn-sm" disabled={i === 0} aria-label="Move up"
                onClick={() => onMove(r.id, rows[i - 1].id)}><ChevronUp size={15} /></button>
              <button className="hd-btn hd-btn-ghost hd-btn-sm" disabled={i === rows.length - 1} aria-label="Move down"
                onClick={() => onMove(rows[i + 1].id, r.id)}><ChevronDown size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * THE BOOKSHELF — the core screen.
 * Rows are packed to the measured width and windowed: only the shelves in
 * view (plus a buffer) are mounted, so 200+ volumes scroll smoothly.
 * ------------------------------------------------------------------ */
function ShelfView({ collection, readOnly, owner, order, onReorder, onOpenSeries, onScan, onQuickAdd, onAddVolume, onExport, onBack }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(readOnly ? "title" : "custom");
  const [arranging, setArranging] = useState(false);
  const dragFrom = useRef(null);
  const [showStats, setShowStats] = useState(false);
  const [hover, setHover] = useState(null); // {id, x, y, pinned}
  const [scrollTop, setScrollTop] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 640 });
  const scrollRef = useRef(null);
  const rafRef = useRef(0);
  const lastTop = useRef(0);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact = box.w > 0 && box.w < 640;
  const m = compact ? METRICS.compact : METRICS.wide;
  const rowH = rowHeight(m);
  // Centre the shelves in a column rather than letting them run wall to wall.
  const sidePad = Math.max(m.pad, Math.round((box.w - 1180) / 2));
  const innerW = Math.max(120, box.w - sidePad * 2);

  const allGroups = useMemo(() => Object.entries(collection)
    .map(([id, e]) => ({ s: SERIES_BY_ID[id], e }))
    .filter((g) => g.s && g.e.owned.length > 0), [collection]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allGroups.filter((g) => !q || g.s.title.toLowerCase().includes(q) || g.s.author.toLowerCase().includes(q));
    const rank = (id) => {
      const i = order ? order.indexOf(id) : -1;
      return i === -1 ? 1e6 : i;
    };
    const by = {
      custom: (a, b) => rank(a.s.id) - rank(b.s.id) || a.s.title.localeCompare(b.s.title),
      title: (a, b) => a.s.title.localeCompare(b.s.title),
      volumes: (a, b) => b.e.owned.length - a.e.owned.length,
      complete: (a, b) => pctOf(b.e.owned.length, b.s.volumes) - pctOf(a.e.owned.length, a.s.volumes),
      added: (a, b) => b.e.added - a.e.added,
    };
    list = [...list].sort(by[sort] || by.title);
    return list.map((g) => {
      const owned = [...g.e.owned].sort((a, b) => a - b);
      // Every run ends with a volume turned cover-out — the newest one you own,
      // unless you've picked a favourite to face out instead.
      const pick = g.e.coverOut && owned.includes(g.e.coverOut);
      const co = pick ? g.e.coverOut : owned[owned.length - 1];
      const items = owned.filter((v) => v !== co)
        .map((v) => ({ key: g.s.id + "-" + v, type: "spine", vol: v, w: spineWidth(g.s, v, m) }));
      items.push({ key: g.s.id + "-co", type: "cover", vol: co, pick, w: coverWidth(g.s, m) + 4 });
      const nextGap = gapsIn(owned, g.s.volumes)[0];
      if (!readOnly && nextGap) items.push({ key: g.s.id + "-add", type: "add", vol: nextGap, w: Math.round(m.spine * 0.9) });
      return { ...g, owned, items };
    });
  }, [allGroups, query, sort, m, readOnly, order]);

  const rows = useMemo(() => (innerW > 0 ? packRows(groups, innerW, m) : []), [groups, innerW, m]);
  const totalRows = rows.length + 1; // one empty shelf below: room to grow
  const first = Math.max(0, Math.floor(scrollTop / rowH) - 1);
  const last = Math.min(totalRows - 1, Math.ceil((scrollTop + box.h) / rowH) + 1);
  const visible = [];
  for (let i = first; i <= last; i++) visible.push(i);

  const totals = useMemo(() => allGroups.reduce((a, g) => {
    a.vols += g.e.owned.length; a.slots += g.s.volumes; return a;
  }, { vols: 0, slots: 0 }), [allGroups]);

  const lastTarget = useRef(null);
  const handleMove = (e) => {
    if (compact) return;
    if (e.target === lastTarget.current) return;      // same element, nothing to do
    lastTarget.current = e.target;
    const el = e.target.closest?.("[data-series]");
    if (!el) { if (hover) setHover(null); return; }
    const id = el.dataset.series;
    if (!hover || hover.id !== id) setHover({ id, x: e.clientX, y: e.clientY, pinned: false });
  };
  const handleSpineClick = (id, e) => {
    if (!compact) { setHover(null); onOpenSeries(id); return; }
    if (hover?.id === id && hover.pinned) { onOpenSeries(id); return; }
    setHover({ id, x: e.clientX, y: e.clientY, pinned: true });
  };

  const hoveredEntry = hover ? collection[hover.id] : null;
  const canDrag = !readOnly && sort === "custom";
  const dragProps = (id) => (canDrag ? {
    draggable: true,
    onDragStart: (e) => { dragFrom.current = id; e.dataTransfer.effectAllowed = "move"; setHover(null); },
    onDragOver: (e) => { if (dragFrom.current && dragFrom.current !== id) e.preventDefault(); },
    onDrop: (e) => { e.preventDefault(); if (dragFrom.current && dragFrom.current !== id) onReorder(dragFrom.current, id); dragFrom.current = null; },
    onDragEnd: () => { dragFrom.current = null; },
  } : {});

  return (
    <div className="flex h-full flex-col" style={{ minHeight: 0 }}>
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--line)" }}>
        <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
          {onBack && <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onBack}><ArrowLeft size={14} /> Back</button>}
          <div style={{ marginRight: "auto" }}>
            <h1 className="hd-serif" style={{ fontSize: 20, lineHeight: 1.2 }}>{readOnly ? `${owner}'s shelf` : "Your shelf"}</h1>
            <div className="hd-faint" style={{ fontSize: 12.5, marginTop: 2 }}>
              {totals.vols} volumes · {allGroups.length} series · {pctOf(totals.vols, totals.slots)}% of everything published
            </div>
          </div>
          {!readOnly && (
            <>
              <button className="hd-btn hd-btn-primary hd-btn-sm" onClick={onQuickAdd}><Plus size={14} /> Add volumes</button>
              <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={onScan}><ScanLine size={14} /> Scan</button>
              <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={() => { setSort("custom"); setArranging(true); }}>
                <GripVertical size={14} /> Arrange
              </button>
              <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={onExport}><Mail size={14} /> Export</button>
            </>
          )}
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => setShowStats((v) => !v)}>
            <SlidersHorizontal size={14} /> Breakdown
            <ChevronDown size={13} style={{ transform: showStats ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
          </button>
        </div>

        <div className="mt-3 flex items-center" style={{ gap: 8 }}>
          <div style={{ position: "relative", flex: "1 1 auto", maxWidth: 320 }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: 12, color: "var(--ink3)" }} />
            <input className="hd-input" style={{ paddingLeft: 32, paddingTop: 8, paddingBottom: 8 }}
              placeholder="Find a series on this shelf" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="hd-select" style={{ width: "auto", paddingTop: 8, paddingBottom: 8 }}
            value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Shelf order">
            {!readOnly && <option value="custom">My order</option>}
            <option value="title">A–Z</option>
            <option value="volumes">Most volumes</option>
            <option value="complete">Closest to complete</option>
            <option value="added">Recently added</option>
          </select>
        </div>

        {showStats && <div className="mt-3"><Breakdown groups={allGroups} /></div>}
      </div>

      <div style={{ position: "relative", flex: "1 1 auto", minHeight: 0 }}>
        <div ref={scrollRef} className="hd-scroll"
          style={{ height: "100%", overflowY: "auto", paddingLeft: sidePad, paddingRight: sidePad, background: "var(--bg)" }}
          onScroll={(e) => {
            lastTop.current = e.currentTarget.scrollTop;
            if (hover) setHover(null);
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = 0;
              // Only commit when we've crossed into a different shelf.
              setScrollTop((prev) => (Math.abs(prev - lastTop.current) >= rowH / 3 ? lastTop.current : prev));
            });
          }}
          onMouseMove={handleMove}
          onMouseLeave={() => !compact && setHover(null)}
          onClick={(e) => { if (compact && !e.target.closest?.("[data-series]")) setHover(null); }}
        >
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ height: "80%", textAlign: "center", padding: 24 }}>
              <Library size={26} style={{ color: "var(--ink3)" }} />
              <div className="hd-serif" style={{ fontSize: 17, marginTop: 12 }}>
                {query ? "Nothing on the shelf matches that" : "The shelf is empty"}
              </div>
              <div className="hd-muted" style={{ fontSize: 13, marginTop: 6, maxWidth: 320 }}>
                {query ? "Try the title or the author's name." : "Add a volume, or scan the barcode on one you already own."}
              </div>
            </div>
          ) : (
            <div style={{ position: "relative", height: totalRows * rowH + 16 }}>
              {visible.map((r) => {
                const items = rows[r];
                return (
                  <div key={r} style={{ position: "absolute", top: r * rowH + 16, left: 0, right: 0, height: rowH }}>
                    <div className="hd-books" style={{ height: m.bookH }}>
                      {!items && (
                        <div className="hd-faint hd-serif" style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontSize: 12.5, fontStyle: "italic" }}>
                          Room to grow
                        </div>
                      )}
                      {items && items.map((it) => {
                        const on = hover?.id === it.g.s.id;
                        const dim = !!hover && !on;
                        if (it.type === "add") {
                          return (
                            <button key={it.key} data-series={it.g.s.id} className="hd-addslot" data-near={on ? "1" : "0"}
                              style={{ left: it.x, width: it.w - 3, height: Math.round(seriesHeight(it.g.s, m) * 0.42), opacity: dim ? .12 : undefined }}
                              title={`Add ${it.g.s.title} vol. ${it.vol}`}
                              onClick={(e) => { e.stopPropagation(); onAddVolume(it.g.s.id, it.vol); }}>
                              <Plus size={13} />
                            </button>
                          );
                        }
                        if (it.type === "cover") {
                          return (
                            <div key={it.key} data-series={it.g.s.id} {...dragProps(it.g.s.id)}
                              className={"hd-coverwrap " + (on ? "hd-lift " : "") + (dim ? "hd-dim" : "")}
                              style={{ position: "absolute", bottom: 0, left: it.x + 4, cursor: canDrag ? "grab" : "pointer" }}
                              onClick={(e) => handleSpineClick(it.g.s.id, e)}>
                              <Cover s={it.g.s} vol={it.vol} w={coverWidth(it.g.s, m)} h={seriesHeight(it.g.s, m)} />
                              {it.pick && (
                                <div title="Your pick" style={{ position: "absolute", top: 6, left: 6, width: 17, height: 17, borderRadius: "50%",
                                  background: "var(--bengara)", color: "#FAF1EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Star size={9} fill="currentColor" />
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <Spine key={it.key} s={it.g.s} vol={it.vol} w={it.w} h={volumeHeight(it.g.s, it.vol, m)} x={it.x}
                            lift={on} dim={dim} drag={dragProps(it.g.s.id)} grab={canDrag}
                            onOpen={(e) => handleSpineClick(it.g.s.id, e)} />
                        );
                      })}
                    </div>
                    <div className="hd-plank" style={{ height: m.plank }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {arranging && (
        <ReorganiseSheet order={order || []} collection={collection} onMove={onReorder} onClose={() => setArranging(false)} />
      )}
      {hover && hoveredEntry && (
        <ShelfPopup pos={hover} series={SERIES_BY_ID[hover.id]} entry={hoveredEntry}
          pinned={hover.pinned} compact={compact}
          onOpen={() => onOpenSeries(hover.id)}
          onAdd={readOnly ? null : (id, vol) => { onAddVolume(id, vol); setHover(null); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * BUYING
 * Offers are simulated. In a real build each shop's price comes from its
 * affiliate feed and the outbound link carries the affiliate tag.
 * ------------------------------------------------------------------ */
function BuySheet({ series, vol, country, plan, onPremium, onClose, onBuy, onWish, wished }) {
  const offers = useMemo(() => offersFor(country, series, vol), [country, series, vol]);
  const isImport = jpOnly(series, vol);
  const cheapest = offers.find((o) => o.stock);
  const history = cheapest ? priceHistory(country, series, vol, cheapest.price) : null;

  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="hd-serif" style={{ fontSize: 17 }}>Buy this volume</div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="flex" style={{ gap: 13, padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <Cover s={series} vol={vol} w={62} />
          <div style={{ minWidth: 0 }}>
            <div className="hd-serif" style={{ fontSize: 16, lineHeight: 1.2 }}>{series.title}</div>
            <div className="hd-muted" style={{ fontSize: 13, marginTop: 3 }}>Volume {vol} · {isImport ? series.publisher : series.en}</div>
            {isImport && (
              <div style={{ fontSize: 11.5, marginTop: 7, color: "var(--bengara)" }}>
                Japanese edition only — no English release yet. Import shops only.
              </div>
            )}
            <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 7 }}>Shipping to {country}</div>
          </div>
        </div>

        {history && (
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between" style={{ gap: 12 }}>
              <div>
                <div className="hd-eyebrow">Price history</div>
                <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 4 }}>
                  {plan === "premium"
                    ? `Twelve months · low ${money(cheapest.currency, Math.min(...history), cheapest.dec)}`
                    : "Premium shows twelve months of prices"}
                </div>
              </div>
              {plan === "premium"
                ? <Sparkline points={history} />
                : <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={onPremium}>Unlock</button>}
            </div>
          </div>
        )}

        <div style={{ padding: "8px 18px 18px" }}>
          {offers.map((o) => (
            <div key={o.shop} className="flex items-center" style={{ gap: 10, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{o.shop}</div>
                <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>
                  {o.stock ? (o === cheapest ? "Cheapest in stock" : "In stock") : "Out of stock"}
                </div>
              </div>
              <div className="hd-serif" style={{ fontSize: 15.5, opacity: o.stock ? 1 : .45 }}>{money(o.currency, o.price, o.dec)}</div>
              <button className={"hd-btn hd-btn-sm " + (o === cheapest ? "hd-btn-buy" : "hd-btn-quiet")}
                disabled={!o.stock} onClick={() => onBuy(o)}>
                Buy <ExternalLink size={12} />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between" style={{ gap: 10, marginTop: 14 }}>
            <button className="hd-btn hd-btn-sm"
              style={wished ? { background: "var(--bengara)", color: "#FAF1EB" } : { background: "var(--surface)", color: "var(--ink)", borderColor: "var(--line2)" }}
              onClick={() => onWish(series.id, vol)}>
              <Heart size={13} fill={wished ? "currentColor" : "none"} /> {wished ? "On your wishlist" : "Save to wishlist"}
            </button>
            <span className="hd-faint" style={{ fontSize: 11 }}>Prices are indicative</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SERIES DETAIL
 * ------------------------------------------------------------------ */
function SeriesSheet({ series, entry, collection, readOnly, ownerName, country, actions, onBuy, onOpenSeries, onClose }) {
  const [mark, setMark] = useState("own"); // own | wish — makes wishlisting work on touch
  const siblings = editionsOf(series);
  const owned = new Set(entry.owned);
  const wish = new Set(entry.wishlist);
  const pct = pctOf(entry.owned.length, series.volumes);
  const gaps = gapsIn(entry.owned, series.volumes);
  const enVols = series.enVols ?? series.volumes;

  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet hd-scroll" onClick={(e) => e.stopPropagation()}>
        <div style={{ position: "relative", padding: "20px 20px 16px", borderBottom: "1px solid var(--line)" }}>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" style={{ position: "absolute", right: 12, top: 12 }} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
          <div className="flex" style={{ gap: 16 }}>
            <Cover s={series} vol={entry.coverOut || Math.max(1, entry.owned.length || 1)} w={92} />
            <div style={{ minWidth: 0, paddingRight: 30 }}>
              <h2 className="hd-serif" style={{ fontSize: 22, lineHeight: 1.15 }}>{series.title}</h2>
              {series.jp && <div className="hd-faint" style={{ fontSize: 12.5, marginTop: 3 }}>{series.jp}</div>}
              <div className="hd-muted" style={{ fontSize: 13, marginTop: 8 }}>
                {series.author} · {series.publisher} · {series.status}{series.ended ? ` ${series.ended}` : ` since ${series.year}`}
              </div>
              {series.edition !== "Standard" && (
                <div style={{ fontSize: 12.5, marginTop: 6, color: "var(--bengara)" }}>
                  {series.edition}{series.format ? ` · ${series.format}` : ""}
                </div>
              )}
              <div className="flex flex-wrap" style={{ gap: 5, marginTop: 9 }}>
                {series.genres.map((g) => <span key={g} className="hd-tag">{g}</span>)}
              </div>
            </div>
          </div>
          <p className="hd-muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 14 }}>{series.blurb}</p>
          {siblings.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <div className="hd-eyebrow" style={{ marginBottom: 8 }}>Editions of this work</div>
              <div className="flex flex-wrap" style={{ gap: 7 }}>
                {siblings.map((ed) => {
                  const owns = (collection?.[ed.id]?.owned || []).length;
                  const current = ed.id === series.id;
                  return (
                    <button key={ed.id} className="hd-btn hd-btn-sm"
                      style={current
                        ? { background: "var(--accent)", color: "var(--on-accent)" }
                        : { background: "var(--surface)", color: "var(--ink)", borderColor: "var(--line2)" }}
                      onClick={() => !current && onOpenSeries(ed.id)}>
                      {ed.edition === "Standard" ? "Tankōbon" : ed.edition} · {ed.volumes} vols
                      {owns > 0 && <span style={{ opacity: .75 }}>· {owns} owned</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {enVols < series.volumes && (
            <div className="hd-panel" style={{ padding: "9px 12px", marginTop: 12, fontSize: 12.5, color: "var(--bengara)" }}>
              English release has reached volume {enVols}. Volumes {enVols + 1}–{series.volumes} are Japanese-only so far.
            </div>
          )}
        </div>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-baseline justify-between">
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>
              {readOnly ? `${ownerName} owns ${entry.owned.length} of ${series.volumes}` : `Collected: ${entry.owned.length}/${series.volumes} · ${pct}%`}
            </span>
            <span className="hd-faint" style={{ fontSize: 12 }}>{listGaps(gaps)}</span>
          </div>
          <div className="hd-bar" data-done={gaps.length ? "0" : "1"} style={{ marginTop: 8 }}><span style={{ width: `${pct}%` }} /></div>

          {!readOnly && (
            <div className="flex flex-wrap" style={{ gap: 8, marginTop: 14 }}>
              <button className="hd-btn hd-btn-sm"
                style={entry.followed
                  ? { background: "var(--accent)", color: "var(--on-accent)" }
                  : { background: "var(--surface)", color: "var(--ink)", borderColor: "var(--line2)" }}
                onClick={() => actions.toggleFollow(series.id)}>
                <Bookmark size={13} /> {entry.followed ? "Following" : "Follow"}
              </button>
              <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={() => actions.ownAll(series.id)}>
                <Check size={13} /> I own every volume
              </button>
              {entry.owned.length > 0 && (
                <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => actions.clearAll(series.id)}>
                  <Trash2 size={13} /> Clear
                </button>
              )}
            </div>
          )}

          {!readOnly && entry.owned.length > 0 && (
            <div className="hd-panel" style={{ padding: "11px 13px", marginTop: 12 }}>
              <div className="flex items-center justify-between" style={{ gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Which volume faces out</div>
                  <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>
                    Every run shows a cover so you can find it fast. Newest by default — override it for a staff pick.
                  </div>
                </div>
                <select className="hd-select" style={{ width: 108, padding: "7px 10px", fontSize: 12.5 }}
                  value={entry.coverOut ?? ""} onChange={(e) => actions.setCoverOut(series.id, e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Newest</option>
                  {[...entry.owned].sort((a, b) => a - b).map((v) => <option key={v} value={v}>Vol. {v}</option>)}
                </select>
              </div>
            </div>
          )}

          {series.next && (
            <div className="hd-faint flex items-center" style={{ gap: 7, fontSize: 12.5, marginTop: 12 }}>
              <Sparkles size={13} /> Volume {series.next.num} is out {series.next.date}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 20px 10px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <div className="hd-eyebrow">Volumes</div>
            {!readOnly && (
              <div className="flex items-center" style={{ gap: 8 }}>
                <span className="hd-faint" style={{ fontSize: 11.5 }}>Tapping marks</span>
                <div className="hd-seg">
                  <button data-on={mark === "own" ? "1" : "0"} onClick={() => setMark("own")}>Owned</button>
                  <button data-on={mark === "wish" ? "1" : "0"} data-kind="wish" onClick={() => setMark("wish")}>Wishlist</button>
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(52px,1fr))" }}>
            {Array.from({ length: series.volumes }, (_, i) => i + 1).map((v) => {
              const state = owned.has(v) ? "owned" : wish.has(v) ? "wish" : "none";
              return (
                <button key={v} className="hd-vol" data-state={state} disabled={readOnly}
                  onClick={() => (mark === "wish" ? actions.toggleWish(series.id, v) : actions.toggleOwned(series.id, v))}
                  onContextMenu={(e) => { e.preventDefault(); if (!readOnly) actions.toggleWish(series.id, v); }}
                  title={jpOnly(series, v) ? `Volume ${v} — Japanese edition only` : `Volume ${v}`}>
                  {v}
                  {jpOnly(series, v) && <span className="hd-jp">JP</span>}
                  {state === "wish" && <Heart size={9} style={{ position: "absolute", bottom: 3, left: 4 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {!readOnly && gaps.length > 0 && (
          <div style={{ padding: "10px 20px 22px" }}>
            <div className="hd-eyebrow" style={{ marginBottom: 9 }}>Fill the gaps</div>
            {gaps.slice(0, 5).map((v) => {
              const best = bestOffer(country, series, v);
              return (
                <div key={v} className="flex items-center" style={{ gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ flex: 1, fontSize: 13 }}>
                    Volume {v}
                    {jpOnly(series, v) && <span style={{ color: "var(--bengara)", fontSize: 11.5, marginLeft: 7 }}>Japanese only</span>}
                  </div>
                  <div className="hd-faint" style={{ fontSize: 12 }}>{best ? `from ${money(best.currency, best.price, best.dec)}` : "unavailable"}</div>
                  <button className="hd-btn hd-btn-buy hd-btn-sm" onClick={() => onBuy(series.id, v)}>
                    <ShoppingBag size={12} /> Buy
                  </button>
                </div>
              );
            })}
            {gaps.length > 5 && <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 9 }}>+{gaps.length - 5} more missing volumes</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- quick add straight from the shelf ---- */
function QuickAddSheet({ collection, onOpenSeries, onClose }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const seen = new Set();
  const list = SERIES.filter((s) => {
    if (!s.volumes || seen.has(s.work)) return false;
    if (term && !(s.title.toLowerCase().includes(term) || s.author.toLowerCase().includes(term) || s.jp.includes(term))) return false;
    if (s.edition !== "Standard" && SERIES.some((x) => x.work === s.work && x.edition === "Standard")) return false;
    seen.add(s.work);
    return true;
  }).slice(0, 40);

  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet hd-scroll" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="hd-serif" style={{ fontSize: 17 }}>Add volumes</div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: "14px 18px 6px" }}>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--ink3)" }} />
            <input className="hd-input" autoFocus style={{ paddingLeft: 34 }} value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Which series?" />
          </div>
        </div>
        <div style={{ padding: "6px 18px 18px" }}>
          {list.map((s) => {
            const e = entryOf(collection, s.id);
            return (
              <button key={s.id} onClick={() => onOpenSeries(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none",
                  borderBottom: "1px solid var(--line)", padding: "10px 0", cursor: "pointer", textAlign: "left", color: "var(--ink)" }}>
                <Cover s={s} vol={1} w={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="hd-serif" style={{ fontSize: 14 }}>{s.title}</div>
                  <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>
                    {s.author} · {s.volumes} volumes{e.owned.length ? ` · you own ${e.owned.length}` : ""}
                  </div>
                </div>
                <ChevronRight size={15} style={{ color: "var(--ink3)" }} />
              </button>
            );
          })}
          {list.length === 0 && <div className="hd-muted" style={{ fontSize: 13, padding: "18px 0" }}>No print series matches that.</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SEARCH & DISCOVER
 * ------------------------------------------------------------------ */
function DiscoverView({ collection, country, onOpenSeries, onBuy, actions }) {
  const [q, setQ] = useState("");
  const [publisher, setPublisher] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");

  const { results, hidden } = useMemo(() => {
    const term = q.trim().toLowerCase();
    const matched = SERIES.filter((s) =>
      (!term || s.title.toLowerCase().includes(term) || s.author.toLowerCase().includes(term) || s.jp.includes(term)) &&
      (!publisher || s.publisher === publisher) &&
      (!author || s.author === author) &&
      (!genre || s.genres.includes(genre)));
    // Only titles with an actual tankōbon release can be shelved, so anything
    // without collected volumes (web extras, magazine-only runs) is held back.
    const printed = matched.filter((s) => s.volumes > 0);
    // One card per *work*: Berserk and Berserk Deluxe are the same story, and
    // showing them as separate results just looks like a duplicate. The base
    // run represents the work; the editions live inside the detail sheet.
    const byWork = new Map();
    printed.forEach((s) => {
      const cur = byWork.get(s.work);
      if (!cur || (cur.edition !== "Standard" && s.edition === "Standard")) byWork.set(s.work, s);
    });
    const results = [...byWork.values()].map((s) => ({
      s, editions: SERIES.filter((x) => x.work === s.work && x.volumes > 0).length,
    }));
    return { results, hidden: matched.filter((s) => s.volumes === 0).length };
  }, [q, publisher, author, genre]);

  const clear = () => { setQ(""); setPublisher(""); setAuthor(""); setGenre(""); };
  const anyFilter = publisher || author || genre || q;

  return (
    <div className="hd-scroll" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "18px 16px 26px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="hd-serif" style={{ fontSize: 21 }}>Find something to shelve</h1>
        <div className="hd-faint" style={{ fontSize: 12.5, marginTop: 3 }}>
          Only titles you can actually buy in print show up here. Prices are for {country}.
        </div>

        <div style={{ position: "relative", marginTop: 14 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 13, color: "var(--ink3)" }} />
          <input className="hd-input" style={{ paddingLeft: 36 }} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Title, author, or 呪術廻戦" />
        </div>

        <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          <select className="hd-select" value={publisher} onChange={(e) => setPublisher(e.target.value)}>
            <option value="">All publishers</option>
            {PUBLISHERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="hd-select" value={author} onChange={(e) => setAuthor(e.target.value)}>
            <option value="">All authors</option>
            {AUTHORS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="hd-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">All genres</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 14, marginBottom: 10, gap: 12 }}>
          <div className="hd-faint" style={{ fontSize: 12.5 }}>
            {results.length} {results.length === 1 ? "title" : "titles"}
            {hidden > 0 && ` · ${hidden} hidden (no print release)`}
          </div>
          {anyFilter && <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={clear}>Clear filters</button>}
        </div>

        {results.length === 0 ? (
          <div className="hd-panel" style={{ padding: 28, textAlign: "center" }}>
            <div className="hd-serif" style={{ fontSize: 16 }}>No print releases match those filters</div>
            <div className="hd-muted" style={{ fontSize: 13, marginTop: 6 }}>Widen the genre or drop the publisher and try again.</div>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(268px,1fr))" }}>
            {results.map(({ s, editions }) => {
              const e = entryOf(collection, s.id);
              const nextVol = gapsIn(e.owned, s.volumes)[0] || 1;
              const best = bestOffer(country, s, nextVol);
              return (
                <div key={s.id} className="hd-card flex" style={{ padding: 12, gap: 12, cursor: "pointer" }} onClick={() => onOpenSeries(s.id)}>
                  <Cover s={s} vol={e.owned.length ? nextVol : 1} w={66} />
                  <div className="flex flex-col" style={{ minWidth: 0, flex: 1 }}>
                    <div className="hd-serif" style={{ fontSize: 14.5, lineHeight: 1.2 }}>{s.title}</div>
                    <div className="hd-muted" style={{ fontSize: 12, marginTop: 3 }}>{s.author}</div>
                    <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 5 }}>{s.volumes} volumes · {s.publisher}</div>
                    {editions > 1 && (
                      <div style={{ fontSize: 11.5, marginTop: 4, color: "var(--bengara)" }}>
                        {editions} editions — choose inside
                      </div>
                    )}
                    <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>
                      {e.owned.length > 0 ? `You own ${e.owned.length}` : "Not on your shelf"}
                      {best ? ` · vol. ${nextVol} from ${money(best.currency, best.price, best.dec)}` : ""}
                    </div>
                    <div className="flex" style={{ gap: 6, marginTop: "auto", paddingTop: 9 }}>
                      <button className="hd-btn hd-btn-buy hd-btn-sm" onClick={(ev) => { ev.stopPropagation(); onBuy(s.id, nextVol); }}>
                        <ShoppingBag size={13} /> Buy vol. {nextVol}
                      </button>
                      <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={(ev) => { ev.stopPropagation(); onOpenSeries(s.id); }}>
                        <Plus size={13} />
                      </button>
                      <button className="hd-btn hd-btn-sm"
                        style={e.wishlist.length
                          ? { background: "var(--bengara)", color: "#FAF1EB" }
                          : { background: "var(--surface)", color: "var(--ink)", borderColor: "var(--line2)" }}
                        onClick={(ev) => { ev.stopPropagation(); actions.wishNext(s.id); }}
                        title="Wishlist the next volume you're missing">
                        <Heart size={13} fill={e.wishlist.length ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * WISHLIST — the buying screen
 * ------------------------------------------------------------------ */
function TargetControl({ s, vol, target, best, onSet }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(target ? String(target) : "");
  const hit = target && best && best.price <= target;
  if (!editing) {
    return (
      <button className="hd-btn hd-btn-sm"
        style={hit ? { background: "var(--moss)", color: "#F6F1E4" } : { background: "var(--surface)", color: target ? "var(--ink)" : "var(--ink2)", borderColor: "var(--line2)" }}
        onClick={() => setEditing(true)} title="Alert me under this price">
        {hit ? <><Check size={12} /> Target hit</> : target ? `Target ${money(best?.currency || "", target, best?.dec ?? 2)}` : <>Set target</>}
      </button>
    );
  }
  return (
    <div className="flex items-center" style={{ gap: 5 }}>
      <input className="hd-input" style={{ width: 82, padding: "6px 8px", fontSize: 12.5 }} inputMode="decimal"
        autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
      <button className="hd-btn hd-btn-primary hd-btn-sm" onClick={() => { onSet(s.id, vol, value ? Number(value) : null); setEditing(false); }}>
        <Check size={12} />
      </button>
      <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => { onSet(s.id, vol, null); setValue(""); setEditing(false); }}>
        <X size={12} />
      </button>
    </div>
  );
}

function WishlistView({ collection, country, plan, onPremium, onBuy, onOpenSeries, actions }) {
  const [shopFilter, setShopFilter] = useState("");
  const shops = storefront(country).shops;

  const items = useMemo(() => {
    const out = [];
    Object.entries(collection).forEach(([id, e]) => {
      const s = SERIES_BY_ID[id];
      if (!s) return;
      e.wishlist.forEach((vol) => {
        if (e.owned.includes(vol)) return;
        const offers = offersFor(country, s, vol);
        const best = offers.find((o) => o.stock) || null;
        const pick = shopFilter ? offers.find((o) => o.shop === shopFilter && o.stock) || null : best;
        out.push({ s, vol, best, pick, offers, drop: priceDrop(country, s, vol, best), target: e.targets?.[vol] ?? null });
      });
    });
    return out.sort((a, b) => a.s.title.localeCompare(b.s.title) || a.vol - b.vol);
  }, [collection, country, shopFilter]);

  const currency = storefront(country).currency;
  const total = items.reduce((n, i) => n + (i.pick?.price || i.best?.price || 0), 0);

  return (
    <div className="hd-scroll" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "18px 16px 26px", maxWidth: 860, margin: "0 auto" }}>
        <h1 className="hd-serif" style={{ fontSize: 21 }}>Wishlist</h1>
        <div className="hd-faint" style={{ fontSize: 12.5, marginTop: 3 }}>
          The volumes you're hunting, priced across shops that deliver to {country}.
        </div>

        {items.length === 0 ? (
          <div className="hd-panel" style={{ padding: 28, textAlign: "center", marginTop: 16 }}>
            <div className="hd-serif" style={{ fontSize: 16 }}>Nothing on the wishlist yet</div>
            <div className="hd-muted" style={{ fontSize: 13, marginTop: 6 }}>
              Right-click a volume in any series, or tap the heart in Discover, to start tracking prices.
            </div>
          </div>
        ) : (
          <>
            {(() => {
              const drops = items.filter((i) => i.drop).length;
              if (plan === "premium") {
                return drops > 0 ? (
                  <div className="hd-panel flex items-center" style={{ gap: 10, padding: "11px 13px", marginTop: 16 }}>
                    <Sparkles size={15} style={{ color: "var(--bengara)", flex: "none" }} />
                    <div style={{ fontSize: 13 }}>
                      {drops} {drops === 1 ? "volume has" : "volumes have"} dropped in price since you added {drops === 1 ? "it" : "them"}.
                    </div>
                  </div>
                ) : null;
              }
              return (
                <div className="hd-panel flex flex-wrap items-center" style={{ gap: 10, padding: "12px 13px", marginTop: 16 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                      {drops > 0 ? `${drops} of these got cheaper this week` : "We're watching these prices for you"}
                    </div>
                    <div className="hd-faint" style={{ fontSize: 12, marginTop: 3 }}>
                      Premium tells you the day a wishlisted volume drops, or hits a price you name.
                    </div>
                  </div>
                  <button className="hd-btn hd-btn-buy hd-btn-sm" onClick={onPremium}>See Premium</button>
                </div>
              );
            })()}

            <div className="flex flex-wrap items-center justify-between" style={{ gap: 10, marginTop: 16, marginBottom: 12 }}>
              <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                <span className="hd-faint" style={{ fontSize: 12.5 }}>Show prices from</span>
                <select className="hd-select" style={{ width: "auto", padding: "7px 10px", fontSize: 12.5 }}
                  value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}>
                  <option value="">Cheapest shop</option>
                  {shops.map((sh) => <option key={sh} value={sh}>{sh}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 13 }}>
                <span className="hd-faint">{items.length} volumes · </span>
                <span className="hd-serif" style={{ fontSize: 16 }}>{money(currency, total, storefront(country).dec)}</span>
              </div>
            </div>

            {items.map(({ s, vol, best, pick, drop, target }) => {
              const shown = pick || best;
              return (
                <div key={s.id + vol} className="hd-card hd-wishrow" style={{ padding: 11, marginBottom: 8 }}>
                  <div className="cover" style={{ cursor: "pointer" }} onClick={() => onOpenSeries(s.id)}>
                    <Cover s={s} vol={vol} w={42} />
                  </div>
                  <div className="title" style={{ minWidth: 0 }}>
                    <div className="hd-serif" style={{ fontSize: 14.5, lineHeight: 1.2 }}>{s.title}</div>
                    <div className="hd-faint" style={{ fontSize: 12, marginTop: 3 }}>
                      Volume {vol}
                      {jpOnly(s, vol) && <span style={{ color: "var(--bengara)" }}> · Japanese edition only</span>}
                    </div>
                  </div>
                  <div className="price">
                    {shown ? (
                      <>
                        <div className="hd-serif" style={{ fontSize: 15, color: drop && plan === "premium" ? "var(--bengara)" : undefined }}>
                          {money(shown.currency, shown.price, shown.dec)}
                        </div>
                        <div className="hd-faint" style={{ fontSize: 11 }}>
                          {drop && plan === "premium"
                            ? <>was <span style={{ textDecoration: "line-through" }}>{money(shown.currency, drop.was, shown.dec)}</span> · −{drop.pct}%</>
                            : shown.shop}
                        </div>
                      </>
                    ) : <div className="hd-faint" style={{ fontSize: 12 }}>Out of stock</div>}
                  </div>
                  <div className="acts">
                    {plan === "premium" && (
                      <TargetControl s={s} vol={vol} target={target} best={best} onSet={actions.setTarget} />
                    )}
                    <button className="hd-btn hd-btn-buy hd-btn-sm" onClick={() => onBuy(s.id, vol)}>
                      <ShoppingBag size={13} /> Buy
                    </button>
                    <button className="hd-btn hd-btn-ghost hd-btn-sm" title="I own this now" onClick={() => actions.toggleOwned(s.id, vol)}>
                      <Check size={14} />
                    </button>
                    <button className="hd-btn hd-btn-ghost hd-btn-sm" title="Remove" onClick={() => actions.toggleWish(s.id, vol)}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.6 }}>
              Prototype prices. Real listings would come from each shop's feed, and outbound links would carry honDana's affiliate tag.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FOLLOWED SERIES — stands in for release notifications
 * ------------------------------------------------------------------ */
function FollowingView({ collection, onOpenSeries, actions }) {
  const followed = Object.entries(collection)
    .filter(([, e]) => e.followed)
    .map(([id, e]) => ({ s: SERIES_BY_ID[id], e }))
    .filter((g) => g.s)
    .sort((a, b) => (a.s.next ? 0 : 1) - (b.s.next ? 0 : 1));

  return (
    <div className="hd-scroll" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "18px 16px 26px", maxWidth: 780, margin: "0 auto" }}>
        <h1 className="hd-serif" style={{ fontSize: 21 }}>Following</h1>
        <div className="hd-faint" style={{ fontSize: 12.5, marginTop: 3 }}>
          We'll tell you when the next volume of these lands in your region.
        </div>

        {followed.length === 0 ? (
          <div className="hd-panel" style={{ padding: 28, textAlign: "center", marginTop: 16 }}>
            <div className="hd-serif" style={{ fontSize: 16 }}>You're not following anything yet</div>
            <div className="hd-muted" style={{ fontSize: 13, marginTop: 6 }}>Open any series and choose Follow to get release dates here.</div>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {followed.map(({ s, e }) => {
              const gaps = gapsIn(e.owned, s.volumes);
              return (
                <div key={s.id} className="hd-card flex items-center" style={{ padding: 12, gap: 13, marginBottom: 9, cursor: "pointer" }}
                  onClick={() => onOpenSeries(s.id)}>
                  <Cover s={s} vol={e.owned.length || 1} w={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="hd-serif" style={{ fontSize: 15 }}>{s.title}</div>
                    <div className="hd-faint" style={{ fontSize: 12, marginTop: 3 }}>
                      {e.owned.length}/{s.volumes} owned · {listGaps(gaps)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    {s.next ? (
                      <>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--bengara)" }}>Vol. {s.next.num}</div>
                        <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>{s.next.date}</div>
                      </>
                    ) : <div className="hd-faint" style={{ fontSize: 11.5 }}>Series finished</div>}
                  </div>
                  <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={(ev) => { ev.stopPropagation(); actions.toggleFollow(s.id); }}>
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * PEOPLE — following / followers, asymmetric like Letterboxd. Following
 * someone is one-directional; they may follow you back, which is where the
 * notification comes from.
 * ------------------------------------------------------------------ */
function PersonRow({ person, isFollowed, followsYou, onFollow, onVisit }) {
  const count = Object.values(person.collection).reduce((n, e) => n + e.owned.length, 0);
  const locked = !!person.private;
  return (
    <div className="hd-card flex items-center" style={{ padding: 12, gap: 12, marginBottom: 8 }}>
      <button onClick={() => onVisit(person.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <Avatar name={person.name} profile={person.profile} locked={locked} />
      </button>
      <button onClick={() => onVisit(person.id)}
        style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", color: "var(--ink)" }}>
        <div className="flex items-center" style={{ gap: 7 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{locked ? `@${person.handle}` : person.name}</span>
          {locked && <Lock size={12} style={{ color: "var(--ink3)" }} />}
          {!locked && person.premium && <PremiumMark size={12} />}
          {!locked && followsYou && <span className="hd-tag" style={{ fontSize: 10.5 }}>Follows you</span>}
        </div>
        <div className="hd-faint" style={{ fontSize: 12, marginTop: 2 }}>
          {locked ? "Private profile" : `@${person.handle} · ${count} volumes · ${person.country}`}
        </div>
      </button>
      <button className="hd-btn hd-btn-sm"
        style={isFollowed
          ? { background: "var(--surface)", color: "var(--ink2)", borderColor: "var(--line2)" }
          : { background: "var(--accent)", color: "var(--on-accent)" }}
        onClick={() => onFollow(person.id)}>
        {isFollowed ? <><Check size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
      </button>
    </div>
  );
}

function PeopleView({ following, followers, tab, setTab, onFollow, onVisit }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const search = FRIENDS.filter((f) => !term || f.name.toLowerCase().includes(term) || f.handle.includes(term));
  const list = tab === "following" ? FRIENDS.filter((f) => following.includes(f.id))
    : tab === "followers" ? FRIENDS.filter((f) => followers.includes(f.id))
    : search;

  return (
    <div className="hd-scroll" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "18px 16px 26px", maxWidth: 780, margin: "0 auto" }}>
        <h1 className="hd-serif" style={{ fontSize: 21 }}>People</h1>
        <div className="hd-faint" style={{ fontSize: 12.5, marginTop: 3 }}>
          Follow someone to see their shelf. They don't have to follow you back.
        </div>

        <div className="flex" style={{ gap: 4, marginTop: 14, borderBottom: "1px solid var(--line)" }}>
          {[["following", `Following · ${following.length}`], ["followers", `Followers · ${followers.length}`], ["search", "Find people"]].map(([id, label]) => (
            <button key={id} className="hd-tab" data-on={tab === id ? "1" : "0"} style={{ marginBottom: 9 }} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {tab === "search" && (
          <div style={{ position: "relative", marginTop: 16 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--ink3)" }} />
            <input className="hd-input" autoFocus style={{ paddingLeft: 34 }} value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or @handle" />
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {list.map((f) => (
            <PersonRow key={f.id} person={f} isFollowed={following.includes(f.id)} followsYou={followers.includes(f.id)}
              onFollow={onFollow} onVisit={onVisit} />
          ))}
          {list.length === 0 && (
            <div className="hd-panel" style={{ padding: 26, textAlign: "center" }}>
              <div className="hd-serif" style={{ fontSize: 16 }}>
                {tab === "following" ? "You're not following anyone yet" : tab === "followers" ? "No followers yet" : "Nobody matches that"}
              </div>
              <div className="hd-muted" style={{ fontSize: 13, marginTop: 6 }}>
                {tab === "search" ? "Try a different name or handle." : "Find people and follow a few — their shelves show up in your feed."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ items, onVisit, onClear }) {
  return (
    <div className="hd-menu" style={{ width: 300, maxHeight: 380, overflowY: "auto", padding: 0 }}>
      <div className="flex items-center justify-between" style={{ padding: "11px 13px", borderBottom: "1px solid var(--line)" }}>
        <span className="hd-eyebrow">Notifications</span>
        {items.length > 0 && <button className="hd-btn hd-btn-ghost hd-btn-sm" style={{ padding: "3px 7px" }} onClick={onClear}>Clear</button>}
      </div>
      {items.length === 0 ? (
        <div className="hd-muted" style={{ fontSize: 13, padding: "22px 14px", textAlign: "center" }}>Nothing new.</div>
      ) : items.map((n) => {
        const person = n.userId ? FRIEND_BY_ID[n.userId] : null;
        return (
          <button key={n.id} onClick={() => person && onVisit(person.id)}
            style={{ display: "flex", gap: 10, width: "100%", background: n.read ? "none" : "var(--surface2)", border: "none",
              borderBottom: "1px solid var(--line)", padding: "11px 13px", cursor: person ? "pointer" : "default", textAlign: "left" }}>
            {person ? <Avatar name={person.name} size={30} profile={person.profile} />
              : <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bengara-soft)", flex: "none" }}><Sparkles size={14} style={{ color: "var(--bengara)" }} /></div>}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, lineHeight: 1.4, color: "var(--ink)" }}>{n.text}</div>
              <div className="hd-faint" style={{ fontSize: 11, marginTop: 3 }}>{n.when}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SCAN TO ADD — real camera, real barcode decoding.
 *
 * Uses the native BarcodeDetector where it exists (Chrome, Edge, Android).
 * Safari/iOS doesn't ship it: install `barcode-detector` (a WASM ponyfill on
 * ZXing) and import it at the top of this file — the rest of this component
 * needs no changes. Camera access requires HTTPS and a user gesture, which is
 * why nothing starts until "Allow camera" is pressed. If a preview sandbox
 * blocks the camera, the sample-barcode path below still exercises the flow.
 * ------------------------------------------------------------------ */

// Known ISBNs, seeded so scanning works offline. In production this is a
// lookup against your own volumes table (see ingest-covers.mjs).
const ISBN_INDEX = {
  "9781632369901": { id: "vinland", vol: 25 },
  "9781646513522": { id: "witch", vol: 13 },
  "9781974741739": { id: "frieren", vol: 12 },
  "9781974734139": { id: "csm", vol: 19 },
  "9781974700523": { id: "jjk", vol: 12 },
  "9781421585444": { id: "mha", vol: 7 },
  "9781506711980": { id: "berserk-deluxe", vol: 9 },
  "9781974707164": { id: "kaguya", vol: 21 },
};
const SAMPLE_ISBNS = Object.keys(ISBN_INDEX);
const isIsbn13 = (code) => /^97[89]\d{10}$/.test(String(code).replace(/\D/g, ""));

/** ISBN → series + volume: local table first, then Google Books. */
async function resolveIsbn(isbn) {
  const local = ISBN_INDEX[isbn];
  if (local && SERIES_BY_ID[local.id]) return { ...local, isbn, source: "catalogue" };
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    if (res.ok) {
      const data = await res.json();
      const info = data.items?.[0]?.volumeInfo;
      if (info?.title) {
        // Volume titles are published as "Chainsaw Man, Vol. 7" almost always.
        const m = info.title.match(/vol(?:ume)?\.?\s*(\d+)/i);
        const vol = m ? Number(m[1]) : 1;
        const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "");
        const stripped = norm(info.title.replace(/,?\s*vol(?:ume)?\.?\s*\d+.*/i, ""));
        const match = SERIES.find((s) => s.volumes > 0 && stripped.startsWith(norm(s.title)));
        if (match) return { id: match.id, vol, isbn, source: "google-books", title: info.title };
        return { unknown: true, isbn, title: info.title, authors: info.authors?.join(", ") };
      }
    }
  } catch { /* offline, blocked, or rate limited — fall through to manual */ }
  return { unknown: true, isbn };
}

function ScanSheet({ collection, onAdd, onClose, notify }) {
  const [step, setStep] = useState("intro"); // intro | scanning | working | result | manual | denied
  const [hit, setHit] = useState(null);
  const [note, setNote] = useState("");
  const [manualIsbn, setManualIsbn] = useState("");
  const [pick, setPick] = useState({ id: "", vol: 1 });
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const busyRef = useRef(false);

  const stopCamera = useCallback(() => {
    clearTimeout(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  const handleCode = useCallback(async (raw) => {
    const isbn = String(raw).replace(/\D/g, "");
    if (!isIsbn13(isbn)) { setNote("That's the price barcode — scan the one starting 978."); return; }
    busyRef.current = true;
    stopCamera();
    setStep("working");
    const found = await resolveIsbn(isbn);
    if (found.unknown || !SERIES_BY_ID[found.id]) {
      setHit(found);
      setPick({ id: "", vol: 1 });
      setStep("manual");
    } else {
      setHit(found);
      setStep("result");
    }
  }, [stopCamera]);

  const startCamera = async () => {
    setNote("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setNote("This browser won't give us a camera. Enter the ISBN instead.");
      setStep("manual");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setStep("scanning");
    } catch (err) {
      setNote(err?.name === "NotAllowedError"
        ? "Camera permission was declined. You can allow it in your browser's site settings, or type the ISBN."
        : "No camera available here. Type the ISBN instead.");
      setStep("denied");
    }
  };

  // Attach the stream and run the detector once the <video> is mounted.
  useEffect(() => {
    if (step !== "scanning" || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
    busyRef.current = false;

    const Detector = typeof window !== "undefined" && window.BarcodeDetector;
    if (!Detector) {
      setNote("This browser can't decode barcodes natively — ship the barcode-detector polyfill, or type the ISBN below.");
      return;
    }
    const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a"] });
    const tick = async () => {
      if (busyRef.current || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        const isbn = codes.map((c) => c.rawValue).find(isIsbn13);
        if (isbn) {
          if (navigator.vibrate) navigator.vibrate(40);
          handleCode(isbn);
          return;
        }
      } catch { /* a frame failed to decode; try the next one */ }
      loopRef.current = setTimeout(tick, 220);
    };
    tick();
    return () => clearTimeout(loopRef.current);
  }, [step, handleCode]);

  const close = () => { stopCamera(); onClose(); };
  const series = hit && !hit.unknown ? SERIES_BY_ID[hit.id] : null;
  const pickSeries = pick.id ? SERIES_BY_ID[pick.id] : null;

  return (
    <div className="hd-overlay" onClick={close}>
      <div className="hd-sheet hd-scroll" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="hd-serif" style={{ fontSize: 17 }}>Scan a barcode</div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={close} aria-label="Close"><X size={16} /></button>
        </div>

        <div style={{ padding: 18 }}>
          {step === "intro" && (
            <div style={{ textAlign: "center", padding: "12px 6px 4px" }}>
              <div className="flex items-center justify-center" style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--surface2)", margin: "0 auto" }}>
                <Camera size={22} style={{ color: "var(--ink2)" }} />
              </div>
              <div className="hd-serif" style={{ fontSize: 17, marginTop: 14 }}>Use your camera?</div>
              <p className="hd-muted" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 8, maxWidth: 310, marginLeft: "auto", marginRight: "auto" }}>
                Point it at the barcode on the back of a volume — the one starting 978. Frames are read on
                your device and never uploaded.
              </p>
              <div className="flex flex-wrap" style={{ gap: 8, marginTop: 18, justifyContent: "center" }}>
                <button className="hd-btn hd-btn-primary" onClick={startCamera}>Allow camera</button>
                <button className="hd-btn hd-btn-quiet" onClick={() => setStep("manual")}>Type an ISBN</button>
              </div>
            </div>
          )}

          {step === "scanning" && (
            <div>
              <div className="hd-scanbox">
                <video ref={videoRef} playsInline muted autoPlay
                  style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div className="hd-bracket" style={{ left: 14, top: 14, borderRight: "none", borderBottom: "none" }} />
                <div className="hd-bracket" style={{ right: 14, top: 14, borderLeft: "none", borderBottom: "none" }} />
                <div className="hd-bracket" style={{ left: 14, bottom: 14, borderRight: "none", borderTop: "none" }} />
                <div className="hd-bracket" style={{ right: 14, bottom: 14, borderLeft: "none", borderTop: "none" }} />
                <div className="hd-scanline" />
              </div>
              <div className="flex items-center justify-center" style={{ gap: 8, marginTop: 12, fontSize: 13, color: "var(--ink2)" }}>
                <Loader2 size={14} className="animate-spin" /> Looking for a barcode…
              </div>
              {note && <div className="hd-faint" style={{ fontSize: 12, marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>{note}</div>}
              <div className="flex" style={{ gap: 8, marginTop: 12 }}>
                <button className="hd-btn hd-btn-quiet hd-btn-sm" style={{ flex: 1 }} onClick={() => { stopCamera(); setStep("manual"); }}>
                  Type it instead
                </button>
                <button className="hd-btn hd-btn-ghost hd-btn-sm" style={{ flex: 1 }}
                  onClick={() => handleCode(SAMPLE_ISBNS[Math.floor(Math.random() * SAMPLE_ISBNS.length)])}>
                  Use a sample barcode
                </button>
              </div>
            </div>
          )}

          {step === "denied" && (
            <div style={{ textAlign: "center", padding: "10px 4px" }}>
              <div className="hd-serif" style={{ fontSize: 16 }}>Camera unavailable</div>
              <p className="hd-muted" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>{note}</p>
              <div className="flex flex-wrap" style={{ gap: 8, marginTop: 16, justifyContent: "center" }}>
                <button className="hd-btn hd-btn-quiet" onClick={startCamera}>Try again</button>
                <button className="hd-btn hd-btn-primary" onClick={() => setStep("manual")}>Type an ISBN</button>
              </div>
            </div>
          )}

          {step === "working" && (
            <div className="flex flex-col items-center justify-center" style={{ padding: "36px 0", gap: 12 }}>
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--ink2)" }} />
              <div className="hd-muted" style={{ fontSize: 13 }}>Looking up the ISBN…</div>
            </div>
          )}

          {step === "result" && series && (
            <div>
              <div className="flex items-center" style={{ gap: 6, fontSize: 12.5, color: "var(--moss)" }}><Check size={14} /> Matched</div>
              <div className="hd-panel flex" style={{ padding: 13, gap: 13, marginTop: 10 }}>
                <Cover s={series} vol={hit.vol} w={58} />
                <div style={{ minWidth: 0 }}>
                  <div className="hd-serif" style={{ fontSize: 15.5 }}>{series.title}</div>
                  <div className="hd-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                    Volume {hit.vol}{series.edition !== "Standard" ? ` · ${series.edition}` : ""}
                  </div>
                  <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 6 }}>ISBN {hit.isbn}</div>
                </div>
              </div>
              <div className="flex" style={{ gap: 8, marginTop: 16 }}>
                <button className="hd-btn hd-btn-quiet" style={{ flex: 1 }} onClick={() => { setHit(null); setStep("manual"); }}>Wrong book</button>
                <button className="hd-btn hd-btn-primary" style={{ flex: 1 }} onClick={() => onAdd(hit.id, hit.vol, series.title)}>
                  <Plus size={14} /> Add to shelf
                </button>
              </div>
              <button className="hd-btn hd-btn-ghost hd-btn-sm" style={{ width: "100%", marginTop: 8 }}
                onClick={() => { setHit(null); setNote(""); startCamera(); }}>Scan another</button>
            </div>
          )}

          {step === "manual" && (
            <div>
              {hit?.unknown && (
                <div className="hd-panel" style={{ padding: "10px 12px", fontSize: 12.5, marginBottom: 12 }}>
                  {hit.title
                    ? <>Found <strong>{hit.title}</strong>{hit.authors ? ` by ${hit.authors}` : ""}, but it isn't in the catalogue yet. Match it below and we'll remember the ISBN.</>
                    : <>ISBN {hit.isbn} isn't in the catalogue yet. Match it below and we'll remember it.</>}
                </div>
              )}
              <label className="hd-label">ISBN-13</label>
              <div className="flex" style={{ gap: 8 }}>
                <input className="hd-input" inputMode="numeric" placeholder="978…" value={manualIsbn}
                  onChange={(e) => setManualIsbn(e.target.value)} />
                <button className="hd-btn hd-btn-quiet" disabled={!isIsbn13(manualIsbn)} onClick={() => handleCode(manualIsbn)}>Look up</button>
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="hd-label">Or pick it by hand</label>
                <select className="hd-select" value={pick.id} onChange={(e) => setPick({ id: e.target.value, vol: 1 })}>
                  <option value="">Choose a series</option>
                  {SERIES.filter((s) => s.volumes > 0).sort((a, b) => a.title.localeCompare(b.title)).map((s) => (
                    <option key={s.id} value={s.id}>{s.title}{s.edition !== "Standard" ? ` — ${s.edition}` : ""}</option>
                  ))}
                </select>
                {pickSeries && (
                  <select className="hd-select" style={{ marginTop: 8 }} value={pick.vol}
                    onChange={(e) => setPick((p) => ({ ...p, vol: Number(e.target.value) }))}>
                    {Array.from({ length: pickSeries.volumes }, (_, i) => i + 1).map((v) => <option key={v} value={v}>Volume {v}</option>)}
                  </select>
                )}
                <button className="hd-btn hd-btn-primary" style={{ width: "100%", marginTop: 10 }} disabled={!pickSeries}
                  onClick={() => {
                    if (isIsbn13(manualIsbn) || hit?.isbn) ISBN_INDEX[manualIsbn || hit.isbn] = { id: pick.id, vol: pick.vol };
                    onAdd(pick.id, pick.vol, pickSeries.title);
                  }}>
                  <Plus size={14} /> Add to shelf
                </button>
              </div>

              <button className="hd-btn hd-btn-ghost hd-btn-sm" style={{ width: "100%", marginTop: 10 }} onClick={startCamera}>
                <Camera size={13} /> Back to the camera
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * HOME
 * ------------------------------------------------------------------ */
function HomeView({ account, profile, plan, collection, country, friendIds, onTab, onOpenSeries, onBuy, onScan, onQuickAdd, onVisitFriend }) {
  const groups = Object.entries(collection).map(([id, e]) => ({ s: SERIES_BY_ID[id], e })).filter((g) => g.s && g.e.owned.length);
  const vols = groups.reduce((n, g) => n + g.e.owned.length, 0);
  const slots = groups.reduce((n, g) => n + g.s.volumes, 0);
  const wishCount = groups.reduce((n, g) => n + g.e.wishlist.filter((v) => !g.e.owned.includes(v)).length, 0);
  const complete = groups.filter((g) => g.e.owned.length === g.s.volumes).length;

  const upcoming = groups.filter((g) => g.e.followed && g.s.next)
    .sort((a, b) => new Date(a.s.next.date) - new Date(b.s.next.date)).slice(0, 3);
  const nearlyThere = groups.map((g) => ({ ...g, gaps: gapsIn(g.e.owned, g.s.volumes) }))
    .filter((g) => g.gaps.length > 0 && g.gaps.length <= 3)
    .sort((a, b) => a.gaps.length - b.gaps.length).slice(0, 4);
  const recent = [...groups].sort((a, b) => b.e.added - a.e.added).slice(0, 6);
  const friends = FRIENDS.filter((f) => friendIds.includes(f.id)).slice(0, 6);

  return (
    <div className="hd-scroll" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "22px 16px 30px", maxWidth: 940, margin: "0 auto" }}>
        <div className="hd-eyebrow">本棚</div>
        <h1 className="hd-serif flex flex-wrap items-center" style={{ fontSize: "clamp(24px,4vw,32px)", lineHeight: 1.15, marginTop: 8, gap: 10 }}>
          <span>Welcome back, {account.username || "reader"}.</span>
          {plan === "premium" && <PremiumMark size={20} />}
        </h1>
        <p className="hd-muted" style={{ fontSize: 14, marginTop: 7 }}>
          {vols} volumes shelved across {groups.length} series. {wishCount > 0 ? `${wishCount} on the wishlist.` : "Nothing on the wishlist."}
        </p>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4" style={{ marginTop: 22 }}>
          <StatCard label="Volumes" value={vols} sub={`of ${slots} published`} />
          <StatCard label="Series" value={groups.length} sub={`${complete} complete`} />
          <StatCard label="Shelf filled" value={`${pctOf(vols, slots)}%`} sub="across all series" />
          <StatCard label="Wishlist" value={wishCount} sub="volumes tracked" />
        </div>

        {upcoming.length > 0 && (
          <>
            <div className="flex items-center justify-between" style={{ marginTop: 28, marginBottom: 10 }}>
              <div className="hd-eyebrow">Coming to shelves</div>
              <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => onTab("following")}>All followed <ChevronRight size={13} /></button>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
              {upcoming.map(({ s }) => (
                <div key={s.id} className="hd-card flex items-center" style={{ padding: 11, gap: 11, cursor: "pointer" }} onClick={() => onOpenSeries(s.id)}>
                  <Cover s={s} vol={s.next.num} w={40} />
                  <div style={{ minWidth: 0 }}>
                    <div className="hd-serif" style={{ fontSize: 14, lineHeight: 1.2 }}>{s.title}</div>
                    <div style={{ fontSize: 12, marginTop: 3, color: "var(--bengara)" }}>Vol. {s.next.num} · {s.next.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {nearlyThere.length > 0 && (
          <>
            <div className="flex items-center justify-between" style={{ marginTop: 28, marginBottom: 10 }}>
              <div className="hd-eyebrow">A volume or two from complete</div>
              <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => onTab("wishlist")}>Wishlist <ChevronRight size={13} /></button>
            </div>
            {nearlyThere.map(({ s, e, gaps }) => {
              const best = bestOffer(country, s, gaps[0]);
              return (
                <div key={s.id} className="hd-card flex items-center" style={{ padding: 11, gap: 12, marginBottom: 8 }}>
                  <div style={{ cursor: "pointer" }} onClick={() => onOpenSeries(s.id)}><Cover s={s} vol={gaps[0]} w={40} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="hd-serif" style={{ fontSize: 14 }}>{s.title}</div>
                    <div className="hd-faint" style={{ fontSize: 12, marginTop: 3 }}>
                      {e.owned.length}/{s.volumes} · {listGaps(gaps)}
                    </div>
                  </div>
                  <div className="hd-faint" style={{ fontSize: 12 }}>{best ? `from ${money(best.currency, best.price, best.dec)}` : ""}</div>
                  <button className="hd-btn hd-btn-buy hd-btn-sm" onClick={() => onBuy(s.id, gaps[0])}>
                    <ShoppingBag size={13} /> Vol. {gaps[0]}
                  </button>
                </div>
              );
            })}
          </>
        )}

        <div className="hd-eyebrow" style={{ marginTop: 28, marginBottom: 10 }}>Recently shelved</div>
        <div className="flex flex-wrap" style={{ gap: 10 }}>
          {recent.map(({ s, e }) => (
            <div key={s.id} style={{ cursor: "pointer", width: 62 }} onClick={() => onOpenSeries(s.id)}>
              <Cover s={s} vol={Math.max(...e.owned)} w={62} />
              <div className="hd-faint" style={{ fontSize: 11, marginTop: 5, lineHeight: 1.3 }}>{s.title}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * PROFILE — the same page whether it's yours or a friend's: who they are,
 * a stats bar, four favourites, a favourite volume, their friends, and then
 * their shelf. Editing controls only appear on your own.
 * ------------------------------------------------------------------ */
function SectionHead({ children, action }) {
  return (
    <div className="flex items-center" style={{ gap: 12, marginTop: 26, marginBottom: 12 }}>
      <span className="hd-eyebrow" style={{ flex: "none" }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
      {action}
    </div>
  );
}

function SeriesPicker({ collection, title, onPick, onClear, onClose }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const owned = Object.entries(collection).map(([id, e]) => ({ s: SERIES_BY_ID[id], e }))
    .filter((g) => g.s && g.e.owned.length && (!term || g.s.title.toLowerCase().includes(term) || g.s.author.toLowerCase().includes(term)))
    .sort((a, b) => a.s.title.localeCompare(b.s.title));
  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet hd-scroll" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="hd-serif" style={{ fontSize: 17 }}>{title}</div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: "14px 18px 4px", position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 30, top: 26, color: "var(--ink3)" }} />
          <input className="hd-input" autoFocus style={{ paddingLeft: 34 }} value={q}
            onChange={(e) => setQ(e.target.value)} placeholder="Search your shelf" />
        </div>
        <div style={{ padding: "8px 18px 18px" }}>
          {onClear && <button className="hd-btn hd-btn-ghost hd-btn-sm" style={{ marginBottom: 6 }} onClick={onClear}><X size={13} /> Leave empty</button>}
          {owned.map(({ s, e }) => (
            <button key={s.id} onClick={() => onPick(s.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none",
                borderBottom: "1px solid var(--line)", padding: "10px 0", cursor: "pointer", textAlign: "left", color: "var(--ink)" }}>
              <Cover s={s} vol={Math.max(...e.owned)} w={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hd-serif" style={{ fontSize: 14 }}>{s.title}</div>
                <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>{e.owned.length} volumes owned</div>
              </div>
            </button>
          ))}
          {owned.length === 0 && <div className="hd-muted" style={{ fontSize: 13, padding: "16px 0" }}>Nothing on the shelf matches that.</div>}
        </div>
      </div>
    </div>
  );
}

const PREVIEW_M = { bookH: 112, plank: 11, below: 16, spine: 19, jitter: 6, gap: 12, pad: 12 };

/** Two shelves' worth of the real thing, for the bottom of a profile. */
function ShelfPreview({ collection, order, onOpenSeries, rows: rowCount = 2 }) {
  const [w, setW] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const m = PREVIEW_M;

  const groups = useMemo(() => Object.entries(collection)
    .map(([id, e]) => ({ s: SERIES_BY_ID[id], e }))
    .filter((g) => g.s && g.e.owned.length)
    .sort((a, b) => {
      const rank = (id) => { const i = order ? order.indexOf(id) : -1; return i === -1 ? 1e6 : i; };
      return rank(a.s.id) - rank(b.s.id) || a.s.title.localeCompare(b.s.title);
    })
    .map((g) => {
      const owned = [...g.e.owned].sort((a, b) => a - b);
      const co = g.e.coverOut && owned.includes(g.e.coverOut) ? g.e.coverOut : owned[owned.length - 1];
      const items = owned.filter((v) => v !== co).map((v) => ({ key: g.s.id + "-" + v, type: "spine", vol: v, w: spineWidth(g.s, v, m) }));
      items.push({ key: g.s.id + "-co", type: "cover", vol: co, w: coverWidth(g.s, m) + 4 });
      return { ...g, items };
    }), [collection, m, order]);

  const rows = useMemo(() => (w > 0 ? packRows(groups, w - m.pad * 2, m).slice(0, rowCount) : []), [groups, w, m, rowCount]);

  return (
    <div ref={ref} style={{ background: "var(--bg)", borderRadius: 12, border: "1px solid var(--line)", overflow: "hidden", padding: `14px ${m.pad}px 16px` }}>
      {rows.map((items, r) => (
        <div key={r} style={{ marginBottom: r === rows.length - 1 ? 0 : m.below }}>
          <div className="hd-books" style={{ height: m.bookH }}>
            {items.map((it) => (it.type === "cover" ? (
              <div key={it.key} className="hd-coverwrap" style={{ position: "absolute", bottom: 0, left: it.x + 4, cursor: "pointer" }}
                onClick={() => onOpenSeries(it.g.s.id)}>
                <Cover s={it.g.s} vol={it.vol} w={coverWidth(it.g.s, m)} h={seriesHeight(it.g.s, m)} />
              </div>
            ) : (
              <Spine key={it.key} s={it.g.s} vol={it.vol} w={it.w} h={volumeHeight(it.g.s, it.vol, m)} x={it.x}
                onOpen={() => onOpenSeries(it.g.s.id)} />
            )))}
          </div>
          <div className="hd-plank" style={{ height: m.plank }} />
        </div>
      ))}
      {rows.length === 0 && <div className="hd-faint" style={{ fontSize: 13, padding: "22px 0", textAlign: "center" }}>Nothing shelved yet.</div>}
    </div>
  );
}

function ProfileView({ owner, profile, setProfile, collection, followingIds, followerCount, readOnly,
  isFollowed, followsYou, shelfOrder, onFollowToggle, onRename, onVisitFriend, onOpenSeries, onViewShelf, onTab, onBack, notify }) {
  const [picking, setPicking] = useState(null); // {kind:'fav', slot} | {kind:'volume'}
  const [sharing, setSharing] = useState(false);
  const [editing, setEditing] = useState(null);       // "name" | "bio" | null
  const [picMenu, setPicMenu] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const picRef = useRef(null);
  useEffect(() => {
    if (!picMenu) return;
    const close = (e) => { if (!picRef.current?.contains(e.target)) setPicMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [picMenu]);

  const groups = Object.entries(collection).map(([id, e]) => ({ s: SERIES_BY_ID[id], e })).filter((g) => g.s && g.e.owned.length);
  const vols = groups.reduce((n, g) => n + g.e.owned.length, 0);
  const complete = groups.filter((g) => g.e.owned.length === g.s.volumes).length;
  const wish = groups.reduce((n, g) => n + g.e.wishlist.filter((v) => !g.e.owned.includes(v)).length, 0);
  const friends = followingIds.map((id) => FRIEND_BY_ID[id]).filter(Boolean);

  const favVol = profile.favouriteVolume;
  const favSeries = favVol ? SERIES_BY_ID[favVol.id] : null;
  const favVolEntry = favVol ? entryOf(collection, favVol.id) : null;

  const setFav = (slot, id) => {
    const next = [...profile.favourites];
    next[slot] = id;
    setProfile({ ...profile, favourites: next });
    setPicking(null);
  };

  const stats = [
    [vols, "Volumes", null], [groups.length, "Series", null], [complete, "Complete", null],
    ...(readOnly ? [] : [[wish, "Wishlist", () => onTab("wishlist")]]),
    [friends.length, "Following", readOnly ? null : () => onTab("people:following")],
    [followerCount, "Followers", readOnly ? null : () => onTab("people:followers")],
  ];

  return (
    <div className="hd-scroll" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "22px 16px 34px", maxWidth: 880, margin: "0 auto" }}>
        {onBack && (
          <button className="hd-btn hd-btn-ghost hd-btn-sm" style={{ marginBottom: 12, marginLeft: -11 }} onClick={onBack}>
            <ArrowLeft size={14} /> Friends
          </button>
        )}
        <div className="flex flex-wrap items-start" style={{ gap: 18 }}>
          <div ref={picRef} style={{ position: "relative", flex: "none" }}>
            <button onClick={() => !readOnly && setPicMenu((v) => !v)} title={readOnly ? undefined : "Change your picture"}
              style={{ background: "none", border: "none", padding: 0, cursor: readOnly ? "default" : "pointer", display: "block" }}>
              <Avatar name={owner.name} size={84} profile={profile} />
            </button>
            {picMenu && (
              <div className="hd-menu" style={{ left: 0, right: "auto", width: 210 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8,
                  cursor: "pointer", fontSize: 13.5 }}>
                  <Upload size={15} /> Upload a photo
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 4 * 1024 * 1024) { notify("That image is over 4MB — try a smaller one"); return; }
                    const reader = new FileReader();
                    reader.onload = () => { setProfile({ ...profile, avatarImage: String(reader.result) }); setPicMenu(false); };
                    reader.readAsDataURL(file);
                  }} />
                </label>
                <button onClick={() => { setPicMenu(false); setCapturing(true); }}><Camera size={15} /> Take one now</button>
                {profile.avatarImage && (
                  <button onClick={() => { setProfile({ ...profile, avatarImage: null }); setPicMenu(false); }}>
                    <Trash2 size={15} /> Remove photo
                  </button>
                )}
                <div className="flex flex-wrap" style={{ gap: 6, padding: "8px 10px 4px" }}>
                  {AVATAR_COLORS.map((c) => (
                    <button key={c} onClick={() => setProfile({ ...profile, avatarColor: c, avatarImage: null })}
                      aria-label="Avatar colour" style={{ width: 22, height: 22, padding: 0, borderRadius: "50%", background: c,
                        border: profile.avatarColor === c && !profile.avatarImage ? "2px solid var(--ink)" : "1px solid var(--line2)" }} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="flex items-center" style={{ gap: 9 }}>
              {editing === "name" && !readOnly ? (
                <input className="hd-input hd-serif" autoFocus style={{ fontSize: 22, padding: "4px 8px", maxWidth: 280 }}
                  value={owner.name}
                  onChange={(e) => onRename(e.target.value)}
                  onBlur={() => setEditing(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditing(null)} />
              ) : (
                <h1 className="hd-serif flex items-center" style={{ fontSize: 26, lineHeight: 1.12, gap: 9,
                  cursor: readOnly ? "default" : "text" }}
                  onClick={() => !readOnly && setEditing("name")}
                  title={readOnly ? undefined : "Click to rename"}>
                  {owner.name}{owner.premium && <PremiumMark size={17} />}
                </h1>
              )}
              <button className="hd-btn hd-btn-quiet hd-btn-sm" data-nocapture="1" aria-label="Share profile"
                style={{ padding: "6px 8px" }} onClick={() => setSharing(true)}>
                <Share2 size={14} />
              </button>
            </div>
            <div className="flex flex-wrap items-center" style={{ gap: 8, marginTop: 5 }}>
              <span className="hd-faint" style={{ fontSize: 12.5 }}>
                @{owner.handle} · {owner.country || "—"} · joined {owner.joined}
              </span>
              {readOnly && followsYou && <span className="hd-tag" style={{ fontSize: 10.5 }}>Follows you</span>}
              {profile.private && <span className="hd-tag flex items-center" style={{ fontSize: 10.5, gap: 4 }}><Lock size={9} /> Private</span>}
            </div>
            {editing === "bio" && !readOnly ? (
              <textarea className="hd-input" autoFocus rows={2} style={{ marginTop: 10, maxWidth: 480, fontSize: 13.5 }}
                value={profile.bio || ""} placeholder="A line about what you collect"
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                onBlur={() => setEditing(null)} />
            ) : (profile.bio || !readOnly) && (
              <p className="hd-muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 10, maxWidth: 480,
                cursor: readOnly ? "default" : "text" }}
                onClick={() => !readOnly && setEditing("bio")}
                title={readOnly ? undefined : "Click to edit"}>
                {profile.bio || "Add a line about what you collect."}
              </p>
            )}
            {readOnly && (
              <div className="flex flex-wrap" style={{ gap: 8, marginTop: 12 }}>
                <button className="hd-btn hd-btn-sm"
                  style={isFollowed
                    ? { background: "var(--surface)", color: "var(--ink2)", borderColor: "var(--line2)" }
                    : { background: "var(--accent)", color: "var(--on-accent)" }}
                  onClick={onFollowToggle}>
                  {isFollowed ? <><Check size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
                </button>
                <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={onViewShelf}>
                  <Library size={13} /> View shelf
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="hd-stats">
          {stats.map(([n, l, go]) => (
            <div key={l}>
              <button disabled={!go} onClick={go || undefined}
                style={{ background: "none", border: "none", padding: 0, width: "100%", cursor: go ? "pointer" : "default", color: "var(--ink)" }}>
                <div className="hd-serif" style={{ fontSize: 22, lineHeight: 1 }}>{n}</div>
                <div className="hd-eyebrow" style={{ marginTop: 5 }}>{l}</div>
              </button>
            </div>
          ))}
        </div>

        <SectionHead>Favourite manga</SectionHead>
        <div className="hd-favgrid">
          {[0, 1, 2, 3].map((slot) => {
            const id = profile.favourites[slot];
            const s = id ? SERIES_BY_ID[id] : null;
            const e = id ? entryOf(collection, id) : null;
            return (
              <div key={slot} style={{ textAlign: "center" }}>
                {s ? (
                  <div className="hd-fav">
                    <button onClick={() => (readOnly ? onOpenSeries(s.id) : setPicking({ kind: "fav", slot }))}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "block", width: "100%" }}
                      title={readOnly ? s.title : "Swap this favourite"}>
                      <Cover s={s} vol={e.owned.length ? Math.max(...e.owned) : 1} w={104} h={152} style={{ margin: "0 auto" }} />
                    </button>
                    {!readOnly && (
                      <button className="hd-favx" aria-label={`Remove ${s.title}`} title="Remove"
                        onClick={() => setFav(slot, null)}><X size={13} /></button>
                    )}
                  </div>
                ) : (
                  <button className="hd-slot" disabled={readOnly} style={{ width: 104, height: 152, margin: "0 auto" }}
                    onClick={() => setPicking({ kind: "fav", slot })}>
                    {readOnly ? <span style={{ fontSize: 12 }}>—</span> : <Plus size={18} />}
                  </button>
                )}
                <div className="hd-faint" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.3 }}>{s ? s.title : (readOnly ? "" : "Add a favourite")}</div>
              </div>
            );
          })}
        </div>

        <SectionHead>Favourite volume</SectionHead>
        <div className="hd-card flex flex-wrap items-center" style={{ gap: 16, padding: 16 }}>
          {favSeries ? (
            <button onClick={() => onOpenSeries(favSeries.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <Cover s={favSeries} vol={favVol.vol} w={92} />
            </button>
          ) : (
            <div className="hd-slot" style={{ width: 92, height: 133 }}><Star size={18} /></div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            {favSeries ? (
              <>
                <div className="hd-serif" style={{ fontSize: 17 }}>{favSeries.title}</div>
                <div className="hd-muted" style={{ fontSize: 13, marginTop: 3 }}>Volume {favVol.vol} · {favSeries.author}</div>
                {jpOnly(favSeries, favVol.vol) && <div style={{ fontSize: 11.5, marginTop: 5, color: "var(--bengara)" }}>Japanese edition</div>}
              </>
            ) : (
              <div className="hd-muted" style={{ fontSize: 13 }}>
                {readOnly ? "No favourite volume picked." : "Pick the one volume you'd save from a fire."}
              </div>
            )}
            {!readOnly && (
              <div className="flex flex-wrap" style={{ gap: 8, marginTop: 12 }}>
                <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={() => setPicking({ kind: "volume" })}>
                  {favSeries ? "Change series" : "Choose a series"}
                </button>
                {favSeries && favVolEntry.owned.length > 0 && (
                  <select className="hd-select" style={{ width: 110, padding: "6px 10px", fontSize: 12.5 }}
                    value={favVol.vol} onChange={(ev) => setProfile({ ...profile, favouriteVolume: { id: favVol.id, vol: Number(ev.target.value) } })}>
                    {[...favVolEntry.owned].sort((a, b) => a - b).map((v) => <option key={v} value={v}>Vol. {v}</option>)}
                  </select>
                )}
                {favSeries && (
                  <button className="hd-btn hd-btn-ghost hd-btn-sm"
                    onClick={() => { setProfile({ ...profile, favouriteVolume: null }); }}>Remove</button>
                )}
              </div>
            )}
          </div>
        </div>

        <SectionHead action={
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onViewShelf}>Full shelf <ChevronRight size={13} /></button>
        }>
          {readOnly ? "Their shelf" : "Your shelf"}
        </SectionHead>
        <ShelfPreview collection={collection} order={shelfOrder} onOpenSeries={onOpenSeries} />
      </div>

      {capturing && (
        <PhotoCapture onClose={() => setCapturing(false)}
          onCapture={(dataUrl) => { setProfile({ ...profile, avatarImage: dataUrl }); setCapturing(false); notify("Profile picture updated"); }} />
      )}
      {sharing && (
        <ShareSheet owner={owner} profile={profile} collection={collection} notify={notify} onClose={() => setSharing(false)} />
      )}
      {picking && !readOnly && (
        <SeriesPicker
          collection={collection}
          title={picking.kind === "fav" ? "Pick a favourite" : "Pick your favourite volume"}
          onClear={picking.kind === "fav" ? () => setFav(picking.slot, null) : () => { setProfile({ ...profile, favouriteVolume: null }); setPicking(null); }}
          onPick={(id) => {
            if (picking.kind === "fav") setFav(picking.slot, id);
            else {
              const owned = entryOf(collection, id).owned;
              setProfile({ ...profile, favouriteVolume: { id, vol: owned.length ? Math.max(...owned) : 1 } });
              setPicking(null);
            }
          }}
          onClose={() => setPicking(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * PREMIUM PRICING
 * Purchasing-power pricing, one row per market. `Stripe` wants a Price ID per
 * currency/interval: create them once in the dashboard and map them here, then
 * the server charges by ID rather than trusting an amount from the browser.
 * Country comes from the Cloudflare edge (request.cf.country) with the user's
 * chosen country as the override — never from the client alone.
 * ------------------------------------------------------------------ */
const PPP = {
  "United States": ["US$", 2.49, 20, 2], Canada: ["C$", 3.49, 29, 2], Australia: ["A$", 3.49, 29, 2],
  Mexico: ["MX$", 28, 226, 0], Brazil: ["R$", 6.49, 52, 2], Chile: ["CLP", 1190, 9740, 0],
  Colombia: ["COP", 4190, 33300, 0], Peru: ["S/", 3.9, 38.6, 2], Paraguay: ["₲", 7500, 57500, 0],
  Bolivia: ["Bs", 6.9, 54, 2], Uruguay: ["UYU", 79, 597, 0],
  France: ["€", 2.49, 20, 2], Germany: ["€", 2.49, 20, 2], Italy: ["€", 2.49, 20, 2], Spain: ["€", 2.49, 20, 2],
  "United Kingdom": ["£", 1.99, 16, 2], Japan: ["¥", 299, 2067, 0], "South Korea": ["₩", 2200, 17600, 0],
  India: ["₹", 49, 397, 0], Pakistan: ["Rs", 159, 1308, 0], Bangladesh: ["৳", 89, 699, 0],
  Nepal: ["NPR", 89, 705, 0], "Sri Lanka": ["LKR", 199, 1623, 0], Philippines: ["₱", 49, 411, 0],
  Indonesia: ["Rp", 12900, 101300, 0], Vietnam: ["₫", 17900, 144100, 0], Thailand: ["฿", 29, 212, 0],
  Malaysia: ["RM", 3.9, 28.6, 2], Singapore: ["S$", 2.49, 20.4, 2], "South Africa": ["R", 19, 155, 0],
  Egypt: ["E£", 19, 154, 0], Morocco: ["MAD", 9.99, 79, 2], Kenya: ["KSh", 109, 900, 0],
  Nigeria: ["₦", 799, 6361, 0],
};
function planFor(country) {
  const [currency, monthly, yearly, dec] = PPP[country] || PPP["United States"];
  return {
    currency, monthly, yearly, dec,
    monthlyLabel: money(currency, monthly, dec),
    yearlyLabel: money(currency, yearly, dec),
    saving: Math.max(0, Math.round((1 - yearly / (monthly * 12)) * 100)),
    localised: !!PPP[country],
  };
}

/* Client-side card checks. These stop obvious typos before a request is made —
   the real validation is Stripe's, on the server, and a card is only "valid"
   once the PaymentIntent succeeds. Never grant premium on these alone. */
function luhn(digits) {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}
function cardBrand(value) {
  const d = String(value).replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "American Express";
  if (/^(6011|65|64[4-9])/.test(d)) return "Discover";
  if (/^35/.test(d)) return "JCB";
  if (/^3(0[0-5]|[68])/.test(d)) return "Diners Club";
  if (/^62/.test(d)) return "UnionPay";
  return null;
}
const formatCard = (v) => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
function formatExpiry(v) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}
function expiryState(v) {
  const m = /^(\d{2})\/(\d{2})$/.exec(v.trim());
  if (!m) return "format";
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "format";
  const now = new Date();
  const end = new Date(year, month, 1);            // first day after the card expires
  return end > now ? "ok" : "past";
}

/* Stripe: the publishable key is the only key that may exist in this bundle.
   The secret key belongs in the Worker, in an environment binding, and nowhere
   else — see stripe-worker.js. */
const STRIPE_PUBLISHABLE_KEY = "pk_live_replace_me";

/* Where this copy of honDana lives. Set VITE_SITE_URL in Cloudflare Pages
   (Settings → Environment variables) when you move to a custom domain. */
const SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://trackhondana.pages.dev";

/** Edition-aware recommended retail price, used for collection valuation. */
function editionMultiplier(s) {
  const f = (s.format || "").toLowerCase();
  if (f.includes("brick") || f.includes("5-in-1")) return 4.2;
  if (f.includes("box")) return 3.4;
  if (f.includes("3-in-1")) return 2.4;
  if (f.includes("2-in-1")) return 1.9;
  if (f.includes("hardcover") || f.includes("oversized") || f.includes("colour")) return 2.2;
  return 1;
}
const msrpOf = (country, s) => {
  const { base, currency, dec } = storefront(country);
  const raw = base * editionMultiplier(s);
  return { value: dec === 0 ? Math.round(raw / 10) * 10 : Math.round(raw) - 0.05, currency, dec };
};

/** Twelve months of prices ending at what it costs today. Deterministic. */
function priceHistory(country, series, vol, current) {
  const pts = [];
  const { dec } = storefront(country);
  for (let i = 11; i >= 0; i--) {
    const h = hash(`${series.id}|${vol}|${i}|${country}`);
    const drift = 1 + (i / 11) * 0.22 + ((h % 15) - 7) / 100;
    const v = current * drift;
    pts.push(dec === 0 ? Math.round(v / 10) * 10 : Math.round(v * 100) / 100);
  }
  pts[11] = current;
  return pts;
}

function Sparkline({ points, width = 168, height = 40 }) {
  if (!points?.length) return null;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const d = points.map((p, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${(height - ((p - min) / span) * (height - 6) - 3).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const down = last < points[0];
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <path d={d} fill="none" stroke={down ? "var(--moss)" : "var(--ink3)"} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={width} cy={height - ((last - min) / span) * (height - 6) - 3} r="2.8" fill={down ? "var(--moss)" : "var(--bengara)"} />
    </svg>
  );
}

/** Card fields are a mock. Wire to Stripe Elements — see comment in onPay. */
function CheckoutSheet({ plan, country, onPaid, onCancel }) {
  const [interval, setInterval] = useState("yearly");
  const [state, setState] = useState("form"); // form | processing | done
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [errors, setErrors] = useState({});
  const amount = interval === "yearly" ? plan.yearlyLabel : plan.monthlyLabel;
  const brand = cardBrand(card.number);

  const validate = () => {
    const e = {};
    const digits = card.number.replace(/\D/g, "");
    if (!luhn(digits)) e.number = digits.length < 12 ? "Card number looks too short" : "That card number isn't valid";
    else if (!brand) e.number = "We don't recognise that card type";
    const exp = expiryState(card.exp);
    if (exp !== "ok") e.exp = exp === "past" ? "That expiry date has passed" : "Use MM/YY";
    const cvcLen = brand === "American Express" ? 4 : 3;
    if (card.cvc.replace(/\D/g, "").length !== cvcLen) e.cvc = `${cvcLen} digits for ${brand || "this card"}`;
    if (card.name.trim().length < 2) e.name = "Name on the card, please";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pay = async () => {
    if (!validate()) return;
    setState("processing");
    /* Real implementation, all on your own page:
     *   const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
     *   const { clientSecret } = await fetch("/api/subscribe", {
     *     method: "POST", headers: { "Content-Type": "application/json" },
     *     body: JSON.stringify({ interval }),      // NOT the amount — the server picks the Price ID
     *   }).then((r) => r.json());
     *   const { error } = await stripe.confirmPayment({ elements, clientSecret,
     *     confirmParams: { return_url: window.location.origin + "/premium" } });
     * The Worker in stripe-worker.js creates the customer, subscription and
     * clientSecret, and flips the plan flag from the webhook — never from here. */
    setTimeout(() => { setState("done"); onPaid(interval); }, 1500);
  };

  return (
    <div className="hd-overlay" onClick={onCancel}>
      <div className="hd-sheet hd-scroll" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="hd-serif" style={{ fontSize: 17 }}>honDana Premium</div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onCancel} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: 18 }}>
      <div className="hd-seg" style={{ width: "100%" }}>
        <button style={{ flex: 1 }} data-on={interval === "monthly" ? "1" : "0"} onClick={() => setInterval("monthly")}>
          {plan.monthlyLabel} / month
        </button>
        <button style={{ flex: 1 }} data-on={interval === "yearly" ? "1" : "0"} onClick={() => setInterval("yearly")}>
          {plan.yearlyLabel} / year{plan.saving > 0 ? ` · save ${plan.saving}%` : ""}
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <label className="hd-label">Card number</label>
        <div style={{ position: "relative" }}>
          <input className="hd-input" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
            style={errors.number ? { borderColor: "var(--bengara)" } : undefined}
            value={card.number}
            onChange={(e) => { setCard({ ...card, number: formatCard(e.target.value) }); setErrors({ ...errors, number: null }); }} />
          {brand && <span className="hd-faint" style={{ position: "absolute", right: 12, top: 12, fontSize: 11.5 }}>{brand}</span>}
        </div>
        {errors.number && <div className="hd-err">{errors.number}</div>}

        <div className="flex" style={{ gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="hd-label">Expiry</label>
            <input className="hd-input" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
              style={errors.exp ? { borderColor: "var(--bengara)" } : undefined} value={card.exp}
              onChange={(e) => { setCard({ ...card, exp: formatExpiry(e.target.value) }); setErrors({ ...errors, exp: null }); }} />
            {errors.exp && <div className="hd-err">{errors.exp}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <label className="hd-label">CVC</label>
            <input className="hd-input" inputMode="numeric" autoComplete="cc-csc" placeholder="123"
              style={errors.cvc ? { borderColor: "var(--bengara)" } : undefined} value={card.cvc}
              onChange={(e) => { setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }); setErrors({ ...errors, cvc: null }); }} />
            {errors.cvc && <div className="hd-err">{errors.cvc}</div>}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label className="hd-label">Name on card</label>
          <input className="hd-input" autoComplete="cc-name"
            style={errors.name ? { borderColor: "var(--bengara)" } : undefined} value={card.name}
            onChange={(e) => { setCard({ ...card, name: e.target.value }); setErrors({ ...errors, name: null }); }} />
          {errors.name && <div className="hd-err">{errors.name}</div>}
        </div>
      </div>

      <button className="hd-btn hd-btn-buy" style={{ width: "100%", marginTop: 16, padding: "12px 16px", fontSize: 14.5 }}
        disabled={state !== "form"} onClick={pay}>
        {state === "processing" ? <><Loader2 size={15} className="animate-spin" /> Confirming…</> : <>Pay {amount}</>}
      </button>
      <div className="hd-faint" style={{ fontSize: 11, marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
        Prices are set for {country}. Renews automatically; cancel renewal any time.
      </div>
        </div>
      </div>
    </div>
  );
}

/** What the shelf cost at recommended retail, and what's left to finish. */
function ValuationPanel({ collection, country, rows = 6 }) {
  const data = useMemo(() => {
    let total = 0, currency = "", dec = 2;
    const rows = [];
    Object.entries(collection).forEach(([id, e]) => {
      const s = SERIES_BY_ID[id];
      if (!s || !e.owned.length) return;
      const m = msrpOf(country, s);
      currency = m.currency; dec = m.dec;
      const value = m.value * e.owned.length;
      total += value;
      rows.push({ s, volumes: e.owned.length, value });
    });
    rows.sort((a, b) => b.value - a.value);
    return { total, currency, dec, rows };
  }, [collection, country]);

  return (
    <div className="hd-card hd-scroll" style={{ padding: 15, minHeight: 0, overflowY: "auto" }}>
      <div className="hd-eyebrow">Collection valuation</div>
      <div className="hd-serif" style={{ fontSize: 27, marginTop: 6 }}>{money(data.currency, data.total, data.dec)}</div>
      <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 3 }}>
        At recommended retail in {country}, across {data.rows.reduce((n, r) => n + r.volumes, 0)} volumes.
      </div>
      <div style={{ marginTop: 14 }}>
        {data.rows.slice(0, rows).map((r) => (
          <div key={r.s.id} className="flex items-center justify-between" style={{ gap: 10, padding: "6px 0", borderTop: "1px solid var(--line)" }}>
            <span className="hd-serif" style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.s.title}{r.s.edition !== "Standard" ? ` · ${r.s.edition}` : ""}
            </span>
            <span className="hd-faint" style={{ fontSize: 12, flex: "none" }}>{r.volumes} vols · {money(data.currency, r.value, data.dec)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cheapest route to finishing each series you've started. */
function CompletionPlanner({ collection, country, onBuy, rows: cap = 8 }) {
  const plans = useMemo(() => {
    const out = [];
    Object.entries(collection).forEach(([id, e]) => {
      const s = SERIES_BY_ID[id];
      if (!s || !e.owned.length) return;
      const gaps = gapsIn(e.owned, s.volumes);
      if (!gaps.length) return;
      let total = 0, currency = "", dec = 2, unavailable = 0;
      const shops = {};
      gaps.forEach((v) => {
        const best = bestOffer(country, s, v);
        if (!best) { unavailable += 1; return; }
        total += best.price; currency = best.currency; dec = best.dec;
        shops[best.shop] = (shops[best.shop] || 0) + 1;
      });
      const bestShop = Object.entries(shops).sort((a, b) => b[1] - a[1])[0];
      out.push({ s, gaps, total, currency, dec, bestShop, unavailable });
    });
    return out.sort((a, b) => a.total - b.total);
  }, [collection, country]);

  const grand = plans.reduce((n, p) => n + p.total, 0);
  if (!plans.length) return null;

  return (
    <div className="hd-card hd-scroll" style={{ padding: 15, minHeight: 0, overflowY: "auto" }}>
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 10 }}>
        <div className="hd-eyebrow">Completion planner</div>
        <div className="flex items-baseline" style={{ gap: 7, background: "var(--bengara-soft)", border: "1px solid var(--bengara)",
          borderRadius: 999, padding: "4px 12px" }}>
          <span className="hd-eyebrow" style={{ color: "var(--bengara)" }}>Everything</span>
          <span className="hd-serif" style={{ fontSize: 17, lineHeight: 1, color: "var(--bengara)" }}>
            {money(plans[0].currency, grand, plans[0].dec)}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        {plans.slice(0, cap).map((p) => (
          <div key={p.s.id} className="flex flex-wrap items-center" style={{ gap: 10, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="hd-serif" style={{ fontSize: 13.5 }}>
                {p.s.title}{p.s.edition !== "Standard" ? ` · ${p.s.edition}` : ""}
              </div>
              <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 3 }}>
                {p.gaps.length} missing{p.bestShop ? ` · mostly cheapest at ${p.bestShop[0]}` : ""}
                {p.unavailable ? ` · ${p.unavailable} unavailable` : ""}
              </div>
            </div>
            <div className="hd-serif" style={{ fontSize: 15 }}>{money(p.currency, p.total, p.dec)}</div>
            <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={() => onBuy(p.s.id, p.gaps[0])}>
              <ShoppingBag size={12} /> Vol. {p.gaps[0]}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One row per volume you own or want. Quoting follows RFC 4180. */
function buildCsv(collection) {
  const head = ["Title", "Edition", "Author", "Japanese publisher", "English publisher", "Volume",
    "Status", "Japanese edition only", "Faced out", "Volumes in run", "Series status"];
  const rows = [];
  Object.entries(collection).forEach(([id, e]) => {
    const s = SERIES_BY_ID[id];
    if (!s) return;
    const seen = new Set();
    const push = (vol, status) => {
      const key = vol + status;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push([s.title, s.edition, s.author, s.publisher, s.en, vol, status,
        jpOnly(s, vol) ? "yes" : "no", e.coverOut === vol ? "yes" : "no", s.volumes, s.status]);
    };
    [...e.owned].sort((a, b) => a - b).forEach((v) => push(v, "owned"));
    [...e.wishlist].sort((a, b) => a - b).filter((v) => !e.owned.includes(v)).forEach((v) => push(v, "wishlist"));
  });
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])) || a[5] - b[5]);
  const cell = (v) => {
    const t = String(v ?? "");
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

function ExportSheet({ collection, email, onEmail, onClose, notify }) {
  const csv = useMemo(() => buildCsv(collection), [collection]);
  const lines = csv.split("\r\n");
  const download = () => {
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hondana-collection-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("collection.csv downloaded");
    } catch (err) {
      notify("Download blocked here — use Email it to me instead");
    }
  };
  /* PDF without a library: a print-styled window and the browser's own
     "Save as PDF". The server-side version renders the same HTML headlessly
     and attaches the file to the email. */
  const printable = () => {
    const rows = Object.entries(collection).flatMap(([id, e]) => {
      const s = SERIES_BY_ID[id];
      if (!s || !e.owned.length) return [];
      return [[s.title, s.edition, s.author, e.owned.length + " / " + s.volumes,
        [...e.owned].sort((a, b) => a - b).join(", ")]];
    }).sort((a, b) => a[0].localeCompare(b[0]));
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>honDana collection</title>
      <style>body{font-family:Georgia,serif;color:#231f1a;margin:36px}h1{font-size:22px;margin:0}
      p{color:#6a6153;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}
      th{text-align:left;text-transform:uppercase;letter-spacing:.1em;font-size:9px;color:#8b8170;border-bottom:1px solid #ccc;padding:6px 4px}
      td{padding:6px 4px;border-bottom:1px solid #eee;vertical-align:top}
      td:last-child{color:#6a6153;font-size:11px}</style></head><body>
      <h1>honDana — collection inventory</h1>
      <p>${new Date().toLocaleDateString()} · ${rows.length} series · ${rows.reduce((n, r) => n + Number(r[3].split(" / ")[0]), 0)} volumes</p>
      <table><thead><tr><th>Series</th><th>Edition</th><th>Author</th><th>Owned</th><th>Volumes</th></tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${String(c).replace(/</g, "&lt;")}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { notify("Pop-up blocked — allow pop-ups, or use Email it to me"); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 350);
  };

  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="hd-serif" style={{ fontSize: 17 }}>Export your collection</div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: 18 }}>
          <div className="hd-muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
            {lines.length - 1} rows — every volume you own and everything on your wishlist, with edition,
            publisher and Japanese-only status. Opens in Excel, Numbers or Sheets.
          </div>
          <pre className="hd-scroll" style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 9,
            padding: 11, marginTop: 12, fontSize: 11, lineHeight: 1.6, overflowX: "auto", maxHeight: 150, color: "var(--ink2)" }}>
{lines.slice(0, 5).join("\n")}
{lines.length > 5 ? `\n… ${lines.length - 6} more rows` : ""}
          </pre>
          <div className="flex flex-wrap" style={{ gap: 8, marginTop: 16 }}>
            <button className="hd-btn hd-btn-primary" onClick={() => onEmail(lines.length - 1)}>
              <Mail size={14} /> Email it to me
            </button>
            <button className="hd-btn hd-btn-quiet" onClick={download}>Download CSV</button>
            <button className="hd-btn hd-btn-quiet" onClick={printable}>Printable PDF</button>
          </div>
          <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
            Sent to {email}. Change the address in Settings.
          </div>
        </div>
      </div>
    </div>
  );
}

const PERKS = [
  ["Price-drop alerts", "A notification the day a wishlisted volume falls, with the shop and the old price."],
  ["Price targets", "Name your number — we tell you when a volume finally goes under it."],
  ["Price history", "Twelve months of what every volume has actually cost."],
  ["Collection valuation", "What the shelf is worth at recommended retail, by series."],
  ["Completion planner", "What finishing each series costs, and which shop to do it at."],
  ["CSV and PDF export", "Your whole collection as a spreadsheet or a printable inventory."],
];

function PremiumView({ plan, interval, renew, periodEnd, country, collection, wishCount, dropCount, following,
  onSubscribe, onSetRenew, onVisit, onExport, onBuy }) {
  const premium = plan === "premium";
  const [checkout, setCheckout] = useState(false);
  const [perksOpen, setPerksOpen] = useState(false);
  const price = planFor(country);
  const subscribers = FRIENDS.filter((f) => f.premium && following.includes(f.id));
  const amount = interval === "monthly" ? price.monthlyLabel : price.yearlyLabel;

  /* ---------------- subscribed: the tools come first ---------------- */
  if (premium) {
    return (
      <div style={{ height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px 12px", maxWidth: 1000, margin: "0 auto", height: "100%",
          display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="flex flex-wrap items-start" style={{ gap: 12, flex: "none" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <Crown size={16} style={{ color: "var(--bengara)" }} />
                <span className="hd-eyebrow">Premium</span>
              </div>
              <h1 className="hd-serif" style={{ fontSize: 20, marginTop: 4 }}>Your collection, valued</h1>
              <div className="hd-faint" style={{ fontSize: 12, marginTop: 3 }}>
                Watching {wishCount} {wishCount === 1 ? "volume" : "volumes"} across every shop in {country}.
              </div>
            </div>

            {/* the perks list lives here now — out of the way, one tap to check */}
            <div style={{ position: "relative" }}>
              <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={() => setPerksOpen((v) => !v)}>
                What's included
                <ChevronDown size={13} style={{ transform: perksOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
              </button>
              {perksOpen && (
                <div className="hd-menu" style={{ width: 268, padding: "6px 4px" }}>
                  {PERKS.map(([t, d]) => (
                    <div key={t} className="flex" style={{ gap: 8, padding: "8px 10px" }}>
                      <Check size={13} style={{ color: "var(--moss)", flex: "none", marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t}</div>
                        <div className="hd-faint" style={{ fontSize: 11, marginTop: 2, lineHeight: 1.45 }}>{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hd-premgrid">
            <ValuationPanel collection={collection} country={country} rows={20} />
            <CompletionPlanner collection={collection} country={country} onBuy={onBuy} rows={20} />
          </div>

          <div className="hd-card flex flex-wrap items-center" style={{ padding: "11px 16px", gap: 10, flex: "none" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Export your collection</div>
              <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 2 }}>CSV or a printable inventory, emailed to you.</div>
            </div>
            <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={onExport}><Mail size={13} /> Export</button>
          </div>

          {/* billing */}
          <div className="hd-card" style={{ padding: "13px 16px", flex: "none" }}>
            <div className="hd-eyebrow" style={{ marginBottom: 10 }}>Billing</div>
            <div className="flex flex-wrap items-center" style={{ gap: 12 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                  {amount} {interval === "monthly" ? "monthly" : "yearly"}
                </div>
                <div className="hd-faint" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>
                  {renew
                    ? `Renews automatically on ${periodEnd}.`
                    : `Cancelled. Premium stays on until ${periodEnd}, then the account returns to free.`}
                </div>
              </div>
              <div className="flex items-center" style={{ gap: 9 }}>
                <span className="hd-faint" style={{ fontSize: 12 }}>Auto-renew</span>
                <button className="hd-switch" data-on={renew ? "1" : "0"} onClick={() => onSetRenew(!renew)}><span /></button>
              </div>
            </div>
                {renew ? (
                  <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => onSetRenew(false)}>Cancel renewal</button>
                ) : (
                  <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={() => onSetRenew(true)}>Turn renewal on</button>
                )}
            <div className="hd-faint" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
              Cancelling stops the next charge. It doesn't refund the current period.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- not subscribed: the pitch ---------------- */
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "16px 16px", maxWidth: 780, margin: "0 auto" }}>
        <div className="hd-card" style={{ padding: 16 }}>
          <div className="flex items-center" style={{ gap: 9 }}>
            <Crown size={18} style={{ color: "var(--bengara)" }} />
            <h1 className="hd-serif" style={{ fontSize: 21 }}>honDana Premium</h1>
          </div>
          <div className="flex flex-wrap items-baseline" style={{ gap: 10, marginTop: 10 }}>
            <span className="hd-serif" style={{ fontSize: 27 }}>{price.monthlyLabel}</span>
            <span className="hd-muted" style={{ fontSize: 13 }}>
              a month, or {price.yearlyLabel} a year{price.saving > 0 ? ` — ${price.saving}% less` : ""}
            </span>
          </div>
          <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 5 }}>
            {price.localised ? `Priced for ${country}.` : `Priced in US dollars — we don't have a local price for ${country} yet.`}
          </div>

          <div className="hd-premperks" style={{ marginTop: 12 }}>
            {PERKS.map(([t, d]) => (
              <div key={t} className="flex" style={{ gap: 9, padding: "6px 0" }}>
                <Check size={14} style={{ color: "var(--moss)", flex: "none", marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                  <div className="hd-faint hd-perkcopy" style={{ fontSize: 11.5, marginTop: 2, lineHeight: 1.45 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="hd-btn hd-btn-buy" style={{ width: "100%", marginTop: 14, padding: "11px 16px", fontSize: 14.5 }}
            onClick={() => setCheckout(true)}>
            <Crown size={15} /> Start Premium
          </button>
          <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 8, textAlign: "center" }}>
            {dropCount > 0
              ? `${dropCount} ${dropCount === 1 ? "volume" : "volumes"} on your wishlist ${dropCount === 1 ? "is" : "are"} cheaper today than when you added ${dropCount === 1 ? "it" : "them"}.`
              : "Renews automatically; cancel renewal any time and keep the rest of the period."}
          </div>
        </div>

        {checkout && (
          <CheckoutSheet plan={price} country={country}
            onPaid={(chosen) => { setCheckout(false); onSubscribe(chosen, price); }}
            onCancel={() => setCheckout(false)} />
        )}

        <div className="hd-panel" style={{ padding: "12px 16px", marginTop: 12 }}>
          <div className="hd-eyebrow" style={{ marginBottom: 8 }}>Free forever</div>
          <div className="hd-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            The shelf, unlimited volumes and series, scanning, editions, wishlists, following,
            release dates and buying links all stay free. Premium only buys you the watching.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SETTINGS
 * ------------------------------------------------------------------ */
function Row({ title, hint, children }) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 16, padding: "13px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{title}</div>
        {hint && <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 3, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div style={{ flex: "none" }}>{children}</div>
    </div>
  );
}

function SettingsView({ account, setAccount, profile, setProfile, theme, setTheme, plan, renew, periodEnd,
  onPremium, onExport, notify, onTab, onSignOut }) {
  const [alerts, setAlerts] = useState({ release: true, friends: false, price: true });
  const [capturing, setCapturing] = useState(false);
  return (
    <div className="hd-scroll" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "18px 16px 40px", maxWidth: 620, margin: "0 auto" }}>
        <h1 className="hd-serif" style={{ fontSize: 21 }}>Settings</h1>

        <div className="hd-eyebrow" style={{ marginTop: 22, marginBottom: 4 }}>Account</div>
        <Row title="Username">
          <input className="hd-input" style={{ width: 200, padding: "7px 10px", fontSize: 13 }}
            value={account.username} onChange={(e) => setAccount({ ...account, username: e.target.value })} />
        </Row>
        <Row title="Email">
          <input className="hd-input" style={{ width: 200, padding: "7px 10px", fontSize: 13 }}
            value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
        </Row>
        <Row title="Country" hint="Sets which shops, prices and release dates you see.">
          <select className="hd-select" style={{ width: 200, padding: "7px 10px", fontSize: 13 }}
            value={account.country} onChange={(e) => { setAccount({ ...account, country: e.target.value }); notify(`Prices now shown for ${e.target.value}`); }}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Row>
        <Row title="Profile picture" hint="A photo, or your initials on a colour.">
          <div className="flex items-center" style={{ gap: 8 }}>
            <Avatar name={account.username} size={34} profile={profile} />
            <label className="hd-btn hd-btn-quiet hd-btn-sm" style={{ cursor: "pointer" }}>
              <Upload size={13} /> Upload
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 4 * 1024 * 1024) { notify("That image is over 4MB — try a smaller one"); return; }
                const reader = new FileReader();
                reader.onload = () => setProfile({ ...profile, avatarImage: String(reader.result) });
                reader.readAsDataURL(file);
              }} />
            </label>
            <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={() => setCapturing(true)}><Camera size={13} /></button>
            {profile.avatarImage && (
              <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => setProfile({ ...profile, avatarImage: null })}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </Row>
        {!profile.avatarImage && (
          <Row title="Initial colour" hint="Used when there's no photo.">
            <div className="flex flex-wrap items-center" style={{ gap: 6, maxWidth: 220, justifyContent: "flex-end" }}>
              {AVATAR_COLORS.map((c) => (
                <button key={c} onClick={() => setProfile({ ...profile, avatarColor: c })} aria-label="Avatar colour"
                  style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
                    border: profile.avatarColor === c ? "2px solid var(--ink)" : "1px solid var(--line2)" }} />
              ))}
            </div>
          </Row>
        )}
        <Row title="Bio" hint="One line, shown on your profile.">
          <input className="hd-input" style={{ width: 220, padding: "7px 10px", fontSize: 13 }}
            value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="A line about what you collect" />
        </Row>
        <Row title="Private profile" hint="People who find you in search see your username and nothing else.">
          <button className="hd-switch" data-on={profile.private ? "1" : "0"}
            onClick={() => { setProfile({ ...profile, private: !profile.private }); notify(profile.private ? "Profile is public again" : "Profile is private"); }}>
            <span />
          </button>
        </Row>

        <div className="hd-eyebrow" style={{ marginTop: 26, marginBottom: 4 }}>Plan</div>
        <Row title={plan === "premium" ? "honDana Premium" : "Free"}
          hint={plan === "premium"
            ? (renew ? "Renews automatically — manage it on the Premium tab" : `Cancelled — Premium until ${periodEnd}`)
            : `From ${planFor(account.country || "United States").monthlyLabel} a month`}>
          <button className="hd-btn hd-btn-sm" style={plan === "premium"
            ? { background: "var(--surface)", color: "var(--ink)", borderColor: "var(--line2)" }
            : { background: "var(--bengara)", color: "#FAF1EB" }}
            onClick={onPremium}>{plan === "premium" ? "Manage" : "Upgrade"}</button>
        </Row>

        <Row title="Collection export" hint={plan === "premium" ? "CSV of everything you own, emailed to you" : "Premium only"}>
          <button className="hd-btn hd-btn-quiet hd-btn-sm" onClick={() => (plan === "premium" ? onExport() : onPremium())}>
            {plan === "premium" ? "Export CSV" : "See Premium"}
          </button>
        </Row>

        <div className="hd-eyebrow" style={{ marginTop: 26, marginBottom: 4 }}>Appearance</div>
        <Row title="Theme" hint="Dark mode is tuned like a reading lamp, not an inverted palette.">
          <div className="flex" style={{ gap: 6 }}>
            <button className="hd-btn hd-btn-sm" style={theme === "light"
              ? { background: "var(--accent)", color: "var(--on-accent)" }
              : { background: "var(--surface)", color: "var(--ink2)", borderColor: "var(--line2)" }}
              onClick={() => setTheme("light")}><Sun size={13} /> Light</button>
            <button className="hd-btn hd-btn-sm" style={theme === "dark"
              ? { background: "var(--accent)", color: "var(--on-accent)" }
              : { background: "var(--surface)", color: "var(--ink2)", borderColor: "var(--line2)" }}
              onClick={() => setTheme("dark")}><Moon size={13} /> Dark</button>
          </div>
        </Row>

        <div className="hd-eyebrow" style={{ marginTop: 26, marginBottom: 4 }}>Tell me about</div>
        <Row title="New volumes in series I follow">
          <button className="hd-switch" data-on={alerts.release ? "1" : "0"} onClick={() => setAlerts((a) => ({ ...a, release: !a.release }))}><span /></button>
        </Row>
        <Row title="When a friend fills a gap I'm missing">
          <button className="hd-switch" data-on={alerts.friends ? "1" : "0"} onClick={() => setAlerts((a) => ({ ...a, friends: !a.friends }))}><span /></button>
        </Row>
        <Row title="Price drops on wishlisted volumes" hint={plan === "premium" ? undefined : "Premium only"}>
          <button className="hd-switch" data-on={plan === "premium" && alerts.price ? "1" : "0"}
            onClick={() => (plan === "premium" ? setAlerts((a) => ({ ...a, price: !a.price })) : onPremium())}><span /></button>
        </Row>

        <button className="hd-btn hd-btn-quiet" style={{ marginTop: 26 }} onClick={onSignOut}><LogOut size={14} /> Sign out</button>
      </div>

      {capturing && (
        <PhotoCapture onClose={() => setCapturing(false)}
          onCapture={(dataUrl) => { setProfile({ ...profile, avatarImage: dataUrl }); setCapturing(false); notify("Profile picture updated"); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * CHROME: wordmark, theme toggle, landing, auth
 * ------------------------------------------------------------------ */
function Wordmark({ size = 20 }) {
  return (
    <span className="hd-serif flex items-baseline" style={{ gap: 7, letterSpacing: "-.01em" }}>
      <span style={{ fontSize: size }}>hon<span style={{ color: "var(--bengara)" }}>Dana</span></span>
      <span className="hd-faint" style={{ fontSize: size * 0.55, letterSpacing: ".08em" }}>本棚</span>
    </span>
  );
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <button className="hd-btn hd-btn-ghost hd-btn-sm" aria-label="Switch theme"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * LANDING
 * A row of books standing on the baseline. Hovering turns one on its spine;
 * clicking swings it open to its cover and prints the details underneath.
 * The eight titles are fixed — they're the shelf we want people to recognise.
 * ------------------------------------------------------------------ */
const LANDING_BOOKS = [
  { id: "hxh", vol: 31 },
  { id: "onepiece", vol: 9 },
  { id: "vagabond-perfect", vol: 6 },
  { id: "jjk", vol: 19 },
  { id: "nana", vol: 2 },
  { id: "fma", vol: 1 },
  { id: "dragonball", vol: 9 },
  { id: "kimi", vol: 3 },
];
const LANDING_DEFAULT = LANDING_BOOKS[3];   // Jujutsu Kaisen, already turned

function BookInfo({ pick, onClose }) {
  const s = SERIES_BY_ID[pick.id];
  if (!s) return null;
  return (
    <div className="hd-overlay" onClick={onClose}>
      <div className="hd-sheet hd-scroll" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start" style={{ gap: 15, padding: 18, borderBottom: "1px solid var(--line)" }}>
          <Cover s={s} vol={pick.vol} w={86} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="hd-serif" style={{ fontSize: 20, lineHeight: 1.15 }}>{s.title}</div>
            {s.jp && <div className="hd-faint" style={{ fontSize: 12.5, marginTop: 3 }}>{s.jp}</div>}
            <div style={{ fontSize: 13, marginTop: 8, color: "var(--bengara)" }}>
              Volume {pick.vol}{s.edition !== "Standard" ? ` · ${s.edition}` : ""}
            </div>
            <div className="hd-muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>
              {s.author}<br />{s.publisher} · {s.en} · {s.volumes} volumes
            </div>
          </div>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: 18 }}>
          <div className="flex flex-wrap" style={{ gap: 5 }}>
            {s.genres.map((g) => <span key={g} className="hd-tag">{g}</span>)}
          </div>
          <p className="hd-muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 12 }}>{s.blurb}</p>
        </div>
      </div>
    </div>
  );
}

/** One book, standing. Two faces hinged at the spine's edge, rotated in 3D. */
function LandingBook({ pick, height, open, onSelect }) {
  const s = SERIES_BY_ID[pick.id];
  if (!s) return null;
  const seed = hash(s.id + "landing" + pick.vol);
  const spineW = 40 + (seed % 12);
  const coverW = Math.round(height / 1.45);
  const base = tone(s.color, (seed % 9) - 4, 0);
  const band = tone(s.color, (seed % 9) - 4, 26, -12);

  return (
    <button className={"hd-lbook" + (open ? " is-open" : "")}
      style={{ height, width: spineW, marginRight: open ? coverW * 0.72 : 0 }}
      onClick={() => onSelect(open ? null : pick)}
      aria-label={`${s.title}, volume ${pick.vol}`}>
      <span className="hd-lbook-3d">
        {/* the top of the page block — what you see when a book tips forward */}
        <span className="hd-lbook-top" style={{ width: spineW, height: coverW }} />
        <span className="hd-lbook-spine" style={{ width: spineW, height, background: base }}>
          <span style={{ position: "absolute", left: 0, right: 0, top: "6%", height: 3, background: band }} />
          <span style={{ position: "absolute", left: 0, right: 0, bottom: "9%", height: 1, background: "rgba(255,255,255,.28)" }} />
          <span className="hd-serif hd-lbook-title" style={{ fontSize: Math.min(15, spineW * 0.36), lineHeight: `${spineW}px` }}>
            {s.title}
          </span>
          <span className="hd-lbook-vol">{pick.vol}</span>
        </span>
        <span className="hd-lbook-cover" style={{ width: coverW, height }}>
          <Cover s={s} vol={pick.vol} w={coverW} h={height} />
        </span>
      </span>
    </button>
  );
}

/**
 * One book, modelled as a box: cover on top, back board underneath, a spine
 * down one side and page edges on the other three. Every book on the mobile
 * landing is this same component — only the artwork and thickness change.
 */
const Book3D = React.memo(function Book3D({ s, vol, size, thick }) {
  const pages = tone(s.color, 0, 44, -34);
  return (
    <div className="hd-book3d" style={{ width: size, height: size }}>
      <div className="hd-b3-board" style={{ width: size, height: size, background: tone(s.color, 0, -30), transform: `translateZ(${-thick}px)` }} />
      <div className="hd-b3-pages" style={{ left: size, top: 0, width: thick, height: size, background: pages,
        transformOrigin: "0 50%", transform: "rotateY(90deg)" }} />
      <div className="hd-b3-pages" style={{ left: 0, top: size, width: size, height: thick, background: pages,
        transformOrigin: "50% 0", transform: "rotateX(-90deg)" }} />
      <div className="hd-b3-pages" style={{ left: 0, top: 0, width: size, height: thick, background: pages,
        transformOrigin: "50% 0", transform: "rotateX(-90deg)" }} />
      <div className="hd-b3-spine" style={{ width: thick, height: size, background: tone(s.color, 0, -6),
        transform: `translateZ(${-thick}px) rotateY(-90deg)` }}>
        <span className="hd-serif">{s.title}</span>
      </div>
      <div style={{ position: "relative", transform: "translateZ(0.5px)" }}>
        <Cover s={s} vol={vol} w={size} h={size} />
      </div>
    </div>
  );
});

/** One card in the pile. Lands on top, then rides down as books stack above. */
function StackCard({ book, slot, z, thick, top, onPick }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const s = SERIES_BY_ID[book.id];
  if (!s) return null;
  const seed = hash(book.id + book.vol);
  const size = 148;
  const tilt = ((seed >> 4) % 13) - 6;            // no pile is ever square
  const nudge = ((seed >> 8) % 11) - 5;
  const leaving = slot < 0;
  /* No opacity anywhere on this subtree: fading an element that contains
     preserve-3d children makes the browser flatten them, which is why a book
     used to arrive looking like a loose cover and only become solid on landing.
     Books fly in and drop out on transform alone. */
  // Leaving books slide out from the bottom; arriving ones drift down onto the
  // pile with a little rotation so the landing doesn't look mechanical.
  const transform = leaving
    ? `translate(-50%,-50%) translateX(${nudge - 300}px) translateY(24px) translateZ(-6px) rotateZ(${tilt - 14}deg)`
    : entered
      ? `translate(-50%,-50%) translateX(${nudge}px) translateZ(${z}px) rotateZ(${tilt}deg)`
      : `translate(-50%,-50%) translateX(${nudge + 18}px) translateZ(${z + 170}px) rotateZ(${tilt + 9}deg)`;
  // The arriving book and the departing book move together on the tick — the
  // bottom of the pile is already sliding out as the new one starts its drop.
  // Everything between them follows a beat later, bottom first.
  const settle = leaving || top ? 0 : 0.09 * (slot + 1);
  return (
    <button className="hd-stackitem" data-leaving={leaving ? "1" : "0"}
      onClick={() => onPick({ id: book.id, vol: book.vol })}
      style={{
        transform,
        zIndex: Math.max(0, slot),
        visibility: leaving ? "hidden" : "visible",
        transitionDelay: leaving ? "0s, 1.4s" : `${settle}s, 0s`,
      }}>
      <Book3D s={s} vol={book.vol} size={size} thick={thick} />
    </button>
  );
}

/** Mobile: a growing pile — a book lands on top, the bottom one slides away. */
function CoverStack({ onPick, paused }) {
  const [n, setN] = useState(6);
  useEffect(() => {
    if (paused) return;                       // a book is open: hold the pile still
    let t = null, first = null;
    const start = () => {
      if (t || first) return;
      // A quick first swap so the pile is visibly alive, then a slow cadence.
      first = setTimeout(() => { first = null; setN((v) => v + 1); t = setInterval(() => setN((v) => v + 1), 5100); }, 1500);
    };
    const stop = () => { clearInterval(t); clearTimeout(first); t = null; first = null; };
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [paused]);
  // Each book sits on top of the ones below it, so the offsets have to be a
  // running total of their thicknesses — not slot × its own thickness.
  let z = 8;
  const cards = [-1, 0, 1, 2, 3, 4, 5, 6].map((slot) => {
    const index = n - 6 + slot;
    const book = LANDING_BOOKS[((index % LANDING_BOOKS.length) + LANDING_BOOKS.length) % LANDING_BOOKS.length];
    const thick = 12 + (hash(book.id + book.vol) % 8);
    const at = z;
    if (slot >= 0) z += thick + 1;
    return { key: index, slot, book, thick, z: at };
  });
  return (
    <div className="hd-stackwrap">
      <div className="hd-stack3d">
        <div className="hd-stackshadow" />
        {cards.map((c) => (
          <StackCard key={c.key} book={c.book} slot={c.slot} z={c.z} thick={c.thick}
            top={c.slot === 6} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

function Landing({ theme, setTheme, onStart, onSignIn }) {
  useRealCovers(LANDING_BOOKS);
  const [picked, setPicked] = useState(LANDING_DEFAULT);
  const [mobilePick, setMobilePick] = useState(null);
  const chosen = picked ? SERIES_BY_ID[picked.id] : null;

  const wordmark = (
    <>
      <h1 className="hd-serif hd-hero-word">honDana</h1>
      <div className="hd-hero-jp">本棚</div>
      <p className="hd-hero-tag">Start tracking your physical manga today.</p>
      <div className="flex flex-wrap" style={{ gap: 10, marginTop: 20, justifyContent: "inherit" }}>
        <button className="hd-btn hd-hero-cta" onClick={onStart}>Build your shelf</button>
        <button className="hd-btn hd-hero-ghost" onClick={onSignIn}>I already have a shelf</button>
      </div>
    </>
  );

  return (
    <div className="hd-landing">
      <header className="flex items-center justify-end" style={{ padding: "14px 18px", gap: 4, position: "relative", zIndex: 6 }}>
        <button className="hd-btn hd-hero-ghost hd-btn-sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Switch theme">
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <button className="hd-btn hd-hero-ghost hd-btn-sm" onClick={onSignIn}>Sign in</button>
      </header>

      {/* desktop */}
      <div className="hd-landing-wide">
        <div className="hd-landing-words" style={{ alignItems: "center", textAlign: "center" }}>{wordmark}</div>

        <div className="hd-lrow-wrap">
          <div className="hd-lrow">
            {LANDING_BOOKS.map((b) => (
              <LandingBook key={b.id} pick={b} height={280} open={picked?.id === b.id} onSelect={setPicked} />
            ))}
          </div>
          <div className="hd-lshelf" />

          <div className="hd-ldetail" style={{ opacity: chosen ? 1 : 0 }}>
            {chosen ? (
              <>
                <div className="hd-serif" style={{ fontSize: 24, lineHeight: 1.2 }}>{chosen.title}</div>
                <div className="hd-ldetail-jp">
                  {chosen.jp} · Volume {picked.vol}{chosen.edition !== "Standard" ? ` · ${chosen.edition}` : ""}
                </div>
                <div className="hd-ldetail-meta">
                  {chosen.author} · {chosen.publisher} / {chosen.en} · {chosen.status} since {chosen.year} · {chosen.volumes} volumes
                </div>
                <div className="hd-ldetail-meta" style={{ marginTop: 4 }}>{chosen.genres.join(" · ")}</div>
                <p className="hd-ldetail-blurb">{chosen.blurb}</p>
              </>
            ) : (
              <div className="hd-ldetail-meta">Pick a book.</div>
            )}
          </div>
        </div>
      </div>

      {/* phone */}
      <div className="hd-landing-narrow">
        <CoverStack onPick={setMobilePick} paused={!!mobilePick} />
        <div className="hd-landing-words" style={{ textAlign: "center", alignItems: "center", justifyContent: "center" }}>{wordmark}</div>
      </div>

      {mobilePick && <BookInfo pick={mobilePick} onClose={() => setMobilePick(null)} />}
    </div>
  );
}

function AuthScreen({ mode, setMode, theme, setTheme, account, setAccount, onDone, onBack }) {
  const signup = mode === "signup";
  const [pw, setPw] = useState("");
  const [reset, setReset] = useState(null);   // null | "form" | "sending" | "sent"
  const [resetEmail, setResetEmail] = useState("");
  const ready = account.email.includes("@") && pw.length >= 6 && (!signup || (account.username.trim() && account.country));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="flex items-center justify-between" style={{ padding: "16px 20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Wordmark /></button>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 20px 48px" }}>
        <div className="hd-card" style={{ width: "100%", maxWidth: 420, padding: "24px 22px", boxShadow: "var(--shadow)" }}>
          <h1 className="hd-serif" style={{ fontSize: 22 }}>{signup ? "Start your shelf" : "Welcome back"}</h1>
          <p className="hd-muted" style={{ fontSize: 13, marginTop: 5 }}>
            {signup ? "Four fields and you're shelving." : "Pick up where your collection left off."}
          </p>

          <div style={{ marginTop: 20 }}>
            <label className="hd-label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 12, top: 13, color: "var(--ink3)" }} />
              <input className="hd-input" style={{ paddingLeft: 34 }} type="email" value={account.email}
                onChange={(e) => setAccount({ ...account, email: e.target.value })} placeholder="you@example.com" />
            </div>
          </div>

          <div style={{ marginTop: 13 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <label className="hd-label" style={{ margin: 0 }}>Password</label>
              {!signup && (
                <button onClick={() => { setResetEmail(account.email); setReset("form"); }}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                    color: "var(--accent)", fontSize: 12, fontFamily: "var(--sans)" }}>
                  Forgot password?
                </button>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={14} style={{ position: "absolute", left: 12, top: 13, color: "var(--ink3)" }} />
              <input className="hd-input" style={{ paddingLeft: 34 }} type="password" value={pw}
                onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" />
            </div>
          </div>

          {signup && (
            <>
              <div style={{ marginTop: 13 }}>
                <label className="hd-label">Username</label>
                <div style={{ position: "relative" }}>
                  <UserIcon size={14} style={{ position: "absolute", left: 12, top: 13, color: "var(--ink3)" }} />
                  <input className="hd-input" style={{ paddingLeft: 34 }} value={account.username}
                    onChange={(e) => setAccount({ ...account, username: e.target.value })} placeholder="How friends will find you" />
                </div>
              </div>

              <div style={{ marginTop: 13 }}>
                <label className="hd-label">Country</label>
                <div style={{ position: "relative" }}>
                  <Globe size={14} style={{ position: "absolute", left: 12, top: 13, color: "var(--ink3)", zIndex: 1 }} />
                  <select className="hd-select" style={{ paddingLeft: 34 }} value={account.country}
                    onChange={(e) => setAccount({ ...account, country: e.target.value })}>
                    <option value="">Choose your country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="hd-faint" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.5 }}>
                  So we can show you where to buy each volume, what it costs there, and the release dates that apply where you live.
                </div>
              </div>
            </>
          )}

          <button className="hd-btn hd-btn-primary" style={{ width: "100%", marginTop: 20, padding: "11px 16px" }}
            disabled={!ready} onClick={onDone}>{signup ? "Create account" : "Sign in"}</button>

          <div className="hd-muted" style={{ fontSize: 12.5, textAlign: "center", marginTop: 14 }}>
            {signup ? "Already have a shelf? " : "New here? "}
            <button onClick={() => setMode(signup ? "login" : "signup")}
              style={{ background: "none", border: "none", padding: 0, color: "var(--accent)", cursor: "pointer", fontSize: 12.5, fontFamily: "var(--sans)" }}>
              {signup ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>
      </div>

      {reset && (
        <div className="hd-overlay" onClick={() => setReset(null)}>
          <div className="hd-sheet" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
              <div className="hd-serif" style={{ fontSize: 17 }}>Reset your password</div>
              <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => setReset(null)} aria-label="Close"><X size={16} /></button>
            </div>
            <div style={{ padding: 18 }}>
              {reset === "sent" ? (
                <div style={{ textAlign: "center", padding: "10px 4px" }}>
                  <div className="flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--moss-soft)", margin: "0 auto" }}>
                    <Mail size={19} style={{ color: "var(--moss)" }} />
                  </div>
                  <div className="hd-serif" style={{ fontSize: 16, marginTop: 13 }}>Check your inbox</div>
                  <p className="hd-muted" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>
                    If <strong>{resetEmail}</strong> has an account, a reset link is on its way. It expires in an hour.
                  </p>
                  <button className="hd-btn hd-btn-quiet" style={{ marginTop: 16 }} onClick={() => setReset(null)}>Back to sign in</button>
                </div>
              ) : (
                <>
                  <p className="hd-muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
                    Enter the address you signed up with and we'll email you a link to set a new password.
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <label className="hd-label">Email</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={14} style={{ position: "absolute", left: 12, top: 13, color: "var(--ink3)" }} />
                      <input className="hd-input" style={{ paddingLeft: 34 }} type="email" autoFocus
                        value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                  </div>
                  <button className="hd-btn hd-btn-primary" style={{ width: "100%", marginTop: 16 }}
                    disabled={!resetEmail.includes("@") || reset === "sending"}
                    onClick={() => {
                      setReset("sending");
                      /* Real route: POST /api/password/reset { email }. The Worker
                         mints a single-use token, stores its hash with a one-hour
                         expiry, and emails the link via Resend. It always answers
                         200 — telling callers whether an address exists hands out
                         a list of your users. */
                      setTimeout(() => setReset("sent"), 900);
                    }}>
                    {reset === "sending" ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : "Email me a reset link"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * APP
 * ------------------------------------------------------------------ */
const NAV = [
  { id: "home", label: "Home", Icon: Home },
  { id: "shelf", label: "Shelf", Icon: Library },
  { id: "discover", label: "Discover", Icon: Search },
  { id: "wishlist", label: "Wishlist", Icon: Heart },
  { id: "following", label: "Following", Icon: Bookmark },
  { id: "people", label: "People", Icon: Users },
  { id: "premium", label: "Premium", Icon: Crown },
  { id: "profile", label: "Profile", Icon: UserIcon },
];
const MOBILE_NAV = ["home", "shelf", "discover", "wishlist", "premium", "people", "profile"];

export default function App() {
  const [theme, setTheme] = useState("light");
  const [screen, setScreen] = useState("landing"); // landing | auth | app
  const [authMode, setAuthMode] = useState("signup");
  const [tab, setTab] = useState("home");
  const [account, setAccount] = useState({ username: "hondana", email: "hondana@example.com", country: "Australia" });
  const [profile, setProfile] = useState({
    avatarColor: AVATAR_COLORS[0],     bio: "Slowly closing the gaps. Vinland Saga is the one I'd save from a fire.",
    favourites: ["vinland", "monster", "witch", "frieren"],
    favouriteVolume: { id: "vinland", vol: 22 },
  });
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

    useEffect(() => {
    if (isSignedIn && user) {
      setAccount((a) => ({
        ...a,
        username: user.username || user.firstName || a.username,
        email: user.primaryEmailAddress?.emailAddress || a.email,
      }));
      setScreen("app");
      setTab("home");
    } else if (isSignedIn === false && screen === "app") {
      // Clerk has confirmed you're signed out, but the app still thinks
      // you're in — send it back to the landing page.
      setScreen("landing");
    }
  }, [isSignedIn, user, screen]);
  const [collection, setCollection] = useState(() => buildCollection(MY_COLLECTION));
  const [following, setFollowing] = useState(["f1", "f2", "f3"]);
  const [followers, setFollowers] = useState(["f1", "f6", "f7", "f10"]);
  const [peopleTab, setPeopleTab] = useState("following");
  const [notifs, setNotifs] = useState(() => [
    { id: "n1", userId: "f10", text: "Ananya Nair followed you", when: "2 hours ago", read: false },
    { id: "n2", userId: "f7", text: "Yuki Tanaka followed you", when: "Yesterday", read: false },
    { id: "n3", userId: null, text: "Vinland Saga vol. 29 is out on 12 Sep in Australia", when: "3 days ago", read: true },
    { id: "n4", userId: "f6", text: "Marcus Bell shelved Berserk Deluxe Edition vol. 14", when: "5 days ago", read: true },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [plan, setPlan] = useState("free");
  const [billing, setBilling] = useState({ interval: "yearly", renew: true, periodEnd: "" });
  const [exportOpen, setExportOpen] = useState(false);
  const [shelfOrder, setShelfOrder] = useState(() => Object.keys(buildCollection(MY_COLLECTION))
    .sort((a, b) => SERIES_BY_ID[a].title.localeCompare(SERIES_BY_ID[b].title)));

  /** Move `fromId` to sit where `toId` currently is. */
  const reorderShelf = useCallback((fromId, toId) => {
    setShelfOrder((prev) => {
      const list = prev.includes(fromId) ? [...prev] : [...prev, fromId];
      if (!list.includes(toId)) list.push(toId);
      const from = list.indexOf(fromId);
      list.splice(from, 1);
      const to = list.indexOf(toId);
      list.splice(to, 0, fromId);
      return list;
    });
  }, []);
  const notifRef = useRef(null);
  const followTimers = useRef([]);
  const [visiting, setVisiting] = useState(null);
  const [friendPage, setFriendPage] = useState("profile"); // profile | shelf
  const [openId, setOpenId] = useState(null);
  const [buying, setBuying] = useState(null); // {id, vol}
  const [scanOpen, setScanOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const menuRef = useRef(null);

  const notify = useCallback((msg) => {
    setToast({ msg, key: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => () => followTimers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!notifOpen) return;
    const close = (e) => { if (!notifRef.current?.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [notifOpen]);

  const unread = notifs.filter((n) => !n.read).length;
  const notifWasOpen = useRef(false);
  useEffect(() => {
    // Mark as read on close, so the highlight survives while you're reading them.
    if (notifWasOpen.current && !notifOpen) setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
    notifWasOpen.current = notifOpen;
  }, [notifOpen]);
  const openNotifs = () => setNotifOpen((v) => !v);

  /** Following is one-directional; some people follow back a moment later. */
  const toggleFollow = (id) => {
    const person = FRIEND_BY_ID[id];
    if (following.includes(id)) {
      setFollowing((f) => f.filter((x) => x !== id));
      notify(`Unfollowed ${person.name}`);
      return;
    }
    setFollowing((f) => [...f, id]);
    notify(`Following ${person.name}`);
    if (!followers.includes(id) && hash(id + "back") % 3 !== 0) {
      const t = setTimeout(() => {
        setFollowers((f) => (f.includes(id) ? f : [...f, id]));
        setNotifs((ns) => [{ id: "n" + Date.now(), userId: id, text: `${person.name} followed you back`, when: "Just now", read: false }, ...ns]);
      }, 2400);
      followTimers.current.push(t);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const edit = useCallback((id, fn) => {
    setCollection((c) => {
      const nextAdded = Object.values(c).reduce((n, e) => Math.max(n, e.added), -1) + 1;
      const cur = c[id] || { ...EMPTY_ENTRY, owned: [], wishlist: [], targets: {}, added: nextAdded };
      return { ...c, [id]: fn({ ...cur, owned: [...cur.owned], wishlist: [...cur.wishlist], targets: { ...(cur.targets || {}) } }) };
    });
  }, []);

  const actions = useMemo(() => ({
    toggleOwned: (id, vol) => edit(id, (e) => {
      const has = e.owned.includes(vol);
      e.owned = has ? e.owned.filter((v) => v !== vol) : [...e.owned, vol].sort((a, b) => a - b);
      if (!has) e.wishlist = e.wishlist.filter((v) => v !== vol);
      if (has && e.coverOut === vol) e.coverOut = null;
      return e;
    }),
    addVolume: (id, vol) => {
      setShelfOrder((o) => (o.includes(id) ? o : [...o, id]));
      edit(id, (e) => ({ ...e, owned: e.owned.includes(vol) ? e.owned : [...e.owned, vol].sort((a, b) => a - b), wishlist: e.wishlist.filter((v) => v !== vol) }));
      notify(`${SERIES_BY_ID[id].title} vol. ${vol} shelved`);
    },
    setTarget: (id, vol, price) => {
      edit(id, (e) => ({ ...e, targets: { ...(e.targets || {}), [vol]: price ?? undefined } }));
      const s = SERIES_BY_ID[id];
      const best = bestOffer(country, s, vol);
      if (price && best && best.price <= price) {
        notify(`Already there — ${best.shop} has vol. ${vol} at ${money(best.currency, best.price, best.dec)}`);
        setNotifs((ns) => [{ id: "t" + Date.now(), userId: null, read: false, when: "Just now",
          text: `${s.title} vol. ${vol} is under your target at ${best.shop} — ${money(best.currency, best.price, best.dec)}` }, ...ns]);
      } else {
        notify(price ? `We'll email you when vol. ${vol} drops below ${money(best?.currency || "", price, best?.dec ?? 2)}` : "Target cleared");
      }
    },
    toggleWish: (id, vol) => edit(id, (e) => {
      const has = e.wishlist.includes(vol);
      e.wishlist = has ? e.wishlist.filter((v) => v !== vol) : [...e.wishlist, vol].sort((a, b) => a - b);
      return e;
    }),
    toggleFollow: (id) => {
      edit(id, (e) => ({ ...e, followed: !e.followed }));
      notify(!(collection[id]?.followed) ? `Following ${SERIES_BY_ID[id].title}` : `Stopped following ${SERIES_BY_ID[id].title}`);
    },
    setCoverOut: (id, vol) => {
      edit(id, (e) => ({ ...e, coverOut: vol }));
      notify(vol ? `Volume ${vol} now faces out` : "Back to showing the newest volume");
    },
    ownAll: (id) => {
      const s = SERIES_BY_ID[id];
      edit(id, (e) => ({ ...e, owned: Array.from({ length: s.volumes }, (_, i) => i + 1), wishlist: [] }));
      notify(`All ${s.volumes} volumes of ${s.title} shelved`);
    },
    clearAll: (id) => {
      edit(id, (e) => ({ ...e, owned: [], coverOut: null }));
      notify(`${SERIES_BY_ID[id].title} taken off the shelf`);
    },
    wishNext: (id) => {
      const s = SERIES_BY_ID[id];
      const e = entryOf(collection, id);
      const next = gapsIn(e.owned, s.volumes).find((v) => !e.wishlist.includes(v));
      if (!next) { notify(`Nothing left to want from ${s.title}`); return; }
      edit(id, (en) => ({ ...en, wishlist: [...en.wishlist, next].sort((a, b) => a - b) }));
      notify(`${s.title} vol. ${next} added to your wishlist`);
    },
  }), [edit, notify, collection]);

  const periodEndFor = (interval) => {
    const d = new Date();
    if (interval === "monthly") d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  };

  const subscribe = (interval = "yearly", price = planFor(country)) => {
    setPlan("premium");
    // Auto-renew is on by default on both plans, as Stripe subscriptions are.
    setBilling({ interval, renew: true, periodEnd: periodEndFor(interval) });
    setTab("premium");
    notify(`Premium on — ${interval === "yearly" ? price.yearlyLabel + "/year" : price.monthlyLabel + "/month"}`);
    const drops = Object.entries(collection).flatMap(([id, e]) => {
      const s = SERIES_BY_ID[id];
      if (!s) return [];
      return e.wishlist.filter((v) => !e.owned.includes(v))
        .map((v) => ({ s, v, best: bestOffer(country, s, v) }))
        .filter((d) => d.best && priceDrop(country, d.s, d.v, d.best));
    });
    if (drops.length) {
      const t = setTimeout(() => {
        setNotifs((ns) => [...drops.slice(0, 2).map((d, i) => {
          const drop = priceDrop(country, d.s, d.v, d.best);
          return { id: "p" + Date.now() + i, userId: null, read: false, when: "Just now",
            text: `${d.s.title} vol. ${d.v} dropped ${drop.pct}% to ${money(d.best.currency, d.best.price, d.best.dec)} at ${d.best.shop}` };
        }), ...ns]);
      }, 1800);
      followTimers.current.push(t);
    }
  };

  const goTab = (t) => {
    if (t.startsWith("people:")) { setPeopleTab(t.split(":")[1]); t = "people"; }
    setTab(t); setVisiting(null); setMenuOpen(false); setNotifOpen(false);
  };
  const visitFriend = (id) => { setVisiting(id); setFriendPage("profile"); setMenuOpen(false); };
  const openBuy = (id, vol) => setBuying({ id, vol });
  const addScanned = (id, vol, title) => {
    actions.toggleOwned(id, vol);
    setScanOpen(false);
    setTab("shelf");
    notify(`${title} vol. ${vol} shelved`);
  };

  const friend = visiting ? FRIEND_BY_ID[visiting] : null;
  const activeCollection = friend ? friend.collection : collection;
  const openSeries = openId ? SERIES_BY_ID[openId] : null;
  const openEntry = openId ? entryOf(activeCollection, openId) : EMPTY_ENTRY;
  const country = account.country || "Australia";

    if (screen !== "app") {
    return (
      <div className="hd-root" data-theme={theme} style={{ minHeight: "100vh" }}>
        <Styles />
        {screen === "landing" ? (
          <Landing theme={theme} setTheme={setTheme}
            onStart={() => { setAuthMode("signup"); setScreen("auth"); }}
            onSignIn={() => { setAuthMode("login"); setScreen("auth"); }} />
        ) : (
                       <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
            <div style={{ width: "100%", maxWidth: 400 }}>
              {authMode === "signup" ? (
                <SignUp
                  routing="virtual"
                  signInUrl="#"
                  afterSignUpUrl="/"
                  appearance={{
                    elements: {
                      rootBox: { width: "100%" },
                      card: { width: "100%", boxShadow: "none", border: "1px solid var(--line2, #E4DACB)" },
                      footer: { display: "none" },
                    },
                  }}
                />
              ) : (
                <SignIn
                  routing="virtual"
                  signUpUrl="#"
                  afterSignInUrl="/"
                  appearance={{
                    elements: {
                      rootBox: { width: "100%" },
                      card: { width: "100%", boxShadow: "none", border: "1px solid var(--line2, #E4DACB)" },
                      footer: { display: "none" },
                    },
                  }}
                />
              )}
              <div style={{
                textAlign: "center", marginTop: -1, padding: "14px 20px",
                border: "1px solid var(--line2, #E4DACB)", borderTop: "none",
                borderRadius: "0 0 12px 12px", background: "var(--surface, #FBF7EE)",
              }}>
                <button onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent, #C2542A)",
                    fontSize: 13.5, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                  {authMode === "signup" ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
              </div>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button onClick={() => setScreen("landing")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink2, #6A6153)",
                    fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}
        {toast && <div className="hd-toast" key={toast.key}>{toast.msg}</div>}
      </div>
    );
  }

  return (
    <div className="hd-root hd-app" data-theme={theme}>
      <Styles />

      <header className="flex items-center" style={{ gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg2)", flex: "none" }}>
        <button onClick={() => goTab("home")} title="Home" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <Wordmark size={18} />
        </button>

        <nav className="hidden md:flex items-center" style={{ gap: 2, marginLeft: 14 }}>
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} className="hd-tab" data-on={tab === id && !visiting ? "1" : "0"} onClick={() => goTab(id)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center" style={{ gap: 4, marginLeft: "auto" }}>
          <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={() => setScanOpen(true)} aria-label="Scan a barcode"><ScanLine size={15} /></button>
          <div ref={notifRef} style={{ position: "relative" }}>
            <button className="hd-btn hd-btn-ghost hd-btn-sm" onClick={openNotifs} aria-label="Notifications" style={{ position: "relative" }}>
              <Bell size={15} />
              {unread > 0 && (
                <span style={{ position: "absolute", top: 3, right: 4, minWidth: 14, height: 14, borderRadius: 999,
                  background: "var(--bengara)", color: "#FAF1EB", fontSize: 9, fontWeight: 700, lineHeight: "14px", padding: "0 3px" }}>{unread}</span>
              )}
            </button>
            {notifOpen && (
              <NotificationPanel items={notifs} onVisit={(id) => { setNotifOpen(false); visitFriend(id); }}
                onClear={() => setNotifs([])} />
            )}
          </div>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <div ref={menuRef} style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Your account"
              style={{ background: "none", border: "none", padding: 2, cursor: "pointer", display: "flex" }}>
              <Avatar name={account.username || "reader"} size={30} profile={profile} />
            </button>
            {menuOpen && (
              <div className="hd-menu">
                <button onClick={() => goTab("profile")}><UserIcon size={15} /> Profile</button>
                <button onClick={() => goTab("shelf")}><Library size={15} /> My shelf</button>
                <button onClick={() => goTab("following")}><Bookmark size={15} /> Followed series</button>
                <button onClick={() => goTab("people:followers")}><Users size={15} /> Followers</button>
                <button onClick={() => goTab("premium")}><Crown size={15} /> {plan === "premium" ? "Premium" : `Premium · ${planFor(country).monthlyLabel}/mo`}</button>
                <button onClick={() => goTab("settings")}><SettingsIcon size={15} /> Settings</button>
                <button onClick={() => { setMenuOpen(false); setVisiting(null); signOut(); }}><LogOut size={15} /> Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: "1 1 auto", minHeight: 0 }}>
        {friend && friend.private ? (
          <div className="hd-scroll" style={{ height: "100%", overflowY: "auto" }}>
            <div style={{ padding: "22px 16px", maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
              <button className="hd-btn hd-btn-ghost hd-btn-sm" style={{ float: "left" }} onClick={() => goTab("people")}>
                <ArrowLeft size={14} /> People
              </button>
              <div style={{ paddingTop: 48 }}>
                <Avatar name={friend.name} size={80} locked />
                <h1 className="hd-serif" style={{ fontSize: 22, marginTop: 14 }}>@{friend.handle}</h1>
                <p className="hd-muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 10 }}>
                  This profile is private. Their shelf, picture and favourites are hidden.
                </p>
                <button className="hd-btn hd-btn-sm" style={{ marginTop: 16, background: "var(--accent)", color: "var(--on-accent)" }}
                  onClick={() => toggleFollow(friend.id)}>
                  {following.includes(friend.id) ? <><Check size={13} /> Requested</> : <><UserPlus size={13} /> Request to follow</>}
                </button>
              </div>
            </div>
          </div>
        ) : friend ? (friendPage === "shelf" ? (
          <ShelfView collection={friend.collection} readOnly owner={friend.name.split(" ")[0]}
            onOpenSeries={setOpenId} onBack={() => setFriendPage("profile")} />
        ) : (
          <ProfileView
            owner={{ name: friend.name, handle: friend.handle, country: friend.country, joined: friend.joined, premium: friend.premium }}
            profile={{ ...friend.profile, bio: friend.bio }} setProfile={() => {}}
            collection={friend.collection} followingIds={friend.friendIds} readOnly
            followerCount={FRIENDS.filter((x) => x.friendIds.includes(friend.id)).length + (following.includes(friend.id) ? 1 : 0)}
            isFollowed={following.includes(friend.id)} followsYou={followers.includes(friend.id)}
            onFollowToggle={() => toggleFollow(friend.id)}
            onVisitFriend={visitFriend} onOpenSeries={setOpenId}
            onViewShelf={() => setFriendPage("shelf")} onTab={goTab}
            onBack={() => goTab("people")} notify={notify} />
        )) : tab === "home" ? (
          <HomeView account={account} profile={profile} plan={plan} collection={collection} country={country} friendIds={following}
            onTab={goTab} onOpenSeries={setOpenId} onBuy={openBuy} onScan={() => setScanOpen(true)}
            onQuickAdd={() => setQuickAdd(true)} onVisitFriend={visitFriend} />
        ) : tab === "shelf" ? (
          <ShelfView collection={collection} order={shelfOrder} onReorder={reorderShelf}
            onOpenSeries={setOpenId} onScan={() => setScanOpen(true)}
            onQuickAdd={() => setQuickAdd(true)} onAddVolume={actions.addVolume}
            onExport={() => (plan === "premium" ? setExportOpen(true) : goTab("premium"))} />
        ) : tab === "discover" ? (
          <DiscoverView collection={collection} country={country} onOpenSeries={setOpenId} onBuy={openBuy} actions={actions} />
        ) : tab === "wishlist" ? (
          <WishlistView collection={collection} country={country} plan={plan} onPremium={() => goTab("premium")}
            onBuy={openBuy} onOpenSeries={setOpenId} actions={actions} />
        ) : tab === "following" ? (
          <FollowingView collection={collection} onOpenSeries={setOpenId} actions={actions} />
        ) : tab === "premium" ? (
          <PremiumView plan={plan} following={following} country={country} collection={collection} onBuy={openBuy}
            interval={billing.interval} renew={billing.renew} periodEnd={billing.periodEnd}
            onSetRenew={(on) => {
              setBilling((b) => ({ ...b, renew: on }));
              /* Real call: POST /api/cancel → subscriptions.update with
                 cancel_at_period_end. No refund is issued; access ends when the
                 period does, and the webhook flips the plan flag then. */
              notify(on ? "Renewal turned back on" : `Renewal cancelled — Premium until ${billing.periodEnd}`);
            }}
            onExport={() => setExportOpen(true)}
            wishCount={Object.values(collection).reduce((n, e) => n + e.wishlist.filter((v) => !e.owned.includes(v)).length, 0)}
            dropCount={Object.entries(collection).reduce((n, [id, e]) => {
              const s = SERIES_BY_ID[id];
              if (!s) return n;
              return n + e.wishlist.filter((v) => !e.owned.includes(v) && priceDrop(country, s, v, bestOffer(country, s, v))).length;
            }, 0)}
            onSubscribe={subscribe} onVisit={visitFriend} />
        ) : tab === "people" ? (
          <PeopleView following={following} followers={followers} tab={peopleTab} setTab={setPeopleTab}
            onFollow={toggleFollow} onVisit={visitFriend} />
        ) : tab === "profile" ? (
          <ProfileView
            owner={{ name: account.username || "reader", handle: account.username || "reader", country: account.country, joined: "February 2025", premium: plan === "premium" }}
            profile={profile} setProfile={setProfile} collection={collection}
            followingIds={following} followerCount={followers.length} shelfOrder={shelfOrder}
            onVisitFriend={visitFriend} onOpenSeries={setOpenId} onRename={(v) => setAccount((a) => ({ ...a, username: v }))}
            onViewShelf={() => goTab("shelf")} onTab={goTab} notify={notify} />
        ) : (
          <SettingsView account={account} setAccount={setAccount} profile={profile} setProfile={setProfile}
            theme={theme} setTheme={setTheme}
            plan={plan} renew={billing.renew} periodEnd={billing.periodEnd}
            onPremium={() => goTab("premium")} onExport={() => setExportOpen(true)}
            notify={notify} onTab={goTab} onSignOut={() => { setVisiting(null); signOut(); }} />
        )}
      </main>

      <nav className="md:hidden flex" style={{ borderTop: "1px solid var(--line)", background: "var(--bg2)", flex: "none", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.filter((n) => MOBILE_NAV.includes(n.id)).map(({ id, label, Icon }) => {
          const on = tab === id && !visiting;
          return (
            <button key={id} onClick={() => goTab(id)}
              style={{ flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", padding: "8px 1px 9px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                color: on ? "var(--ink)" : "var(--ink3)", fontFamily: "var(--sans)" }}>
              <Icon size={17} strokeWidth={on ? 2.1 : 1.7} />
              <span style={{ fontSize: 9.5, fontWeight: on ? 500 : 400, letterSpacing: "-.01em" }}>{label}</span>
            </button>
          );
        })}
      </nav>

      {openSeries && (
        <SeriesSheet series={openSeries} entry={openEntry} readOnly={!!friend}
          ownerName={friend ? friend.name.split(" ")[0] : ""} country={country}
          collection={collection} actions={actions} onBuy={openBuy} onOpenSeries={setOpenId} onClose={() => setOpenId(null)} />
      )}
      {buying && SERIES_BY_ID[buying.id] && (
        <BuySheet series={SERIES_BY_ID[buying.id]} vol={buying.vol} country={country} plan={plan} onPremium={() => goTab("premium")}
          wished={entryOf(collection, buying.id).wishlist.includes(buying.vol)}
          onWish={(id, vol) => { actions.toggleWish(id, vol); notify("Wishlist updated"); }}
          onBuy={(offer) => {
            setBuying(null);
            if (offer.url) window.open(offer.url, "_blank", "noopener,noreferrer");
            notify(`Opening ${offer.shop} — ${money(offer.currency, offer.price, offer.dec)}`);
          }}
          onClose={() => setBuying(null)} />
      )}
      {quickAdd && (
        <QuickAddSheet collection={collection}
          onOpenSeries={(id) => { setQuickAdd(false); setOpenId(id); }}
          onClose={() => setQuickAdd(false)} />
      )}
      {exportOpen && (
        <ExportSheet collection={collection} email={account.email} notify={notify}
          onEmail={(rows) => {
            setExportOpen(false);
            notify(`Sending ${rows} rows to ${account.email}`);
            const t = setTimeout(() => setNotifs((ns) => [{ id: "e" + Date.now(), userId: null, read: false, when: "Just now",
              text: `Your collection export (${rows} rows) is on its way to ${account.email}` }, ...ns]), 1600);
            followTimers.current.push(t);
          }}
          onClose={() => setExportOpen(false)} />
      )}
      {scanOpen && <ScanSheet collection={collection} onAdd={addScanned} notify={notify} onClose={() => setScanOpen(false)} />}
      {toast && <div className="hd-toast" key={toast.key}>{toast.msg}</div>}
    </div>
  );
}