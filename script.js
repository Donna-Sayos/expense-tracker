let appState = {
  expenses: [],
  walletBalance: 1000.0,
  filters: {
    category: "All",
    sortBy: "date-desc",
  },
};

const colorSchemeConfig = {
  Food: "#40e0d0",
  Transport: "#66e6d9",
  Entertainment: "#f38630",
  Other: "#fa6901",
  Unallocated: "#cccccc",
};

const dom = {
  form: document.getElementById("expenseForm"),
  descInput: document.getElementById("expDescription"),
  amountInput: document.getElementById("expAmount"),
  categoryInput: document.getElementById("expCategory"),
  dateInput: document.getElementById("expDate"),

  validationError: document.getElementById("formValidationError"),
  asyncError: document.getElementById("asyncErrorFeedback"),
  conversionResult: document.getElementById("conversionResult"),

  metricsCount: document.getElementById("metricsCount"),
  totalUSD: document.getElementById("totalUSD"),
  walletValue: document.getElementById("walletValue"),

  filterCategory: document.getElementById("filterCategory"),
  sortSelector: document.getElementById("sortSelector"),

  tableBody: document.getElementById("ledgerTableBody"),
  emptyState: document.getElementById("emptyStateFallback"),

  convertBtn: document.getElementById("convertBtn"),
  currencyTarget: document.getElementById("currencyTarget"),
  colorWheelGraph: document.getElementById("colorWheelGraph"),
  chartLegend: document.getElementById("chartLegend"),
};

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDate();
  loadLocalStorage();
  setupEventListeners();
  render();
});

function setDefaultDate() {
  const today = new Date().toISOString().split("T")[0];
  console.log({ today });
  dom.dateInput.value = today;
}

function loadLocalStorage() {
  try {
    const storedExpenses = localStorage.getItem("expenses");
    const storedWallet = localStorage.getItem("wallet");

    if (storedExpenses) {
      const parsedData = JSON.parse(storedExpenses);
      if (Array.isArray(parsedData)) {
        appState.expenses = parsedData;
      }
    }

    if (storedWallet) {
      const parsedValue = parseFloat(storedWallet);
      if (!isNaN(parsedValue) && parsedValue >= 0) {
        appState.walletBalance = parsedValue;
      }
    }
  } catch (err) {
    // Fallback to empty defaults if localStorage data is corrupt
    appState.expenses = [];
    appState.walletBalance = 1000.0;
  }

  dom.walletValue.textContent = appState.walletBalance.toFixed(2);
}
function saveToLocalStorage() {
  localStorage.setItem("expenses", JSON.stringify(appState.expenses));
  localStorage.setItem("wallet", appState.walletBalance.toString());
}

function setupEventListeners() {
  dom.form.addEventListener("submit", handleFormSubmit);

  dom.filterCategory.addEventListener("change", (e) => {
    appState.filters.category = e.target.value;
    render();
  });

  dom.sortSelector.addEventListener("change", (e) => {
    appState.filters.sortBy = e.target.value;
    render();
  });

  dom.walletValue.addEventListener("blur", handleWalletEdit);
  dom.walletValue.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dom.walletValue.blur();
    }
  });

  dom.convertBtn.addEventListener("click", convertCurrency);
}
function handleFormSubmit(e) {
  e.preventDefault();
  dom.validationError.classList.add("hidden");
  dom.validationError.textContent = "";

  const description = dom.descInput.value.trim();
  const amount = parseFloat(dom.amountInput.value);
  const category = dom.categoryInput.value;
  const date = dom.dateInput.value;
}

function render() {}
