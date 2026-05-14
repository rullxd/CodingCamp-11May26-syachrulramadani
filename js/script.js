const form = document.getElementById("transactionForm");
const itemNameInput = document.getElementById("itemName");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const spendingLimitInput = document.getElementById("spendingLimit");
const totalBalance = document.getElementById("totalBalance");
const transactionList = document.getElementById("transactionList");
const sortOption = document.getElementById("sortOption");
const limitWarning = document.getElementById("limitWarning");
const themeToggle = document.getElementById("themeToggle");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let spendingLimit = Number(localStorage.getItem("spendingLimit")) || 0;
let chart;

spendingLimitInput.value = spendingLimit || "";

function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("spendingLimit", spendingLimit);
}

function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(number);
}

function addTransaction(e) {
    e.preventDefault();

    const name = itemNameInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    spendingLimit = Number(spendingLimitInput.value) || 0;

    if (!name || !amount || !category) {
        alert("Semua field wajib diisi!");
        return;
    }

    if (amount <= 0) {
        alert("Amount harus lebih dari 0!");
        return;
    }

    const transaction = {
        id: Date.now(),
        name,
        amount,
        category,
        date: new Date().toISOString()
    };

    transactions.push(transaction);

    saveData();
    render();

    form.reset();
    spendingLimitInput.value = spendingLimit || "";
}

function deleteTransaction(id) {
    transactions = transactions.filter(item => item.id !== id);
    saveData();
    render();
}

function getSortedTransactions() {
    let sorted = [...transactions];

    if (sortOption.value === "amount") {
        sorted.sort((a, b) => b.amount - a.amount);
    } else if (sortOption.value === "category") {
        sorted.sort((a, b) => a.category.localeCompare(b.category));
    } else {
        sorted.sort((a, b) => b.id - a.id);
    }

    return sorted;
}

function renderTransactions() {
    const sortedTransactions = getSortedTransactions();

    transactionList.innerHTML = "";

    if (sortedTransactions.length === 0) {
        transactionList.innerHTML = `<p class="empty">No transactions yet.</p>`;
        return;
    }

    sortedTransactions.forEach(item => {
        const div = document.createElement("div");
        div.className = "transaction-item";

        div.innerHTML = `
      <div class="transaction-info">
        <h4>${item.name}</h4>
        <p>${formatRupiah(item.amount)}</p>
        <span class="badge">${item.category}</span>
      </div>
      <button class="delete-btn" onclick="deleteTransaction(${item.id})">
        Delete
      </button>
    `;

        transactionList.appendChild(div);
    });
}

function renderTotal() {
    const total = transactions.reduce((sum, item) => sum + item.amount, 0);
    totalBalance.textContent = formatRupiah(total);

    if (spendingLimit > 0 && total > spendingLimit) {
        limitWarning.textContent = `⚠️ Spending limit exceeded! Limit: ${formatRupiah(spendingLimit)}`;
    } else {
        limitWarning.textContent = "";
    }
}

function getCategoryTotals() {
    const totals = {
        Food: 0,
        Transport: 0,
        Fun: 0
    };

    transactions.forEach(item => {
        totals[item.category] += item.amount;
    });

    return totals;
}

function renderChart() {
    const ctx = document.getElementById("expenseChart").getContext("2d");
    const totals = getCategoryTotals();

    const data = {
        labels: ["Food", "Transport", "Fun"],
        datasets: [{
            data: [totals.Food, totals.Transport, totals.Fun],
            backgroundColor: ["#2ecc71", "#3498db", "#e67e22"]
        }]
    };

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "pie",
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

function render() {
    renderTransactions();
    renderTotal();
    renderChart();
}

function toggleTheme() {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
}

function loadTheme() {
    const theme = localStorage.getItem("theme");

    if (theme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "☀️";
    } else {
        themeToggle.textContent = "🌙";
    }
}

form.addEventListener("submit", addTransaction);
sortOption.addEventListener("change", renderTransactions);
themeToggle.addEventListener("click", toggleTheme);

loadTheme();
render();