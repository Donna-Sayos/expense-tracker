let appState = {
  expenses: [],
  walletBalance: 1000.0,
  filters: {
    category: "All",
    sortBy: "date-desc",
  },
};

const categoryColors = {
  Food: "#40e0d0",
  Transport: "#66e6d9",
  Entertainment: "#f38630",
  Other: "#fa6901",
  Unallocated: "#cccccc",
};

// grabs all necessary dom elements
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
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
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

function showValidationError(message) {
  dom.validationError.textContent = message;
  dom.validationError.classList.remove("hidden");
}
function handleFormSubmit(e) {
  e.preventDefault();
  dom.validationError.classList.add("hidden");
  dom.validationError.textContent = "";

  const description = dom.descInput.value.trim();
  const amount = parseFloat(dom.amountInput.value);
  const category = dom.categoryInput.value;
  const date = dom.dateInput.value;

  if (!description) {
    return showValidationError("Description cannot be empty.");
  }
  if (isNaN(amount) || amount <= 0) {
    return showValidationError("Amount must be greater than 0.");
  }
  if (!category) {
    return showValidationError("Please select a category.");
  }
  if (!date) {
    return showValidationError("Please select a date.");
  }

  const newExpense = {
    id: Math.floor(Math.random() * 1000000) + 1,
    description,
    amount,
    category,
    date,
  };

  appState.expenses.push(newExpense);
  saveToLocalStorage();

  // reset form inputs after saving to localStorage
  dom.descInput.value = "";
  dom.amountInput.value = "";
  dom.categoryInput.selectedIndex = 0;
  setDefaultDate();
  dom.conversionResult.textContent = "";

  render();
}

function deleteExpense(id) {
  appState.expenses = appState.expenses.filter((item) => item.id !== id);
  saveToLocalStorage();
  dom.conversionResult.textContent = "";
  render();
}

function handleWalletEdit() {
  const parsedValue = parseFloat(dom.walletValue.textContent.trim());

  if (isNaN(parsedValue) || parsedValue < 0) {
    dom.walletValue.textContent = appState.walletBalance.toFixed(2);
    alert("Wallet balance must be a positive number.");
  } else {
    appState.walletBalance = parsedValue;
    dom.walletValue.textContent = parsedValue.toFixed(2);
    saveToLocalStorage();
  }
}

function getFilteredExpenses() {
  // filter based on expense type
  let result = appState.expenses.filter((item) => {
    if (appState.filters.category === "All") {
      return true;
    } else {
      return item.category === appState.filters.category;
    }
  });

  // sort
  result.sort((a, b) => {
    switch (appState.filters.sortBy) {
      case "date-asc":
        return new Date(a.date) - new Date(b.date);
      case "date-desc":
        return new Date(b.date) - new Date(a.date);
      case "amount-asc":
        return a.amount - b.amount;
      case "amount-desc":
        return b.amount - a.amount;
      default:
        return 0;
    }
  });

  return result;
}
function calculateTotal(expenseArr) {
  return expenseArr.reduce((sum, item) => {
    return sum + item.amount;
  }, 0);
}
async function convertCurrency() {
  const target = dom.currencyTarget.value;
  dom.asyncError.classList.add("hidden");
  dom.asyncError.textContent = "";

  const activeExpenses = getFilteredExpenses();
  const usdTotal = calculateTotal(activeExpenses);

  if (usdTotal === 0) {
    dom.conversionResult.textContent = `0.00 ${target} (No expenses to convert)`;
    return;
  }

  // add loading state
  dom.convertBtn.disabled = true;
  const originalText = dom.convertBtn.textContent;
  dom.convertBtn.textContent = "Converting...";

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");

    if (!res.ok) {
      throw new Error(`API error! Status: ${res.status}`);
    }

    const data = await res.json();
    const rate = data.rates[target];

    if (!rate) {
      throw new Error("Exchange rate for target currency not found.");
    }

    const convertedTotal = usdTotal * rate;
    dom.conversionResult.innerHTML = `Converted Total: <strong>${convertedTotal.toFixed(2)} ${target}</strong>`;
  } catch (err) {
    dom.asyncError.textContent = `Error: ${err.message}`;
    dom.asyncError.classList.remove("hidden");
    dom.conversionResult.textContent = "";
  } finally {
    // exit loading state
    dom.convertBtn.disabled = false;
    dom.convertBtn.textContent = originalText;
  }
}

function renderLegendItem(label, color, amount, percent) {
  const legendItem = document.createElement("div");
  legendItem.className = "legendItem";
  legendItem.innerHTML = `
        <span class="legendDot" style="background-color: ${color}"></span>
        <span style="color:var(--text-charcoal); font-weight:700;">${label}:</span>
        <span style="margin-left:auto; color:var(--text-slate); font-weight:500;">$${amount.toFixed(2)} (${percent.toFixed(0)}%)</span>
    `;
  dom.chartLegend.appendChild(legendItem);
}
function updateColorWheel(visibleExpenses, currentTotal) {
  dom.chartLegend.innerHTML = "";
  const categories = ["Food", "Transport", "Entertainment", "Other"];

  if (currentTotal === 0) {
    dom.colorWheelGraph.style.background = `conic-gradient(${categoryColors["Unallocated"]} 0% 100%)`;
    categories.forEach((cat) =>
      renderLegendItem(cat, categoryColors[cat], 0, 0),
    );
    return;
  }

  let gradientSegments = [];
  let cumulativePercentage = 0;

  categories.forEach((cat) => {
    const catExpenses = visibleExpenses.filter((item) => item.category === cat);
    const catTotal = calculateTotal(catExpenses);
    const percentage = (catTotal / currentTotal) * 100;

    if (percentage > 0) {
      const start = cumulativePercentage;
      cumulativePercentage += percentage;

      const end = cumulativePercentage;
      gradientSegments.push(
        `${categoryColors[cat]} ${start.toFixed(1)}% ${end.toFixed(1)}%`,
      );
    }

    renderLegendItem(cat, categoryColors[cat], catTotal, percentage);
  });

  if (gradientSegments.length > 0) {
    dom.colorWheelGraph.style.background = `conic-gradient(${gradientSegments.join(", ")})`;
  } else {
    dom.colorWheelGraph.style.background = `conic-gradient(${categoryColors["Unallocated"]} 0% 100%)`;
  }
}
function renderTable(expensesToDisplay) {
  dom.tableBody.innerHTML = "";

  // Find the frame container directly
  const tableFrameContainer = document.querySelector(".tableFrame");

  // Empty State
  if (expensesToDisplay.length === 0) {
    if (tableFrameContainer) tableFrameContainer.classList.add("hidden");
    if (dom.emptyState) {
      dom.emptyState.classList.remove("hidden");
      dom.emptyState.textContent =
        appState.expenses.length === 0
          ? "Your ledger is completely empty. Add your first expense above!"
          : "No expenses match your active category filter.";
    }
    return; // Exit function early
  }

  if (tableFrameContainer) tableFrameContainer.classList.remove("hidden");
  if (dom.emptyState) dom.emptyState.classList.add("hidden");

  // Populate Rows
  expensesToDisplay.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${item.description}</td>
        <td>
          <span class="roleBadge" style="background-color: ${categoryColors[item.category]}20; color: ${categoryColors[item.category]}; padding: 4px 8px; border-radius: 4px; font-weight:700; font-size:11px;">
            ${item.category}
          </span>
        </td>
        <td class="tableDate" style="white-space: nowrap;">${item.date}</td>
        <td style="font-weight: 700;">$${item.amount.toFixed(2)}</td>
        <td class="textCenter"><button type="button" class="deleteRowBtn">Delete</button></td>
    `;

    row
      .querySelector(".deleteRowBtn")
      .addEventListener("click", () => deleteExpense(item.id));

    dom.tableBody.appendChild(row);
  });
}
function render() {
  const visibleExpenses = getFilteredExpenses();
  const currentTotal = calculateTotal(visibleExpenses);

  dom.metricsCount.textContent = visibleExpenses.length.toString();
  dom.totalUSD.textContent = `$${currentTotal.toFixed(2)}`;

  updateColorWheel(visibleExpenses, currentTotal);
  renderTable(visibleExpenses);
}
