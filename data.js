/**
 * VEDAMITRA — Syllabus & subject data
 * -----------------------------------
 * This is the ONLY file that should need editing when the CISCE syllabus
 * changes. Nothing in css/ or the other js/ files depends on the exact
 * chapter list — everything renders from SUBJECTS below.
 *
 * NOTE ON ACCURACY:
 * Chapter names here follow the standard, long-stable ICSE Class 10
 * curriculum structure (Mathematics, Physical Science, Life Science,
 * History & Civics, Geography, English, Computer Applications). Board
 * syllabi are revised in minor ways most years — before relying on this
 * for real exam prep, cross-check each subject against the official
 * syllabus PDF at https://cisce.org (Publications > Syllabus) for the
 * 2026-27 session / ICSE 2027 examination, and edit the arrays below.
 * Every chapter object below only needs an "id" (stable, never rename
 * once progress exists) and a "name".
 */

const SUBJECTS = [
  {
    id: "mathematics",
    name: "Mathematics",
    color: "#2D6A4F",
    chapters: [
      { id: "m01", name: "GST (Goods and Services Tax)" },
      { id: "m02", name: "Banking — Recurring Deposit Accounts" },
      { id: "m03", name: "Shares and Dividends" },
      { id: "m04", name: "Linear Inequations" },
      { id: "m05", name: "Quadratic Equations" },
      { id: "m06", name: "Ratio and Proportion" },
      { id: "m07", name: "Factorisation (Remainder & Factor Theorem)" },
      { id: "m08", name: "Matrices" },
      { id: "m09", name: "Arithmetic Progression" },
      { id: "m10", name: "Coordinate Geometry — Reflection" },
      { id: "m11", name: "Coordinate Geometry — Section & Mid-point Formula" },
      { id: "m12", name: "Coordinate Geometry — Equation of a Line" },
      { id: "m13", name: "Similarity" },
      { id: "m14", name: "Loci" },
      { id: "m15", name: "Circles" },
      { id: "m16", name: "Constructions" },
      { id: "m17", name: "Mensuration — Cylinder, Cone & Sphere" },
      { id: "m18", name: "Trigonometric Identities" },
      { id: "m19", name: "Heights and Distances" },
      { id: "m20", name: "Graphical Representation (Histograms & Ogive)" },
      { id: "m21", name: "Measures of Central Tendency" },
      { id: "m22", name: "Probability" },
    ],
  },
  {
    id: "physics",
    name: "Physics",
    color: "#1B4332",
    chapters: [
      { id: "p01", name: "Force, Work, Power and Energy" },
      { id: "p02", name: "Light — Refraction Through a Lens" },
      { id: "p03", name: "Light — Spectrum" },
      { id: "p04", name: "Sound" },
      { id: "p05", name: "Current Electricity" },
      { id: "p06", name: "Household Circuits" },
      { id: "p07", name: "Electro-Magnetism" },
      { id: "p08", name: "Heat — Calorimetry" },
      { id: "p09", name: "Modern Physics — Radioactivity" },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    color: "#40916C",
    chapters: [
      { id: "c01", name: "Periodic Properties & Periodicity" },
      { id: "c02", name: "Chemical Bonding" },
      { id: "c03", name: "Acids, Bases and Salts" },
      { id: "c04", name: "Analytical Chemistry (NH4OH & NaOH)" },
      { id: "c05", name: "Mole Concept and Stoichiometry" },
      { id: "c06", name: "Electrolysis" },
      { id: "c07", name: "Metallurgy" },
      { id: "c08", name: "Study of Compounds — Hydrogen Chloride" },
      { id: "c09", name: "Study of Compounds — Ammonia" },
      { id: "c10", name: "Study of Compounds — Nitric Acid" },
      { id: "c11", name: "Study of Compounds — Sulphuric Acid" },
      { id: "c12", name: "Organic Chemistry" },
    ],
  },
  {
    id: "biology",
    name: "Biology",
    color: "#52B788",
    chapters: [
      { id: "b01", name: "Cell Cycle and Cell Division" },
      { id: "b02", name: "Genetics" },
      { id: "b03", name: "Absorption by Roots & Transpiration" },
      { id: "b04", name: "Photosynthesis" },
      { id: "b05", name: "Chemical Coordination in Plants" },
      { id: "b06", name: "Excretion in Humans" },
      { id: "b07", name: "The Nervous System" },
      { id: "b08", name: "The Endocrine System" },
      { id: "b09", name: "The Reproductive System" },
      { id: "b10", name: "Population — Growth & Environment Impact" },
      { id: "b11", name: "Pollution" },
    ],
  },
  {
    id: "english-language",
    name: "English Language",
    color: "#74A57F",
    chapters: [
      { id: "el01", name: "Composition / Essay Writing" },
      { id: "el02", name: "Formal & Official Email Writing" },
      { id: "el03", name: "Comprehension Passages" },
      { id: "el04", name: "Grammar & Structured Writing" },
      { id: "el05", name: "Note-making and Summary" },
    ],
  },
  {
    id: "english-literature",
    name: "English Literature",
    color: "#588157",
    chapters: [
      { id: "eli01", name: "Prescribed Drama" },
      { id: "eli02", name: "Prescribed Novel" },
      { id: "eli03", name: "Treasure Trove — Prose" },
      { id: "eli04", name: "Treasure Trove — Poetry" },
    ],
  },
  {
    id: "history-civics",
    name: "History & Civics",
    color: "#3A5A40",
    chapters: [
      { id: "hc01", name: "Civics — The Union Legislature" },
      { id: "hc02", name: "Civics — The Union Executive" },
      { id: "hc03", name: "Civics — The Judiciary" },
      { id: "hc04", name: "Civics — State Government" },
      { id: "hc05", name: "History — The French Revolution" },
      { id: "hc06", name: "History — Industrialisation" },
      { id: "hc07", name: "History — Unification of Germany & Italy" },
      { id: "hc08", name: "History — Nationalism in Europe" },
      { id: "hc09", name: "History — The First World War" },
      { id: "hc10", name: "History — The Russian Revolution" },
      { id: "hc11", name: "History — Rise of Dictatorships" },
      { id: "hc12", name: "History — The Second World War" },
      { id: "hc13", name: "History — The United Nations" },
      { id: "hc14", name: "History — The Non-Aligned Movement" },
    ],
  },
  {
    id: "geography",
    name: "Geography",
    color: "#606C38",
    chapters: [
      { id: "g01", name: "Map Reading & Interpretation" },
      { id: "g02", name: "Location, Extent and Physical Features" },
      { id: "g03", name: "Climate" },
      { id: "g04", name: "Soil" },
      { id: "g05", name: "Natural Vegetation" },
      { id: "g06", name: "Water Resources" },
      { id: "g07", name: "Mineral and Power Resources" },
      { id: "g08", name: "Agriculture" },
      { id: "g09", name: "Industries" },
      { id: "g10", name: "Transport" },
      { id: "g11", name: "Waste Management" },
      { id: "g12", name: "Population" },
    ],
  },
  {
    id: "computer-applications",
    name: "Computer Applications",
    color: "#2F6690",
    chapters: [
      { id: "ca01", name: "Review of Java Fundamentals" },
      { id: "ca02", name: "Class as the Basis of a Solution" },
      { id: "ca03", name: "Inheritance (Extending Classes)" },
      { id: "ca04", name: "Arrays — 1D and 2D" },
      { id: "ca05", name: "String Handling" },
      { id: "ca06", name: "Encapsulation" },
      { id: "ca07", name: "Library Classes (Math, Scanner, etc.)" },
      { id: "ca08", name: "Searching & Sorting Algorithms" },
    ],
  },
  {
    id: "second-language",
    name: "Second Language",
    color: "#A68A64",
    chapters: [
      { id: "sl01", name: "Comprehension" },
      { id: "sl02", name: "Grammar" },
      { id: "sl03", name: "Composition Writing" },
      { id: "sl04", name: "Letter Writing" },
      { id: "sl05", name: "Literature / Prescribed Text" },
    ],
  },
];

// Default revision offsets (days after a chapter is marked Completed)
const REVISION_INTERVALS_DAYS = [1, 3, 7, 15, 30];

// Priority levels shared by Homework and Exams
const PRIORITY_LEVELS = ["Low", "Medium", "High"];
