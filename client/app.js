import { notoSansBase64 } from './fontData.js';

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api";
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const textInput = document.getElementById("textInput");
  const urlInput = document.getElementById("urlInput");
  const emailInput = document.getElementById("emailInput");
  const summaryOutput = document.getElementById("summaryOutput");
  const historyContainer = document.getElementById("historyList");
  const languageSelect = document.getElementById("languageSelect");
  const voiceInputBtn = document.getElementById("voiceInputBtn");
  const speakSummaryBtn = document.getElementById("speakSummaryBtn");

  let currentSummary = "";

  async function summarize({ isUrl = false }) {
    const email = emailInput.value.trim();
    const selectedLang = languageSelect.value;
    const input = isUrl ? urlInput.value.trim() : textInput.value.trim();

    if (!input) return alert(`Please enter ${isUrl ? "a URL" : "text"} to summarize.`);
    if (!email) return alert("Please enter your email.");

    summaryOutput.innerText = "⏳ Generating summary...";
    currentSummary = "";

    try {
      const endpoint = isUrl ? "/summarize/url" : "/summarize";
      const payloadKey = isUrl ? "url" : "text";

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [payloadKey]: input,
          language: selectedLang,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Summarization failed.");

      const summary = data.summaryText || data.summary;
      summaryOutput.innerText = summary;
      currentSummary = summary;

      await fetchHistory();

      const emailRes = await fetch(`${API_BASE}/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toEmail: email, summary }),
      });

      const emailData = await emailRes.json();
      if (!emailRes.ok) throw new Error(emailData.message || "Email failed.");
      alert("✅ Summary emailed successfully!");
    } catch (err) {
      console.error("Summarization Error:", err.message);
      summaryOutput.innerText = "❌ Error generating summary.";
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${API_BASE}/summarize/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      historyContainer.innerHTML = "";
      if (!data.history || data.history.length === 0) {
        historyContainer.innerHTML = "<p>No summaries found.</p>";
        return;
      }

      data.history.forEach((item) => {
        const li = document.createElement("li");
        li.className = "history-item";
        li.innerHTML = `
          <div class="input-text"><strong>Input (${item.language}):</strong><br>${item.originalText}</div>
          <div class="summary-text"><strong>Summary:</strong><br>${item.summaryText}</div>
          <button class="delete-btn" data-id="${item._id}">🗑️ Delete</button>
        `;

        li.querySelector(".delete-btn").addEventListener("click", async () => {
          await fetch(`${API_BASE}/summarize/${item._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchHistory();
        });

        historyContainer.appendChild(li);
      });
    } catch (err) {
      console.error("History Load Error:", err.message);
      historyContainer.innerHTML = "<p>❌ Error loading history.</p>";
    }
  }

 function downloadSummary(type) {
  const summary = currentSummary.trim();
  if (!summary || summary.length < 5 || summary.startsWith("⏳") || summary.startsWith("❌")) {
    return alert("⚠️ Cannot download. Please generate a valid summary first.");
  }

  if (type === "txt") {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  } else if (type === "pdf") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const lang = languageSelect.value;

    if (lang === "hi" || /[^\u0000-\u007F]+/.test(summary)) {
      // If Hindi or any non-ASCII characters exist, use Unicode-compatible font
      doc.addFileToVFS("NotoSans-Regular.ttf", notoSansBase64);
      doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
      doc.setFont("NotoSans");
    } else {
      // Use built-in font for English
      doc.setFont("helvetica");
    }

    doc.setFontSize(12);
    doc.text("Smart Text Summary:", 10, 10);
    const lines = doc.splitTextToSize(summary, 180);
    doc.text(lines, 10, 20);
    doc.save("summary.pdf");
  }
}


  async function deleteAllHistory() {
    if (!confirm("Are you sure you want to delete all summary history?")) return;

    try {
      const res = await fetch(`${API_BASE}/summarize`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete all summaries.");
      fetchHistory();
    } catch (err) {
      console.error("Delete All Error:", err.message);
    }
  }

  function logoutUser() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }

  // 🎤 Voice Input
  if (voiceInputBtn && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    voiceInputBtn.addEventListener("click", () => {
      recognition.start();
      voiceInputBtn.textContent = "🎤 Listening...";
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      textInput.value += (textInput.value ? "\n" : "") + transcript;
      voiceInputBtn.textContent = "🎤 Speak";
    };

    recognition.onerror = () => {
      voiceInputBtn.textContent = "🎤 Speak";
    };
  } else if (voiceInputBtn) {
    voiceInputBtn.disabled = true;
    voiceInputBtn.title = "Speech recognition not supported in this browser.";
  }

  // 🔊 Text-to-Speech
  if (speakSummaryBtn) {
    speakSummaryBtn.addEventListener("click", () => {
      const summary = currentSummary.trim();
      if (!summary) return alert("Please generate a summary first.");

      const utterance = new SpeechSynthesisUtterance(summary);
      utterance.lang = languageSelect?.value || "en-US";
      window.speechSynthesis.speak(utterance);
    });
  }

  // 🌙 Dark Mode Toggle
  const toggle = document.getElementById("darkModeToggle");
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
  toggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // ✅ Button Bindings
  document.getElementById("summarizeBtn")?.addEventListener("click", () => summarize({ isUrl: false }));
  document.getElementById("summarizeUrlBtn")?.addEventListener("click", () => summarize({ isUrl: true }));
  document.getElementById("downloadPdf")?.addEventListener("click", () => downloadSummary("pdf"));
  document.getElementById("downloadTxt")?.addEventListener("click", () => downloadSummary("txt"));
  document.getElementById("deleteAllBtn")?.addEventListener("click", deleteAllHistory);
  document.getElementById("logoutBtn")?.addEventListener("click", logoutUser);

  fetchHistory();
});
